import { useState } from 'react';
import { ArrowRight, BookOpen, Brain, CheckCircle2, ChevronRight, GraduationCap, Headphones, Menu, MessageCircle, ShieldCheck, Sparkles, Target, Trophy, X } from 'lucide-react';

const questions = [
  { q: 'I ___ a student.', options: ['am', 'is', 'are', 'be'], answer: 0 },
  { q: 'She ___ coffee every morning.', options: ['drink', 'drinks', 'drinking', 'drank'], answer: 1 },
  { q: 'There ___ two books on the table.', options: ['is', 'am', 'are', 'be'], answer: 2 },
  { q: 'We ___ to the park yesterday.', options: ['go', 'goes', 'went', 'gone'], answer: 2 },
  { q: 'Choose the correct sentence.', options: ['He can to swim.', 'He cans swim.', 'He can swim.', 'He can swimming.'], answer: 2 },
  { q: 'I have lived here ___ three years.', options: ['since', 'for', 'from', 'during'], answer: 1 },
  { q: 'This book is ___ than that one.', options: ['interesting', 'more interesting', 'most interesting', 'the more interesting'], answer: 1 },
  { q: 'They ___ dinner when I arrived.', options: ['have', 'had', 'were having', 'are having'], answer: 2 },
  { q: 'You ___ wear a seat belt. It is the law.', options: ['might', 'must', 'would', 'could'], answer: 1 },
  { q: 'If it rains tomorrow, we ___ at home.', options: ['stayed', 'would stay', 'will stay', 'stay yesterday'], answer: 2 },
  { q: 'I have never ___ sushi before.', options: ['eat', 'ate', 'eaten', 'eating'], answer: 2 },
  { q: 'The letters ___ yesterday.', options: ['sent', 'were sent', 'are sending', 'have send'], answer: 1 },
  { q: 'If I had more free time, I ___ a new language.', options: ['learn', 'will learn', 'would learn', 'would have learned'], answer: 2 },
  { q: 'She asked me where I ___.', options: ['live', 'did I live', 'lived', 'do I live'], answer: 2 },
  { q: 'Despite ___ tired, he finished the project.', options: ['be', 'was', 'being', 'been'], answer: 2 },
  { q: 'By the time we arrived, the film ___.', options: ['already started', 'has already started', 'had already started', 'was already start'], answer: 2 },
  { q: 'If they had left earlier, they ___ the train.', options: ['would catch', 'would have caught', 'will catch', 'had caught'], answer: 1 },
  { q: 'The new bridge ___ by the end of next year.', options: ['will complete', 'will have completed', 'will have been completed', 'has been completing'], answer: 2 },
  { q: 'Hardly ___ the room when the phone rang.', options: ['I had entered', 'had I entered', 'I entered', 'did I entered'], answer: 1 },
  { q: 'Were it not for her advice, I ___ the wrong decision.', options: ['would make', 'will make', 'would have made', 'made'], answer: 2 },

];

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
  const [testOpen, setTestOpen] = useState(false);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [testFinished, setTestFinished] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);\n  const [readingOpen, setReadingOpen] = useState(false);\n  const [readingIndex, setReadingIndex] = useState(0);\n  const [readingAnswers, setReadingAnswers] = useState({});\n  const [readingFinished, setReadingFinished] = useState(false);

  const startReading = () => {\n    setReadingIndex(0);\n    setReadingAnswers({});\n    setReadingFinished(false);\n    setReadingOpen(true);\n    setTestOpen(false);\n  };\n  const readingScore = readingPassages.reduce((sum, passage, pIndex) => sum + passage.questions.reduce((n, question, qIndex) => {\n    const value = readingAnswers[`${pIndex}-${qIndex}`];\n    return n + (value !== undefined && String(value).trim().toLowerCase() === question.answer ? 1 : 0);\n  }, 0), 0);\n  const readingLevel = (() => {\n    const passed = readingPassages.map((passage, pIndex) => passage.questions.reduce((n, question, qIndex) => n + (String(readingAnswers[`${pIndex}-${qIndex}`] ?? '').trim().toLowerCase() === question.answer ? 1 : 0), 0));\n    if (passed[0] < 3) return 'A1 — Beginner';\n    if (passed[1] < 3) return 'A2 — Elementary';\n    if (passed[2] < 3) return 'B1 — Intermediate';\n    return 'B2 — Upper-intermediate';\n  })();\n\n  const startTest = () => {
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
  const level = score <= 5 ? 'A1 — Beginner' : score <= 10 ? 'A2 — Elementary' : score <= 15 ? 'B1 — Intermediate' : score <= 18 ? 'B2 — Upper-intermediate' : 'B2 — Strong result';

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
            <article className="feature-card"><div className="feature-icon icon-violet"><Target size={23}/></div><span className="feature-number">01</span><h3>Darajani aniqlash</h3><p>Grammatika testi yoki matn asosidagi Reading testi orqali bilimingizni tekshiring.</p><button onClick={startTest} className="text-link">Grammar test <ArrowRight size={16}/></button><button onClick={startReading} className="text-link reading-link">Reading test <ArrowRight size={16}/></button></article>
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
          </> : <div className="test-result"><div className="result-icon"><GraduationCap size={32}/></div><span className="test-kicker">TEST YAKUNLANDI</span><h2>Sizning taxminiy natijangiz</h2><div className="result-level">{level}</div><p>Siz {questions.length} ta savoldan {score} tasiga to‘g‘ri javob berdingiz.</p><div className="result-note">Bu 20 savollik boshlang‘ich test asosan grammatika va lug‘atni tekshiradi. Natija taxminiy: u rasmiy CEFR yoki IELTS bahosi emas va Listening, Speaking, Reading hamda Writing ko‘nikmalarini to‘liq o‘lchamaydi.</div><button className="button-primary test-next" onClick={() => setTestOpen(false)}>Davom etish <ArrowRight size={17}/></button><button className="restart-link" onClick={startTest}>Testni qayta ishlash</button></div>}
        </div>
      </div>}
    </div>
  );
}

export default App;