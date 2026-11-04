const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Vary": "Authorization",
  },
});

async function verifyStudent(request) {
  const header = request.headers.get("Authorization") || "";
  const credential = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!credential || credential.length > 10000) return null;

  const response = await fetch("https://english-master-auth.mashrapovmuhammadrizo371.workers.dev/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ credential }),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result.ok || !result.user?.id) return null;
  return result.user;
}

export async function onRequest({ request, env }) {
  if (!env.DB) return json({ error: "Profil bazasi ulanmagan." }, 503);
  if (request.method !== "GET" && request.method !== "POST") {
    return json({ error: "So‘rov turi qo‘llab-quvvatlanmaydi." }, 405);
  }

  const user = await verifyStudent(request);
  if (!user) return json({ error: "Google sessiyasi tasdiqlanmadi." }, 401);

  try {
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS user_onboarding (
        google_sub TEXT PRIMARY KEY,
        welcome_seen_at TEXT
      )
    `).run();

    if (request.method === "GET") {
      const row = await env.DB.prepare(`
        SELECT u.created_at, o.welcome_seen_at
        FROM users u
        LEFT JOIN user_onboarding o ON o.google_sub = u.google_sub
        WHERE u.google_sub = ?
      `).bind(String(user.id)).first();

      // Accounts that already existed before this feature shipped have
      // necessarily passed through the old Welcome screen at least once.
      const legacyAccount = Boolean(row?.created_at && row.created_at < "2026-11-04 15:49:00");
      if (legacyAccount && !row?.welcome_seen_at) {
        await env.DB.prepare(`
          INSERT INTO user_onboarding (google_sub, welcome_seen_at)
          VALUES (?, CURRENT_TIMESTAMP)
          ON CONFLICT(google_sub) DO UPDATE SET welcome_seen_at = CURRENT_TIMESTAMP
        `).bind(String(user.id)).run();
      }
      return json({ seen: Boolean(row?.welcome_seen_at) || legacyAccount });
    }

    await env.DB.prepare(`
      INSERT INTO user_onboarding (google_sub, welcome_seen_at)
      VALUES (?, CURRENT_TIMESTAMP)
      ON CONFLICT(google_sub) DO UPDATE SET welcome_seen_at = COALESCE(user_onboarding.welcome_seen_at, CURRENT_TIMESTAMP)
    `).bind(String(user.id)).run();

    return json({ ok: true, seen: true });
  } catch {
    return json({ error: "Welcome holatini saqlab bo‘lmadi." }, 503);
  }
}
