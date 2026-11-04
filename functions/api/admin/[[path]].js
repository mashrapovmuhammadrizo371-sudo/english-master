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
      env.DB.prepare("SELECT COUNT(*) AS count FROM users").first(),
      env.DB.prepare("SELECT COUNT(*) AS count FROM courses WHERE status='published'").first(),
      env.DB.prepare("SELECT COUNT(*) AS count FROM exam_attempts").first(),
      env.DB.prepare("SELECT COUNT(*) AS count FROM payment_transactions WHERE status='paid'").first()
    ]);
    return json({ students: students.count, courses: courses.count, attempts: exams.count, payments: payments.count });
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
