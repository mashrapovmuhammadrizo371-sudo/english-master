import { useMemo, useState } from 'react';
import {
  LayoutDashboard, Users, BookOpen, ClipboardList, CreditCard, Bot, Settings,
  Search, Bell, ChevronDown, Plus, Download, MoreHorizontal, TrendingUp,
  GraduationCap, ShieldCheck, Clock3, ArrowUpRight, Menu, X, LockKeyhole,
  CircleHelp, Activity, Sparkles
} from 'lucide-react';
import './admin-panel.css';

const sections = [
  { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'students', label: 'Students', icon: Users },
  { id: 'courses', label: 'Courses & Lessons', icon: BookOpen },
  { id: 'exams', label: 'Tests & Exams', icon: ClipboardList },
  { id: 'payments', label: 'Payments & Plans', icon: CreditCard },
  { id: 'ai', label: 'AI Management', icon: Bot },
  { id: 'security', label: 'Settings & Security', icon: Settings },
];

const sectionCopy = {
  students: ['O‘quvchilar', 'Ro‘yxatdan o‘tgan o‘quvchilar va ularning o‘quv faoliyati.'],
  courses: ['Kurslar va darslar', 'A1–C2 darajadagi kurslar, mavzular va o‘quv materiallari.'],
  exams: ['Testlar va imtihonlar', 'Savollar banki, vaqt chegarasi, baholash va urinishlar.'],
  payments: ['To‘lovlar va tariflar', 'Tariflar, to‘lovlar tarixi, depozit va qaytarishlar.'],
  ai: ['AI Management', 'AI Teacher ko‘rsatmalari, model sozlamalari va foydalanish nazorati.'],
  security: ['Settings & Security', 'Administratorlar, ruxsatlar, tizim sozlamalari va audit jurnali.'],
};

function EmptyModule({ title, description, action }) {
  return <div className="ap-empty">
    <div className="ap-empty-icon"><LockKeyhole size={22}/></div>
    <h3>{title}</h3>
    <p>{description}</p>
    <span className="ap-status-note">Backend va ma’lumotlar bazasi ulanishi kutilmoqda</span>
    {action && <button className="ap-secondary-btn" disabled>{action} <Plus size={16}/></button>}
  </div>;
}

