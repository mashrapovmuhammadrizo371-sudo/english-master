import { useEffect, useMemo, useState } from 'react';
import { AudioLines, Play, Pause, Square, Volume2, Sparkles } from 'lucide-react';

export default function SpeakerStudio() {
  const [text, setText] = useState('Hello! Welcome to English Master. Let’s improve your English together.');
  const [voices, setVoices] = useState([]);
  const [voiceURI, setVoiceURI] = useState('');
  const [rate, setRate] = useState(0.95);
  const [pitch, setPitch] = useState(1);
  const [speaking, setSpeaking] = useState(false);
  const [paused, setPaused] = useState(false);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (!('speechSynthesis' in window)) {
      setNotice('Bu brauzer ovozli o‘qishni qo‘llab-quvvatlamaydi. Chrome yoki Edge brauzerida oching.');
      return;
    }
    const load = () => {
      const available = window.speechSynthesis.getVoices();
      setVoices(available);
      if (!voiceURI) {
        const preferred = available.find(v => v.lang.toLowerCase().startsWith('en-us')) || available.find(v => v.lang.toLowerCase().startsWith('en'));
        if (preferred) setVoiceURI(preferred.voiceURI);
      }
    };
    load();
    window.speechSynthesis.addEventListener?.('voiceschanged', load);
    return () => {
      window.speechSynthesis.removeEventListener?.('voiceschanged', load);
      window.speechSynthesis.cancel();
    };
  }, []);

  const selectedVoice = useMemo(() => voices.find(v => v.voiceURI === voiceURI), [voices, voiceURI]);
  const speak = () => {
    if (!text.trim() || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text.trim());
    if (selectedVoice) utterance.voice = selectedVoice;
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.onstart = () => { setSpeaking(true); setPaused(false); setNotice('Ovoz ijro etilmoqda.'); };
    utterance.onend = () => { setSpeaking(false); setPaused(false); setNotice('O‘qish tugadi.'); };
    utterance.onerror = () => { setSpeaking(false); setPaused(false); setNotice('Ovoz ijro etilmadi. Boshqa ovozni tanlab ko‘ring.'); };
    window.speechSynthesis.speak(utterance);
  };
  const stop = () => { window.speechSynthesis.cancel(); setSpeaking(false); setPaused(false); setNotice('Ijro to‘xtatildi.'); };
  const togglePause = () => {
    if (window.speechSynthesis.paused) { window.speechSynthesis.resume(); setPaused(false); }
    else { window.speechSynthesis.pause(); setPaused(true); }
  };

  return <section className="speaker-studio">
    <div className="speaker-heading"><span className="eyebrow"><Sparkles size={15}/> ENGLISH MASTER · VOICE STUDIO</span><h1>Speaker <span>AI</span></h1><p>Matningizni inglizcha ovozda tinglang, talaffuzni mashq qiling va mos ovozni tanlang.</p></div>
    <div className="speaker-panel">
      <label className="speaker-label" htmlFor="speaker-text">Matn</label>
      <textarea id="speaker-text" className="speaker-textarea" value={text} onChange={e=>setText(e.target.value)} maxLength={5000} placeholder="Ovoz chiqarib o‘qiladigan matnni yozing..."/>
      <div className="speaker-count">{text.length} / 5000</div>
      <div className="speaker-controls">
        <label>Ovoz<select value={voiceURI} onChange={e=>setVoiceURI(e.target.value)}>{voices.length ? voices.map(v=><option key={v.voiceURI} value={v.voiceURI}>{v.name} · {v.lang}</option>) : <option value="">Standart ovoz</option>}</select></label>
        <label>Tezlik <strong>{rate.toFixed(2)}×</strong><input type="range" min="0.6" max="1.3" step="0.05" value={rate} onChange={e=>setRate(Number(e.target.value))}/></label>
        <label>Ovoz balandligi <strong>{pitch.toFixed(1)}</strong><input type="range" min="0.7" max="1.4" step="0.1" value={pitch} onChange={e=>setPitch(Number(e.target.value))}/></label>
      </div>
      <div className="speaker-actions">
        <button className="button-primary" onClick={speak} disabled={!text.trim()}><Play size={17}/> Tinglash</button>
        <button className="speaker-secondary" onClick={togglePause} disabled={!speaking}><Pause size={17}/>{paused ? 'Davom ettirish' : 'Pauza'}</button>
        <button className="speaker-secondary" onClick={stop} disabled={!speaking}><Square size={16}/> To‘xtatish</button>
      </div>
      <p className="speaker-notice" aria-live="polite"><Volume2 size={16}/>{notice || 'Ovoz qurilmangiz va brauzeringizdagi mavjud ovozlarga bog‘liq.'}</p>
    </div>
    <div className="speaker-tip"><AudioLines size={20}/><div><b>Speaking practice</b><p>Matnni tinglang, keyin o‘zingiz ham ovoz chiqarib takrorlang. Bu versiya qurilmadagi Text-to-Speech ovozlaridan foydalanadi; AI voice cloning emas.</p></div></div>
  </section>;
}
