import { useMemo, useState } from 'react';
import { ArrowRight, CheckCircle2, GraduationCap, LoaderCircle, Sparkles, PenLine } from 'lucide-react';
import BrandMark from './BrandMark.jsx';
import './placement-test.css';

const ASSESSMENT_API = 'https://english-master-assessment.mashrapovmuhammadrizo371.workers.dev';
const TOPIC = 'Some people prefer learning new skills alone, while others prefer learning with a teacher. Which do you prefer and why? Give reasons and examples.';

const validLevels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

export default function PlacementTest({ onComplete }) {
  const [essay, setEssay] = useState('');
  const [assessment, setAssessment] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const wordCount = useMemo(() => essay.trim() ? essay.trim().split(/\s+/).length : 0, [essay]);

  const submitEssay = async (event) => {
    event.preventDefault();
    if (wordCount < 40 || busy) return;
    setBusy(true);
    setError('');
    try {
      const response = await fetch(ASSESSMENT_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'writing',
          content: essay.trim(),
          instructions: [
            'This is an initial CEFR writing placement assessment, not an IELTS score and not an official certificate.',
            'Estimate the most defensible CEFR writing level from A1, A2, B1, B2, C1, C2. Do not inflate the level.',
            'Judge the learner by what they can independently write. Do not assume abilities that are not demonstrated.',
            'Assess task achievement, coherence and cohesion, vocabulary range and appropriacy, grammatical range and accuracy, and spelling/punctuation.',
            'A short or simple response can still show A1 or A2 ability. Do not penalize a learner merely for not using advanced vocabulary.',
            'If the response is too short, off-topic, copied-looking, or contains too little English evidence, explain that the estimate has low confidence.',
            'Return useful corrections and next steps in Uzbek. Be supportive, specific, and honest.'
          ].join(' ')
        })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'AI essayni tekshira olmadi. Keyinroq qayta urinib ko‘ring.');
      const result = data.assessment;
      if (!result || !validLevels.includes(String(result.estimatedLevel || '').toUpperCase())) {
        throw new Error('AI aniq CEFR darajasini qaytarmadi. Essayni qayta yuborib ko‘ring.');
      }
      setAssessment({ ...result, estimatedLevel: String(result.estimatedLevel).toUpperCase() });
    } catch (err) {
      setError(err.message || 'Ulanishda xatolik yuz berdi.');
    } finally {
      setBusy(false);
    }
  };

  return <main className="placement-page">
    <header className="placement-header">
      <a className="placement-brand" href="#placement"><BrandMark /><span>ENGLISH <b>MASTER</b></span></a>
      <span className="placement-secure"><GraduationCap size={17}/> Writing orqali daraja aniqlash</span>
    </header>

    <section className="placement-intro">
      <span className="placement-eyebrow"><Sparkles size={15}/> YOUR PERSONAL ENGLISH LEVEL</span>
      <h1>Ingliz tili <span>darajangizni</span> yozish orqali aniqlaymiz.</h1>
      <p>Mavzu bo‘yicha ingliz tilida essay yozing. AI grammatikangiz, lug‘atingiz va fikrlaringizni ifodalashingizni tahlil qilib, taxminiy CEFR darajangizni aniqlaydi.</p>
    </section>

    {!assessment ? <form className="placement-card writing-placement-card" onSubmit={submitEssay}>
      <div className="placement-card-top">
        <div><span className="placement-step">WRITING ASSESSMENT · 01</span><h2>Quyidagi mavzuda essay yozing</h2></div>
        <span className="placement-level">A1–C2</span>
      </div>
      <div className="placement-progress"><span style={{ width: '55%' }} /></div>
      <article className="writing-topic">
        <div className="placement-panel-label"><PenLine size={17}/> ESSAY TOPIC</div>
        <h3>{TOPIC}</h3>
        <p>Fikringizni sabablar va misollar bilan tushuntiring. Imkon qadar mustaqil yozing — tarjimon yoki AI yordamidan foydalanmang.</p>
      </article>
      <label className="writing-label" htmlFor="placement-essay">Your essay</label>
      <textarea
        id="placement-essay"
        className="writing-essay-input"
        value={essay}
        onChange={event => setEssay(event.target.value)}
        placeholder="Write your essay in English here..."
        rows={11}
        maxLength={8000}
        disabled={busy}
      />
      <div className="writing-meta"><span>{wordCount} words · Kamida 40 ta so‘z</span><span>{essay.length}/8000</span></div>
      {error && <p className="placement-error" role="alert">{error}</p>}
      <div className="placement-footer">
        <span>AI natijasi Writing ko‘nikmangiz bo‘yicha taxminiy baho bo‘ladi.</span>
        <button className="placement-continue" type="submit" disabled={wordCount < 40 || busy}>
          {busy ? <><LoaderCircle size={17} className="writing-spinner"/> AI tekshiryapti...</> : <>Essayni tekshirish <ArrowRight size={17}/></>}
        </button>
      </div>
    </form> : <section className="placement-result writing-placement-result">
      <div className="placement-result-icon"><GraduationCap size={30}/></div>
      <span className="placement-eyebrow">AI WRITING ASSESSMENT</span>
      <h2>Sizning taxminiy Writing darajangiz</h2>
      <div className="placement-result-level">{assessment.estimatedLevel}</div>
      <p>{assessment.summary || 'Essay tahlili yakunlandi.'}</p>
      {Array.isArray(assessment.criteria) && assessment.criteria.length > 0 && <div className="writing-criteria">
        {assessment.criteria.map((item, index) => <div className="writing-criterion" key={item.name || index}>
          <div><b>{item.name}</b><span>{item.scoreOutOf5 ?? '—'}/5</span></div>
          {item.feedback && <p>{item.feedback}</p>}
        </div>)}
      </div>}
      {Array.isArray(assessment.strengths) && assessment.strengths.length > 0 && <div className="writing-feedback-block"><b><CheckCircle2 size={16}/> Kuchli tomonlaringiz</b><ul>{assessment.strengths.map((item, i) => <li key={i}>{item}</li>)}</ul></div>}
      {Array.isArray(assessment.corrections) && assessment.corrections.length > 0 && <div className="writing-feedback-block"><b>Yaxshilash kerak bo‘lgan joylar</b>{assessment.corrections.slice(0, 5).map((item, i) => <p key={i}><span>{item.original}</span> → <strong>{item.corrected}</strong>{item.explanation ? <small>{item.explanation}</small> : null}</p>)}</div>}
      {Array.isArray(assessment.nextSteps) && assessment.nextSteps.length > 0 && <div className="writing-feedback-block"><b>Keyingi qadamlar</b><ul>{assessment.nextSteps.map((item, i) => <li key={i}>{item}</li>)}</ul></div>}
      <div className="placement-result-note">Bu faqat Writing namunangiz asosidagi AI taxmini. To‘liq CEFR darajasi uchun Listening, Speaking, Reading va boshqa ko‘nikmalarni ham alohida baholash kerak.</div>
      <button className="placement-continue" onClick={() => onComplete({ level: assessment.estimatedLevel, assessment, method: 'writing' })}>O‘quv yo‘limni boshlash <ArrowRight size={17}/></button>
    </section>}
    <footer className="placement-bottom">ENGLISH MASTER · Learn with purpose. Achieve more.</footer>
  </main>;
}
