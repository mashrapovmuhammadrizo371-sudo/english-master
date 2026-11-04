import { useEffect, useMemo, useState } from 'react';
import {
  LayoutDashboard, Users, BookOpen, ClipboardList, CreditCard, Bot, Settings,
  Bell, ChevronDown, Plus, ArrowUpRight, Menu, X, LockKeyhole, CircleHelp,
  Activity, Sparkles, RefreshCw, ShieldCheck, Trash2
} from 'lucide-react';
import './admin-panel.css';
import './admin-panel-data.css';

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
  const [loginPassword,setLoginPassword] = useState('');
  const [loginBusy,setLoginBusy] = useState(false);
  const [role,setRole] = useState('');
  const [apiError,setApiError] = useState('');
  const [loading,setLoading] = useState(true);
  const [summary,setSummary] = useState(null);
  const [students,setStudents] = useState([]);
  const [courses,setCourses] = useState([]);
  const [admins,setAdmins] = useState([]);
  const [exams,setExams] = useState([]);
  const [questionsByExam,setQuestionsByExam] = useState({});
  const [selectedExam,setSelectedExam] = useState('');
  const [questionPrompt,setQuestionPrompt] = useState('');
  const [questionOptions,setQuestionOptions] = useState('');
  const [questionAnswer,setQuestionAnswer] = useState('');
  const [aiSettings,setAiSettings] = useState({enabled:0,provider:'openai',model:'gpt-4o-mini',instructions:''});
  const [paymentSettings,setPaymentSettings] = useState({mode:'disabled',provider:'manual'});
  const [payments,setPayments] = useState([]);
  const [plans,setPlans] = useState([]);
  const [examForm,setExamForm] = useState(false);
  const [examTitle,setExamTitle] = useState('');
  const [examLevel,setExamLevel] = useState('A1');
  const [examMinutes,setExamMinutes] = useState('30');
  const [planForm,setPlanForm] = useState(false);
  const [planName,setPlanName] = useState('');
  const [planPrice,setPlanPrice] = useState('0');
  const [auditEvents,setAuditEvents] = useState([]);
  const [courseForm,setCourseForm] = useState(false);
  const [courseTitle,setCourseTitle] = useState('');
  const [courseLevel,setCourseLevel] = useState('A1');
  const [courseDescription,setCourseDescription] = useState('');
  const [lessonsByCourse,setLessonsByCourse] = useState({});
  const [lessonFormCourse,setLessonFormCourse] = useState('');
  const [lessonTitle,setLessonTitle] = useState('');
  const [lessonContent,setLessonContent] = useState('');
  const [adminEmail,setAdminEmail] = useState('');
  const [selectedPermissions,setSelectedPermissions] = useState(['students.read','courses.read']);
  const [busy,setBusy] = useState(false);
  const [notice,setNotice] = useState('');
  const activeSection = sections.find(s=>s.id===active) || sections[0];
  const canManageCourses = role === 'super_admin' || role === 'admin';
  const api = async (path, options={}) => {
    const response = await fetch('/api/admin/'+path,{
      ...options,
      credentials:'same-origin',
      headers:{'Content-Type':'application/json',...(options.headers||{})}
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
        const result=await api('courses'); setCourses(result.courses||[]); const lessonPairs=await Promise.all((result.courses||[]).map(async course=>[course.id,(await api('courses/'+course.id+'/lessons')).lessons||[]])); setLessonsByCourse(Object.fromEntries(lessonPairs));
      } else if(section==='exams'){
        const result=await api('exams'); setExams(result.exams||[]);
        const pairs=await Promise.all((result.exams||[]).map(async exam=>[exam.id,(await api('exams/'+exam.id+'/questions')).questions||[]]));
        setQuestionsByExam(Object.fromEntries(pairs));
      } else if(section==='payments'){
        const [result,planResult,settingsResult]=await Promise.all([api('payments'),api('plans'),api('payment-settings')]);
        setPayments(result.payments||[]); setPlans(planResult.plans||[]); setPaymentSettings(settingsResult.settings||{mode:'disabled',provider:'manual'});
      } else if(section==='ai'){
        const result=await api('ai-settings'); setAiSettings(result.settings||{enabled:0,provider:'openai',model:'gpt-4o-mini',instructions:''});
      } else if(section==='security' && me.role==='super_admin'){
        const [result,logs]=await Promise.all([api('admins'),api('audit')]); setAdmins(result.admins||[]); setAuditEvents(logs.events||[]);
      }
    } catch(error){setApiError(error.message);}
    finally{setLoading(false);}
  };
  useEffect(()=>{
    let active=true;
    fetch('/api/admin/me',{credentials:'same-origin'}).then(response=>{if(response.ok&&active)setToken('cookie-session');}).catch(()=>{}).finally(()=>{if(active)setLoading(false);});
    return ()=>{active=false;};
  },[]);
  useEffect(()=>{if(token) load('overview');},[token]);
  const loginAdmin=async(event)=>{
    event.preventDefault(); if(!loginPassword||loginBusy)return;
    setLoginBusy(true);setApiError('');
    try{const response=await fetch('/api/admin/login',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:loginPassword})});const data=await response.json().catch(()=>({}));if(!response.ok)throw new Error(data.error||'Admin tizimiga kirib bo‘lmadi.');setLoginPassword('');setToken('cookie-session');}
    catch(error){setApiError(error.message);}finally{setLoginBusy(false);}
  };
  useEffect(()=>{if(token && active!=='overview') load(active);},[active,token]);

  const createCourse = async (event) => {
    event.preventDefault(); if(!courseTitle.trim()) return;
    setBusy(true);setNotice('');
    try{
      await api('courses',{method:'POST',body:JSON.stringify({level:courseLevel,title:courseTitle,description:courseDescription})});
      setCourseTitle('');setCourseDescription('');setCourseForm(false);setNotice('Kurs saqlandi.');await load('courses');
    }catch(error){setApiError(error.message);}finally{setBusy(false);}
  };
  const createLesson = async (event) => {
    event.preventDefault(); if(!lessonFormCourse || !lessonTitle.trim()) return;
    setBusy(true);setNotice('');
    try{await api('courses/'+lessonFormCourse+'/lessons',{method:'POST',body:JSON.stringify({title:lessonTitle,content:lessonContent})});setLessonTitle('');setLessonContent('');setLessonFormCourse('');setNotice('Dars loyihasi saqlandi.');await load('courses');}
    catch(error){setApiError(error.message);}finally{setBusy(false);}
  };
  const createExam = async (event) => {
    event.preventDefault(); if(!examTitle.trim()) return;
    setBusy(true);setNotice('');
    try{await api('exams',{method:'POST',body:JSON.stringify({title:examTitle,level:examLevel,duration_seconds:Number(examMinutes)*60,pass_percent:80})});setExamTitle('');setExamForm(false);setNotice('Test loyihasi saqlandi.');await load('exams');}
    catch(error){setApiError(error.message);}finally{setBusy(false);}
  };
  const createQuestion = async (event) => {
    event.preventDefault();
    const options=questionOptions.split('\n').map(x=>x.trim()).filter(Boolean);
    setBusy(true);setNotice('');
    try{
      await api('exams/'+selectedExam+'/questions',{method:'POST',body:JSON.stringify({prompt:questionPrompt,options,correct_answer:questionAnswer,points:1})});
      setQuestionPrompt('');setQuestionOptions('');setQuestionAnswer('');
      setNotice('Savol saqlandi.');await load('exams');
    }catch(error){setApiError(error.message);}finally{setBusy(false);}
  };
  const deleteQuestion = async (questionId) => {
    if(!window.confirm('Ushbu savolni o‘chirasizmi?'))return;
    setBusy(true);
    try{await api('exam-questions/'+questionId,{method:'DELETE'});setNotice('Savol o‘chirildi.');await load('exams');}
    catch(error){setApiError(error.message);}finally{setBusy(false);}
  };
  const publishExam = async (examId) => {
    if(!window.confirm('Testni nashr qilasizmi? Nashrdan keyin savollar o‘zgartirilmaydi.'))return;
    setBusy(true);
    try{await api('exams/'+examId+'/publish',{method:'POST'});setNotice('Test nashr qilindi.');await load('exams');}
    catch(error){setApiError(error.message);}finally{setBusy(false);}
  };
  const saveAISettings = async (event) => {
    event.preventDefault();setBusy(true);setNotice('');
    try{await api('ai-settings',{method:'POST',body:JSON.stringify(aiSettings)});setNotice('AI sozlamalari saqlandi.');await load('ai');}
    catch(error){setApiError(error.message);}finally{setBusy(false);}
  };
  const savePaymentSettings = async (event) => {
    event.preventDefault();setBusy(true);setNotice('');
    try{await api('payment-settings',{method:'POST',body:JSON.stringify(paymentSettings)});setNotice('To‘lov test sozlamalari saqlandi. Real to‘lovlar o‘chiq.');await load('payments');}
    catch(error){setApiError(error.message);}finally{setBusy(false);}
  };

  const createPlan = async (event) => {
    event.preventDefault(); if(!planName.trim()) return;
    setBusy(true);setNotice('');
    try{await api('plans',{method:'POST',body:JSON.stringify({name:planName,price_minor:Math.round(Number(planPrice)*100),features:[]})});setPlanName('');setPlanPrice('0');setPlanForm(false);setNotice('Tarif loyihasi saqlandi.');await load('payments');}
    catch(error){setApiError(error.message);}finally{setBusy(false);}
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
      <div className="ap-welcome"><div><span className="ap-eyebrow">ENGLISH MASTER · BOSHQARUV</span><h1>{title}</h1><p>{description}</p></div>{(active==='courses'||active==='exams'||(active==='payments'&&role==='super_admin'))&&<button className="ap-primary-btn" onClick={()=>active==='courses'?setCourseForm(v=>!v):active==='exams'?setExamForm(v=>!v):setPlanForm(v=>!v)}><Plus size={17}/>{active==='courses'?'Kurs yaratish':active==='exams'?'Test yaratish':'Tarif yaratish'}</button>}</div>
      {notice&&<div className="ap-notice">{notice}</div>}
      {active==='students'&&<section className="ap-panel"><div className="ap-panel-head"><div><h2>O‘quvchilar ro‘yxati</h2><p>Oxirgi 200 ta Google profili</p></div><span className="ap-muted-tag">{students.length} ta</span></div>{students.length?<div className="ap-table-wrap"><table className="ap-table"><thead><tr><th>O‘quvchi</th><th>Email</th><th>Oxirgi kirish</th></tr></thead><tbody>{students.map(s=><tr key={s.email}><td>{s.name}</td><td>{s.email}</td><td>{s.last_login_at}</td></tr>)}</tbody></table></div>:<Empty title="Hozircha o‘quvchilar yo‘q" description="Google orqali kirgan foydalanuvchilar ro‘yxati shu yerda ko‘rinadi."/>}</section>}
      {active==='courses'&&<>{courseForm&&<form className="ap-panel ap-form" onSubmit={createCourse}><h2>Yangi kurs</h2><label>Daraja<select value={courseLevel} onChange={e=>setCourseLevel(e.target.value)}>{['A1','A2','B1','B2','C1','C2'].map(x=><option key={x}>{x}</option>)}</select></label><label>Kurs nomi<input required value={courseTitle} onChange={e=>setCourseTitle(e.target.value)} placeholder="Masalan: Everyday English"/></label><label>Tavsif<textarea value={courseDescription} onChange={e=>setCourseDescription(e.target.value)} placeholder="Kurs haqida qisqacha"/></label><div className="ap-form-actions"><button type="button" className="ap-secondary-btn" onClick={()=>setCourseForm(false)}>Bekor qilish</button><button className="ap-primary-btn" disabled={busy}>{busy?'Saqlanmoqda…':'Saqlash'}</button></div></form>}{lessonFormCourse&&<form className="ap-panel ap-form" onSubmit={createLesson}><h2>Yangi dars qo‘shish</h2><label>Dars nomi<input required value={lessonTitle} onChange={e=>setLessonTitle(e.target.value)} placeholder="Masalan: Introducing yourself"/></label><label>Dars materiali<textarea value={lessonContent} onChange={e=>setLessonContent(e.target.value)} placeholder="Dars matni yoki qisqa ko‘rsatma"/></label><div className="ap-form-actions"><button type="button" className="ap-secondary-btn" onClick={()=>setLessonFormCourse('')}>Bekor qilish</button><button className="ap-primary-btn" disabled={busy}>Darsni saqlash</button></div></form>}<div className="ap-course-grid">{courses.map(course=><article className="ap-level-card" key={course.id}><span>{course.level}</span><b>{course.title}</b><small>{course.description||'Tavsif kiritilmagan'}</small><em>{course.status} · {(lessonsByCourse[course.id]||[]).length} dars</em><button className="ap-secondary-btn" onClick={()=>setLessonFormCourse(course.id)}><Plus size={14}/>Dars qo‘shish</button>{(lessonsByCourse[course.id]||[]).map(lesson=><small key={lesson.id}>• {lesson.title} ({lesson.status})</small>)}</article>)}</div>{!courses.length&&!courseForm&&<Empty title="Kurslar hali yaratilmagan" description="A1–C2 darajalarida birinchi kursingizni yaratishingiz mumkin."/>}</>}
      {active==='security'&&<>{role==='super_admin'?<><form className="ap-panel ap-form" onSubmit={saveAdmin}><h2>Admin qo‘shish yoki ruxsatlarni yangilash</h2><p>Foydalanuvchi avval Google orqali saytga kamida bir marta kirgan bo‘lishi kerak.</p><label>Google email<input type="email" required value={adminEmail} onChange={e=>setAdminEmail(e.target.value)} placeholder="admin@example.com"/></label><div className="ap-permissions">{permissions.map(([value,label])=><label key={value}><input type="checkbox" checked={selectedPermissions.includes(value)} onChange={e=>setSelectedPermissions(old=>e.target.checked?[...old,value]:old.filter(x=>x!==value))}/>{label}</label>)}</div><button className="ap-primary-btn" disabled={busy}><Plus size={16}/>Admin huquqini saqlash</button></form><section className="ap-panel"><div className="ap-panel-head"><div><h2>Administratorlar</h2><p>Super Admin tomonidan boshqariladi</p></div></div>{admins.length?admins.map(admin=><div className="ap-admin-row" key={admin.email}><div><b>{admin.name||admin.email}</b><small>{admin.email} · {admin.permissions_json}</small></div><button className="ap-danger-btn" disabled={busy} onClick={()=>revokeAdmin(admin.email)}><Trash2 size={16}/>Bekor qilish</button></div>):<p className="ap-muted">Hozircha qo‘shimcha admin yo‘q.</p>}</section><section className="ap-panel"><div className="ap-panel-head"><div><h2>Audit jurnali</h2><p>Administratorlar bajargan oxirgi amallar</p></div></div>{auditEvents.length?auditEvents.map((event,i)=><div className="ap-admin-row" key={i}><div><b>{event.action} · {event.resource_type}</b><small>{event.email} · {event.created_at}</small></div></div>):<p className="ap-muted">Hozircha qayd etilgan amallar yo‘q.</p>}</section></>:<Empty title="Super Admin ruxsati kerak" description="Administratorlarni faqat Super Admin qo‘sha oladi yoki o‘chira oladi."/>}</>}
      {active==='exams'&&<>{examForm&&<form className="ap-panel ap-form" onSubmit={createExam}><h2>Yangi test</h2><label>Test nomi<input required value={examTitle} onChange={e=>setExamTitle(e.target.value)} placeholder="Masalan: A1 Reading Check"/></label><label>Daraja<select value={examLevel} onChange={e=>setExamLevel(e.target.value)}>{['A1','A2','B1','B2','C1','C2'].map(x=><option key={x}>{x}</option>)}</select></label><label>Davomiyligi (daqiqa)<input type="number" min="1" max="240" value={examMinutes} onChange={e=>setExamMinutes(e.target.value)}/></label><div className="ap-form-actions"><button type="button" className="ap-secondary-btn" onClick={()=>setExamForm(false)}>Bekor qilish</button><button className="ap-primary-btn" disabled={busy}>Saqlash</button></div></form>}<section className="ap-panel"><div className="ap-panel-head"><div><h2>Testlar ro‘yxati</h2><p>Savollar banki va nashr holati</p></div><span className="ap-muted-tag">{exams.length} ta</span></div>{exams.length?exams.map(exam=><article className="ap-exam-card" key={exam.id}><div className="ap-exam-head"><div><b>{exam.title}</b><small>{exam.level} · {Math.round(exam.duration_seconds/60)} daqiqa · {exam.status} · {(questionsByExam[exam.id]||[]).length} savol</small></div><div className="ap-exam-actions"><button className="ap-secondary-btn" onClick={()=>setSelectedExam(selectedExam===exam.id?'':exam.id)}>{selectedExam===exam.id?'Yopish':'Savollarni boshqarish'}</button>{exam.status==='draft'&&<button className="ap-primary-btn" disabled={busy||!(questionsByExam[exam.id]||[]).length} onClick={()=>publishExam(exam.id)}>Nashr qilish</button>}</div></div>{selectedExam===exam.id&&<div className="ap-question-manager"><form className="ap-form" onSubmit={createQuestion}><h3>Yangi savol qo‘shish</h3><label>Savol matni<textarea required value={questionPrompt} onChange={e=>setQuestionPrompt(e.target.value)} placeholder="Savolni kiriting"/></label><label>Variantlar — har birini yangi qatordan yozing<textarea required value={questionOptions} onChange={e=>setQuestionOptions(e.target.value)} placeholder={'A\nB\nC\nD'}/></label><label>To‘g‘ri javob — variant bilan aynan bir xil<input required value={questionAnswer} onChange={e=>setQuestionAnswer(e.target.value)} placeholder="To‘g‘ri variant"/></label><button className="ap-primary-btn" disabled={busy}>Savolni saqlash</button></form>{(questionsByExam[exam.id]||[]).map((q,index)=><div className="ap-question-row" key={q.id}><div><b>{index+1}. {q.prompt}</b><small>{(q.options||[]).join(' · ')} | Javob: {q.correct_answer}</small></div>{exam.status==='draft'&&<button className="ap-danger-btn" disabled={busy} onClick={()=>deleteQuestion(q.id)}>O‘chirish</button>}</div>)}</div>}</article>):<Empty title="Testlar hali yaratilmagan" description="Birinchi test loyihasini yarating."/>}</section></>}{active==='payments'&&<>{planForm&&<form className="ap-panel ap-form" onSubmit={createPlan}><h2>Yangi tarif loyihasi</h2><label>Tarif nomi<input required value={planName} onChange={e=>setPlanName(e.target.value)} placeholder="Masalan: Premium"/></label><label>Narx (UZS)<input type="number" min="0" value={planPrice} onChange={e=>setPlanPrice(e.target.value)}/></label><div className="ap-form-actions"><button type="button" className="ap-secondary-btn" onClick={()=>setPlanForm(false)}>Bekor qilish</button><button className="ap-primary-btn" disabled={busy}>Saqlash</button></div><small>Tarif draft holatida saqlanadi. Hozircha foydalanuvchilardan to‘lov olinmaydi.</small></form>}<form className="ap-panel ap-form" onSubmit={savePaymentSettings}><h2>To‘lov provayderi sozlamalari</h2><p>Hozircha faqat xavfsiz sinov/o‘chiq rejim. Real to‘lovlar yoqilmagan.</p><label>Rejim<select value={paymentSettings.mode} onChange={e=>setPaymentSettings(s=>({...s,mode:e.target.value}))}><option value="disabled">O‘chiq</option><option value="test">Sinov rejimi</option></select></label><label>Provayder<select value={paymentSettings.provider} onChange={e=>setPaymentSettings(s=>({...s,provider:e.target.value}))}><option value="manual">Manual / ulanmagan</option><option value="click">Click (hali ulanmagan)</option><option value="payme">Payme (hali ulanmagan)</option></select></label><div className="ap-notice">Real pul qabul qilish, yechish va qaytarish o‘chiq. Provayderning rasmiy merchant tekshiruvi va server webhooklari ulanmaguncha bu holat o‘zgarmaydi.</div><button className="ap-primary-btn" disabled={busy||role!=='super_admin'}>Saqlash</button></form><section className="ap-panel"><div className="ap-panel-head"><div><h2>Tariflar</h2><p>Yaratilgan tarif loyihalari</p></div></div>{plans.length?plans.map(p=><div className="ap-admin-row" key={p.id}><div><b>{p.name} · {(p.price_minor/100).toLocaleString('uz-UZ')} {p.currency}</b><small>{p.status}</small></div></div>):<p className="ap-muted">Tariflar hali yaratilmagan.</p>}</section><section className="ap-panel"><div className="ap-panel-head"><div><h2>To‘lovlar tarixi</h2><p>Faqat provayder orqali tasdiqlangan tranzaksiyalar</p></div><span className="ap-muted-tag">{payments.length} ta</span></div>{payments.length?<div className="ap-table-wrap"><table className="ap-table"><thead><tr><th>Foydalanuvchi</th><th>Miqdor</th><th>Holati</th><th>Sana</th></tr></thead><tbody>{payments.map(x=><tr key={x.id}><td>{x.email}</td><td>{(x.amount_minor/100).toLocaleString('uz-UZ')} {x.currency}</td><td>{x.status}</td><td>{x.created_at}</td></tr>)}</tbody></table></div>:<Empty title="To‘lov yozuvlari yo‘q" description="To‘lov provayderi ulanmaguncha pul qabul qilish yoki qaytarish yoqilmaydi."/>}</section></>}
      {active==='ai'&&<><section className="ap-ai-banner"><span><Bot size={20}/></span><div><b>AI xavfsizlik eslatmasi</b><p>API kalitlari bu oynaga kiritilmaydi. Ular faqat serverdagi Cloudflare Secret sifatida saqlanishi kerak. Bu yerda model va ko‘rsatmalar boshqariladi.</p></div></section><form className="ap-panel ap-form" onSubmit={saveAI}><h2>AI Teacher sozlamalari</h2><label className="ap-inline-check"><input type="checkbox" checked={!!aiSettings.enabled} onChange={e=>setAiSettings(s=>({...s,enabled:e.target.checked?1:0}))}/> AI funksiyasini yoqish</label><label>Provayder<select value={aiSettings.provider} onChange={e=>setAiSettings(s=>({...s,provider:e.target.value}))}><option value="openai">OpenAI</option></select></label><label>Model<select value={aiSettings.model} onChange={e=>setAiSettings(s=>({...s,model:e.target.value}))}>{['gpt-4o-mini','gpt-4.1-mini','gpt-4.1'].map(m=><option key={m}>{m}</option>)}</select></label><label>AI uchun umumiy ko‘rsatmalar<textarea rows="6" value={aiSettings.instructions||''} onChange={e=>setAiSettings(s=>({...s,instructions:e.target.value}))} placeholder="AI Teacher qanday uslubda javob berishi kerak?"/></label><button className="ap-primary-btn" disabled={busy||role!=='super_admin'}>AI sozlamalarini saqlash</button>{role!=='super_admin'&&<small>Faqat Super Admin o‘zgartira oladi.</small>}</form></>}
    </>;
  };
  if(loading&&!token)return <div className="admin-panel" style={{minHeight:'100vh',display:'grid',placeItems:'center',color:'#fff'}}>Admin sessiyasi tekshirilmoqda…</div>;
  if(!token)return <div className="admin-panel" style={{minHeight:'100vh',display:'grid',placeItems:'center',padding:24}}><form onSubmit={loginAdmin} style={{width:'min(100%,420px)',padding:32,borderRadius:20,background:'#111827',border:'1px solid #334155',color:'#f8fafc'}}><div style={{fontSize:12,letterSpacing:2,color:'#d6b66b',fontWeight:700}}>ENGLISH MASTER · ADMIN</div><h1 style={{fontSize:28,margin:'14px 0 8px'}}>Admin Panel</h1><p style={{color:'#94a3b8',marginBottom:24}}>Davom etish uchun maxsus admin parolini kiriting.</p><label style={{display:'block',fontSize:13,marginBottom:8}}>Admin paroli</label><input type="password" autoComplete="current-password" value={loginPassword} onChange={e=>setLoginPassword(e.target.value)} required style={{width:'100%',boxSizing:'border-box',padding:14,borderRadius:10,border:'1px solid #475569',background:'#0b1220',color:'#fff',marginBottom:16}}/>{apiError&&<p role="alert" style={{color:'#fca5a5',fontSize:13}}>{apiError}</p>}<button type="submit" disabled={loginBusy} style={{width:'100%',padding:14,border:0,borderRadius:10,background:'#d6b66b',color:'#111827',fontWeight:700}}>{loginBusy?'Tekshirilmoqda…':'Xavfsiz kirish'}</button><button type="button" onClick={onExit} style={{width:'100%',padding:12,marginTop:10,border:0,background:'transparent',color:'#94a3b8'}}>← Asosiy saytga qaytish</button></form></div>;
  return <div className="admin-panel"><aside className={mobileOpen?'ap-sidebar ap-sidebar-open':'ap-sidebar'}><div className="ap-brand"><span className="ap-brand-mark">E</span><span>ENGLISH <b>MASTER</b><small>ADMIN CONSOLE</small></span><button className="ap-mobile-close" onClick={()=>setMobileOpen(false)}><X size={18}/></button></div><div className="ap-menu-label">WORKSPACE</div><nav className="ap-nav">{sections.map(item=><button key={item.id} className={active===item.id?'ap-nav-item active':'ap-nav-item'} onClick={()=>{setActive(item.id);setMobileOpen(false);}}><item.icon size={18}/><span>{item.label}</span>{active===item.id&&<i/>}</button>)}</nav><div className="ap-sidebar-bottom"><div className="ap-help-card"><CircleHelp size={18}/><b>Yordam kerakmi?</b><small>Admin qo‘llanmasi keyinroq ulanadi.</small></div><button className="ap-exit-btn" onClick={async()=>{await fetch("/api/admin/logout",{method:"POST",credentials:"same-origin"});setToken("");setRole("");onExit();}}>← Chiqish</button></div></aside>{mobileOpen&&<button className="ap-scrim" aria-label="Menyuni yopish" onClick={()=>setMobileOpen(false)}/>}<main className="ap-main"><header className="ap-topbar"><button className="ap-mobile-menu" onClick={()=>setMobileOpen(true)}><Menu size={20}/></button><div className="ap-breadcrumb">Workspace <span>/</span> <b>{activeSection.label}</b></div><div className="ap-top-actions"><button className="ap-icon-btn" aria-label="Yangilash" onClick={()=>load(active)}><RefreshCw size={17}/></button><div className="ap-user"><div className="ap-avatar">{(user?.name||'A').slice(0,1).toUpperCase()}</div><span><b>{user?.name||'Administrator'}</b><small>{role==='super_admin'?'Super Admin':role==='admin'?'Admin':'Tekshirilmoqda'}</small></span><ChevronDown size={15}/></div></div></header><div className="ap-content">{renderContent()}<footer className="ap-footer">© 2026 English Master · Admin Console <span>Secure workspace</span></footer></div></main></div>;
}
