import { useEffect, useMemo, useState } from 'react';
import {
  LayoutDashboard, Users, BookOpen, ClipboardList, CreditCard, Bot, Settings,
  Bell, ChevronDown, Plus, ArrowUpRight, Menu, X, LockKeyhole, CircleHelp,
  Activity, Sparkles, RefreshCw, ShieldCheck, Trash2
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
const permissions = [
  ['students.read','O‘quvchilarni ko‘rish'],
  ['courses.read','Kurslarni ko‘rish'],
  ['courses.write','Kurslarni boshqarish'],
  ['exams.read','Testlarni ko‘rish'],
  ['exams.write','Testlarni boshqarish'],
  ['payments.read','To‘lovlarni ko‘rish'],
  ['ai.read','AI sozlamalarini ko‘rish'],
  ['settings.read','Tizim sozlamalarini ko‘rish'],
];
const copy = {
  students: ['O‘quvchilar', 'Ro‘yxatdan o‘tgan o‘quvchilar va ularning o‘quv faoliyati.'],
  courses: ['Kurslar va darslar', 'A1–C2 darajadagi kurslar, mavzular va o‘quv materiallari.'],
  exams: ['Testlar va imtihonlar', 'Savollar banki, vaqt chegarasi, baholash va urinishlar.'],
  payments: ['To‘lovlar va tariflar', 'Tariflar, to‘lovlar tarixi va tranzaksiyalar.'],
  ai: ['AI Management', 'AI Teacher ko‘rsatmalari, model sozlamalari va foydalanish nazorati.'],
  security: ['Settings & Security', 'Administratorlar, ruxsatlar va xavfsizlik jurnali.'],
};
const Empty = ({ title, description }) => <div className="ap-empty"><div className="ap-empty-icon"><LockKeyhole size={22}/></div><h3>{title}</h3><p>{description}</p></div>;

export default function AdminPanel({ user, onExit }) {
  const [active,setActive] = useState('overview');
  const [mobileOpen,setMobileOpen] = useState(false);
  const [token,setToken] = useState('');
  const [role,setRole] = useState('');
  const [apiError,setApiError] = useState('');
  const [loading,setLoading] = useState(true);
  const [summary,setSummary] = useState(null);
  const [students,setStudents] = useState([]);
  const [courses,setCourses] = useState([]);
  const [admins,setAdmins] = useState([]);
  const [courseForm,setCourseForm] = useState(false);
  const [courseTitle,setCourseTitle] = useState('');
  const [courseLevel,setCourseLevel] = useState('A1');
  const [courseDescription,setCourseDescription] = useState('');
  const [adminEmail,setAdminEmail] = useState('');
  const [selectedPermissions,setSelectedPermissions] = useState(['students.read','courses.read']);
  const [busy,setBusy] = useState(false);
  const [notice,setNotice] = useState('');
  const activeSection = sections.find(s=>s.id===active) || sections[0];
  const canManageCourses = role === 'super_admin' || role === 'admin';
  const api = async (path, options={}) => {
    const response = await fetch('/api/admin/'+path,{
      ...options,
      headers:{'Content-Type':'application/json',Authorization:'Bearer '+token,...(options.headers||{})}
    });
    const data = await response.json().catch(()=>({}));
    if(!response.ok) throw new Error(data.error || 'Server bilan bog‘lanib bo‘lmadi.');
    return data;
  };
  const load = async (section=active) => {
    if(!token) return;
    setLoading(true); setApiError('');
    try {
      const me = await api('me');
      setRole(me.role);
      if(section==='overview'){
        const stats=await api('summary'); setSummary(stats);
      } else if(section==='students'){
        const result=await api('students'); setStudents(result.students||[]);
      } else if(section==='courses'){
        const result=await api('courses'); setCourses(result.courses||[]);
      } else if(section==='security' && me.role==='super_admin'){
        const result=await api('admins'); setAdmins(result.admins||[]);
      }
    } catch(error){setApiError(error.message);}
    finally{setLoading(false);}
  };
  useEffect(()=>{
    try {
      const session=JSON.parse(localStorage.getItem('em-auth-session')||'null');
      setToken(session?.credential||'');
    } catch { setApiError('Kirish sessiyasini o‘qib bo‘lmadi.'); setLoading(false); }
  },[]);
  useEffect(()=>{if(token) load('overview');},[token]);
  useEffect(()=>{if(token && active!=='overview') load(active);},[active,token]);

  const createCourse = async (event) => {
    event.preventDefault(); if(!courseTitle.trim()) return;
    setBusy(true);setNotice('');
    try{
      await api('courses',{method:'POST',body:JSON.stringify({level:courseLevel,title:courseTitle,description:courseDescription})});
      setCourseTitle('');setCourseDescription('');setCourseForm(false);setNotice('Kurs saqlandi.');await load('courses');
    }catch(error){setApiError(error.message);}finally{setBusy(false);}
  };
  const saveAdmin = async (event) => {
    event.preventDefault();if(!adminEmail.trim())return;
    setBusy(true);setNotice('');
    try{
      await api('admins',{method:'POST',body:JSON.stringify({email:adminEmail,permissions:selectedPermissions})});
      setAdminEmail('');setNotice('Admin ruxsatlari saqlandi.');await load('security');
    }catch(error){setApiError(error.message);}finally{setBusy(false);}
  };
  const revokeAdmin = async (email) => {
    if(!window.confirm(email+' uchun admin huquqini bekor qilasizmi?'))return;
    setBusy(true);
    try{await api('admins/'+encodeURIComponent(email),{method:'DELETE'});setNotice('Admin huquqi bekor qilindi.');await load('security');}
    catch(error){setApiError(error.message);}finally{setBusy(false);}
  };

  const renderContent=()=>{
    if(loading)return <div className="ap-loading"><RefreshCw size={20}/> Ma’lumotlar yuklanmoqda…</div>;
    if(apiError)return <div className="ap-error"><ShieldCheck size={22}/><b>Admin API ulanishida muammo</b><p>{apiError}</p><small>Maxfiy admin ruxsati serverda tekshiriladi. Oddiy Google login admin huquqini bermaydi.</small><button className="ap-secondary-btn" onClick={()=>load(active)}>Qayta urinish</button></div>;
    if(active==='overview')return <>
      <div className="ap-welcome"><div><span className="ap-eyebrow">ENGLISH MASTER · CONTROL CENTER</span><h1>Dashboard</h1><p>Platformangizning asosiy boshqaruv markazi.</p></div><div className="ap-date-chip"><Activity size={15}/> API <b>Ulandi</b></div></div>
      <div className="ap-stats">{[
        ['Jami o‘quvchilar',summary?.students??0,Users,'Google orqali kirgan profillar'],
        ['Faol kurslar',summary?.courses??0,BookOpen,'Nashr qilingan kurslar'],
        ['Test topshirishlar',summary?.attempts??0,ClipboardList,'Barcha urinishlar'],
        ['To‘lovlar',summary?.payments??0,CreditCard,'Tasdiqlangan tranzaksiyalar'],
      ].map(([label,value,Icon,hint])=><article className="ap-stat-card" key={label}><div className="ap-stat-top"><span>{label}</span><i><Icon size={18}/></i></div><strong>{value}</strong><small>{hint}</small></article>)}</div>
      <div className="ap-grid-two"><section className="ap-panel"><div className="ap-panel-head"><div><h2>Platforma holati</h2><p>Ma’lumotlar bazasidan olingan ko‘rsatkichlar</p></div><span className="ap-muted-tag">Live API</span></div><div className="ap-chart-placeholder"><div className="ap-chart-center"><Activity size={25}/><b>Statistika yig‘ilmoqda</b><small>Vaqt bo‘yicha faollik grafigi keyingi bosqichda ulanadi.</small></div></div></section><section className="ap-panel ap-quick"><div className="ap-panel-head"><div><h2>Tezkor boshqaruv</h2><p>Asosiy bo‘limlarga o‘tish</p></div><Sparkles size={18}/></div>{sections.slice(1).map(item=><button className="ap-quick-link" key={item.id} onClick={()=>setActive(item.id)}><span className="ap-quick-icon"><item.icon size={17}/></span><span>{item.label}</span><ArrowUpRight size={16}/></button>)}</section></div>
    </>;
    const [title,description]=copy[active];
    return <>
      <div className="ap-welcome"><div><span className="ap-eyebrow">ENGLISH MASTER · BOSHQARUV</span><h1>{title}</h1><p>{description}</p></div>{active==='courses'&&<button className="ap-primary-btn" onClick={()=>setCourseForm(v=>!v)}><Plus size={17}/>Kurs yaratish</button>}</div>
      {notice&&<div className="ap-notice">{notice}</div>}
      {active==='students'&&<section className="ap-panel"><div className="ap-panel-head"><div><h2>O‘quvchilar ro‘yxati</h2><p>Oxirgi 200 ta Google profili</p></div><span className="ap-muted-tag">{students.length} ta</span></div>{students.length?<div className="ap-table-wrap"><table className="ap-table"><thead><tr><th>O‘quvchi</th><th>Email</th><th>Oxirgi kirish</th></tr></thead><tbody>{students.map(s=><tr key={s.email}><td>{s.name}</td><td>{s.email}</td><td>{s.last_login_at}</td></tr>)}</tbody></table></div>:<Empty title="Hozircha o‘quvchilar yo‘q" description="Google orqali kirgan foydalanuvchilar ro‘yxati shu yerda ko‘rinadi."/>}</section>}
      {active==='courses'&&<>{courseForm&&<form className="ap-panel ap-form" onSubmit={createCourse}><h2>Yangi kurs</h2><label>Daraja<select value={courseLevel} onChange={e=>setCourseLevel(e.target.value)}>{['A1','A2','B1','B2','C1','C2'].map(x=><option key={x}>{x}</option>)}</select></label><label>Kurs nomi<input required value={courseTitle} onChange={e=>setCourseTitle(e.target.value)} placeholder="Masalan: Everyday English"/></label><label>Tavsif<textarea value={courseDescription} onChange={e=>setCourseDescription(e.target.value)} placeholder="Kurs haqida qisqacha"/></label><div className="ap-form-actions"><button type="button" className="ap-secondary-btn" onClick={()=>setCourseForm(false)}>Bekor qilish</button><button className="ap-primary-btn" disabled={busy}>{busy?'Saqlanmoqda…':'Saqlash'}</button></div></form>}<div className="ap-course-grid">{courses.map(course=><article className="ap-level-card" key={course.id}><span>{course.level}</span><b>{course.title}</b><small>{course.description||'Tavsif kiritilmagan'}</small><em>{course.status}</em></article>)}</div>{!courses.length&&!courseForm&&<Empty title="Kurslar hali yaratilmagan" description="A1–C2 darajalarida birinchi kursingizni yaratishingiz mumkin."/>}</>}
      {active==='security'&&<>{role==='super_admin'?<><form className="ap-panel ap-form" onSubmit={saveAdmin}><h2>Admin qo‘shish yoki ruxsatlarni yangilash</h2><p>Foydalanuvchi avval Google orqali saytga kamida bir marta kirgan bo‘lishi kerak.</p><label>Google email<input type="email" required value={adminEmail} onChange={e=>setAdminEmail(e.target.value)} placeholder="admin@example.com"/></label><div className="ap-permissions">{permissions.map(([value,label])=><label key={value}><input type="checkbox" checked={selectedPermissions.includes(value)} onChange={e=>setSelectedPermissions(old=>e.target.checked?[...old,value]:old.filter(x=>x!==value))}/>{label}</label>)}</div><button className="ap-primary-btn" disabled={busy}><Plus size={16}/>Admin huquqini saqlash</button></form><section className="ap-panel"><div className="ap-panel-head"><div><h2>Administratorlar</h2><p>Super Admin tomonidan boshqariladi</p></div></div>{admins.length?admins.map(admin=><div className="ap-admin-row" key={admin.email}><div><b>{admin.name||admin.email}</b><small>{admin.email} · {admin.permissions_json}</small></div><button className="ap-danger-btn" disabled={busy} onClick={()=>revokeAdmin(admin.email)}><Trash2 size={16}/>Bekor qilish</button></div>):<p className="ap-muted">Hozircha qo‘shimcha admin yo‘q.</p>}</section></>:<Empty title="Super Admin ruxsati kerak" description="Administratorlarni faqat Super Admin qo‘sha oladi yoki o‘chira oladi."/>}</>}
      {active==='exams'&&<Empty title="Testlar moduli keyingi bosqichda" description="Test yaratish, savollar banki va urinishlarni boshqarish uchun API hali ulanmagan."/>}
      {active==='payments'&&<Empty title="To‘lov provayderi ulanmagan" description="Hozircha haqiqiy to‘lov yoki pul qaytarish amallari mavjud emas. Provayder integratsiyasidan keyin yoqiladi."/>}
      {active==='ai'&&<Empty title="AI boshqaruvi tayyorlanmoqda" description="AI model sozlamalari serverda maxfiy saqlanadi. API orqali xavfsiz boshqaruv keyingi bosqichda ulanadi."/>}
    </>;
  };
  return <div className="admin-panel"><aside className={mobileOpen?'ap-sidebar ap-sidebar-open':'ap-sidebar'}><div className="ap-brand"><span className="ap-brand-mark">E</span><span>ENGLISH <b>MASTER</b><small>ADMIN CONSOLE</small></span><button className="ap-mobile-close" onClick={()=>setMobileOpen(false)}><X size={18}/></button></div><div className="ap-menu-label">WORKSPACE</div><nav className="ap-nav">{sections.map(item=><button key={item.id} className={active===item.id?'ap-nav-item active':'ap-nav-item'} onClick={()=>{setActive(item.id);setMobileOpen(false);}}><item.icon size={18}/><span>{item.label}</span>{active===item.id&&<i/>}</button>)}</nav><div className="ap-sidebar-bottom"><div className="ap-help-card"><CircleHelp size={18}/><b>Yordam kerakmi?</b><small>Admin qo‘llanmasi keyinroq ulanadi.</small></div><button className="ap-exit-btn" onClick={onExit}>← Saytga qaytish</button></div></aside>{mobileOpen&&<button className="ap-scrim" aria-label="Menyuni yopish" onClick={()=>setMobileOpen(false)}/>}<main className="ap-main"><header className="ap-topbar"><button className="ap-mobile-menu" onClick={()=>setMobileOpen(true)}><Menu size={20}/></button><div className="ap-breadcrumb">Workspace <span>/</span> <b>{activeSection.label}</b></div><div className="ap-top-actions"><button className="ap-icon-btn" aria-label="Yangilash" onClick={()=>load(active)}><RefreshCw size={17}/></button><div className="ap-user"><div className="ap-avatar">{(user?.name||'A').slice(0,1).toUpperCase()}</div><span><b>{user?.name||'Administrator'}</b><small>{role==='super_admin'?'Super Admin':role==='admin'?'Admin':'Tekshirilmoqda'}</small></span><ChevronDown size={15}/></div></div></header><div className="ap-content">{renderContent()}<footer className="ap-footer">© 2026 English Master · Admin Console <span>Secure workspace</span></footer></div></main></div>;
}
