import {
  arePreviousTopicsPassed,
  calculateAssessmentResult,
  calculateDeparturePenalty,
  canRecoverAttempt,
  selectRandomQuestions
} from "./assessment-utils.js";

const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "Vary": "Authorization" }
});
const id = () => crypto.randomUUID();
const nowSeconds = () => Math.floor(Date.now() / 1000);
const parseJson = (value, fallback) => { try { return JSON.parse(value || ""); } catch { return fallback; } };

async function verifyStudent(request) {
  const header = request.headers.get("Authorization") || "";
  const credential = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!credential || credential.length > 10000) return null;
  const response = await fetch("https://english-master-auth.mashrapovmuhammadrizo371.workers.dev/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ credential })
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result.ok || !result.user?.id || !result.user?.email) return null;
  return result.user;
}

function sanitizeAnswers(order, rawAnswers) {
  const source = rawAnswers && typeof rawAnswers === "object" && !Array.isArray(rawAnswers) ? rawAnswers : {};
  const answers = {};
  for (const questionId of order) {
    if (typeof source[questionId] === "string") answers[questionId] = source[questionId].slice(0, 500);
  }
  return answers;
}

async function getAttemptPayload(env, attemptId, googleSub) {
  const attempt = await env.DB.prepare(`
    SELECT a.id,a.exam_id,a.google_sub,a.score_percent,a.status,a.started_at,a.submitted_at,
           a.deadline_at,a.question_order_json,a.answers_json,a.result_json,
           a.departure_count,a.penalty_seconds_applied,a.recovery_used,
           e.title AS exam_title,e.duration_seconds,e.pass_percent,e.penalty_seconds,
           l.id AS lesson_id,l.title AS lesson_title,c.title AS course_title
    FROM exam_attempts a
    JOIN exams e ON e.id=a.exam_id
    JOIN lessons l ON l.id=e.lesson_id
    JOIN courses c ON c.id=l.course_id
    WHERE a.id=? AND a.google_sub=?
  `).bind(attemptId, googleSub).first();
  if (!attempt) return null;
  const now = nowSeconds();
  const deadlineAt = Number(attempt.deadline_at || 0);
  const effectiveStatus = attempt.status === "started" && deadlineAt <= now ? "expired" : attempt.status;
  const order = parseJson(attempt.question_order_json, []);
  let questions = [];
  if (order.length) {
    const placeholders = order.map(() => "?").join(",");
    const result = await env.DB.prepare(
      `SELECT id,question_json,points FROM exam_questions WHERE exam_id=? AND id IN (${placeholders})`
    ).bind(attempt.exam_id, ...order).all();
    const byId = new Map((result.results || []).map(row => [row.id, row]));
    questions = order.map(questionId => byId.get(questionId)).filter(Boolean).map(row => {
      const question = parseJson(row.question_json, {});
      return {
        id: row.id,
        prompt: String(question.prompt || ""),
        options: Array.isArray(question.options) ? question.options : [],
        points: Number(row.points) || 1
      };
    });
  }
  const canRecover = effectiveStatus === "expired" && canRecoverAttempt(deadlineAt, now, Number(attempt.recovery_used) === 1);
  return {
    id: attempt.id,
    examId: attempt.exam_id,
    title: attempt.exam_title,
    courseTitle: attempt.course_title,
    lessonId: attempt.lesson_id,
    lessonTitle: attempt.lesson_title,
    durationSeconds: Number(attempt.duration_seconds),
    passPercent: Number(attempt.pass_percent),
    penaltySeconds: Number(attempt.penalty_seconds),
    deadlineAt,
    serverNow: now,
    remainingSeconds: Math.max(0, deadlineAt - now),
    departureCount: Number(attempt.departure_count) || 0,
    penaltySecondsApplied: Number(attempt.penalty_seconds_applied) || 0,
    recoveryUsed: Number(attempt.recovery_used) === 1,
    canRecover,
    status: effectiveStatus,
    questions,
    answers: parseJson(attempt.answers_json, {}),
    result: effectiveStatus === "submitted" ? parseJson(attempt.result_json, null) : null
  };
}

