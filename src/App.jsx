import { useState, useRef, useEffect } from 'react';
import Assessment from './Assessment.jsx';
import BrandMark from './BrandMark.jsx';
import BrandHero from './BrandHero.jsx';
import { ArrowRight, BookOpen, Brain, CheckCircle2, ChevronRight, GraduationCap, Headphones, Menu, MessageCircle, ShieldCheck, Sparkles, Target, Trophy, X, CalendarCheck, Languages, Star, Flame } from 'lucide-react';

const readingPassages = [
  {
    level: 'A1',
    title: 'Tom’s Day',
    text: 'Tom is ten years old. He lives in a small house with his family. Every morning, he eats breakfast at seven o’clock and walks to school. His favourite subject is English.',
    questions: [
      { type: 'tf', q: 'Tom is ten years old.', answer: 'true' },
      { type: 'tf', q: 'Tom goes to school by bus.', answer: 'false' },
      { type: 'word', q: 'Where does Tom live?', answer: 'house' },
      { type: 'word', q: 'What is his favourite subject?', answer: 'english' },
    ],
  },
  {
    level: 'A2',
    title: 'A Weekend Trip',
    text: 'Last Saturday, Maya travelled to Samarkand with her cousin. They went by train because it was cheaper than taking a taxi. In the morning, they visited a famous square and took photos. After lunch, they bought some local bread before returning home in the evening.',
    questions: [
      { type: 'tf', q: 'Maya travelled with her brother.', answer: 'false' },
      { type: 'tf', q: 'They chose the train because it cost less.', answer: 'true' },
      { type: 'word', q: 'Where did Maya travel?', answer: 'samarkand' },
      { type: 'word', q: 'What local food did they buy?', answer: 'bread' },
    ],
  },
  {
    level: 'B1',
    title: 'Learning a New Skill',
    text: 'When Aziz decided to learn photography, he expected to improve quickly. At first, however, many of his pictures were too dark or out of focus. Instead of buying an expensive camera, he practised with his phone and watched free lessons online. After several months, he became more confident and began taking photos for school events.',
    questions: [
      { type: 'tf', q: 'Aziz immediately became an excellent photographer.', answer: 'false' },
      { type: 'tf', q: 'He used free online lessons to practise.', answer: 'true' },
      { type: 'word', q: 'Which device did Aziz use at first?', answer: 'phone' },
      { type: 'word', q: 'What events did he later take photos for?', answer: 'school' },
    ],
  },
  {
    level: 'B2',
    title: 'The Value of Public Libraries',
    text: 'Although digital resources have made information easier to access, public libraries continue to serve an important purpose. They provide reliable materials, quiet places to study, and support for people who may not have a suitable internet connection at home. Many libraries have also adapted by offering workshops and access to digital tools. Their role is therefore changing rather than disappearing.',
    questions: [
      { type: 'tf', q: 'The text argues that public libraries are no longer useful.', answer: 'false' },
      { type: 'tf', q: 'Some libraries now offer workshops and digital tools.', answer: 'true' },
      { type: 'word', q: 'What kind of place do libraries provide for studying?', answer: 'quiet' },
      { type: 'word', q: 'According to the text, is the role of libraries disappearing or changing?', answer: 'changing' },
    ],
  },
];

