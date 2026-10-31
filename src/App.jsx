import { useState } from 'react';
import { ArrowRight, BookOpen, Brain, CheckCircle2, ChevronRight, GraduationCap, Headphones, Menu, MessageCircle, ShieldCheck, Sparkles, Target, Trophy, X } from 'lucide-react';

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
  const [readingOpen, setReadingOpen] = useState(false);
  const [readingIndex, setReadingIndex] = useState(0);
  const [readingAnswers, setReadingAnswers] = useState({});
  const [readingFinished, setReadingFinished] = useState(false);
  const [studyPlanOpen, setStudyPlanOpen] = useState(false);
  const [activeLesson, setActiveLesson] = useState(false);
  const [lessonAnswer, setLessonAnswer] = useState('');
  const [lessonChecked, setLessonChecked] = useState(false);
  const [completedLessons, setCompletedLessons] = useState([]);

  const startReading = () => {
    setReadingIndex(0);
    setReadingAnswers({});
    setReadingFinished(false);
    setReadingOpen(true);
  };
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
        </nav>
      </header>

      <main id="home">
        <section className="hero">
          <div className="hero-copy">
            <div className="eyebrow"><Sparkles size={15} /> INGLIZ TILINI YANGI BOSQICHGA OLIB CHIQING</div>
            <h1>Ingliz tilingizni<br /> <span>maqsad bilan</span> o‘rganing.</h1>
            <p className="hero-description">CEFR va IELTS imtihonlariga tayyorgarlikni o‘z darajangizdan boshlang. Bilimingizni tekshiring, yo‘lingizni belgilang va bosqichma-bosqich rivojlaning.</p>
            <div className="hero-actions">
              <button className="button-reading" onClick={startReading}><BookOpen size={17} /> Reading testi</button>
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
            <article className="feature-card"><div className="feature-icon icon-violet"><Target size={23}/></div><span className="feature-number">01</span><h3>Darajani aniqlash</h3><p>Matn asosidagi Reading testi orqali o‘qib tushunish ko‘nikmangizni tekshiring.</p><button onClick={startReading} className="text-link reading-link">Reading test <ArrowRight size={16}/></button></article>
            <article className="feature-card"><div className="feature-icon icon-blue"><BookOpen size={23}/></div><span className="feature-number">02</span><h3>Darajaga mos darslar</h3><p>Grammatika, lug‘at va boshqa muhim mavzularni tartib bilan o‘rganing.</p><span className="coming-label">TEZ ORADA</span></article>
            <article className="feature-card"><div className="feature-icon icon-orange"><Trophy size={23}/></div><span className="feature-number">03</span><h3>IELTS & CEFR practice</h3><p>Imtihon formatiga mos mashqlar orqali bilimingizni mustahkamlang.</p><span className="coming-label">TEZ ORADA</span></article>
          </div>
        </section>

        <section className="path-section" id="path">
          <div className="path-copy"><span className="eyebrow">BIRINCHI QADAM</span><h2>Maqsadingizni<br /><span>bugun belgilang.</span></h2><p>Reading testi orqali o‘qib tushunish ko‘nikmangizni tekshiring. Keyin o‘zingizga mos o‘quv yo‘nalishini tanlang.</p><button className="button-primary" onClick={startReading}>Reading testini boshlash <ArrowRight size={18}/></button></div>
          <div className="path-steps"><div className="path-step active"><span>1</span><div><b>Testlarni bajaring</b><small>Reading testidan boshlang</small></div><CheckCircle2 size={20}/></div><div className="path-step"><span>2</span><div><b>Maqsadingizni tanlang</b><small>CEFR, IELTS yoki umumiy English</small></div><ChevronRight size={20}/></div><div className="path-step"><span>3</span><div><b>Reja bo‘yicha o‘rganing</b><small>Darslar va amaliy mashqlar</small></div><ChevronRight size={20}/></div></div>
        </section>

        <section className="bottom-cta" id="about"><div><span className="eyebrow">ENGLISH MASTER</span><h2>Kelajakdagi ingliz tilingiz<br />bugungi qadamingizdan boshlanadi.</h2></div><button className="button-light" onClick={startReading}>Reading testini boshlash <ArrowRight size={18}/></button></section>
      </main>
      <footer><a className="footer-brand" href="#home">english<span>master</span></a><p>IELTS & CEFR Preparation Platform</p><span>© 2026 English Master. O‘rganish yo‘lingiz shu yerdan boshlanadi.</span></footer>

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
            <button className="button-primary test-next" disabled={!lessonAnswer} onClick={() => { if (!lessonChecked) { setLessonChecked(true); } else if (lessonAnswer === 'improve') { setCompletedLessons(prev => prev.includes(0) ? prev : [...prev, 0]); setActiveLesson(false); } else { setLessonChecked(false); } }}>{!lessonChecked ? 'Javobni tekshirish' : lessonAnswer === 'improve' ? 'Darsni yakunlash' : 'Qayta urinish'} <ArrowRight size={17}/></button>
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