async function ensureTopicAccess(env, examId, googleSub) {
  const current = await env.DB.prepare(`
    SELECT e.id AS exam_id,e.status AS exam_status,l.id AS lesson_id,l.course_id,l.title,
           l.sort_order,l.status AS lesson_status,c.status AS course_status
    FROM exams e
    JOIN lessons l ON l.id=e.lesson_id
    JOIN courses c ON c.id=l.course_id
    WHERE e.id=?
  `).bind(examId).first();
  if (!current || current.exam_status !== "published" || current.lesson_status !== "published" || current.course_status !== "published") {
    return { error: json({ error: "Bu mavzu testi hozircha ochiq emas." }, 404) };
  }
  const previousResult = await env.DB.prepare(`
    SELECT l.id,e.id AS exam_id
    FROM lessons l
    LEFT JOIN exams e ON e.lesson_id=l.id AND e.status='published'
    WHERE l.course_id=? AND l.status='published'
      AND (l.sort_order < ? OR (l.sort_order = ? AND (l.title < ? OR (l.title = ? AND l.id < ?))))
    ORDER BY l.sort_order,l.title,l.id
  `).bind(current.course_id,current.sort_order,current.sort_order,current.title,current.title,current.lesson_id).all();
  const previousTopics = [];
  for (const topic of previousResult.results || []) {
    let passed = false;
    if (topic.exam_id) {
      const result = await env.DB.prepare(`
        SELECT 1 AS passed
        FROM exam_attempts a JOIN exams e ON e.id=a.exam_id
        WHERE a.google_sub=? AND a.exam_id=? AND a.status='submitted'
          AND a.score_percent >= e.pass_percent
        LIMIT 1
      `).bind(googleSub, topic.exam_id).first();
      passed = Boolean(result);
    }
    previousTopics.push({ examId: topic.exam_id, passed });
  }
  if (!arePreviousTopicsPassed(previousTopics)) {
    return { error: json({ error: "Keyingi mavzu ochilishi uchun oldingi mavzular testidan o‘tish kerak." }, 403) };
  }
  return { current };
}

async function startAttempt(env, examId, googleSub) {
  const now = nowSeconds();
  const existing = await env.DB.prepare(`
    SELECT id,status,deadline_at,recovery_used
    FROM exam_attempts
    WHERE exam_id=? AND google_sub=? AND status IN ('started','expired')
    ORDER BY started_at DESC LIMIT 1
  `).bind(examId, googleSub).first();
  if (existing) {
    const deadline = Number(existing.deadline_at || 0);
    if (existing.status === "started" && deadline > now) return getAttemptPayload(env, existing.id, googleSub);
    if (canRecoverAttempt(deadline, now, Number(existing.recovery_used) === 1)) return getAttemptPayload(env, existing.id, googleSub);
    if (existing.status === "started") {
      await env.DB.prepare("UPDATE exam_attempts SET status='expired' WHERE id=? AND status='started' AND deadline_at<=?")
        .bind(existing.id, now).run();
    }
  }

  const exam = await env.DB.prepare(`
    SELECT e.id,e.duration_seconds,e.question_count,e.status
    FROM exams e
    JOIN lessons l ON l.id=e.lesson_id
    JOIN courses c ON c.id=l.course_id
    WHERE e.id=? AND e.status='published' AND l.status='published' AND c.status='published'
  `).bind(examId).first();
  if (!exam) return null;
  const bank = await env.DB.prepare("SELECT id,question_json,points FROM exam_questions WHERE exam_id=? ORDER BY sort_order,id")
    .bind(examId).all();
  const selected = selectRandomQuestions(bank.results || [], exam.question_count);
  if (!selected.length) return null;
  const attemptId = id();
  const deadlineAt = now + Number(exam.duration_seconds);
  await env.DB.prepare(`
    INSERT INTO exam_attempts (id,exam_id,google_sub,status,deadline_at,question_order_json)
    VALUES (?,?,?,'started',?,?)
  `).bind(attemptId,examId,googleSub,deadlineAt,JSON.stringify(selected.map(question => question.id))).run();
  return getAttemptPayload(env, attemptId, googleSub);
}