function App() {
  const [mobileMenu, setMobileMenu] = useState(false);
  const [authUser, setAuthUser] = useState(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [authError, setAuthError] = useState('');
  const googleButtonRef = useRef(null);
  const authApi = 'https://english-master-auth.mashrapovmuhammadrizo371.workers.dev/verify';
  const verifyGoogleCredential = async (credential) => {
    const response = await fetch(authApi, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ credential }) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.ok || !data.user) throw new Error(data.error || 'Google hisobni tekshirib bo‘lmadi.');
    localStorage.setItem('em-auth-session', JSON.stringify({ credential, expiresAt: data.expiresAt, user: data.user }));
    setAuthUser(data.user);
    setAuthError('');
    return data.user;
  };
  const signOut = () => {
    localStorage.removeItem('em-auth-session');
    setAuthUser(null);
    setAuthError('');
    if (window.google?.accounts?.id) window.google.accounts.id.disableAutoSelect();
  };

  const [activePage, setActivePage] = useState('home');
  const navigateTo = (page) => { setActivePage(page); setMobileMenu(false); if (page === 'tutor') setAiTutorOpen(true); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const [readingOpen, setReadingOpen] = useState(false);
  const [readingIndex, setReadingIndex] = useState(0);
  const [readingAnswers, setReadingAnswers] = useState({});
  const [readingFinished, setReadingFinished] = useState(false);
  const [studyPlanOpen, setStudyPlanOpen] = useState(false);
  const [activeLesson, setActiveLesson] = useState(false);
  const [lessonAnswer, setLessonAnswer] = useState('');
  const [lessonChecked, setLessonChecked] = useState(false);
  const [completedLessons, setCompletedLessons] = useState(() => { try { return JSON.parse(localStorage.getItem('em-completed-lessons') || '[]'); } catch { return []; } });
  const [aiTutorOpen, setAiTutorOpen] = useState(false);
  const [bossOpen, setBossOpen] = useState(false);
  const [bossInput, setBossInput] = useState('');
  const [bossBusy, setBossBusy] = useState(false);
  const [bossMessages, setBossMessages] = useState([{ role: 'assistant', content: 'Salom! Men BOSS AI — English Master AI jamoasining bosh yordamchisiman. G‘oyangizni yozing, mutaxassislar bilan tahlil qilaman.' }]);
  const [assessmentOpen, setAssessmentOpen] = useState(false);
  const [vocabOpen, setVocabOpen] = useState(false);
  const [dailyOpen, setDailyOpen] = useState(false);
  const [tutorInput, setTutorInput] = useState('');
  const [tutorFeedback, setTutorFeedback] = useState('');
  const [tutorMessages, setTutorMessages] = useState([{ role: 'assistant', content: 'Hi! I am your English tutor. What would you like to talk about today? You can write in English or Uzbek.' }]);
  const [tutorBusy, setTutorBusy] = useState(false);
  const [tutorLevel, setTutorLevel] = useState('A2');
  const [voiceListening, setVoiceListening] = useState(false);
  const tutorEndRef = useRef(null);
  const [dailyDone, setDailyDone] = useState(localStorage.getItem('em-daily-done') === new Date().toDateString());
  const [dailyStats, setDailyStats] = useState(() => { try { return JSON.parse(localStorage.getItem('em-daily-stats') || '{"xp":0,"streak":0,"lastDay":""}'); } catch { return { xp: 0, streak: 0, lastDay: '' }; } });
  const [knownWords, setKnownWords] = useState(() => { try { return JSON.parse(localStorage.getItem('em-known-words') || '[]'); } catch { return []; } });
  useEffect(() => {
    let active = true;
    const restoreSession = async () => {
      try {
        const saved = JSON.parse(localStorage.getItem('em-auth-session') || 'null');
        if (saved?.credential && saved.expiresAt > Date.now()) await verifyGoogleCredential(saved.credential);
        else localStorage.removeItem('em-auth-session');
      } catch { localStorage.removeItem('em-auth-session'); }
      finally { if (active) setAuthChecking(false); }
    };
    restoreSession();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (authChecking || authUser || !googleButtonRef.current) return;
    let cancelled = false;
    const initializeGoogle = () => {
      if (cancelled || !window.google?.accounts?.id || !googleButtonRef.current) return;
      window.google.accounts.id.initialize({
        client_id: '574848907767-gp77d9j9f7pb4ri1t9v06hq959vjs17c.apps.googleusercontent.com',
        callback: async (response) => {
          try { setAuthError(''); await verifyGoogleCredential(response.credential); }
          catch (error) { setAuthError(error.message || 'Kirishda xatolik yuz berdi.'); }
        },
        auto_select: true,
        cancel_on_tap_outside: false
      });
      window.google.accounts.id.renderButton(googleButtonRef.current, { theme: 'outline', size: 'large', shape: 'pill', text: 'continue_with', width: 300, locale: 'uz' });
    };
    if (window.google?.accounts?.id) initializeGoogle();
    else {
      let script = document.getElementById('google-identity-services');
      if (!script) {
        script = document.createElement('script');
        script.id = 'google-identity-services';
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
      }
      script.addEventListener('load', initializeGoogle);
    }
    return () => { cancelled = true; };
  }, [authChecking, authUser]);

  const vocabulary = [
    { word: 'improve', translation: 'yaxshilamoq', example: 'I want to improve my English.', level: 'A2' },
    { word: 'confident', translation: 'o‘ziga ishongan', example: 'I feel confident when I practise.', level: 'B1' },
    { word: 'achieve', translation: 'erishmoq', example: 'You can achieve your goals.', level: 'B1' },
    { word: 'although', translation: 'garchi', example: 'Although it was hard, I continued.', level: 'B1' },
    { word: 'opportunity', translation: 'imkoniyat', example: 'Learning English creates opportunities.', level: 'B1' },
    { word: 'habit', translation: 'odat', example: 'Five minutes a day can become a habit.', level: 'A2' },
  ];
  const saveKnownWords = (next) => { setKnownWords(next); localStorage.setItem('em-known-words', JSON.stringify(next)); };
  const finishDailyPractice = () => {
    if (dailyDone) return;
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    const nextStats = { xp: dailyStats.xp + 10, streak: dailyStats.lastDay === yesterday ? dailyStats.streak + 1 : dailyStats.lastDay === today ? dailyStats.streak : 1, lastDay: today };
    setDailyStats(nextStats); localStorage.setItem('em-daily-stats', JSON.stringify(nextStats));
    localStorage.setItem('em-daily-done', today); setDailyDone(true);
  };
  const submitTutorPractice = async () => {
    const text = tutorInput.trim();
    if (!text || tutorBusy) return;
    const nextMessages = [...tutorMessages, { role: 'user', content: text }];
    setTutorMessages(nextMessages);
    setTutorInput('');
    setTutorFeedback('');
    setTutorBusy(true);
    try {
      const response = await fetch('https://english-master-assessment.mashrapovmuhammadrizo371.workers.dev', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'chat', content: text, instructions: 'English level: ' + tutorLevel + '. Continue a friendly English-learning conversation. Reply naturally to the user, ask one relevant follow-up question, correct important English mistakes gently, and explain corrections briefly in Uzbek. Return JSON with keys estimatedLevel, summary, criteria, corrections, strengths, nextSteps, score. Put the actual conversational reply in summary and any corrections in corrections.' })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.detail ? data.error + ' (' + data.detail + ')' : data.error || 'AI javob bera olmadi.');
      const result = data.assessment || {};
      const reply = [result.summary || '', ...(Array.isArray(result.corrections) ? result.corrections.map(c => c.corrected ? 'Correction: ' + c.corrected + (c.explanation ? ' — ' + c.explanation : '') : '') : []), ...(Array.isArray(result.nextSteps) ? result.nextSteps : [])].filter(Boolean).join('\n\n');
      setTutorMessages([...nextMessages, { role: 'assistant', content: reply || 'Let’s keep practising! Tell me more.' }]);
    } catch (error) {
      setTutorMessages([...nextMessages, { role: 'assistant', content: 'Ulanishda xatolik: ' + (error.message || 'Qayta urinib ko‘ring.') }]);
    } finally { setTutorBusy(false); }
  };
  const submitBossTask = async () => {
    const task = bossInput.trim();
    if (!task || bossBusy) return;
    const history = [...bossMessages, { role: 'user', content: task }];
    setBossMessages(history); setBossInput(''); setBossBusy(true);
    try {
      const agents = [
        { name: 'AI Innovator', role: 'Generate 3 original, practical product ideas for English Master.' },
        { name: 'AI Designer', role: 'Suggest a clean, modern, mobile-friendly UI concept. Preserve the purple/navy design.' },
        { name: 'AI Builder', role: 'Propose feature behavior and a practical implementation plan. Do not claim code was changed.' },
        { name: 'AI Analyst', role: 'Review feasibility, user value, risks, and priorities.' }
      ];
      const results = [];
      for (const agent of agents) {
        const response = await fetch('https://english-master-assessment.mashrapovmuhammadrizo371.workers.dev', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'chat', content: task, instructions: 'You are ' + agent.name + '. ' + agent.role + ' Reply in Uzbek, concise and concrete. Return JSON with keys summary, corrections, nextSteps, strengths, score. Put your answer in summary.' })
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || 'AI mutaxassislardan biri javob bera olmadi.');
        results.push({ name: agent.name, text: data.assessment?.summary || 'Taklif tayyor.' });
      }
      const combined = results.map(item => item.name + ':\n' + item.text).join('\n\n');
      const finalResponse = await fetch('https://english-master-assessment.mashrapovmuhammadrizo371.workers.dev', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'chat', content: 'Foydalanuvchi vazifasi: ' + task + '\n\nMutaxassislar natijalari:\n' + combined, instructions: 'You are BOSS AI, coordinator of four specialists. Synthesize their input into one clear Uzbek response: best recommendation, why, practical next steps, and resolve disagreements. Do not claim actions were performed. Return JSON with keys summary, corrections, nextSteps, strengths, score. Put synthesis in summary.' })
      });
      const finalData = await finalResponse.json().catch(() => ({}));
      if (!finalResponse.ok) throw new Error(finalData.error || 'BOSS AI yakuniy javobni tayyorlay olmadi.');
      const synthesis = finalData.assessment?.summary || 'Mutaxassislar tahlili tayyor.';
      setBossMessages([...history, { role: 'assistant', content: '👑 BOSS AI — YAKUNIY YECHIM\n\n' + synthesis + '\n\n' + results.map(item => '• ' + item.name + ': javobi tayyor').join('\n') }]);
    } catch (error) {
      setBossMessages([...history, { role: 'assistant', content: 'Ulanishda xatolik: ' + (error.message || 'Qayta urinib ko‘ring.') }]);
    } finally { setBossBusy(false); }
  };
  const startVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) { setTutorFeedback('Brauzeringiz ovozni matnga aylantirishni qo‘llamaydi. Chrome brauzerida sinab ko‘ring yoki matn yozing.'); return; }
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.onstart = () => setVoiceListening(true);
    recognition.onend = () => setVoiceListening(false);
    recognition.onerror = () => { setVoiceListening(false); setTutorFeedback('Mikrofon ishlamadi. Brauzer sozlamalarida mikrofon ruxsatini tekshiring.'); };
    recognition.onresult = event => setTutorInput(prev => (prev ? prev + ' ' : '') + event.results[0][0].transcript);
    recognition.start();
  };
  const speakTutorReply = (text) => {
    if (!('speechSynthesis' in window)) { setTutorFeedback('Brauzeringiz ovozli o‘qishni qo‘llamaydi.'); return; }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.92;
    window.speechSynthesis.speak(utterance);
  };

  const startReading = () => {
    setReadingIndex(0);
    setReadingAnswers({});
    setReadingFinished(false);
    setReadingOpen(true);
  };
  const isAdmin = Boolean(authUser?.isAdmin);
  const readingScore = readingPassages.reduce((sum, passage, pIndex) => sum + passage.questions.reduce((n, question, qIndex) => {
    const value = readingAnswers[`${pIndex}-${qIndex}`];
    return n + (value !== undefined && String(value).trim().toLowerCase() === question.answer ? 1 : 0);
  }, 0), 0);
  const readingLevelCode = (() => {
    const passed = readingPassages.map((passage, pIndex) => passage.questions.reduce((n, question, qIndex) => n + (String(readingAnswers[`${pIndex}-${qIndex}`] ?? '').trim().toLowerCase() === question.answer ? 1 : 0), 0));
    if (passed[0] < 3) return 'A1';
    if (passed[1] < 3) return 'A2';
    if (passed[2] < 3) return 'B1';
    return 'B2';
  })();
  const readingLevel = (() => {
    const passed = readingPassages.map((passage, pIndex) => passage.questions.reduce((n, question, qIndex) => n + (String(readingAnswers[`${pIndex}-${qIndex}`] ?? '').trim().toLowerCase() === question.answer ? 1 : 0), 0));
    if (passed[0] < 3) return 'A1 — Beginner';
    if (passed[1] < 3) return 'A2 — Elementary';
    if (passed[2] < 3) return 'B1 — Intermediate';
    return 'B2 — Upper-intermediate';
  })();


  if (authChecking) {
    return <div className="auth-screen"><div className="auth-card"><div className="auth-brand-lockup"><BrandMark className="auth-brand-mark" /><span className="auth-kicker">ENGLISH MASTER</span><span className="auth-brand-quote">Your Future Speaks English.</span></div><h1>Hisobingiz tekshirilmoqda</h1><p>Google hisobingiz xavfsiz tekshirilmoqda…</p><div className="auth-loading-line"></div></div></div>;
  }
  if (!authUser) {
    return <div className="auth-screen"><div className="auth-card"><div className="auth-brand-lockup"><BrandMark className="auth-brand-mark" /><span className="auth-kicker">ENGLISH MASTER</span><span className="auth-brand-quote">Your Future Speaks English.</span></div><h1>O‘rganish yo‘lingizni boshlang.</h1><p>Saytga kirish va o‘quv profilingizni ochish uchun Google hisobingiz bilan davom eting.</p><div ref={googleButtonRef} className="google-login-button"></div>{authError && <p className="auth-error">{authError}</p>}<small>Google hisobingiz paroli English Master bilan ulashilmaydi.</small></div></div>;
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand em-brand" href="#home" aria-label="English Master home">
          <BrandMark />
          <span className="em-brand__name">English <b>Master</b></span>
        </a>
        <button className="menu-toggle" onClick={() => setMobileMenu(!mobileMenu)} aria-label="Menu">{mobileMenu ? <X /> : <Menu />}</button>
        <nav className={mobileMenu ? 'nav-links nav-open app-navigation' : 'nav-links app-navigation'} aria-label="Asosiy navigatsiya">
          <button className={activePage === 'home' ? 'nav-page active' : 'nav-page'} onClick={() => navigateTo('home')}>Bosh sahifa</button>
          <button className={activePage === 'lessons' ? 'nav-page active' : 'nav-page'} onClick={() => navigateTo('lessons')}>Darslar</button>
          <button className={activePage === 'tests' ? 'nav-page active' : 'nav-page'} onClick={() => navigateTo('tests')}>Testlar</button>
          <button className={activePage === 'tutor' ? 'nav-page active' : 'nav-page'} onClick={() => navigateTo('tutor')}>AI Tutor</button>
          {isAdmin && <button className="nav-page boss-nav" onClick={() => { setBossOpen(true); setMobileMenu(false); }}>👑 BOSS AI</button>}
          <button className={activePage === 'profile' ? 'nav-page active' : 'nav-page'} onClick={() => navigateTo('profile')}>Profil</button>
        </nav>
        <div className="auth-user-chip">{authUser.picture ? <img src={authUser.picture} alt="" /> : <span>{(authUser.name || 'U').slice(0,1)}</span>}<b>{authUser.name}</b><button onClick={signOut}>Chiqish</button></div>
      </header>

      <main id="home" className="app-pages" data-page={activePage}>
        {activePage === 'home' && <BrandHero />}
        <section className="hero" id="em-start">
          <div className="hero-copy">
            <div className="eyebrow"><Sparkles size={15} /> INGLIZ TILINI YANGI BOSQICHGA OLIB CHIQING</div>
            <h1>Ingliz tilingizni<br /> <span>maqsad bilan</span> o‘rganing.</h1>
            <p className="hero-description">CEFR va IELTS imtihonlariga tayyorgarlikni o‘z darajangizdan boshlang. Bilimingizni tekshiring, yo‘lingizni belgilang va bosqichma-bosqich rivojlaning.</p>
            <div className="hero-actions">
              <button className="button-reading" onClick={startReading}><BookOpen size={17} /> Reading testi</button>
              <a className="button-quiet" href="#features"><span className="play-icon">↗</span> Platformani ko‘rish</a>
            </div>
            <div className="trust-row"><span><CheckCircle2 size={16} /> Boshlash bepul</span><span><CheckCircle2 size={16} /> O‘z darajangizdan</span><span><CheckCircle2 size={16} /> IELTS & CEFR</span><span><Flame size={16} /> {dailyStats.streak} kunlik streak</span></div>
          </div>
          <div className="hero-art" aria-label="Learning progress illustration">
            <div className="orbit orbit-one"></div><div className="orbit orbit-two"></div>
            <div className="floating-chip chip-top"><span className="chip-dot"></span> YOUR NEXT LEVEL</div>
            <div className="progress-card">
              <div className="card-topline"><span className="tiny-label">YOUR LEARNING PATH</span><span className="card-icon"><Target size={18}/></span></div>
              <div className="progress-title">Har kuni bir qadam.</div>
              <p className="progress-subtitle">Kichik mashqlar, katta natijalar.</p>
              <div className="progress-line"><span></span></div>
              <div className="progress-meta"><span>O‘quv yo‘li</span><b>01 / 04</b></div>
              <div className="skill-row"><span className="skill-icon purple"><BookOpen size={17}/></span><span><b>Grammar</b><small>Qoidalarni mustahkamlash</small></span><ChevronRight size={17}/></div>
              <div className="skill-row"><span className="skill-icon blue"><Headphones size={17}/></span><span><b>Listening</b><small>Eshitib tushunish</small></span><ChevronRight size={17}/></div>
              <div className="skill-row"><span className="skill-icon orange"><MessageCircle size={17}/></span><span><b>Speaking</b><small>Erkin muloqot</small></span><ChevronRight size={17}/></div>
            </div>
            <div className="floating-chip chip-bottom"><span className="trophy-icon"><Trophy size={18}/></span><span><b>Progress, not perfection</b><small>Har kuni yaxshiroq</small></span></div>
            <div className="decor decor-a">A</div><div className="decor decor-b">✳</div>
          </div>
        </section>

        <section className="stats-strip" aria-label="Platforma yo‘nalishlari">
          <div><span className="stat-icon"><Target size={20}/></span><span><b>CEFR</b><small>A1 dan C2 gacha</small></span></div>
          <div><span className="stat-icon"><GraduationCap size={20}/></span><span><b>IELTS</b><small>Imtihonga tayyorgarlik</small></span></div>
          <div><span className="stat-icon"><Brain size={20}/></span><span><b>Shaxsiy yo‘l</b><small>Darajangizga mos reja</small></span></div>
          <div><span className="stat-icon"><ShieldCheck size={20}/></span><span><b>Bosqichma-bosqich</b><small>Barqaror rivojlanish</small></span></div>
        </section>

        <section className="features-section" id="features">
          <div className="section-heading"><span className="eyebrow">SIZ UCHUN YARATILGAN</span><h2>O‘rganishning aniq<br /><span>va qulay yo‘li.</span></h2><p>Kerakli ko‘nikmalarni bir joyda rivojlantiring. Platforma bosqichma-bosqich yangi imkoniyatlar bilan kengayadi.</p></div>
          <div className="feature-grid">
            <article className="feature-card"><div className="feature-icon icon-violet"><Target size={23}/></div><span className="feature-number">01</span><h3>Darajani aniqlash</h3><p>Matn asosidagi Reading testi orqali o‘qib tushunish ko‘nikmangizni tekshiring.</p><button onClick={startReading} className="text-link reading-link">Reading test <ArrowRight size={16}/></button></article>
            <article className="feature-card"><div className="feature-icon icon-blue"><BookOpen size={23}/></div><span className="feature-number">02</span><h3>Darajaga mos darslar</h3><p>Grammatika, lug‘at va boshqa muhim mavzularni tartib bilan o‘rganing.</p><button onClick={() => setVocabOpen(true)} className="text-link">Lug‘atni ochish <ArrowRight size={16}/></button></article>
            <article className="feature-card"><div className="feature-icon icon-orange"><Trophy size={23}/></div><span className="feature-number">03</span><h3>IELTS & CEFR practice</h3><p>Imtihon formatiga mos mashqlar orqali bilimingizni mustahkamlang.</p><button onClick={() => setAiTutorOpen(true)} className="text-link">Ustoz bilan mashq <ArrowRight size={16}/></button></article>
            <article className="feature-card"><div className="feature-icon icon-blue"><CheckCircle2 size={23}/></div><span className="feature-number">04</span><h3>AI orqali tekshirish</h3><p>Writing, Speaking, test va topshiriqlaringizga AI tahlili oling.</p><button onClick={() => setAssessmentOpen(true)} className="text-link">Javobni tekshirish <ArrowRight size={16}/></button></article>
          </div>
        </section>

        <section className="path-section" id="path">
          <div className="path-copy"><span className="eyebrow">BIRINCHI QADAM</span><h2>Maqsadingizni<br /><span>bugun belgilang.</span></h2><p>Reading testi orqali o‘qib tushunish ko‘nikmangizni tekshiring. Keyin o‘zingizga mos o‘quv yo‘nalishini tanlang.</p><button className="button-primary" onClick={startReading}>Reading testini boshlash <ArrowRight size={18}/></button></div>
          <div className="path-steps"><div className="path-step active"><span>1</span><div><b>Testlarni bajaring</b><small>Reading testidan boshlang</small></div><CheckCircle2 size={20}/></div><div className="path-step"><span>2</span><div><b>Maqsadingizni tanlang</b><small>CEFR, IELTS yoki umumiy English</small></div><ChevronRight size={20}/></div><div className="path-step"><span>3</span><div><b>Reja bo‘yicha o‘rganing</b><small>Darslar va amaliy mashqlar</small></div><ChevronRight size={20}/></div></div>
        </section>

        <section className="practice-section" id="practice">
          <div className="section-heading"><span className="eyebrow">BUGUNGI QADAM</span><h2>Har kuni ozgina —<br /><span>katta o‘zgarish.</span></h2><p>So‘zlarni takrorlang, qisqa mashq bajaring va rivojlanishingizni kuzating.</p></div>
          <div className="practice-grid">
            <button className="practice-card" onClick={() => setDailyOpen(true)}><span className="practice-icon"><CalendarCheck size={22}/></span><b>Kunlik 5 daqiqa</b><small>{dailyDone ? 'Bugungi mashq bajarildi ✓' : 'Bugungi mashqni boshlang'}</small><span className="practice-action">{dailyDone ? 'Natijani ko‘rish' : 'Boshlash'} <ArrowRight size={15}/></span></button>
            <button className="practice-card" onClick={() => setVocabOpen(true)}><span className="practice-icon"><Languages size={22}/></span><b>Smart Vocabulary</b><small>{knownWords.length} / {vocabulary.length} ta so‘z o‘rganildi</small><span className="practice-action">So‘zlarni takrorlash <ArrowRight size={15}/></span></button>
            <button className="practice-card" onClick={() => setAiTutorOpen(true)}><span className="practice-icon"><MessageCircle size={22}/></span><b>English bilan mashq</b><small>Gap yozing va o‘zbekcha tavsiya oling</small><span className="practice-action">Mashqni ochish <ArrowRight size={15}/></span></button>
          </div>
          <div className="progress-summary"><div><span className="summary-icon"><Star size={18}/></span><span><small>Jami XP</small><b>{dailyStats.xp}</b></span></div><div><span className="summary-icon"><Flame size={18}/></span><span><small>Kunlik streak</small><b>{dailyStats.streak} kun</b></span></div><div><span className="summary-icon"><BookOpen size={18}/></span><span><small>O‘rganilgan so‘zlar</small><b>{knownWords.length}</b></span></div></div>
        </section>

        <section className="bottom-cta" id="about"><div><span className="eyebrow">ENGLISH MASTER</span><h2>Kelajakdagi ingliz tilingiz<br />bugungi qadamingizdan boshlanadi.</h2></div><button className="button-light" onClick={startReading}>Reading testini boshlash <ArrowRight size={18}/></button></section>
      </main>
      <footer className="em-footer"><a className="footer-brand em-footer__brand" href="#home" aria-label="English Master home"><BrandMark className="em-footer__mark" /><span>ENGLISH <b>MASTER</b></span></a><p className="em-footer__quote">Your Future Speaks English.</p><span>© 2026 English Master. O‘rganish yo‘lingiz shu yerdan boshlanadi.</span></footer>

      {isAdmin && bossOpen && <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="BOSS AI Control Center"><div className="test-modal boss-modal"><button className="modal-close" onClick={() => setBossOpen(false)} aria-label="Yopish"><X size={21}/></button><div className="test-kicker">ENGLISH MASTER · AI CONTROL CENTER</div><div className="result-icon"><Sparkles size={28}/></div><h2>👑 BOSS AI</h2><p className="lesson-intro">4 ta AI mutaxassis vazifani alohida tahlil qiladi. BOSS AI natijalarni birlashtirib, yagona tavsiya beradi.</p><div className="boss-team-grid"><div><b>💡 AI Innovator</b><small>Yangi g‘oyalar</small></div><div><b>🎨 AI Designer</b><small>Dizayn takliflari</small></div><div><b>🏗️ AI Builder</b><small>Funksiya rejasi</small></div><div><b>🔍 AI Analyst</b><small>Tahlil va ustuvorlik</small></div></div><div className="boss-chat-history">{bossMessages.map((message,index)=><div className={message.role==='user'?'tutor-chat-bubble user':'tutor-chat-bubble assistant'} key={index}><b>{message.role==='user'?'Siz':'👑 BOSS AI'}</b><p>{message.content}</p></div>)}{bossBusy && <div className="tutor-chat-bubble assistant"><p>4 ta AI ishlayapti, BOSS natijalarni birlashtirmoqda…</p></div>}</div><textarea className="tutor-input" value={bossInput} onChange={e=>setBossInput(e.target.value)} placeholder="Masalan: Saytga yangi Speaking bo‘limi uchun g‘oya ber…" rows="3" onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();submitBossTask();}}}/><button className="button-primary test-next" disabled={!bossInput.trim()||bossBusy} onClick={submitBossTask}>{bossBusy?'AI jamoasi ishlayapti…':'Jamoaga topshiriq berish'} <ArrowRight size={16}/></button><div className="result-note">AI tavsiya va reja beradi; hozircha sayt kodini avtomatik o‘zgartirmaydi.</div></div></div>}
      {assessmentOpen && <Assessment onClose={() => setAssessmentOpen(false)} />}
      {dailyOpen && <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Kunlik mashq"><div className="test-modal"><button className="modal-close" onClick={() => setDailyOpen(false)} aria-label="Yopish"><X size={21}/></button><div className="test-kicker">DAILY PRACTICE · 5 DAQIQA</div><div className="result-icon"><CalendarCheck size={28}/></div><h2>Bugungi kichik maqsad</h2><p className="lesson-intro">Quyidagi gapni o‘qing va ma’nosini eslab qoling.</p><div className="daily-prompt"><b>“Small steps lead to big progress.”</b><span>Kichik qadamlar katta rivojlanishga olib keladi.</span></div><div className="daily-task"><b>Mini-vazifa</b><p>“I practise English every day.” gapini ovoz chiqarib 3 marta o‘qing, so‘ng o‘zingiz haqingizda shunga o‘xshash bitta gap yozing.</p></div>{dailyDone ? <p className="lesson-feedback correct">Bugungi mashq bajarilgan! Jami {dailyStats.xp} XP to‘pladingiz.</p> : <button className="button-primary test-next" onClick={finishDailyPractice}>Mashqni bajardim · +10 XP <Star size={16}/></button>}</div></div>}
      {vocabOpen && <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Smart Vocabulary"><div className="test-modal"><button className="modal-close" onClick={() => setVocabOpen(false)} aria-label="Yopish"><X size={21}/></button><div className="test-kicker">SMART VOCABULARY · {knownWords.length}/{vocabulary.length}</div><h2>So‘zlarni o‘rganing</h2><p className="lesson-intro">“Yod oldim” tugmasini bosib, o‘rgangan so‘zlaringizni belgilang. Natija shu brauzerda saqlanadi.</p><div className="smart-vocab-list">{vocabulary.map(item => <article className={knownWords.includes(item.word) ? 'smart-vocab-item learned' : 'smart-vocab-item'} key={item.word}><div className="vocab-top"><b>{item.word}</b><span>{item.level}</span></div><p>{item.translation}</p><small>{item.example}</small><button className="vocab-mark" onClick={() => saveKnownWords(knownWords.includes(item.word) ? knownWords.filter(word => word !== item.word) : [...knownWords, item.word])}>{knownWords.includes(item.word) ? '✓ O‘rganildi' : 'Yod oldim'}</button></article>)}</div><p className="result-note">Eslatma: bu boshlang‘ich takrorlash ro‘yxati. Hozircha so‘zlar hisoblagichi qurilmangizdagi brauzerda saqlanadi.</p></div></div>}
      {aiTutorOpen && <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="AI English Tutor"><div className="test-modal tutor-chat-modal"><button className="modal-close" onClick={() => {setAiTutorOpen(false);setTutorFeedback('');if ('speechSynthesis' in window) window.speechSynthesis.cancel();}} aria-label="Yopish"><X size={21}/></button><div className="test-kicker">ENGLISH MASTER · AI TUTOR</div><div className="result-icon"><MessageCircle size={28}/></div><h2>AI bilan inglizcha gaplashing</h2><p className="lesson-intro">Inglizcha yozing yoki mikrofon orqali gapiring. AI suhbatlashadi va xatolaringizni o‘zbekcha tushuntiradi.</p><label className="tutor-level-label">Ingliz tili darajangiz</label><select className="tutor-level-select" value={tutorLevel} onChange={e=>setTutorLevel(e.target.value)}><option>A1</option><option>A2</option><option>B1</option><option>B2</option><option>C1</option><option>C2</option></select><div className="tutor-chat-history">{tutorMessages.map((message,index)=><div className={message.role==='user'?'tutor-chat-bubble user':'tutor-chat-bubble assistant'} key={index}><b>{message.role==='user'?'Siz':'AI Tutor'}</b><p>{message.content}</p>{message.role==='assistant' && <button className="tutor-speak-button" onClick={()=>speakTutorReply(message.content)}>🔊 Eshitish</button>}</div>)}{tutorBusy && <div className="tutor-chat-bubble assistant"><p>AI javob tayyorlamoqda…</p></div>}<div ref={tutorEndRef}/></div><textarea className="tutor-input" value={tutorInput} onChange={e=>setTutorInput(e.target.value)} placeholder="Write in English… / Inglizcha yozing" rows="2" onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();submitTutorPractice();}}}/><div className="tutor-chat-actions"><button className="tutor-voice-button" onClick={startVoiceInput} disabled={voiceListening}>{voiceListening?'🎙️ Tinglayapman…':'🎙️ Gapirish'}</button><button className="button-primary test-next" disabled={!tutorInput.trim()||tutorBusy} onClick={submitTutorPractice}>{tutorBusy?'Kutilmoqda…':'Yuborish'} <ArrowRight size={16}/></button></div>{tutorFeedback && <div className="tutor-feedback"><p>{tutorFeedback}</p></div>}<div className="result-note">Ovozli kiritish va javobni eshitish brauzeringiz imkoniyatlariga bog‘liq. AI suhbatlari uchun internet kerak.</div></div></div>}
      {studyPlanOpen && <div className="modal-backdrop study-backdrop" role="dialog" aria-modal="true" aria-label="Shaxsiy o‘quv reja">
        <div className="test-modal study-modal">
          <button className="modal-close" onClick={() => { setStudyPlanOpen(false); setActiveLesson(false); }} aria-label="Yopish"><X size={21}/></button>
          {!activeLesson ? <>
            <div className="test-kicker">ENGLISH MASTER · SHAXSIY REJA</div>
            <div className="study-hero"><div className="result-icon"><GraduationCap size={30}/></div><div><span className="study-level-tag">{readingLevelCode} DARAJA</span><h2>Sizning o‘quv yo‘lingiz</h2><p>Reading test natijangiz asosida boshlang‘ich reja tayyorlandi.</p></div></div>
            <div className="study-notice">Bu hozircha Reading natijasiga asoslangan taxminiy reja. To‘liq CEFR darajasini aniqlash uchun keyin Listening, Writing va Speaking ham tekshiriladi.</div>
            <h3 className="study-section-title">Birinchi 7 kunlik reja</h3>
            <div className="study-day-list">
              {[
                ['1-kun','Vocabulary','10 ta yangi so‘z va misollar'],
                ['2-kun','Grammar','Asosiy grammatikani o‘rganish'],
                ['3-kun','Reading','Qisqa matn va tushunish savollari'],
                ['4-kun','Listening','Qisqa audio tinglab tushunish'],
                ['5-kun','Speaking','Kundalik mavzuda 5 ta gap'],
                ['6-kun','Practice','Aralash mashqlar va takrorlash'],
                ['7-kun','Review','Haftalik takrorlash va mini-test'],
              ].map(([day,title,desc], index) => <div className={completedLessons.includes(index) ? 'study-day completed' : 'study-day'} key={day}><span className="study-day-number">{completedLessons.includes(index) ? '✓' : index+1}</span><div><b>{day} · {title}</b><small>{desc}</small></div><span className="study-day-status">{completedLessons.includes(index) ? 'Bajarildi' : index === 0 ? 'Boshlash' : 'Rejada'}</span></div>)}
            </div>
            <button className="button-primary test-next" onClick={() => { setActiveLesson(true); setLessonAnswer(''); setLessonChecked(false); }}>1-darsni boshlash <ArrowRight size={17}/></button>
            <button className="restart-link" onClick={() => { setStudyPlanOpen(false); setReadingOpen(true); }}>Reading natijasiga qaytish</button>
          </> : <>
            <div className="test-kicker">1-DARS · VOCABULARY</div>
            <span className="study-level-tag">{readingLevelCode} DARAJA</span>
            <h2 className="lesson-title">Kundalik inglizcha so‘zlar</h2>
            <p className="lesson-intro">Quyidagi so‘zlarni o‘rganing. Keyin kichik savolga javob bering.</p>
            <div className="vocab-list">
              {[
                ['learn','o‘rganmoq','I learn English every day.'],
                ['improve','yaxshilamoq','I want to improve my English.'],
                ['practice','mashq qilmoq','I practice speaking at home.'],
                ['goal','maqsad','My goal is to speak English well.'],
                ['progress','rivojlanish','I can see my progress.'],
              ].map(([word,translation,example]) => <div className="vocab-item" key={word}><div><b>{word}</b><small>{translation}</small></div><p>{example}</p></div>)}
            </div>
            <div className="lesson-question"><b>Mini-test: “Men ingliz tilimni yaxshilamoqchiman” jumlasidagi “yaxshilamoq” qaysi so‘z?</b>
              {['learn','improve','goal'].map(option => <button key={option} className={lessonAnswer === option ? 'answer-option selected' : 'answer-option'} onClick={() => {setLessonAnswer(option); setLessonChecked(false);}}>{option}</button>)}
              {lessonChecked && <p className={lessonAnswer === 'improve' ? 'lesson-feedback correct' : 'lesson-feedback incorrect'}>{lessonAnswer === 'improve' ? 'To‘g‘ri! “Improve” — yaxshilamoq.' : 'Yana urinib ko‘ring. “Improve” — yaxshilamoq.'}</p>}
            </div>
            <button className="button-primary test-next" disabled={!lessonAnswer} onClick={() => { if (!lessonChecked) { setLessonChecked(true); } else if (lessonAnswer === 'improve') { setCompletedLessons(prev => { const next = prev.includes(0) ? prev : [...prev, 0]; localStorage.setItem('em-completed-lessons', JSON.stringify(next)); return next; }); setActiveLesson(false); } else { setLessonChecked(false); } }}>{!lessonChecked ? 'Javobni tekshirish' : lessonAnswer === 'improve' ? 'Darsni yakunlash' : 'Qayta urinish'} <ArrowRight size={17}/></button>
            <button className="restart-link" onClick={() => setActiveLesson(false)}>O‘quv rejaga qaytish</button>
          </>}
        </div>
      </div>}
      {readingOpen && <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Reading daraja testi">
        <div className="test-modal reading-modal">
          <button className="modal-close" onClick={() => setReadingOpen(false)} aria-label="Yopish"><X size={21}/></button>
          {!readingFinished ? <>
            <div className="test-kicker">ENGLISH MASTER <span>·</span> READING TEST</div>
            <div className="reading-level-badge">{readingPassages[readingIndex].level} daraja matni</div>
            <div className="test-progress-label"><span>Matn {readingIndex + 1} / {readingPassages.length}</span><span>{Math.round(((readingIndex + 1) / readingPassages.length) * 100)}%</span></div>
            <div className="test-progress"><span style={{width: ((readingIndex + 1) / readingPassages.length) * 100 + '%'}}></span></div>
            <h2 className="reading-title">{readingPassages[readingIndex].title}</h2>
            <p className="reading-passage">{readingPassages[readingIndex].text}</p>
            <p className="test-help">Matnni o‘qing va savollarga javob bering.</p>
            <div className="reading-questions">
              {readingPassages[readingIndex].questions.map((question, qIndex) => <div className="reading-question" key={question.q}>
                <b>{qIndex + 1}. {question.q}</b>
                {question.type === 'tf' ? <div className="reading-tf-options">
                  {['true', 'false'].map(option => <button key={option} className={readingAnswers[`${readingIndex}-${qIndex}`] === option ? 'answer-option selected' : 'answer-option'} onClick={() => setReadingAnswers(prev => ({...prev, [`${readingIndex}-${qIndex}`]: option}))}>{option === 'true' ? 'True' : 'False'}</button>)}
                </div> : <input className="reading-input" value={readingAnswers[`${readingIndex}-${qIndex}`] ?? ''} onChange={e => setReadingAnswers(prev => ({...prev, [`${readingIndex}-${qIndex}`]: e.target.value}))} placeholder="Bitta so‘z yozing" aria-label={question.q}/>}
              </div>)}
            </div>
            <div className="test-navigation">
              {readingIndex > 0 && <button className="test-back" onClick={() => setReadingIndex(readingIndex - 1)}>← Oldingi matn</button>}
              <button className="button-primary test-next" onClick={() => readingIndex < readingPassages.length - 1 ? setReadingIndex(readingIndex + 1) : setReadingFinished(true)}>{readingIndex === readingPassages.length - 1 ? 'Natijani ko‘rish' : 'Keyingi matn'} <ArrowRight size={17}/></button>
            </div>
          </> : <div className="test-result"><div className="result-icon"><BookOpen size={32}/></div><span className="test-kicker">READING TEST YAKUNLANDI</span><h2>Sizning Reading natijangiz</h2><div className="result-level">{readingLevel}</div><p>Jami 16 ta savoldan {readingScore} tasiga to‘g‘ri javob berdingiz.</p><div className="result-note">Bu natija faqat Reading — o‘qib tushunish ko‘nikmasini taxminiy baholaydi. Daraja matnlarning murakkabligi va javoblaringizga qarab hisoblandi; bu rasmiy CEFR sertifikati emas.</div><button className="button-primary test-next" onClick={() => { setReadingOpen(false); setStudyPlanOpen(true); }}>O‘quv rejamni ko‘rish <ArrowRight size={17}/></button><button className="restart-link" onClick={startReading}>Reading testni qayta ishlash</button></div>}
        </div>
      </div>}
    </div>
  );
}

export default App;
