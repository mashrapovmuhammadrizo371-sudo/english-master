import { useRef, useState } from 'react';
import { ArrowRight, CheckCircle2, FileAudio, LoaderCircle, X } from 'lucide-react';

const TYPES = [
  { id: 'test', label: 'Test', hint: 'Savollar va javoblaringizni kiriting. Javob kaliti bo‘lsa, uni ham qo‘shing.' },
  { id: 'writing', label: 'Writing', hint: 'Ingliz tilidagi writing matningizni kiriting.' },
  { id: 'speaking', label: 'Speaking', hint: 'Speaking javobini yozing yoki audio fayl yuklang.' },
  { id: 'task', label: 'Task', hint: 'Topshiriq sharti va bajargan javobingizni kiriting.' },
];

export default function Assessment({ onClose }) {
  const [type, setType] = useState('test');
  const [instructions, setInstructions] = useState('');
  const [content, setContent] = useState('');
  const [answerKey, setAnswerKey] = useState('');
  const [audio, setAudio] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const fileRef = useRef(null);

  const selected = TYPES.find(item => item.id === type);
  const apiUrl = import.meta.env.VITE_ASSESSMENT_API_URL;

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setResult(null);
    if (!apiUrl) {
      setError('API manzili hali sozlanmagan. Cloudflare Pages’da VITE_ASSESSMENT_API_URL qiymatini kiriting.');
      return;
    }
    if (!content.trim() && !audio) {
      setError('Javob matnini kiriting yoki audio fayl yuklang.');
      return;
    }
    setLoading(true);
    try {
      const payload = { type, instructions, content, answerKey };
      if (audio) {
        payload.audioMimeType = audio.type || 'audio/webm';
        payload.audioBase64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result).split(',')[1] || '');
          reader.onerror = reject;
          reader.readAsDataURL(audio);
        });
      }
      const response = await fetch(apiUrl.replace(/\/$/, ''), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Tekshirish amalga oshmadi.');
      setResult(data.assessment);
    } catch (err) {
      setError(err.message || 'Ulanishda xatolik. Keyinroq qayta urinib ko‘ring.');
    } finally {
      setLoading(false);
    }
  };

  return <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="AI tekshiruv">
    <div className="test-modal assessment-modal">
      <button className="modal-close" onClick={onClose} aria-label="Yopish"><X size={21}/></button>
      <div className="test-kicker">ENGLISH MASTER · AI ASSESSMENT</div>
      <h2>Javobingizni tekshiring</h2>
      <p className="lesson-intro">Gemini javobingizni tahlil qilib, o‘zbek tilida fikr-mulohaza beradi. Natija taxminiy, rasmiy sertifikat emas.</p>
      <div className="assessment-tabs">{TYPES.map(item => <button type="button" key={item.id} className={type === item.id ? 'assessment-tab active' : 'assessment-tab'} onClick={() => { setType(item.id); setResult(null); setError(''); }}>{item.label}</button>)}</div>
      {!result ? <form onSubmit={submit}>
        <p className="assessment-hint">{selected.hint}</p>
        {(type === 'task' || type === 'writing') && <label className="assessment-label">Topshiriq sharti<textarea value={instructions} onChange={e => setInstructions(e.target.value)} rows="2" placeholder="Masalan: Write an email to your friend..." /></label>}
        <label className="assessment-label">{type === 'test' ? 'Savollar va javoblaringiz' : type === 'speaking' ? 'Speaking matni (ixtiyoriy, audio ham mumkin)' : 'Javobingiz'}<textarea value={content} onChange={e => setContent(e.target.value)} rows="5" placeholder={type === 'test' ? 'Savol 1: ...\nJavobim: ...' : 'Ingliz tilidagi javobingizni shu yerga yozing...'} /></label>
        {type === 'test' && <label className="assessment-label">Javob kaliti (bo‘lsa)<textarea value={answerKey} onChange={e => setAnswerKey(e.target.value)} rows="2" placeholder="1-A, 2-C, 3-true..." /></label>}
        {type === 'speaking' && <div className="assessment-audio"><input ref={fileRef} type="file" accept="audio/*" hidden onChange={e => { const file = e.target.files?.[0]; setAudio(file || null); }} /><button type="button" className="assessment-upload" onClick={() => fileRef.current?.click()}><FileAudio size={18}/>{audio ? audio.name : 'Speaking audio yuklash'}</button>{audio && <button type="button" className="assessment-remove" onClick={() => {setAudio(null); if(fileRef.current) fileRef.current.value='';}}>Olib tashlash</button>}<small>Audio fayl 8 MB dan kichik bo‘lsin.</small></div>}
        {error && <p className="assessment-error" role="alert">{error}</p>}
        <button className="button-primary test-next" type="submit" disabled={loading}>{loading ? <><LoaderCircle size={17} className="assessment-spinner"/> Tekshirilmoqda...</> : <>Tekshirish <ArrowRight size={17}/></>}</button>
      </form> : <div className="assessment-result">
        <div className="result-icon"><CheckCircle2 size={28}/></div>
        <h3>Tekshiruv natijasi</h3>
        {result.estimatedLevel && <div className="result-level">{result.estimatedLevel}</div>}
        {result.score !== null && result.score !== undefined && <p><b>Ball:</b> {result.score}</p>}
        {result.summary && <p>{result.summary}</p>}
        {Array.isArray(result.criteria) && result.criteria.length > 0 && <div className="assessment-criteria">{result.criteria.map((item, i) => <article key={i}><div><b>{item.name}</b><span>{item.scoreOutOf5 ?? '—'}/5</span></div><p>{item.feedback}</p></article>)}</div>}
        {Array.isArray(result.corrections) && result.corrections.length > 0 && <section><h4>Tuzatishlar</h4>{result.corrections.map((item,i) => <article className="assessment-correction" key={i}><p><s>{item.original}</s> → <b>{item.corrected}</b></p><small>{item.explanation}</small></article>)}</section>}
        {Array.isArray(result.strengths) && result.strengths.length > 0 && <section><h4>Kuchli tomonlar</h4><ul>{result.strengths.map((item,i)=><li key={i}>{item}</li>)}</ul></section>}
        {Array.isArray(result.nextSteps) && result.nextSteps.length > 0 && <section><h4>Keyingi qadamlar</h4><ul>{result.nextSteps.map((item,i)=><li key={i}>{item}</li>)}</ul></section>}
        <p className="result-note">Bu AI bergan taxminiy tahlil. Rasmiy CEFR yoki IELTS natijasi emas.</p>
        <button className="button-primary test-next" onClick={() => {setResult(null);setError('');}}>Yana tekshirish <ArrowRight size={17}/></button>
      </div>}
    </div>
  </div>;
}
