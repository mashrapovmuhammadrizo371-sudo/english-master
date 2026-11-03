import { useState } from 'react';
import { ArrowUp, BookOpen, Headphones, MessageCircle, Mic, Plus, Sparkles, Volume2, X, PenLine, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import './tutor-chat.css';

const skills = [
  { id: 'speaking', label: 'Speaking', detail: 'AI bilan suhbat', icon: MessageCircle, prompt: 'Let’s practise English speaking. Ask me one question at my level and gently correct my mistakes.' },
  { id: 'writing', label: 'Writing', detail: 'Matn yozish va tekshirish', icon: PenLine, prompt: 'Give me a short writing task for my level. After I answer, assess it and explain my mistakes in Uzbek.' },
  { id: 'reading', label: 'Reading', detail: 'Matnni tushunish', icon: BookOpen, prompt: 'Give me a reading passage suitable for my level, followed by comprehension questions.' },
  { id: 'listening', label: 'Listening', detail: 'Eshitib tushunish', icon: Headphones, prompt: 'Help me practise listening. Give me a short listening-style exercise and comprehension questions.' }
];

export default function TutorChat({ messages, input, setInput, onSubmit, busy, level, setLevel, onVoice, listening, onSpeak, onClose, feedback, onNewChat }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeSkill, setActiveSkill] = useState('');
  const chooseSkill = (skill) => { setActiveSkill(skill.id); setInput(skill.prompt); };
  return <div className="em-chat-shell" role="dialog" aria-modal="true" aria-label="ENGLISH MASTER AI chat">
    <aside className={sidebarOpen ? 'em-chat-sidebar is-open' : 'em-chat-sidebar'}>
      <div className="em-chat-side-top">
        <div className="em-chat-brand"><span className="em-chat-brand-mark">E</span><span>ENGLISH <b>MASTER</b><small>AI LEARNING SPACE</small></span></div>
        <button className="em-chat-icon-btn em-chat-side-collapse" onClick={() => setSidebarOpen(false)} aria-label="Menyuni yopish"><PanelLeftClose size={18}/></button>
      </div>
      <button className="em-chat-new" onClick={onNewChat}><Plus size={17}/> Yangi chat</button>
      <div className="em-chat-side-label">O‘RGANISH</div>
      <nav className="em-chat-skills">
        {skills.map(skill => { const Icon = skill.icon; return <button key={skill.id} className={activeSkill === skill.id ? 'em-chat-skill active' : 'em-chat-skill'} onClick={() => chooseSkill(skill)}><Icon size={17}/><span>{skill.label}<small>{skill.detail}</small></span></button>; })}
      </nav>
      <div className="em-chat-side-bottom">
        <div className="em-chat-level-card"><span>YOUR LEVEL</span><select value={level} onChange={e => setLevel(e.target.value)} aria-label="Ingliz tili darajasi">{['A1','A2','B1','B2','C1','C2'].map(x => <option key={x}>{x}</option>)}</select><small>AI javoblari darajangizga moslashadi</small></div>
        <button className="em-chat-close-link" onClick={onClose}><X size={16}/> Chatdan chiqish</button>
      </div>
    </aside>
    <main className="em-chat-main">
      <header className="em-chat-header">
        <div className="em-chat-header-left">
          {!sidebarOpen && <button className="em-chat-icon-btn" onClick={() => setSidebarOpen(true)} aria-label="Menyuni ochish"><PanelLeftOpen size={19}/></button>}
          <div><div className="em-chat-title">English Master AI <span className="em-chat-online-dot"/></div><div className="em-chat-subtitle">Your personal English learning assistant</div></div>
        </div>
        <div className="em-chat-header-right"><span className="em-chat-level-pill">{level} LEVEL</span><button className="em-chat-icon-btn" onClick={onClose} aria-label="Yopish"><X size={19}/></button></div>
      </header>
      <section className="em-chat-conversation">
        {messages.length <= 1 ? <div className="em-chat-welcome">
          <div className="em-chat-spark"><Sparkles size={22}/></div>
          <div className="em-chat-eyebrow">LEARN • PRACTISE • IMPROVE</div>
          <h1>What would you like<br/><span>to learn today?</span></h1>
          <p>Ingliz tilini o‘rganish uchun maqsadingizni tanlang yoki savolingizni yozing.</p>
          <div className="em-chat-skill-grid">{skills.map(skill => { const Icon = skill.icon; return <button key={skill.id} className="em-chat-skill-card" onClick={() => chooseSkill(skill)}><Icon size={19}/><span><b>{skill.label}</b><small>{skill.detail}</small></span><ArrowUp size={15}/></button>; })}</div>
        </div> : <div className="em-chat-message-list">{messages.slice(1).map((message,index) => <article key={index} className={message.role === 'user' ? 'em-chat-message user' : 'em-chat-message assistant'}>
          {message.role === 'assistant' && <div className="em-chat-avatar"><Sparkles size={15}/></div>}
          <div className="em-chat-message-body"><div className="em-chat-message-author">{message.role === 'user' ? 'Siz' : 'ENGLISH MASTER AI'}</div><p>{message.content}</p>{message.role === 'assistant' && <button className="em-chat-speak" onClick={() => onSpeak(message.content)}><Volume2 size={14}/> Eshitish</button>}</div>
        </article>)}{busy && <div className="em-chat-message assistant"><div className="em-chat-avatar"><Sparkles size={15}/></div><div className="em-chat-message-body"><div className="em-chat-message-author">ENGLISH MASTER AI</div><div className="em-chat-typing"><i/><i/><i/></div></div></div>}</div>}
      </section>
      <footer className="em-chat-composer-wrap">
        {feedback && <div className="em-chat-feedback">{feedback}</div>}
        <div className="em-chat-composer">
          <textarea value={input} onChange={e => setInput(e.target.value)} placeholder="Ask anything about English..." rows="1" onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSubmit(); } }}/>
          <div className="em-chat-composer-tools"><span>AI can make mistakes. Check important learning feedback.</span><div><button className={listening ? 'em-chat-mic listening' : 'em-chat-mic'} onClick={onVoice} disabled={listening} aria-label="Ovoz orqali yozish"><Mic size={17}/></button><button className="em-chat-send" onClick={onSubmit} disabled={!input.trim() || busy} aria-label="Yuborish"><ArrowUp size={19}/></button></div></div>
        </div>
        <div className="em-chat-footnote">ENGLISH MASTER · YOUR FUTURE SPEAKS ENGLISH</div>
      </footer>
    </main>
  </div>;
}
