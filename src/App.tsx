import React, { useState, useEffect, useCallback } from 'react';
import { Styles } from './components/Styles';
import { Toast, Spin, T } from './components/UI';
import { IC } from './components/Icons';
import { AuthPage } from './pages/AuthPage';
import { Landing } from './pages/Landing';
import { Dashboard } from './pages/Dashboard';
import { Library } from './pages/Library';
import { QuizPage } from './pages/QuizPage';
import { FlashcardPage } from './pages/FlashcardPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { TutorPage } from './pages/TutorPage';
import { auth } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { store } from './lib/db';

const NAV_ITEMS = [
  { id:"dashboard", icon:"home",     label:"Dashboard" },
  { id:"library",   icon:"book",     label:"PDF Library" },
  { id:"quiz",      icon:"quiz",     label:"Quizzes" },
  { id:"flashcard", icon:"flash",    label:"Flashcards" },
  { id:"analytics", icon:"chart",    label:"Analytics" },
  { id:"tutor",     icon:"bot",      label:"AI Tutor" },
];

const Sidebar = ({ active, setPage, user, onLogout, collapsed, setCollapsed }: any) => (
  <aside style={{ width:collapsed?64:230, flexShrink:0, background:T.white, borderRight:`1px solid ${T.border}`, display:"flex", flexDirection:"column", height:"100vh", position:"sticky", top:0, transition:"width 0.25s ease", overflow:"hidden", zIndex:50 }}>
    <div style={{ height:64, display:"flex", alignItems:"center", padding:"0 16px", borderBottom:`1px solid ${T.border}`, gap:10, flexShrink:0 }}>
      <div style={{ width:32, height:32, borderRadius:9, flexShrink:0, background:"var(--grad)", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 2px 10px rgba(42,46,127,0.2)", cursor:"pointer" }} onClick={()=>setCollapsed((c: boolean)=>!c)}>
        <IC n="brain" s={15} c="#fff"/>
      </div>
      {!collapsed && <span style={{ fontFamily:"var(--font-h)", fontSize:17, fontWeight:700, color:T.indigo, whiteSpace:"nowrap" }}>Revixa <span style={{ color:T.purple }}>AI</span></span>}
    </div>

    <nav style={{ flex:1, padding:"12px 10px", overflow:"hidden" }}>
      {NAV_ITEMS.map(item=>{
        const isA = active===item.id;
        return (
          <button key={item.id} onClick={()=>setPage(item.id)} title={collapsed?item.label:""}
            style={{ display:"flex", alignItems:"center", gap:11, width:"100%", padding:"9px 11px", borderRadius:8, border:"none", background:isA?`${T.purple}12`:"transparent", color:isA?T.purple:T.muted, cursor:"pointer", fontSize:13, fontWeight:isA?600:400, transition:"all 0.15s", marginBottom:2, whiteSpace:"nowrap", borderLeft:isA?`3px solid ${T.purple}`:"3px solid transparent" }}
            onMouseEnter={e=>{ if(!isA) e.currentTarget.style.background=T.subtle; }}
            onMouseLeave={e=>{ if(!isA) e.currentTarget.style.background="transparent"; }}>
            <IC n={item.icon} s={15} c={isA?T.purple:T.muted} sx={{ flexShrink:0 }}/>
            {!collapsed && item.label}
          </button>
        );
      })}
    </nav>

    {!collapsed && (
      <div style={{ padding:"0 10px 16px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 12px", borderRadius:10, border:`1px solid ${T.border}` }}>
          <div style={{ width:32, height:32, borderRadius:"50%", background:"var(--grad)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
            <span style={{ fontFamily:"var(--font-h)", fontSize:13, fontWeight:700, color:"#fff" }}>{user?.name?.[0]?.toUpperCase()||"U"}</span>
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <p style={{ fontSize:13, fontWeight:600, color:T.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{user?.name}</p>
            <p style={{ fontSize:11, color:T.faint, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{user?.email}</p>
          </div>
          <button onClick={onLogout} style={{ background:"none", border:"none", cursor:"pointer", padding:4, flexShrink:0 }} title="Sign out">
            <IC n="logout" s={14} c={T.faint}/>
          </button>
        </div>
      </div>
    )}
  </aside>
);

const TopBar = ({ title, sub }: any) => (
  <div style={{ height:64, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 32px", background:T.white, borderBottom:`1px solid ${T.border}`, flexShrink:0, position:"sticky", top:0, zIndex:40 }}>
    <div>
      <h1 style={{ fontFamily:"var(--font-h)", fontSize:19, fontWeight:700, color:T.text, letterSpacing:"-0.02em" }}>{title}</h1>
      {sub && <p style={{ fontSize:12, color:T.muted }}>{sub}</p>}
    </div>
  </div>
);

export default function App() {
  const [screen, setScreen] = useState("landing"); // landing | auth | app
  const [user, setUser] = useState<any>(null);
  const [page, setPage] = useState("dashboard");
  const [collapsed, setSidebarCollapsed] = useState(false);
  const [pdfs, setPdfs] = useState<any[]>([]);
  const [quizAttempts, setQuizAttempts] = useState<any[]>([]);
  const [activePdf, setActivePdf] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<any>(null);

  const showToast = useCallback((msg: string, type="success") => {
    setToast({ msg, type, id:Date.now() });
  }, []);

  useEffect(()=>{
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        const userData = await store.getUser(u.uid);
        if (userData) {
          setUser({ id: u.uid, ...userData });
          await loadUserData(u.uid);
          setScreen("app");
        } else {
          // User exists in auth but not in DB (shouldn't happen if AuthPage is used)
          setScreen("auth");
        }
      } else {
        setUser(null);
        setScreen("landing");
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const loadUserData = async (uid: string) => {
    const pdfData = await store.getPdfs(uid);
    setPdfs(pdfData.sort((a: any,b: any)=>b.uploadedAt-a.uploadedAt));

    const attemptData = await store.getAttempts(uid);
    setQuizAttempts(attemptData.sort((a: any,b: any)=>b.date-a.date));
  };

  const handleAuth = async (u: any) => {
    setUser(u);
    await loadUserData(u.id);
    setScreen("app");
    showToast(`Welcome${u.name ? `, ${u.name.split(" ")[0]}` : ""}!`, "success");
  };

  const handleLogout = async () => {
    await signOut(auth);
    setUser(null); setPdfs([]); setQuizAttempts([]); setActivePdf(null);
    setScreen("landing");
  };

  const addAttempt = (attempt: any) => {
    setQuizAttempts(a=>[attempt, ...a]);
  };

  const PAGE_META: any = {
    dashboard: { title:"Dashboard" },
    library:   { title:"PDF Library" },
    quiz:      { title:"Quizzes" },
    flashcard: { title:"Flashcards" },
    analytics: { title:"Analytics" },
    tutor:     { title:"AI Tutor" },
  };

  if (loading) return (
    <>
      <Styles/>
      <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:T.bg }}>
        <div style={{ textAlign:"center" }}>
          <div style={{ width:52, height:52, borderRadius:16, background:"var(--grad)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px", boxShadow:T.shBtn }}>
            <IC n="brain" s={24} c="#fff"/>
          </div>
          <Spin s={24} c={T.purple}/>
        </div>
      </div>
    </>
  );

  return (
    <>
      <Styles/>
      {toast && <Toast key={toast.id} msg={toast.msg} type={toast.type} onDone={()=>setToast(null)}/>}

      {screen==="landing" && <Landing onGetStarted={()=>setScreen("auth")}/>}
      {screen==="auth" && <AuthPage onAuth={handleAuth}/>}

      {screen==="app" && user && (
        <div style={{ display:"flex", height:"100vh", overflow:"hidden", background:T.bg }}>
          <Sidebar active={page} setPage={(p: string)=>{ setPage(p); setActivePdf(null); }} user={user} onLogout={handleLogout} collapsed={collapsed} setCollapsed={setSidebarCollapsed}/>
          <main style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden", minWidth:0 }}>
            <TopBar title={PAGE_META[page]?.title||""} />
            <div style={{ flex:1, overflowY:"auto", display:"flex", flexDirection:"column" }}>
              {page==="dashboard"  && <Dashboard user={user} pdfs={pdfs} quizAttempts={quizAttempts} setPage={setPage}/>}
              {page==="library"    && <Library user={user} pdfs={pdfs} setPdfs={setPdfs} setPage={setPage} setActivePdf={setActivePdf} showToast={showToast}/>}
              {page==="quiz"       && <QuizPage user={user} pdfs={pdfs} activePdf={activePdf} setActivePdf={setActivePdf} addAttempt={addAttempt} showToast={showToast}/>}
              {page==="flashcard"  && <FlashcardPage user={user} pdfs={pdfs} activePdf={activePdf} showToast={showToast}/>}
              {page==="analytics"  && <AnalyticsPage quizAttempts={quizAttempts} pdfs={pdfs}/>}
              {page==="tutor"      && <TutorPage pdfs={pdfs} activePdf={activePdf}/>}
            </div>
          </main>
        </div>
      )}
    </>
  );
}
