const ALLOWED_PERMISSIONS = ["students.read","courses.read","courses.write","exams.read","exams.write","payments.read","ai.read","settings.read"];

const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" }
});
const id = () => crypto.randomUUID();

async function authenticate(request, env) {
  const header = request.headers.get("Authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return { error: json({ error: "Kirish tokeni topilmadi." }, 401) };
  // Delegate Google-token verification and Super Admin recognition to the existing
  // authentication Worker, which already validates issuer, audience, expiry and ADMIN_EMAIL.
  const response = await fetch("https://english-master-auth.mashrapovmuhammadrizo371.workers.dev/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ credential: token })
  });
  const verified = await response.json().catch(() => ({}));
  if (!response.ok || !verified.ok || !verified.user?.id || !verified.user?.email) {
    return { error: json({ error: "Google hisobni serverda tasdiqlab bo‘lmadi." }, 401) };
  }
  const user = verified.user;
  if (user.isAdmin) return { user, role: "super_admin", permissions: ["*"] };
  const delegated = await env.DB.prepare(
    "SELECT ar.role,ar.permissions_json FROM admin_roles ar JOIN users u ON u.google_sub=ar.google_sub WHERE lower(u.email)=?"
  ).bind(user.email.toLowerCase()).first();
  if (!delegated) return { error: json({ error: "Admin huquqi yo‘q." }, 403) };
  let permissions = [];
  try { permissions = JSON.parse(delegated.permissions_json || "[]"); } catch {}
  return { user, role: "admin", permissions: permissions.filter(p => ALLOWED_PERMISSIONS.includes(p)) };
}
const has = (auth, permission) => auth.role === "super_admin" || auth.permissions.includes("*") || auth.permissions.includes(permission);
async function audit(env, auth, action, type, resourceId = null, details = {}) {
  await env.DB.prepare("INSERT INTO admin_audit_logs (id,actor_google_sub,action,resource_type,resource_id,details_json) VALUES (?,?,?,?,?,?)")
    .bind(id(), auth.user.id, action, type, resourceId, JSON.stringify(details)).run();
}

