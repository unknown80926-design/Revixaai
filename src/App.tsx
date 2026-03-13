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
  { id:"library",   icon:"book",     label:"Study Library" },
  { id:"quiz",      icon:"quiz",     label:"Quizzes" },
  { id:"flashcard", icon:"flash",    label:"Flashcards" },
  { id:"analytics", icon:"chart",    label:"Analytics" },
  { id:"tutor",     icon:"bot",      label:"AI Tutor" },
];

const Sidebar = ({ active, setPage, user, onLogout, collapsed, setCollapsed, mobileOpen, setMobileOpen }: any) => (
  <>
    {/* Mobile Overlay */}
    {mobileOpen && (
      <div className="md:hidden fixed inset-0 bg-black/20 z-40" onClick={() => setMobileOpen(false)} />
    )}
    <aside 
      className={`fixed md:sticky top-0 h-screen bg-white border-r border-gray-200 flex flex-col transition-all duration-300 z-50
        ${mobileOpen ? 'translate-x-0 w-[260px]' : '-translate-x-full md:translate-x-0'}
        ${collapsed ? 'md:w-[72px]' : 'md:w-[260px]'}`}
    >
      <div style={{ height:72, display:"flex", alignItems:"center", padding:"0 20px", borderBottom:`1px solid ${T.border}`, gap:12, flexShrink:0 }}>
        <div style={{ width:36, height:36, borderRadius:10, flexShrink:0, background:"var(--grad)", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 2px 10px rgba(79,70,229,0.25)", cursor:"pointer", transition:"transform 0.2s" }} onClick={()=>setCollapsed((c: boolean)=>!c)} onMouseEnter={e=>e.currentTarget.style.transform="scale(1.05)"} onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}>
          <IC n="brain" s={18} c="#fff"/>
        </div>
        {(!collapsed || mobileOpen) && <span style={{ fontFamily:"var(--font-h)", fontSize:19, fontWeight:700, color:T.indigo, whiteSpace:"nowrap", animation:"fadeIn 0.3s" }}>Revixa <span style={{ color:T.purple }}>AI</span></span>}
      </div>

      <nav style={{ flex:1, padding:"16px 12px", overflow:"hidden", display:"flex", flexDirection:"column", gap:4 }}>
        {NAV_ITEMS.map(item=>{
          const isA = active===item.id;
          return (
            <button key={item.id} onClick={()=>{ setPage(item.id); setMobileOpen(false); }} title={collapsed&&!mobileOpen?item.label:""}
              style={{ display:"flex", alignItems:"center", gap:12, width:"100%", padding:"10px 12px", borderRadius:10, border:"none", background:isA?`${T.purple}12`:"transparent", color:isA?T.purple:T.muted, cursor:"pointer", fontSize:14, fontWeight:isA?600:500, transition:"all 0.2s cubic-bezier(0.16, 1, 0.3, 1)", whiteSpace:"nowrap" }}
              onMouseEnter={e=>{ if(!isA) { e.currentTarget.style.background=T.subtle; e.currentTarget.style.color=T.text; } }}
              onMouseLeave={e=>{ if(!isA) { e.currentTarget.style.background="transparent"; e.currentTarget.style.color=T.muted; } }}>
              <IC n={item.icon} s={18} c={isA?T.purple:T.muted} sx={{ flexShrink:0, transition:"all 0.2s" }}/>
              {(!collapsed || mobileOpen) && item.label}
            </button>
          );
        })}
      </nav>

      {(!collapsed || mobileOpen) && (
        <div style={{ padding:"0 16px 20px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 14px", borderRadius:12, border:`1px solid ${T.border}`, background:T.bg, transition:"all 0.2s" }} onMouseEnter={e=>e.currentTarget.style.borderColor=T.faint} onMouseLeave={e=>e.currentTarget.style.borderColor=T.border}>
            <div style={{ width:36, height:36, borderRadius:"50%", background:"var(--grad)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, boxShadow:"0 2px 8px rgba(79,70,229,0.2)" }}>
              <span style={{ fontFamily:"var(--font-h)", fontSize:14, fontWeight:700, color:"#fff" }}>{user?.name?.[0]?.toUpperCase()||"U"}</span>
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <p style={{ fontSize:14, fontWeight:600, color:T.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{user?.name}</p>
              <p style={{ fontSize:12, color:T.muted, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{user?.email}</p>
            </div>
            <button onClick={onLogout} style={{ background:"none", border:"none", cursor:"pointer", padding:6, flexShrink:0, borderRadius:8, transition:"background 0.2s" }} onMouseEnter={e=>e.currentTarget.style.background=T.border} onMouseLeave={e=>e.currentTarget.style.background="none"} title="Sign out">
              <IC n="logout" s={16} c={T.muted}/>
            </button>
          </div>
        </div>
      )}
    </aside>
  </>
);

const TopBar = ({ title, sub, setMobileOpen }: any) => (
  <div style={{ height:72, display:"flex", alignItems:"center", gap:16, padding:"0 24px", background:"rgba(255,255,255,0.8)", backdropFilter:"blur(12px)", borderBottom:`1px solid ${T.border}`, flexShrink:0, position:"sticky", top:0, zIndex:40 }}>
    <button className="md:hidden p-2 -ml-2 rounded-lg hover:bg-gray-100 text-gray-600" onClick={() => setMobileOpen(true)}>
      <IC n="menu" s={20} c={T.text}/>
    </button>
    <div>
      <h1 style={{ fontFamily:"var(--font-h)", fontSize:20, fontWeight:700, color:T.text, letterSpacing:"-0.02em" }}>{title}</h1>
      {sub && <p style={{ fontSize:13, color:T.muted, marginTop:2 }}>{sub}</p>}
    </div>
  </div>
);

export default function App() {
  const [screen, setScreen] = useState("landing"); // landing | auth | app
  const [user, setUser] = useState<any>(null);
  const [page, setPage] = useState("dashboard");
  const [collapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
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
      try {
        if (u) {
          const userData = await store.getUser(u.uid);
          if (userData) {
            setUser({ id: u.uid, ...userData });
            await loadUserData(u.uid);
            setScreen("app");
          } else {
            setScreen("auth");
          }
        } else {
          setUser(null);
          setScreen("landing");
        }
      } catch (err) {
        console.error("Auth state error:", err);
        setUser(null);
        setScreen("landing");
        showToast("Error loading user data", "error");
      } finally {
        setLoading(false);
      }
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
    library:   { title:"Study Library" },
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
          <Sidebar active={page} setPage={(p: string)=>{ setPage(p); setActivePdf(null); }} user={user} onLogout={handleLogout} collapsed={collapsed} setCollapsed={setSidebarCollapsed} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen}/>
          <main style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden", minWidth:0 }}>
            <TopBar title={PAGE_META[page]?.title||""} setMobileOpen={setMobileOpen} />
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
