import React from 'react';
import { Card, Btn, Badge, Empty, SectionHead, Bar, T } from '../components/UI';
import { IC } from '../components/Icons';

export const Dashboard = ({ user, pdfs, quizAttempts, setPage }: any) => {
  const totalQuizzes = quizAttempts.length;
  const avgAccuracy = totalQuizzes > 0 ? Math.round(quizAttempts.reduce((a: any,q: any)=>a+q.accuracy,0)/totalQuizzes) : 0;
  const recentAttempts = [...quizAttempts].sort((a,b)=>b.date-a.date).slice(0,5);

  // Compute weak concepts from attempts
  const conceptMistakes: any = {};
  quizAttempts.forEach((a: any)=>{
    (a.weakConcepts||[]).forEach((c: any)=>{ conceptMistakes[c]=(conceptMistakes[c]||0)+1; });
  });
  const weakTopics = Object.entries(conceptMistakes).sort((a: any,b: any)=>b[1]-a[1]).slice(0,3).map(([c])=>c);

  const hour = new Date().getHours();
  const greet = hour<12?"Good morning":hour<17?"Good afternoon":"Good evening";

  return (
    <div style={{ flex:1, animation:"fadeIn 0.4s ease", position:"relative" }}>
      {/* DASHBOARD HEADER */}
      <div style={{ padding:"40px 32px 32px", background:T.white, borderBottom:`1px solid ${T.border}`, position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", inset:0, backgroundSize:"30px 30px", backgroundImage:`linear-gradient(to right, ${T.border} 1px, transparent 1px), linear-gradient(to bottom, ${T.border} 1px, transparent 1px)`, opacity:0.3, zIndex:0, maskImage:"linear-gradient(to bottom, black 10%, transparent 100%)", WebkitMaskImage:"linear-gradient(to bottom, black 10%, transparent 100%)", pointerEvents:"none" }}/>
        <div style={{ position:"relative", zIndex:1 }}>
          <h2 style={{ fontFamily:"var(--font-h)", fontSize:28, fontWeight:700, color:T.text, letterSpacing:"-0.02em" }}>{greet}, {user.name.split(" ")[0]} 👋</h2>
          <p style={{ color:T.muted, marginTop:6, fontSize:15 }}>
            {pdfs.length === 0 ? "Upload your first file to get started." : `${pdfs.length} file${pdfs.length>1?"s":""} in your library · ${totalQuizzes} quiz${totalQuizzes!==1?"zes":""} completed.`}
          </p>
        </div>
      </div>

      <div style={{ padding:"32px" }}>
        {pdfs.length === 0 ? (
        <Card>
          <Empty icon="upload" title="No files yet" sub="Upload your first study material to generate quizzes, flashcards, and more."
            action={<Btn variant="primary" icon="upload" onClick={()=>setPage("library")}>Upload Your First File</Btn>}/>
        </Card>
      ) : (
        <>
          {/* STATS */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(190px,1fr))", gap:16, marginBottom:28 }}>
            {[
              { label:"Total Files", value:String(pdfs.length), icon:"book", color:T.indigo },
              { label:"Quizzes Taken", value:String(totalQuizzes), icon:"quiz", color:T.purple },
              { label:"Avg Accuracy", value:totalQuizzes?`${avgAccuracy}%`:"—", icon:"trophy", color:T.success },
              { label:"Weak Topics", value:String(weakTopics.length), icon:"zap", color:T.warn },
            ].map((s,i)=>(
              <Card key={i} style={{ padding:20 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                  <div>
                    <p style={{ fontSize:12, color:T.muted, marginBottom:8, fontWeight:500 }}>{s.label}</p>
                    <p style={{ fontFamily:"var(--font-h)", fontSize:28, fontWeight:800, color:s.color }}>{s.value}</p>
                  </div>
                  <div style={{ width:38, height:38, borderRadius:10, background:`${s.color}12`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <IC n={s.icon} s={17} c={s.color}/>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
            {/* RECENT ACTIVITY */}
            <Card>
              <SectionHead title="Recent Activity" action={<Btn variant="ghost" size="sm" onClick={()=>setPage("analytics")}>View all</Btn>}/>
              {recentAttempts.length === 0 ? (
                <Empty icon="quiz" title="No quizzes yet" sub="Take your first quiz to see activity here." action={<Btn variant="outline" size="sm" onClick={()=>setPage("quiz")}>Take a Quiz</Btn>}/>
              ) : recentAttempts.map((a: any,i)=>(
                <div key={i} style={{ display:"flex", alignItems:"center", gap:12, padding:"11px 0", borderBottom:i<recentAttempts.length-1?`1px solid ${T.border}`:"none" }}>
                  <div style={{ width:8, height:8, borderRadius:"50%", background:a.accuracy>=80?T.success:a.accuracy>=60?T.warn:T.danger, flexShrink:0 }}/>
                  <div style={{ flex:1 }}>
                    <p style={{ fontSize:13, fontWeight:500, color:T.text }}>{a.pdfName}</p>
                    <p style={{ fontSize:11, color:T.faint, marginTop:1 }}>{new Date(a.date).toLocaleDateString()} · {a.totalQ} questions</p>
                  </div>
                  <Badge color={a.accuracy>=80?T.success:a.accuracy>=60?T.warn:T.danger}>{a.accuracy}%</Badge>
                </div>
              ))}
            </Card>

            {/* WEAK TOPICS */}
            <Card>
              <SectionHead title="Needs Revision" action={weakTopics.length?<Badge color={T.danger}>⚠ {weakTopics.length}</Badge>:null}/>
              {weakTopics.length === 0 ? (
                <Empty icon="star" title="All caught up!" sub="No weak topics detected yet. Complete some quizzes to see insights."/>
              ) : (
                <>
                  {weakTopics.map((w,i)=>(
                    <div key={i} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 14px", borderRadius:8, marginBottom:10, background:"rgba(239,68,68,0.05)", border:`1px solid rgba(239,68,68,0.12)` }}>
                      <p style={{ fontSize:13, color:T.text, fontWeight:500 }}>{w}</p>
                      <Btn variant="danger" size="sm" onClick={()=>setPage("quiz")}>Revise</Btn>
                    </div>
                  ))}
                  <Btn variant="primary" size="sm" full onClick={()=>setPage("quiz")} style={{ marginTop:4 }}>Start Revision Session</Btn>
                </>
              )}
            </Card>
          </div>

          {/* LIBRARY QUICK VIEW */}
          <Card>
            <SectionHead title="Your Library" action={<Btn variant="ghost" size="sm" icon="arrow" onClick={()=>setPage("library")}>View all</Btn>}/>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:14 }}>
              {pdfs.slice(0,3).map((pdf: any,i: number)=>{
                const pdfAttempts = quizAttempts.filter((a: any)=>a.pdfId===pdf.id);
                const mastery = pdfAttempts.length ? Math.round(pdfAttempts.reduce((a: any,q: any)=>a+q.accuracy,0)/pdfAttempts.length) : 0;
                return (
                  <div key={i} style={{ padding:"14px 16px", borderRadius:12, border:`1px solid ${T.border}`, background:T.subtle }}>
                    <div style={{ display:"flex", gap:10, alignItems:"flex-start", marginBottom:10 }}>
                      <div style={{ width:36, height:36, borderRadius:9, background:"var(--grad-s)", border:`1px solid rgba(108,99,255,0.15)`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                        <IC n="pdf" s={15} c={T.purple}/>
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <p style={{ fontSize:13, fontWeight:600, color:T.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{pdf.name}</p>
                        <p style={{ fontSize:11, color:T.faint }}>{pdf.pages} pages · {pdfAttempts.length} quiz{pdfAttempts.length!==1?"zes":""}</p>
                      </div>
                    </div>
                    {pdfAttempts.length > 0 && <Bar value={mastery} color={mastery>=70?T.success:mastery>=50?T.warn:T.danger} h={4} label="Mastery" sub={mastery}/>}
                  </div>
                );
              })}
            </div>
          </Card>
        </>
      )}
      </div>
    </div>
  );
};
