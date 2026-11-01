import { useState } from 'react';
import { ArrowRight, BookOpen, CheckCircle2, GraduationCap, Sparkles } from 'lucide-react';
import BrandMark from './BrandMark.jsx';
import './placement-test.css';

const stages = [
  {
    label: 'READING 1 · TRUE / FALSE',
    level: 'A1–A2',
    title: 'A New School Day',
    text: 'Emma is twelve years old and lives in Tashkent. She walks to school with her friend every morning. Her favourite subject is science, but she also enjoys English. After school, Emma usually does her homework and reads a book for twenty minutes.',
    questions: [
      { q: 'Emma lives in Tashkent.', options: ['True', 'False'], answer: 'True' },
      { q: 'She goes to school by car.', options: ['True', 'False'], answer: 'False' },
      { q: 'Her favourite subject is science.', options: ['True', 'False'], answer: 'True' },
    ],
  },
  {
    label: 'READING 2 · CHOOSE ONE ANSWER',
    level: 'A2–B1',
    title: 'Learning Beyond the Classroom',
    text: 'When Jamshid wanted to improve his English, he started with a simple routine. He listened to short podcasts on the bus and wrote five new words in a notebook each day. At weekends, he watched videos with English subtitles. After three months, he could understand more conversations and felt more confident speaking with other learners.',
    questions: [
      { q: 'Where did Jamshid listen to podcasts?', options: ['At the library', 'On the bus', 'At the gym', 'At school'], answer: 'On the bus' },
      { q: 'How many new words did he write each day?', options: ['Three', 'Ten', 'Five', 'Twenty'], answer: 'Five' },
      { q: 'What changed after three months?', options: ['He stopped studying', 'He bought a new phone', 'He moved to another city', 'He understood more and felt confident'], answer: 'He understood more and felt confident' },
    ],
  },
];

export default function PlacementTest({ onComplete }) {
  const [stage, setStage] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showResult, setShowResult] = useState(false);
  const current = stages[stage];
  const answeredCount = current.questions.filter((_, i) => answers[`${stage}-${i}`]).length;
  const score = stages.reduce((total, item, stageIndex) => total + item.questions.reduce((n, q, i) => n + (answers[`${stageIndex}-${i}`] === q.answer ? 1 : 0), 0), 0);
  const level = score <= 2 ? 'A1' : score <= 4 ? 'A2' : 'B1';
  const choose = (questionIndex, value) => setAnswers(prev => ({ ...prev, [`${stage}-${questionIndex}`]: value }));

  return <main className="placement-page">
    <header className="placement-header"><a className="placement-brand" href="#placement"><BrandMark /><span>ENGLISH <b>MASTER</b></span></a><span className="placement-secure"><GraduationCap size={17}/> Darajani aniqlash testi</span></header>
    <section className="placement-intro"><span className="placement-eyebrow"><Sparkles size={15}/> YOUR PERSONAL ENGLISH LEVEL</span><h1>Ingliz tili <span>darajangizni</span> aniqlaymiz.</h1><p>Matnni chap tomonda o‘qing, savollarga o‘ng tomonda javob bering. Bu qisqa test sizga mos o‘quv yo‘lini tanlashga yordam beradi.</p></section>
    {!showResult ? <section className="placement-card">
      <div className="placement-card-top"><div><span className="placement-step">0{stage + 1} / 02</span><h2>{current.label}</h2></div><span className="placement-level">{current.level} daraja</span></div>
      <div className="placement-progress"><span style={{ width: ((stage + 1) / 2) * 100 + '%' }} /></div>
      <div className="placement-columns">
        <article className="placement-reading"><div className="placement-panel-label"><BookOpen size={17}/> READING TEXT</div><h3>{current.title}</h3><p>{current.text}</p><div className="placement-reading-tip">Maslahat: savollarga javob berishdan oldin matnni diqqat bilan o‘qing.</div></article>
        <article className="placement-questions"><div className="placement-panel-label"><CheckCircle2 size={17}/> QUESTIONS <span>{answeredCount}/{current.questions.length}</span></div>{current.questions.map((question, i) => <div className="placement-question" key={question.q}><b><span>{i + 1}</span>{question.q}</b><div className={question.options.length === 2 ? 'placement-options placement-options-tf' : 'placement-options'}>{question.options.map(option => <button type="button" key={option} className={answers[`${stage}-${i}`] === option ? 'placement-option selected' : 'placement-option'} onClick={() => choose(i, option)}>{option}</button>)}</div></div>)}</article>
      </div>
      <div className="placement-footer"><span>{answeredCount === current.questions.length ? 'Ajoyib! Davom etishingiz mumkin.' : 'Davom etish uchun barcha savollarga javob bering.'}</span><button className="placement-continue" disabled={answeredCount !== current.questions.length} onClick={() => stage === 0 ? setStage(1) : setShowResult(true)}>{stage === 0 ? 'Davom etish' : 'Natijani ko‘rish'} <ArrowRight size={17}/></button></div>
    </section> : <section className="placement-result"><div className="placement-result-icon"><GraduationCap size={30}/></div><span className="placement-eyebrow">TEST YAKUNLANDI</span><h2>Sizning taxminiy darajangiz</h2><div className="placement-result-level">{level}</div><p>6 ta savoldan <b>{score}</b> tasiga to‘g‘ri javob berdingiz.</p><div className="placement-result-note">Bu boshlang‘ich Reading testi asosidagi taxminiy natija. To‘liq CEFR darajasi uchun keyinchalik Listening, Speaking, Writing va Grammar ham tekshiriladi.</div><button className="placement-continue" onClick={() => onComplete({ level, score })}>Dashboard’ga o‘tish <ArrowRight size={17}/></button></section>}
    <footer className="placement-bottom">ENGLISH MASTER · Learn with purpose. Achieve more.</footer>
  </main>;
}