async function handleDeparture(env, attemptId, googleSub, eventKey) {
  if (!/^[a-z0-9-]{16,80}$/i.test(eventKey)) return json({ error: "Interruption event ID noto‘g‘ri." }, 400);
  let event = await env.DB.prepare("SELECT * FROM exam_integrity_events WHERE attempt_id=? AND event_key=?")
    .bind(attemptId,eventKey).first();
  if (event?.applied_at) {
    const attempt = await getAttemptPayload(env,attemptId,googleSub);
    if (!attempt) return json({ error: "Test urinish topilmadi." }, 404);
    return json({
      ok:true,duplicate:true,departureNumber:Number(event.departure_number),
      penaltyAppliedSeconds:Number(event.penalty_seconds)||0,
      deadlineAt:attempt.deadlineAt,serverNow:attempt.serverNow,
      remainingSeconds:attempt.remainingSeconds,departureCount:attempt.departureCount
    });
  }
  if (!event) {
    const owner = await env.DB.prepare("SELECT id FROM exam_attempts WHERE id=? AND google_sub=?")
      .bind(attemptId,googleSub).first();
    if (!owner) return json({ error: "Test urinish topilmadi." }, 404);
    await env.DB.prepare(`
      INSERT OR IGNORE INTO exam_integrity_events (id,attempt_id,event_key,event_type)
      VALUES (?,?,?,'visibility_hidden')
    `).bind(id(),attemptId,eventKey).run();
  }

  for (let retry = 0; retry < 3; retry += 1) {
    const attempt = await env.DB.prepare(`
      SELECT a.id,a.status,a.deadline_at,a.departure_count,e.penalty_seconds
      FROM exam_attempts a JOIN exams e ON e.id=a.exam_id
      WHERE a.id=? AND a.google_sub=?
    `).bind(attemptId,googleSub).first();
    if (!attempt) return json({ error: "Test urinish topilmadi." }, 404);
    const now = nowSeconds();
    if (attempt.status !== "started" || Number(attempt.deadline_at) <= now) {
      return json({ error: "Test vaqti tugagan. Sahifani yangilab, tiklash imkoniyatini tekshiring." }, 409);
    }
    event = await env.DB.prepare("SELECT * FROM exam_integrity_events WHERE attempt_id=? AND event_key=?")
      .bind(attemptId,eventKey).first();
    if (event?.applied_at) {
      const current = await getAttemptPayload(env,attemptId,googleSub);
      return json({
        ok:true,duplicate:true,departureNumber:Number(event.departure_number),
        penaltyAppliedSeconds:Number(event.penalty_seconds)||0,
        deadlineAt:current.deadlineAt,serverNow:current.serverNow,
        remainingSeconds:current.remainingSeconds,departureCount:current.departureCount
      });
    }
    const departureNumber = Number(attempt.departure_count) + 1;
    const penalty = calculateDeparturePenalty(attempt.departure_count,attempt.penalty_seconds);
    const batch = await env.DB.batch([
      env.DB.prepare(`
        UPDATE exam_attempts
        SET departure_count=departure_count+1,
            deadline_at=deadline_at-?,
            penalty_seconds_applied=penalty_seconds_applied+?
        WHERE id=? AND google_sub=? AND status='started'
          AND deadline_at>? AND departure_count=?
      `).bind(penalty,penalty,attemptId,googleSub,now,attempt.departure_count),
      env.DB.prepare(`
        UPDATE exam_integrity_events
        SET departure_number=?,penalty_seconds=?,applied_at=CURRENT_TIMESTAMP
        WHERE attempt_id=? AND event_key=? AND applied_at IS NULL
          AND EXISTS (
            SELECT 1 FROM exam_attempts
            WHERE id=? AND google_sub=? AND departure_count=?
          )
      `).bind(departureNumber,penalty,attemptId,eventKey,attemptId,googleSub,departureNumber)
    ]);
    if (Number(batch?.[0]?.meta?.changes) > 0) {
      const updated = await getAttemptPayload(env,attemptId,googleSub);
      return json({
        ok:true,duplicate:false,departureNumber,
        warning:departureNumber===1,
        penaltyAppliedSeconds:penalty,
        deadlineAt:updated.deadlineAt,serverNow:updated.serverNow,
        remainingSeconds:updated.remainingSeconds,departureCount:updated.departureCount
      });
    }
  }
  return json({ error: "Interruption qayd etilmadi. Ulanish tiklangach qayta urinib ko‘ring." }, 409);
}

