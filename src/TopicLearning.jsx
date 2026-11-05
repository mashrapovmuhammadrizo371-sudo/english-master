import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertTriangle, ArrowLeft, ArrowRight, BookOpen, CheckCircle2, Clock3,
  Lock, RefreshCw, ShieldCheck, Trophy, Wifi, X
} from "lucide-react";
import "./topic-learning.css";

const activeAttemptKey = "em-active-topic-attempt";
const pendingDepartureKey = attemptId => "em-pending-departure:" + attemptId;
const eventId = () => globalThis.crypto?.randomUUID?.() || "event-" + Date.now() + "-" + Math.random().toString(36).slice(2);

function readCredential() {
  try {
    return JSON.parse(localStorage.getItem("em-auth-session") || "null")?.credential || "";
  } catch {
    return "";
  }
}

function formatTime(seconds) {
  const safe = Math.max(0, Number(seconds) || 0);
  const minutes = Math.floor(safe / 60);
  const remainder = safe % 60;
  return String(minutes).padStart(2, "0") + ":" + String(remainder).padStart(2, "0");
}

export default function TopicLearning({ onClose }) {
  const [token] = useState(readCredential);
  const [courses, setCourses] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [attempt, setAttempt] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [remaining, setRemaining] = useState(0);
  const [serverOffset, setServerOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [connectionIssue, setConnectionIssue] = useState(false);
  const attemptRef = useRef(null);
  const hiddenHandled = useRef(false);
  const expiryCheckStarted = useRef(false);

  const api = useCallback(async (path, options = {}) => {
    if (!token) throw new Error("Google sessiyasi topilmadi. Saytga qayta kiring.");
    const response = await fetch("/api/learning/" + path, {
      ...options,
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
        ...(options.headers || {})
      }
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const failure = new Error(data.error || "Server bilan bog‘lanib bo‘lmadi.");
      failure.status = response.status;
      failure.data = data;
      throw failure;
    }
    return data;
  }, [token]);

  const syncAttempt = useCallback(nextAttempt => {
    if (!nextAttempt) return;
    attemptRef.current = nextAttempt;
    setAttempt(nextAttempt);
    let localAnswers = {};
    try { localAnswers = JSON.parse(localStorage.getItem("em-topic-answers:" + nextAttempt.id) || "{}"); } catch {}
    setAnswers({ ...(nextAttempt.answers || {}), ...localAnswers });
    setServerOffset(Number(nextAttempt.serverNow || 0) - Math.floor(Date.now() / 1000));
    setRemaining(Number(nextAttempt.remainingSeconds || 0));
    if (nextAttempt.status === "submitted") setResult(nextAttempt.result || null);
    else setResult(null);
  }, []);

  const loadTopics = useCallback(async () => {
    const data = await api("topics", { method: "GET", cache: "no-store" });
    setCourses(data.courses || []);
    setServerOffset(Number(data.serverNow || 0) - Math.floor(Date.now() / 1000));
    return data.courses || [];
  }, [api]);

  const refreshAttempt = useCallback(async attemptId => {
    const data = await api("attempts/" + encodeURIComponent(attemptId), { method: "GET", cache: "no-store" });
    syncAttempt(data.attempt);
    return data.attempt;
  }, [api, syncAttempt]);

  useEffect(() => {
    let active = true;
    const initialize = async () => {
      setLoading(true);
      setError("");
      try {
        const nextCourses = await loadTopics();
        const savedAttemptId = localStorage.getItem(activeAttemptKey);
        if (savedAttemptId) {
          try {
            const data = await api("attempts/" + encodeURIComponent(savedAttemptId), { method: "GET", cache: "no-store" });
            if (!active) return;
            syncAttempt(data.attempt);
            const topic = nextCourses.flatMap(course => course.topics).find(item => item.id === data.attempt.lessonId);
            if (topic) setSelectedTopic(topic);
            if (data.attempt.status === "submitted") setNotice("Oldingi test natijasi tiklandi.");
          } catch (resumeError) {
            if (resumeError.status === 404) localStorage.removeItem(activeAttemptKey);
            else if (active) setConnectionIssue(true);
          }
        }
      } catch (loadError) {
        if (active) setError(loadError.message);
      } finally {
        if (active) setLoading(false);
      }
    };
    initialize();
    return () => { active = false; };
  }, [api, loadTopics, syncAttempt]);

  useEffect(() => {
    attemptRef.current = attempt;
  }, [attempt]);

  useEffect(() => {
    if (!attempt || attempt.status !== "started") return undefined;
    const tick = () => {
      const serverNow = Math.floor(Date.now() / 1000) + serverOffset;
      const nextRemaining = Math.max(0, Number(attempt.deadlineAt) - serverNow);
      setRemaining(nextRemaining);
      if (nextRemaining === 0 && !expiryCheckStarted.current) {
        expiryCheckStarted.current = true;
        refreshAttempt(attempt.id).catch(() => setConnectionIssue(true));
      }
    };
    expiryCheckStarted.current = false;
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [attempt?.id, attempt?.deadlineAt, attempt?.status, serverOffset, refreshAttempt]);

  const sendDeparture = useCallback(async (attemptId, key) => {
    try {
      const response = await fetch("/api/learning/attempts/" + encodeURIComponent(attemptId) + "/departures", {
        method: "POST",
        credentials: "same-origin",
        keepalive: true,
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
        body: JSON.stringify({ eventId: key })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Uzilish qayd etilmadi.");
      localStorage.removeItem(pendingDepartureKey(attemptId));
      setConnectionIssue(false);
      setServerOffset(Number(data.serverNow || 0) - Math.floor(Date.now() / 1000));
      setAttempt(current => current?.id === attemptId ? {
        ...current,
        deadlineAt: data.deadlineAt,
        remainingSeconds: data.remainingSeconds,
        departureCount: data.departureCount,
        serverNow: data.serverNow,
        status: Number(data.remainingSeconds) <= 0 ? "expired" : "started"
      } : current);
      if (!data.duplicate) {
        if (data.departureNumber === 1) {
          setNotice("Test sahifasi ko‘rinmay qoldi. Bu holat aldov isboti emas. Birinchi uzilish faqat ogohlantirish sifatida qayd etildi.");
        } else {
          setNotice("Yana bir sahifa uzilishi qayd etildi. Server taymeridan " + data.penaltyAppliedSeconds + " soniya ayrildi. Bu qayd aldov isboti hisoblanmaydi.");
        }
      }
    } catch {
      setConnectionIssue(true);
      setNotice("Uzilish qaydini yuborish vaqtincha amalga oshmadi. Internet tiklangach, shu event ID bilan qayta yuboriladi.");
    }
  }, [token]);

  useEffect(() => {
    const onVisibilityChange = () => {
      const current = attemptRef.current;
      if (!current || current.status !== "started") return;
      if (document.visibilityState === "hidden") {
        if (hiddenHandled.current) return;
        hiddenHandled.current = true;
        const key = eventId();
        localStorage.setItem(pendingDepartureKey(current.id), key);
        sendDeparture(current.id, key);
      } else {
        hiddenHandled.current = false;
        const pending = localStorage.getItem(pendingDepartureKey(current.id));
        if (pending) sendDeparture(current.id, pending);
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [sendDeparture]);

  useEffect(() => {
    if (!attempt || attempt.status !== "started") return undefined;
    const timer = window.setTimeout(() => {
      api("attempts/" + encodeURIComponent(attempt.id) + "/answers", {
        method: "POST",
        body: JSON.stringify({ answers })
      }).then(() => setConnectionIssue(false)).catch(() => setConnectionIssue(true));
    }, 350);
    return () => window.clearTimeout(timer);
  }, [answers, attempt?.id, attempt?.status, api]);

  const startAttempt = async topic => {
    if (!topic?.examId || busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const data = await api("attempts", {
        method: "POST",
        body: JSON.stringify({ examId: topic.examId })
      });
      setSelectedTopic(topic);
      syncAttempt(data.attempt);
      localStorage.setItem(activeAttemptKey, data.attempt.id);
      setConnectionIssue(false);
      if (data.attempt.status === "expired" && data.attempt.canRecover) {
        setNotice("Oldingi urinish muddati tugagan. Agar texnik uzilish bo‘lgan bo‘lsa, bir martalik tiklashdan foydalanishingiz mumkin.");
      }
    } catch (startError) {
      setError(startError.message);
    } finally {
      setBusy(false);
    }
  };

  const updateAnswer = (questionId, value) => {
    setAnswers(current => {
      const next = { ...current, [questionId]: value };
      if (attemptRef.current?.id) localStorage.setItem("em-topic-answers:" + attemptRef.current.id, JSON.stringify(next));
      return next;
    });
    setConnectionIssue(false);
  };

  const submitAttempt = async () => {
    if (!attempt || busy) return;
    setBusy(true);
    setError("");
    try {
      const data = await api("attempts/" + encodeURIComponent(attempt.id) + "/submit", {
        method: "POST",
        body: JSON.stringify({ answers })
      });
      syncAttempt(data.attempt);
      setResult(data.result || data.attempt?.result || null);
      localStorage.removeItem("em-topic-answers:" + attempt.id);
      setNotice("");
      setConnectionIssue(false);
    } catch (submitError) {
      if (submitError.data?.attempt) syncAttempt(submitError.data.attempt);
      setError(submitError.message);
      if (submitError.data?.canRecover) setNotice("Texnik uzilish bo‘lgan bo‘lsa, testni bir marta tiklash mumkin.");
    } finally {
      setBusy(false);
    }
  };

  const recoverAttempt = async () => {
    if (!attempt || busy) return;
    setBusy(true);
    setError("");
    try {
      const data = await api("attempts/" + encodeURIComponent(attempt.id) + "/recover", { method: "POST", body: "{}" });
      syncAttempt(data.attempt);
      setNotice("Texnik tiklash ishlatildi. Sizga 2 daqiqalik qo‘shimcha vaqt berildi.");
      setConnectionIssue(false);
    } catch (recoverError) {
      setError(recoverError.message);
    } finally {
      setBusy(false);
    }
  };

  const returnToTopics = async () => {
    setAttempt(null);
    attemptRef.current = null;
    setSelectedTopic(null);
    setResult(null);
    setAnswers({});
    setNotice("");
    localStorage.removeItem(activeAttemptKey);
    if (attempt?.id) localStorage.removeItem("em-topic-answers:" + attempt.id);
    try { await loadTopics(); } catch (loadError) { setError(loadError.message); }
  };

  useEffect(() => {
    if (!attempt?.id) return;
    const pending = localStorage.getItem(pendingDepartureKey(attempt.id));
    if (pending && attempt.status === "started") sendDeparture(attempt.id, pending);
  }, [attempt?.id, attempt?.status, sendDeparture]);

  const leaveTest = () => {
    if (!attempt || attempt.status !== "started") {
      setAttempt(null);
      attemptRef.current = null;
      return;
    }
    if (!window.confirm("Testdan chiqish sahifa uzilishi sifatida qayd etiladi. Birinchi chiqishda ogohlantirish, keyingi chiqishlarda " + attempt.penaltySeconds + " soniya vaqt kamayadi. Urinish saqlanadi. Chiqasizmi?")) return;
    const key = eventId();
    localStorage.setItem(pendingDepartureKey(attempt.id), key);
    sendDeparture(attempt.id, key);
    setAttempt(null);
    attemptRef.current = null;
  };

  const close = () => {
    if (attempt?.status === "started") {
      if (!window.confirm("Testdan chiqish sahifa uzilishi sifatida qayd etiladi. Birinchi chiqishda ogohlantirish, keyingi chiqishlarda " + attempt.penaltySeconds + " soniya vaqt kamayadi. Urinish saqlanadi. Hozir chiqasizmi?")) return;
      const key = eventId();
      localStorage.setItem(pendingDepartureKey(attempt.id), key);
      sendDeparture(attempt.id, key);
    }
    onClose?.();
  };

  const currentStatus = attempt?.status || "";
  const isTestActive = Boolean(attempt && currentStatus === "started" && !result);
  const progressCount = selectedTopic ? selectedTopic.attempts || 0 : 0;

  return <div className="tl-backdrop" role="dialog" aria-modal="true" aria-label="Mavzular va topic assessment">
    <section className="tl-shell">
      <header className="tl-header">
        <div className="tl-brand"><span className="tl-brand-mark">E</span><div><b>ENGLISH MASTER</b><small>TOPIC LEARNING</small></div></div>
        <div className="tl-header-actions">
          {isTestActive && <div className={"tl-timer" + (remaining <= 60 ? " is-low" : "")}><Clock3 size={17}/><b>{formatTime(remaining)}</b></div>}
          <button className="tl-close" onClick={close} aria-label="Yopish"><X size={20}/></button>
        </div>
      </header>

      <main className="tl-content">
        {loading ? <div className="tl-state"><RefreshCw className="tl-spin" size={24}/> Mavzular yuklanmoqda…</div> : error && !attempt ? <div className="tl-state tl-error"><AlertTriangle size={24}/><h2>Ulanishda muammo</h2><p>{error}</p><button className="tl-primary" onClick={() => loadTopics().then(setError("")).catch(e=>setError(e.message))}>Qayta urinish</button></div> : null}

        {!loading && !attempt && !selectedTopic && <>
          <div className="tl-intro"><span className="tl-eyebrow">SIZNING O‘QUV YO‘LINGIZ</span><h1>Mavzuni o‘rganing.<br/><span>Bilimingizni tekshiring.</span></h1><p>Har bir mavzu oxirida alohida test bor. Keyingi mavzu oldingisidan muvaffaqiyatli o‘tgach ochiladi.</p></div>
          {courses.length ? courses.map(course => {
            const passedCount = course.topics.filter(topic=>topic.passed).length;
            return <section className="tl-course" key={course.id}>
              <div className="tl-course-head"><div><span>{course.level}</span><h2>{course.title}</h2><p>{course.description || "Mavzular ketma-ketligi"}</p></div><small>{passedCount}/{course.topics.length} mavzu o‘tildi</small></div>
              <div className="tl-topic-list">
                {course.topics.map((topic,index)=><article className={"tl-topic-card" + (!topic.unlocked ? " is-locked" : "") + (topic.passed ? " is-passed" : "")} key={topic.id}>
                  <div className="tl-topic-number">{topic.passed ? <CheckCircle2 size={19}/> : topic.unlocked ? String(index+1).padStart(2,"0") : <Lock size={17}/>}</div>
                  <div className="tl-topic-copy"><b>{topic.title}</b><small>{topic.passed ? "Testdan o‘tildi · " + topic.lastScore + "%" : topic.unlocked ? "O‘rganish va test topshirish mumkin" : "Oldingi mavzu testidan o‘tish kerak"}</small></div>
                  <div className="tl-topic-action">{topic.unlocked ? <button onClick={()=>setSelectedTopic(topic)}>{topic.passed ? "Takrorlash" : "Mavzuni ochish"} <ArrowRight size={15}/></button> : <span>Yopiq</span>}</div>
                </article>)}
              </div>
            </section>;
          }) : <div className="tl-empty"><BookOpen size={28}/><h2>Mavzular hali nashr qilinmagan</h2><p>Administrator kurs, mavzu va unga biriktirilgan testni nashr qilgach, ular shu yerda ko‘rinadi.</p></div>}
        </>}

        {!loading && selectedTopic && !attempt && <>
          <button className="tl-back-link" onClick={()=>setSelectedTopic(null)}><ArrowLeft size={16}/> Mavzularga qaytish</button>
          <div className="tl-topic-detail"><span className="tl-eyebrow">{selectedTopic.examTitle || "TOPIC LESSON"}</span><h1>{selectedTopic.title}</h1><div className="tl-detail-meta"><span><BookOpen size={15}/> Mavzu materiali</span><span><ShieldCheck size={15}/> O‘tish chegarasi: {selectedTopic.passPercent}%</span><span>{progressCount} ta urinish</span></div>
            <div className="tl-lesson-content">{selectedTopic.content ? selectedTopic.content.split(/\n+/).map((line,index)=><p key={index}>{line}</p>) : <p>Bu mavzu uchun material hali qo‘shilmagan. Testni boshlashdan oldin administrator bilan materialni to‘ldiring.</p>}</div>
            <div className="tl-assessment-callout"><div><b>Mavzu yakuniy testi</b><p>{selectedTopic.questionCount || "Savollar"} ta savoldan iborat test. Muvaffaqiyatli o‘tish uchun kamida {selectedTopic.passPercent}% kerak.</p></div><button className="tl-primary" onClick={()=>startAttempt(selectedTopic)} disabled={busy}>{busy ? "Tayyorlanmoqda…" : "Testni boshlash"} <ArrowRight size={16}/></button></div>
          </div>
        </>}

        {attempt && !result && <>
          <div className="tl-test-heading"><button className="tl-back-link" onClick={leaveTest}><ArrowLeft size={16}/> Mavzuga qaytish</button><span className="tl-eyebrow">TOPIC ASSESSMENT</span><h1>{attempt.title}</h1><p>{attempt.courseTitle} · {attempt.lessonTitle}</p></div>
          <div className="tl-rules"><ShieldCheck size={18}/><span>Javoblaringiz avtomatik saqlanadi. Birinchi sahifa uzilishi ogohlantirish beradi; keyingi alohida uzilishlarda {attempt.penaltySeconds} soniya vaqt kamayadi. Brauzer signali aldov isboti emas.</span></div>
          {notice && <div className="tl-notice" role="status">{notice}</div>}
          {connectionIssue && <div className="tl-connection"><Wifi size={17}/> Internet yoki server aloqasi uzildi. Javoblar shu qurilmada saqlanadi; aloqa tiklangach serverga qayta yuboriladi.</div>}
          {error && <div className="tl-error-box" role="alert">{error}</div>}
          {currentStatus === "expired" ? <div className="tl-expired"><Clock3 size={28}/><h2>Test vaqti tugadi</h2><p>{attempt.canRecover ? "Texnik uzilish bo‘lgan bo‘lsa, bir martalik 2 daqiqalik tiklashdan foydalanishingiz mumkin." : "Bu urinishni tiklash muddati tugagan. Yangi savollar to‘plami bilan qayta topshirishingiz mumkin."}</p>{attempt.canRecover && <button className="tl-primary" disabled={busy} onClick={recoverAttempt}>Bir martalik tiklash <RefreshCw size={16}/></button>}<button className="tl-secondary" onClick={()=>returnToTopics()}>Mavzularga qaytish</button></div> : <>
            <div className="tl-progress-line"><span style={{width:Math.round((Object.keys(answers).length / Math.max(1,attempt.questions.length))*100)+"%"}}/></div>
            {attempt.questions.map((question,index)=><article className="tl-question" key={question.id}>
              <div className="tl-question-top"><span>SAVOL {index+1} / {attempt.questions.length}</span><small>{question.points} ball</small></div>
              <h3>{question.prompt}</h3>
              <div className="tl-options">{(question.options||[]).map((option,optionIndex)=><button key={optionIndex} className={answers[question.id]===option ? "is-selected" : ""} onClick={()=>updateAnswer(question.id,option)} disabled={!isTestActive}><span>{String.fromCharCode(65+optionIndex)}</span>{option}</button>)}</div>
            </article>)}
            <div className="tl-submit-row"><small>{Object.keys(answers).length}/{attempt.questions.length} savolga javob berildi</small><button className="tl-primary" onClick={submitAttempt} disabled={busy||!isTestActive}>{busy ? "Tekshirilmoqda…" : "Testni yakunlash"} <ArrowRight size={16}/></button></div>
          </>}
        </>}

        {attempt && result && <>
          <div className="tl-result">
            <div className={"tl-result-icon" + (result.passed ? " is-passed" : "")}>{result.passed ? <Trophy size={30}/> : <AlertTriangle size={28}/>}</div>
            <span className="tl-eyebrow">TEST NATIJASI</span>
            <h1>{result.passed ? "Mavzu muvaffaqiyatli yakunlandi!" : "Yana bir bor mashq qiling."}</h1>
            <div className="tl-score">{result.scorePercent}<small>%</small></div>
            <p>{result.correctCount}/{result.totalQuestions} ta savol to‘g‘ri. O‘tish chegarasi: {result.passPercent}%.</p>
            <div className={result.passed ? "tl-result-status success" : "tl-result-status"}>{result.passed ? "✓ Keyingi mavzu ochildi" : "Keyingi mavzu hozircha yopiq"}</div>
            <div className="tl-feedback-list">{(result.feedback||[]).map((item,index)=><article key={item.questionId} className={item.isCorrect ? "is-correct" : "is-incorrect"}><b>{index+1}. {item.prompt}</b><small>Sizning javobingiz: {item.selectedAnswer || "Javob berilmadi"}</small>{!item.isCorrect && <small>To‘g‘ri javob: {item.correctAnswer}</small>}{item.explanation && <p>{item.explanation}</p>}</article>)}</div>
            <div className="tl-result-actions">{result.passed ? <button className="tl-primary" onClick={returnToTopics}>Keyingi mavzuni ochish <ArrowRight size={16}/></button> : <button className="tl-primary" onClick={()=>{localStorage.removeItem(activeAttemptKey);localStorage.removeItem("em-topic-answers:"+attempt.id);setAttempt(null);attemptRef.current=null;setResult(null);setAnswers({});setNotice("Yangi urinish uchun savollar qayta aralashtiriladi.");}}>Yangi savollar bilan qayta topshirish <RefreshCw size={16}/></button>}<button className="tl-secondary" onClick={returnToTopics}>Mavzularga qaytish</button></div>
          </div>
        </>}
      </main>
    </section>
  </div>;
}