export default function AdminPanel({ user, onExit }) {
  const [active, setActive] = useState('overview');
  const [query, setQuery] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const activeSection = sections.find(item => item.id === active) || sections[0];
  const filteredSections = useMemo(() => sections.filter(item => item.label.toLowerCase().includes(query.toLowerCase())), [query]);

  const renderContent = () => {
    if (active === 'overview') return <>
      <div className="ap-welcome">
        <div><span className="ap-eyebrow">ENGLISH MASTER · CONTROL CENTER</span><h1>Dashboard</h1><p>Platformangizning asosiy boshqaruv markazi.</p></div>
        <div className="ap-date-chip"><Activity size={15}/> Tizim holati <b>Ulanish tekshirilmoqda</b></div>
      </div>
      <div className="ap-stats">
        {[
          ['Jami o‘quvchilar', '—', Users, 'Ma’lumotlar bazasi ulanmagan'],
          ['Faol kurslar', '—', BookOpen, 'Kurslar moduli tayyorlanmoqda'],
          ['Test topshirishlar', '—', ClipboardList, 'Natijalar hali ulanmagan'],
          ['To‘lovlar', '—', CreditCard, 'To‘lov provayderi ulanmagan'],
        ].map(([label, value, Icon, hint]) => <article className="ap-stat-card" key={label}><div className="ap-stat-top"><span>{label}</span><i><Icon size={18}/></i></div><strong>{value}</strong><small>{hint}</small></article>)}
      </div>
      <div className="ap-grid-two">
        <section className="ap-panel ap-activity">
          <div className="ap-panel-head"><div><h2>Platforma faolligi</h2><p>O‘quvchilar faolligi va natijalar statistikasi</p></div><span className="ap-muted-tag">Ma’lumot kutilmoqda</span></div>
          <div className="ap-chart-placeholder"><div className="ap-chart-grid"><span></span><span></span><span></span><span></span></div><div className="ap-chart-center"><Activity size={25}/><b>Hozircha statistika yo‘q</b><small>Real ma’lumotlar D1 bazasiga ulangach ko‘rinadi.</small></div></div>
        </section>
        <section className="ap-panel ap-quick">
          <div className="ap-panel-head"><div><h2>Tezkor boshqaruv</h2><p>Asosiy bo‘limlarga o‘tish</p></div><Sparkles size={18}/></div>
          {sections.slice(1).map(item => <button className="ap-quick-link" key={item.id} onClick={() => setActive(item.id)}><span className="ap-quick-icon"><item.icon size={17}/></span><span>{item.label}</span><ArrowUpRight size={16}/></button>)}
        </section>
      </div>
      <section className="ap-panel ap-bottom-panel">
        <div className="ap-panel-head"><div><h2>Oxirgi tizim hodisalari</h2><p>Xavfsizlik va administrator harakatlari jurnali</p></div><span className="ap-muted-tag">Audit log ulanmagan</span></div>
        <div className="ap-empty-inline"><Clock3 size={18}/> Hozircha qayd etilgan hodisalar yo‘q.</div>
      </section>
    </>;
    const [title, description] = sectionCopy[active];
    const action = active === 'courses' ? 'Kurs yaratish' : active === 'exams' ? 'Test yaratish' : active === 'students' ? 'O‘quvchi qo‘shish' : active === 'security' ? 'Admin qo‘shish' : active === 'payments' ? 'Tarif yaratish' : 'Sozlamani o‘zgartirish';
    return <>
      <div className="ap-welcome"><div><span className="ap-eyebrow">ENGLISH MASTER · BOSHQARUV</span><h1>{title}</h1><p>{description}</p></div><button className="ap-primary-btn" disabled><Plus size={17}/>{action}</button></div>
      {active === 'courses' && <div className="ap-level-grid">{['A1','A2','B1','B2','C1','C2'].map(level => <div className="ap-level-card" key={level}><span>{level}</span><b>{level} kurslari</b><small>Kurslar hali qo‘shilmagan</small></div>)}</div>}
      {active === 'ai' && <div className="ap-ai-banner"><span><Bot size={24}/></span><div><b>AI Teacher boshqaruvi</b><p>Model kalitlari serverda maxfiy saqlanishi kerak. Ushbu sahifada maxfiy kalitlarni ko‘rsatmaymiz.</p></div></div>}
      {active === 'payments' && <div className="ap-ai-banner"><span><ShieldCheck size={24}/></span><div><b>To‘lov xavfsizligi</b><p>Haqiqiy to‘lovlar va depozit qaytarishlari tasdiqlangan provayder, tranzaksiya jurnali va ruxsat tekshiruvi bilan ulanadi.</p></div></div>}
      {active === 'security' && <div className="ap-ai-banner"><span><LockKeyhole size={24}/></span><div><b>Super Admin va Admin rollari</b><p>Admin huquqi faqat serverdagi tasdiqlangan rol orqali beriladi. Google orqali kirishning o‘zi admin huquqini bermaydi.</p></div></div>}
      <EmptyModule title="Ma’lumotlar hali ulanmagan" description="Ushbu bo‘limning interfeysi tayyor. Haqiqiy ma’lumotlarni ko‘rish va o‘zgartirish uchun xavfsiz API hamda Cloudflare D1 ulanishi kerak." action={action}/>
    </>;
  };

  return <div className="admin-panel">
    <aside className={mobileOpen ? 'ap-sidebar ap-sidebar-open' : 'ap-sidebar'}>
      <div className="ap-brand"><span className="ap-brand-mark">E</span><span>ENGLISH <b>MASTER</b><small>ADMIN CONSOLE</small></span><button className="ap-mobile-close" onClick={() => setMobileOpen(false)}><X size={18}/></button></div>
      <div className="ap-menu-label">WORKSPACE</div>
      <nav className="ap-nav">{sections.map(item => <button key={item.id} className={active === item.id ? 'ap-nav-item active' : 'ap-nav-item'} onClick={() => { setActive(item.id); setMobileOpen(false); }}><item.icon size={18}/><span>{item.label}</span>{active === item.id && <i/>}</button>)}</nav>
      <div className="ap-sidebar-bottom"><div className="ap-help-card"><CircleHelp size={18}/><b>Yordam kerakmi?</b><small>Admin qo‘llanmasi keyinroq ulanadi.</small></div><button className="ap-exit-btn" onClick={onExit}>← Saytga qaytish</button></div>
    </aside>
    {mobileOpen && <button className="ap-scrim" aria-label="Menyuni yopish" onClick={() => setMobileOpen(false)}/>}
    <main className="ap-main">
      <header className="ap-topbar"><button className="ap-mobile-menu" onClick={() => setMobileOpen(true)}><Menu size={20}/></button><div className="ap-breadcrumb">Workspace <span>/</span> <b>{activeSection.label}</b></div><div className="ap-top-actions"><button className="ap-icon-btn" aria-label="Bildirishnomalar"><Bell size={18}/><i/></button><div className="ap-user"><div className="ap-avatar">{(user?.name || 'A').slice(0,1).toUpperCase()}</div><span><b>{user?.name || 'Administrator'}</b><small>Super Admin</small></span><ChevronDown size={15}/></div></div></header>
      <div className="ap-content">{renderContent()}<footer className="ap-footer">© 2026 English Master · Admin Console <span>Secure workspace</span></footer></div>
    </main>
  </div>;
}