export async function onRequest({ request, env }) {
  if (!env.DB) return json({ error: "D1 DB binding ulanmagan." }, 503);
  const user = await verifyStudent(request);
  if (!user) return json({ error: "Google sessiyasi tasdiqlanmadi." }, 401);
  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/api\/learning\/?/, "");
  const parts = path.split("/").filter(Boolean).map(decodeURIComponent);
  const method = request.method;
  const now = nowSeconds();

  if (parts.length === 1 && parts[0] === "topics" && method === "GET") {
    const topicsResult = await env.DB.prepare(`
      SELECT c.id AS course_id,c.level,c.title AS course_title,c.description AS course_description,c.sort_order AS course_sort,
             l.id AS lesson_id,l.title AS lesson_title,l.content_json,l.sort_order AS lesson_sort,
             e.id AS exam_id,e.title AS exam_title,e.duration_seconds,e.pass_percent,e.question_count
      FROM courses c
      JOIN lessons l ON l.course_id=c.id
      LEFT JOIN exams e ON e.lesson_id=l.id AND e.status='published'
      WHERE c.status='published' AND l.status='published'
      ORDER BY c.sort_order,c.title,l.sort_order,l.title,l.id
    `).all();
    const attemptsResult = await env.DB.prepare(`
      SELECT a.exam_id,a.status,a.score_percent,a.started_at,a.submitted_at,a.deadline_at,a.recovery_used,e.pass_percent
      FROM exam_attempts a JOIN exams e ON e.id=a.exam_id
      WHERE a.google_sub=?
      ORDER BY a.started_at DESC
    `).bind(String(user.id)).all();
    const attempts = attemptsResult.results || [];
    const passed = new Set(attempts.filter(a => a.status === "submitted" && Number(a.score_percent) >= Number(a.pass_percent)).map(a => a.exam_id));
    const latest = new Map();
    for (const attempt of attempts) if (!latest.has(attempt.exam_id)) latest.set(attempt.exam_id, attempt);
    const courses = new Map();
    for (const row of topicsResult.results || []) {
      if (!courses.has(row.course_id)) courses.set(row.course_id, {
        id:row.course_id,level:row.level,title:row.course_title,description:row.course_description,topics:[],canContinue:true
      });
      const course = courses.get(row.course_id);
      const hasExam = Boolean(row.exam_id);
      const isPassed = hasExam && passed.has(row.exam_id);
      const lastAttempt = hasExam ? latest.get(row.exam_id) : null;
      const unlocked = course.canContinue && hasExam;
      course.topics.push({
        id:row.lesson_id,title:row.lesson_title,
        content:parseJson(row.content_json,{}).text || "",
        examId:row.exam_id,examTitle:row.exam_title,
        passPercent:Number(row.pass_percent || 80),
        questionCount:Number(row.question_count || 0),
        unlocked,passed:isPassed,
        lastScore:lastAttempt?.score_percent === null || lastAttempt?.score_percent === undefined ? null : Number(lastAttempt.score_percent),
        attempts:hasExam ? attempts.filter(a=>a.exam_id===row.exam_id).length : 0
      });
      course.canContinue = course.canContinue && isPassed;
    }
    return json({ courses:[...courses.values()].map(({canContinue,...course})=>course),serverNow:now });
  }

  if (parts.length === 1 && parts[0] === "attempts" && method === "POST") {
    const body = await request.json().catch(() => ({}));
    const examId = String(body.examId || "").slice(0,80);
    if (!examId) return json({ error: "Mavzu testi tanlanmagan." }, 400);
    const access = await ensureTopicAccess(env,examId,String(user.id));
    if (access.error) return access.error;
    const attempt = await startAttempt(env,examId,String(user.id));
    if (!attempt) return json({ error: "Test savollari topilmadi yoki test hali nashr qilinmagan." }, 409);
    return json({ ok:true,attempt });
  }

  if (parts.length >= 2 && parts[0] === "attempts") {
    const attemptId = parts[1];
    if (parts.length === 2 && method === "GET") {
      const attempt = await getAttemptPayload(env,attemptId,String(user.id));
      return attempt ? json({ok:true,attempt}) : json({error:"Test urinish topilmadi."},404);
    }

    if (parts.length === 3 && parts[2] === "answers" && method === "POST") {
      const body = await request.json().catch(() => ({}));
      const current = await env.DB.prepare("SELECT id,question_order_json,status,deadline_at FROM exam_attempts WHERE id=? AND google_sub=?")
        .bind(attemptId,String(user.id)).first();
      if (!current) return json({error:"Test urinish topilmadi."},404);
      const currentNow = nowSeconds();
      if (current.status !== "started" || Number(current.deadline_at) < currentNow) return json({error:"Test vaqti tugagan. Tiklash imkoniyatini tekshiring."},409);
      const order = parseJson(current.question_order_json,[]);
      const answers = sanitizeAnswers(order,body.answers);
      await env.DB.prepare("UPDATE exam_attempts SET answers_json=? WHERE id=? AND google_sub=? AND status='started' AND deadline_at>=?")
        .bind(JSON.stringify(answers),attemptId,String(user.id),currentNow).run();
      return json({ok:true,saved:true,serverNow:currentNow});
    }

    if (parts.length === 3 && parts[2] === "departures" && method === "POST") {
      const body = await request.json().catch(() => ({}));
      return handleDeparture(env,attemptId,String(user.id),String(body.eventId || ""));
    }

    if (parts.length === 3 && parts[2] === "recover" && method === "POST") {
      const current = await env.DB.prepare("SELECT id,status,deadline_at,recovery_used FROM exam_attempts WHERE id=? AND google_sub=?")
        .bind(attemptId,String(user.id)).first();
      if (!current) return json({error:"Test urinish topilmadi."},404);
      const currentNow = nowSeconds();
      if (!canRecoverAttempt(current.deadline_at,currentNow,Number(current.recovery_used)===1) || !["started","expired"].includes(current.status)) {
        return json({error:"Bir martalik tiklash vaqti o‘tgan yoki avval ishlatilgan."},409);
      }
      const newDeadline = currentNow + 120;
      const updated = await env.DB.prepare(`
        UPDATE exam_attempts
        SET status='started',deadline_at=?,recovery_used=1
        WHERE id=? AND google_sub=? AND status IN ('started','expired')
          AND recovery_used=0 AND deadline_at<=? AND deadline_at>=?
        RETURNING id
      `).bind(newDeadline,attemptId,String(user.id),currentNow,currentNow-120).first();
      if (!updated) return json({error:"Tiklash amalga oshmadi. Test holatini yangilang."},409);
      await env.DB.prepare(`
        INSERT OR IGNORE INTO exam_integrity_events (id,attempt_id,event_key,event_type,penalty_seconds,applied_at)
        VALUES (?,?,?,'technical_recovery',0,CURRENT_TIMESTAMP)
      `).bind(id(),attemptId,"recovery-"+attemptId).run();
      const attempt = await getAttemptPayload(env,attemptId,String(user.id));
      return json({ok:true,attempt,recovered:true});
    }

    if (parts.length === 3 && parts[2] === "submit" && method === "POST") {
      const current = await env.DB.prepare(`
        SELECT id,exam_id,status,deadline_at,question_order_json,answers_json
        FROM exam_attempts WHERE id=? AND google_sub=?
      `).bind(attemptId,String(user.id)).first();
      if (!current) return json({error:"Test urinish topilmadi."},404);
      if (current.status === "submitted") {
        const attempt = await getAttemptPayload(env,attemptId,String(user.id));
        return json({ok:true,attempt,result:attempt?.result});
      }
      const currentNow = nowSeconds();
      if (current.status !== "started" || Number(current.deadline_at) < currentNow) {
        if (current.status === "started") await env.DB.prepare("UPDATE exam_attempts SET status='expired' WHERE id=? AND status='started' AND deadline_at<?")
          .bind(attemptId,currentNow).run();
        const attempt = await getAttemptPayload(env,attemptId,String(user.id));
        return json({error:"Test vaqti tugadi.",canRecover:Boolean(attempt?.canRecover),attempt},409);
      }
      const body = await request.json().catch(() => ({}));
      const order = parseJson(current.question_order_json,[]);
      const answers = sanitizeAnswers(order,body.answers || parseJson(current.answers_json,{}));
      const placeholders = order.map(() => "?").join(",");
      const questionsResult = order.length ? await env.DB.prepare(
        `SELECT id,question_json,answer_key_json,points FROM exam_questions WHERE exam_id=? AND id IN (${placeholders})`
      ).bind(current.exam_id,...order).all() : {results:[]};
      const byId = new Map((questionsResult.results || []).map(row=>[row.id,row]));
      const questionRows = order.map(questionId=>byId.get(questionId)).filter(Boolean);
      const exam = await env.DB.prepare("SELECT pass_percent FROM exams WHERE id=?").bind(current.exam_id).first();
      const result = calculateAssessmentResult(questionRows,answers,Number(exam?.pass_percent || 80));
      const saved = await env.DB.prepare(`
        UPDATE exam_attempts
        SET status='submitted',score_percent=?,submitted_at=CURRENT_TIMESTAMP,
            answers_json=?,result_json=?
        WHERE id=? AND google_sub=? AND status='started' AND deadline_at>=?
        RETURNING id
      `).bind(result.scorePercent,JSON.stringify(answers),JSON.stringify(result),attemptId,String(user.id),currentNow).first();
      if (!saved) {
        const attempt = await getAttemptPayload(env,attemptId,String(user.id));
        return json({error:"Test vaqti yakunlandi. Tiklash imkoniyatini tekshiring.",canRecover:Boolean(attempt?.canRecover),attempt},409);
      }
      const attempt = await getAttemptPayload(env,attemptId,String(user.id));
      return json({ok:true,attempt,result});
    }
  }

  return json({error:"Learning API yo‘li topilmadi."},404);
}
