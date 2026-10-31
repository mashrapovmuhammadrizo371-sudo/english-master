import { useState } from 'react';
import { ArrowRight, BookOpen, Brain, CheckCircle2, ChevronRight, GraduationCap, Headphones, Menu, MessageCircle, ShieldCheck, Sparkles, Target, Trophy, X } from 'lucide-react';

const questions = [
  { q: 'She ___ to school every day.', options: ['go', 'goes', 'going', 'gone'], answer: 1 },
  { q: 'I have lived here ___ 2022.', options: ['for', 'from', 'since', 'during'], answer: 2 },
  { q: 'If I had more time, I ___ another language.', options: ['learn', 'will learn', 'would learn', 'learned'], answer: 2 },
  { q: 'The report ___ by the manager yesterday.', options: ['wrote', 'was written', 'is writing', 'has write'], answer: 1 },
  { q: 'Despite ___ tired, he finished the assignment.', options: ['be', 'was', 'being', 'been'], answer: 2 },
];

function App() {
  const [testOpen, setTestOpen] = useState(false);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [testFinished, setTestFinished] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);

  const startTest = () => {
    setQuestionIndex(0);
    setAnswers([]);
    setTestFinished(false);
    setTestOpen(true);
  };
  const chooseAnswer = (index) => {
    const next = [...answers];
    next[questionIndex] = index;
    setAnswers(next);
  };
  const nextQuestion = () => {
    if (questionIndex < questions.length - 1) setQuestionIndex(questionIndex + 1);
    else setTestFinished(true);
  };
  const score = answers.reduce((total, answer, i) => total + (answer === questions[i].answer ? 1 : 0), 0);
  const level = score <= 1 ? 'A1 — Beginner' : score <= 2 ? 'A2 — Elementary' : score <= 3 ? 'B1 — Intermediate' : score === 4 ? 'B2 — Upper-intermediate' : 'B2+ — Strong result';

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#home" aria-label="English Master home">
          <span className="brand-mark"><GraduationCap size={23} /></span>
          <span>english<span className="brand-accent">master</span><small>IELTS & CEFR PREPARATION</small></span>
        </a>
        <button className="menu-toggle" onClick={() => setMobileMenu(!mobileMenu)} aria-label="Menu">{mobileMenu ? <X /> : <Menu />}</button>
        <nav className={mobileMenu ? 'nav-links nav-open' : 'nav-links'}>
          <a href="#features" onClick={() => setMobileMenu(false)}>Imkoniyatlar</a>
          <a href="#path" onClick={() => setMobileMenu(false)}>O‘quv yo‘li</a>
          <a href="#about" onClick={() => setMobileMenu(false)}>Platforma haqida</a>
          <button className="nav-cta" onClick={startTest}>Darajamni aniqlash <ArrowRight size={16} /></button>
        </nav>
      </header>

      <main id="home">
        <section className="hero">
          <div className="hero-copy">
            <div className="eyebrow"><Sparkles size={15} /> INGLIZ TILINI YANGI BOSQICHGA OLIB CHIQING</div>
            <h1>Ingliz tilingizni<br /> <span>maqsad bilan</span> o‘rganing.</h1>
            <p className="hero-description">CEFR va IELTS imtihonlariga tayyorgarlikni o‘z darajangizdan boshlang. Bilimingizni tekshiring, yo‘lingizni belgilang va bosqichma-bosqich rivojlaning.</p>
            <div className="hero-actions">
              <button className="button-primary" onClick={startTest}>Bepul daraja testi <ArrowRight size={18} /></button>
              <a className="button-quiet" href="#features"><span className="play-icon">↗</span> Platformani ko‘rish</a>
            </div>
            <div className="trust-row"><span><CheckCircle2 size={16} /> Boshlash bepul</span><span><CheckCircle2 size={16} /> O‘z darajangizdan</span><span><CheckCircle2 size={16} /> IELTS & CEFR</span></div>
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
            <article className="feature-card"><div className="feature-icon icon-violet"><Target size={23}/></div><span className="feature-number">01</span><h3>Darajani aniqlash</h3><p>Qisqa diagnostik test orqali ingliz tilini qaysi bosqichdan davom ettirishni bilib oling.</p><button onClick={startTest} className="text-link">Testni boshlash <ArrowRight size={16}/></button></article>
            <article className="feature-card"><div className="feature-icon icon-blue"><BookOpen size={23}/></div><span className="feature-number">02</span><h3>Darajaga mos darslar</h3><p>Grammatika, lug‘at va boshqa muhim mavzularni tartib bilan o‘rganing.</p><span className="coming-label">TEZ ORADA</span></article>
            <article className="feature-card"><div className="feature-icon icon-orange"><Trophy size={23}/></div><span className="feature-number">03</span><h3>IELTS & CEFR practice</h3><p>Imtihon formatiga mos mashqlar orqali bilimingizni mustahkamlang.</p><span className="coming-label">TEZ ORADA</span></article>
          </div>
        </section>

        <section className="path-section" id="path">
          <div className="path-copy"><span className="eyebrow">BIRINCHI QADAM</span><h2>Maqsadingizni<br /><span>bugun belgilang.</span></h2><p>Ingliz tilini o‘rganishda eng muhimi — hozirgi darajangizni bilish va davomiylik. Qisqa testdan boshlang, keyin o‘zingizga mos o‘quv rejasini tanlang.</p><button className="button-primary" onClick={startTest}>Darajamni tekshirish <ArrowRight size={18}/></button></div>
          <div className="path-steps"><div className="path-step active"><span>1</span><div><b>Darajangizni aniqlang</b><small>Qisqa boshlang‘ich test</small></div><CheckCircle2 size={20}/></div><div className="path-step"><span>2</span><div><b>Maqsadingizni tanlang</b><small>CEFR, IELTS yoki umumiy English</small></div><ChevronRight size={20}/></div><div className="path-step"><span>3</span><div><b>Reja bo‘yicha o‘rganing</b><small>Darslar va amaliy mashqlar</small></div><ChevronRight size={20}/></div></div>
        </section>

        <section className="bottom-cta" id="about"><div><span className="eyebrow">ENGLISH MASTER</span><h2>Kelajakdagi ingliz tilingiz<br />bugungi qadamingizdan boshlanadi.</h2></div><button className="button-light" onClick={startTest}>Bepul boshlash <ArrowRight size={18}/></button></section>
      </main>
      <footer><a className="footer-brand" href="#home">english<span>master</span></a><p>IELTS & CEFR Preparation Platform</p><span>© 2026 English Master. O‘rganish yo‘lingiz shu yerdan boshlanadi.</span></footer>

      {testOpen && <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Daraja testi">
        <div className="test-modal">
          <button className="modal-close" onClick={() => setTestOpen(false)} aria-label="Yopish"><X size={21}/></button>
          {!testFinished ? <>
            <div className="test-kicker">ENGLISH MASTER <span>·</span> TEZKOR TEST</div>
            <div className="test-progress-label"><span>Savol {questionIndex + 1} / {questions.length}</span><span>{Math.round(((questionIndex + 1) / questions.length) * 100)}%</span></div>
            <div className="test-progress"><span style={{width: ((questionIndex + 1) / questions.length) * 100 + '%'}}></span></div>
            <h2>{questions[questionIndex].q}</h2><p className="test-help">To‘g‘ri javobni tanlang.</p>
            <div className="answer-list">{questions[questionIndex].options.map((option, i) => <button key={option} className={answers[questionIndex] === i ? 'answer-option selected' : 'answer-option'} onClick={() => chooseAnswer(i)}><span>{String.fromCharCode(65 + i)}</span>{option}{answers[questionIndex] === i && <CheckCircle2 size={18}/>}</button>)}</div>
            <button className="button-primary test-next" disabled={answers[questionIndex] === undefined} onClick={nextQuestion}>{questionIndex === questions.length - 1 ? 'Natijani ko‘rish' : 'Keyingi savol'} <ArrowRight size={17}/></button>
          </> : <div className="test-result"><div className="result-icon"><GraduationCap size={32}/></div><span className="test-kicker">TEST YAKUNLANDI</span><h2>Sizning taxminiy natijangiz</h2><div className="result-level">{level}</div><p>Siz {questions.length} ta savoldan {score} tasiga to‘g‘ri javob berdingiz.</p><div className="result-note">Bu qisqa demo-test rasmiy CEFR yoki IELTS baholashi emas. Aniqroq darajani bilish uchun kengroq test kerak bo‘ladi.</div><button className="button-primary test-next" onClick={() => setTestOpen(false)}>Davom etish <ArrowRight size={17}/></button><button className="restart-link" onClick={startTest}>Testni qayta ishlash</button></div>}
        </div>
      </div>}
    </div>
  );
}

export default App;