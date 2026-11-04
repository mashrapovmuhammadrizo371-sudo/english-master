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
  return json({ error: "Admin API yo‘li topilmadi." }, 404);
}