export async function onRequest({ request, env }) {
  if (!env.DB) return json({ error: "D1 DB binding ulanmagan." }, 503);
  const auth = await authenticate(request, env);
  if (auth.error) return auth.error;
  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/api\/admin\/?/, "");
  const method = request.method;

  if (path === "me" && method === "GET") return json({ role: auth.role, permissions: auth.permissions, user: { email: auth.user.email, name: auth.user.name || "" } });

  if (path === "summary" && method === "GET") {
    if (auth.role !== "super_admin" && !has(auth, "students.read")) return json({ error: "Ruxsat yetarli emas." }, 403);
    const [students,courses,exams,payments] = await Promise.all([
      has(auth,"students.read") ? env.DB.prepare("SELECT COUNT(*) AS count FROM users").first() : null,
      has(auth,"courses.read") ? env.DB.prepare("SELECT COUNT(*) AS count FROM courses WHERE status='published'").first() : null,
      has(auth,"exams.read") ? env.DB.prepare("SELECT COUNT(*) AS count FROM exam_attempts").first() : null,
      has(auth,"payments.read") ? env.DB.prepare("SELECT COUNT(*) AS count FROM payment_transactions WHERE status='paid'").first() : null
    ]);
    return json({ students: students?.count ?? null, courses: courses?.count ?? null, attempts: exams?.count ?? null, payments: payments?.count ?? null });
  }

  if (path === "students" && method === "GET") {
    if (!has(auth, "students.read")) return json({ error: "Ruxsat yetarli emas." }, 403);
    const result = await env.DB.prepare("SELECT email,name,picture,created_at,last_login_at FROM users ORDER BY created_at DESC LIMIT 200").all();
    return json({ students: result.results || [] });
  }

  if (path === "courses" && method === "GET") {
    if (!has(auth, "courses.read") && !has(auth, "courses.write")) return json({ error: "Ruxsat yetarli emas." }, 403);
    const result = await env.DB.prepare("SELECT id,level,title,description,status,sort_order,created_at,updated_at FROM courses ORDER BY level,sort_order,title").all();
    return json({ courses: result.results || [] });
  }

  if (path === "courses" && method === "POST") {
    if (!has(auth, "courses.write")) return json({ error: "Ruxsat yetarli emas." }, 403);
    const body = await request.json().catch(() => ({}));
    const level = String(body.level || "").toUpperCase();
    const title = String(body.title || "").trim().slice(0,120);
    const description = String(body.description || "").trim().slice(0,1000);
    if (!["A1","A2","B1","B2","C1","C2"].includes(level) || !title) return json({ error: "Kurs darajasi va nomini to‘g‘ri kiriting." }, 400);
    const courseId = id();
    await env.DB.prepare("INSERT INTO courses (id,level,title,description,status) VALUES (?,?,?,?, 'draft')").bind(courseId,level,title,description).run();
    await audit(env,auth,"course.created","course",courseId,{level,title});
    return json({ ok: true, id: courseId }, 201);
  }

  if (path === "exams" && method === "GET") {
    if (!has(auth, "exams.read") && !has(auth, "exams.write")) return json({ error: "Ruxsat yetarli emas." }, 403);
    const result = await env.DB.prepare("SELECT id,title,level,duration_seconds,pass_percent,status,created_at FROM exams ORDER BY created_at DESC LIMIT 200").all();
    return json({ exams: result.results || [] });
  }

  if (path === "exams" && method === "POST") {
    if (!has(auth, "exams.write")) return json({ error: "Ruxsat yetarli emas." }, 403);
    const body = await request.json().catch(() => ({}));
    const level = String(body.level || "").toUpperCase();
    const title = String(body.title || "").trim().slice(0,120);
    const duration = Number(body.duration_seconds || 0);
    const pass = Number(body.pass_percent || 80);
    if (!["A1","A2","B1","B2","C1","C2"].includes(level) || !title || !Number.isInteger(duration) || duration < 60 || duration > 14400 || !Number.isInteger(pass) || pass < 1 || pass > 100) {
      return json({ error: "Test nomi, darajasi, davomiyligi yoki o‘tish foizini tekshiring." }, 400);
    }
    const examId = id();
    await env.DB.prepare("INSERT INTO exams (id,title,level,duration_seconds,pass_percent,status) VALUES (?,?,?,?,?,'draft')").bind(examId,title,level,duration,pass).run();
    await audit(env,auth,"exam.created","exam",examId,{title,level,duration,pass});
    return json({ ok: true, id: examId }, 201);
  }

  if (path.startsWith("courses/") && path.endsWith("/lessons") && method === "GET") {
    if (!has(auth, "courses.read") && !has(auth, "courses.write")) return json({ error: "Ruxsat yetarli emas." }, 403);
    const courseId = path.split("/")[1];
    const result = await env.DB.prepare("SELECT id,title,status,sort_order,created_at FROM lessons WHERE course_id=? ORDER BY sort_order,title").bind(courseId).all();
    return json({ lessons: result.results || [] });
  }

  if (path.startsWith("courses/") && path.endsWith("/lessons") && method === "POST") {
    if (!has(auth, "courses.write")) return json({ error: "Ruxsat yetarli emas." }, 403);
    const courseId = path.split("/")[1];
    const course = await env.DB.prepare("SELECT id FROM courses WHERE id=?").bind(courseId).first();
    if (!course) return json({ error: "Kurs topilmadi." }, 404);
    const body = await request.json().catch(() => ({}));
    const title = String(body.title || "").trim().slice(0,120);
    const content = String(body.content || "").trim().slice(0,10000);
    if (!title) return json({ error: "Dars nomini kiriting." }, 400);
    const lessonId = id();
    await env.DB.prepare("INSERT INTO lessons (id,course_id,title,content_json,status) VALUES (?,?,?,?,'draft')").bind(lessonId,courseId,title,JSON.stringify({text:content})).run();
    await audit(env,auth,"lesson.created","lesson",lessonId,{courseId,title});
    return json({ ok: true, id: lessonId }, 201);
  }

  if (path === "payments" && method === "GET") {
    if (!has(auth, "payments.read")) return json({ error: "Ruxsat yetarli emas." }, 403);
    const result = await env.DB.prepare("SELECT p.id,u.email,p.amount_minor,p.currency,p.status,p.created_at FROM payment_transactions p JOIN users u ON u.google_sub=p.google_sub ORDER BY p.created_at DESC LIMIT 200").all();
    return json({ payments: result.results || [] });
  }

  if (path === "plans" && method === "GET") {
    if (!has(auth, "payments.read")) return json({ error: "Ruxsat yetarli emas." }, 403);
    const result = await env.DB.prepare("SELECT id,name,price_minor,currency,features_json,status FROM plans ORDER BY created_at DESC").all();
    return json({ plans: result.results || [] });
  }

  if (path === "plans" && method === "POST") {
    if (auth.role !== "super_admin") return json({ error: "Tariflarni faqat Super Admin yaratadi." }, 403);
    const body = await request.json().catch(() => ({}));
    const name = String(body.name || "").trim().slice(0,80);
    const price = Number(body.price_minor);
    if (!name || !Number.isInteger(price) || price < 0 || price > 100000000000) return json({ error: "Tarif nomi yoki narxini tekshiring." }, 400);
    const planId = id();
    await env.DB.prepare("INSERT INTO plans (id,name,price_minor,currency,features_json,status) VALUES (?,?,?,'UZS',?,'draft')").bind(planId,name,price,JSON.stringify(Array.isArray(body.features)?body.features.slice(0,20):[])).run();
    await audit(env,auth,"plan.created","plan",planId,{name,price});
    return json({ ok: true, id: planId }, 201);
  }

  if (path === "audit" && method === "GET") {
    if (auth.role !== "super_admin") return json({ error: "Audit jurnalini faqat Super Admin ko‘ra oladi." }, 403);
    const result = await env.DB.prepare("SELECT a.action,a.resource_type,a.resource_id,a.details_json,a.created_at,u.email FROM admin_audit_logs a JOIN users u ON u.google_sub=a.actor_google_sub ORDER BY a.created_at DESC LIMIT 100").all();
    return json({ events: result.results || [] });
  }

  if (path === "admins" && method === "GET") {
    if (auth.role !== "super_admin") return json({ error: "Faqat Super Admin administratorlarni ko‘ra oladi." }, 403);
    const result = await env.DB.prepare("SELECT u.email,u.name,ar.permissions_json,ar.created_at FROM admin_roles ar JOIN users u ON u.google_sub=ar.google_sub ORDER BY ar.created_at DESC").all();
    return json({ admins: result.results || [], permissions: ALLOWED_PERMISSIONS });
  }

  if (path === "admins" && method === "POST") {
    if (auth.role !== "super_admin") return json({ error: "Faqat Super Admin admin qo‘sha oladi." }, 403);
    const body = await request.json().catch(() => ({}));
    const email = String(body.email || "").trim().toLowerCase();
    const permissions = Array.isArray(body.permissions) ? [...new Set(body.permissions.filter(p => ALLOWED_PERMISSIONS.includes(p)))] : [];
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email === auth.user.email.toLowerCase()) return json({ error: "Admin email manzilini tekshiring." }, 400);
    const target = await env.DB.prepare("SELECT google_sub FROM users WHERE lower(email)=?").bind(email).first();
    if (!target) return json({ error: "Bu foydalanuvchi hali Google orqali saytga kirmagan. Avval bir marta kirishi kerak." }, 404);
    await env.DB.prepare("INSERT INTO admin_roles (google_sub,role,permissions_json,created_by) VALUES (?,'admin',?,?) ON CONFLICT(google_sub) DO UPDATE SET permissions_json=excluded.permissions_json,updated_at=CURRENT_TIMESTAMP")
      .bind(target.google_sub,JSON.stringify(permissions),auth.user.id).run();
    await audit(env,auth,"admin.permissions_updated","admin",target.google_sub,{email,permissions});
    return json({ ok: true });
  }

  if (path.startsWith("admins/") && method === "DELETE") {
    if (auth.role !== "super_admin") return json({ error: "Faqat Super Admin admin huquqini bekor qila oladi." }, 403);
    const email = decodeURIComponent(path.slice("admins/".length)).toLowerCase();
    const target = await env.DB.prepare("SELECT google_sub FROM users WHERE lower(email)=?").bind(email).first();
    if (!target) return json({ error: "Admin topilmadi." }, 404);
    await env.DB.prepare("DELETE FROM admin_roles WHERE google_sub=?").bind(target.google_sub).run();
    await audit(env,auth,"admin.revoked","admin",target.google_sub,{email});
    return json({ ok: true });
  }

  // Question bank: answers are returned only to authenticated administrators.
  if (path.startsWith("exams/") && path.endsWith("/questions") && method === "GET") {
    if (!has(auth, "exams.read") && !has(auth, "exams.write")) return json({ error: "Ruxsat yetarli emas." }, 403);
    const examId = path.split("/")[1];
    const exam = await env.DB.prepare("SELECT id FROM exams WHERE id=?").bind(examId).first();
    if (!exam) return json({ error: "Test topilmadi." }, 404);
    const result = await env.DB.prepare("SELECT id,question_json,answer_key_json,points,sort_order FROM exam_questions WHERE exam_id=? ORDER BY sort_order,id").bind(examId).all();
    return json({ questions: (result.results || []).map(q => ({ id:q.id, ...JSON.parse(q.question_json || "{}"), correct_answer:JSON.parse(q.answer_key_json || "{}").correct || "", points:q.points })) });
  }

  if (path.startsWith("exams/") && path.endsWith("/questions") && method === "POST") {
    if (!has(auth, "exams.write")) return json({ error: "Ruxsat yetarli emas." }, 403);
    const examId = path.split("/")[1];
    const exam = await env.DB.prepare("SELECT id,status FROM exams WHERE id=?").bind(examId).first();
    if (!exam) return json({ error: "Test topilmadi." }, 404);
    if (exam.status !== "draft") return json({ error: "Faqat draft testga savol qo‘shish mumkin." }, 409);
    const body = await request.json().catch(() => ({}));
    const prompt = String(body.prompt || "").trim().slice(0,1200);
    const options = Array.isArray(body.options) ? body.options.map(x => String(x).trim().slice(0,240)).filter(Boolean).slice(0,6) : [];
    const correct = String(body.correct_answer || "").trim().slice(0,240);
    const points = Number(body.points || 1);
    if (!prompt || options.length < 2 || options.length > 6 || new Set(options).size !== options.length || !options.includes(correct) || !Number.isFinite(points) || points <= 0 || points > 100) {
      return json({ error: "Savol matni, 2–6 ta takrorlanmas variant va ulardan biri bo‘lgan to‘g‘ri javobni kiriting." }, 400);
    }
    const count = await env.DB.prepare("SELECT COUNT(*) AS count FROM exam_questions WHERE exam_id=?").bind(examId).first();
    const questionId = id();
    await env.DB.prepare("INSERT INTO exam_questions (id,exam_id,question_json,answer_key_json,points,sort_order) VALUES (?,?,?,?,?,?)")
      .bind(questionId,examId,JSON.stringify({prompt,options}),JSON.stringify({correct}),points,count?.count || 0).run();
    await audit(env,auth,"exam.question_created","exam_question",questionId,{examId});
    return json({ok:true,id:questionId},201);
  }

  if (path.startsWith("exam-questions/") && method === "DELETE") {
    if (!has(auth, "exams.write")) return json({ error: "Ruxsat yetarli emas." }, 403);
    const questionId = path.slice("exam-questions/".length);
    const question = await env.DB.prepare("SELECT q.id,q.exam_id,e.status FROM exam_questions q JOIN exams e ON e.id=q.exam_id WHERE q.id=?").bind(questionId).first();
    if (!question) return json({error:"Savol topilmadi."},404);
    if (question.status !== "draft") return json({error:"Nashr qilingan test savollarini o‘zgartirib bo‘lmaydi."},409);
    await env.DB.prepare("DELETE FROM exam_questions WHERE id=?").bind(questionId).run();
    await audit(env,auth,"exam.question_deleted","exam_question",questionId,{examId:question.exam_id});
    return json({ok:true});
  }

  if (path.startsWith("exams/") && path.endsWith("/publish") && method === "POST") {
    if (!has(auth, "exams.write")) return json({error:"Ruxsat yetarli emas."},403);
    const examId = path.split("/")[1];
    const exam = await env.DB.prepare("SELECT id,status FROM exams WHERE id=?").bind(examId).first();
    if (!exam) return json({error:"Test topilmadi."},404);
    const count = await env.DB.prepare("SELECT COUNT(*) AS count FROM exam_questions WHERE exam_id=?").bind(examId).first();
    if ((count?.count || 0) < 1) return json({error:"Nashr qilishdan oldin kamida bitta savol qo‘shing."},400);
    await env.DB.prepare("UPDATE exams SET status='published',updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(examId).run();
    await audit(env,auth,"exam.published","exam",examId,{questionCount:count.count});
    return json({ok:true});
  }

  if (path === "ai-settings" && method === "GET") {
    if (!has(auth,"ai.read")) return json({error:"Ruxsat yetarli emas."},403);
    const settings = await env.DB.prepare("SELECT enabled,provider,model,instructions,updated_at FROM ai_settings WHERE id='default'").first();
    return json({settings:settings || {enabled:0,provider:"openai",model:"gpt-4o-mini",instructions:""}});
  }

  if (path === "ai-settings" && method === "POST") {
    if (auth.role !== "super_admin") return json({error:"AI sozlamalarini faqat Super Admin o‘zgartiradi."},403);
    const body = await request.json().catch(()=>({}));
    const enabled = body.enabled === true ? 1 : 0;
    const provider = String(body.provider || "openai");
    const model = String(body.model || "").trim().slice(0,80);
    const instructions = String(body.instructions || "").trim().slice(0,4000);
    if (provider !== "openai" || !["gpt-4o-mini","gpt-4.1-mini","gpt-4.1"].includes(model)) return json({error:"AI provayderi yoki model tanlovi noto‘g‘ri."},400);
    await env.DB.prepare("INSERT INTO ai_settings (id,enabled,provider,model,instructions,updated_by) VALUES ('default',?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET enabled=excluded.enabled,provider=excluded.provider,model=excluded.model,instructions=excluded.instructions,updated_by=excluded.updated_by,updated_at=CURRENT_TIMESTAMP")
      .bind(enabled,provider,model,instructions,auth.user.id).run();
    await audit(env,auth,"ai.settings_updated","ai_settings","default",{enabled,provider,model});
    return json({ok:true});
  }

  if (path === "payment-settings" && method === "GET") {
    if (!has(auth,"payments.read")) return json({error:"Ruxsat yetarli emas."},403);
    const settings = await env.DB.prepare("SELECT mode,provider,updated_at FROM payment_settings WHERE id='default'").first();
    return json({settings:settings || {mode:"disabled",provider:"manual"},live_payments_enabled:false});
  }

  if (path === "payment-settings" && method === "POST") {
    if (auth.role !== "super_admin") return json({error:"To‘lov sozlamalarini faqat Super Admin o‘zgartiradi."},403);
    const body = await request.json().catch(()=>({}));
    const mode = String(body.mode || "disabled");
    const provider = String(body.provider || "manual");
    if (!["disabled","test"].includes(mode) || !["manual","click","payme"].includes(provider)) return json({error:"Faqat o‘chirilgan yoki test rejimini tanlash mumkin."},400);
    await env.DB.prepare("INSERT INTO payment_settings (id,mode,provider,updated_by) VALUES ('default',?,?,?) ON CONFLICT(id) DO UPDATE SET mode=excluded.mode,provider=excluded.provider,updated_by=excluded.updated_by,updated_at=CURRENT_TIMESTAMP")
      .bind(mode,provider,auth.user.id).run();
    await audit(env,auth,"payment.test_settings_updated","payment_settings","default",{mode,provider});
    return json({ok:true,live_payments_enabled:false});
  }

  return json({ error: "Admin API yo‘li topilmadi." }, 404);
}
