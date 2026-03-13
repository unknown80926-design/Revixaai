import React from 'react';
import { Card, Empty, SectionHead, Bar, T } from '../components/UI';
import { IC } from '../components/Icons';

export const AnalyticsPage = ({ quizAttempts, pdfs }: any) => {
  if (quizAttempts.length === 0) return (
    <div style={{ flex:1, padding:"32px" }}>
      <SectionHead title="Analytics" sub="Your learning performance over time"/>
      <Card><Empty icon="chart" title="No data yet" sub="Complete some quizzes to see your performance analytics and insights."/></Card>
    </div>
  );

  const sorted = [...quizAttempts].sort((a,b)=>a.date-b.date);
  const avgAcc = Math.round(quizAttempts.reduce((a: any,q: any)=>a+q.accuracy,0)/quizAttempts.length);
  const totalTime = quizAttempts.reduce((a: any,q: any)=>a+q.timeTaken,0);
  const totalQ = quizAttempts.reduce((a: any,q: any)=>a+q.totalQ,0);
  const maxAcc = Math.max(...quizAttempts.map((q: any)=>q.accuracy));
  const minAcc = Math.min(...quizAttempts.map((q: any)=>q.accuracy));

  // Per-PDF mastery
  const pdfStats = pdfs.map((pdf: any)=>{
    const attempts = quizAttempts.filter((a: any)=>a.pdfId===pdf.id);
    const mastery = attempts.length ? Math.round(attempts.reduce((a: any,q: any)=>a+q.accuracy,0)/attempts.length) : 0;
    return { ...pdf, mastery, attempts:attempts.length };
  }).filter((p: any)=>p.attempts>0);

  // Weak concepts across all attempts
  const conceptErr: any = {};
  quizAttempts.forEach((a: any)=>(a.weakConcepts||[]).forEach((c: any)=>{ conceptErr[c]=(conceptErr[c]||0)+1; }));
  const topWeak = Object.entries(conceptErr).sort((a: any,b: any)=>b[1]-a[1]).slice(0,5);

  // Last 7 attempts for chart
  const chartData = sorted.slice(-7);

  return (
    <div style={{ padding:"32px", flex:1, animation:"fadeIn 0.3s ease" }}>
      <div style={{ marginBottom:28 }}>
        <h2 style={{ fontFamily:"var(--font-h)", fontSize:24, fontWeight:700, color:T.text }}>Performance Analytics</h2>
        <p style={{ color:T.muted, marginTop:4, fontSize:14 }}>Based on {quizAttempts.length} quiz{quizAttempts.length!==1?"zes":""} across {pdfs.length} PDF{pdfs.length!==1?"s":""}.</p>
      </div>

      {/* KPIs */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))", gap:16, marginBottom:24 }}>
        {[
          { l:"Avg Accuracy", v:`${avgAcc}%`, c:avgAcc>=70?T.success:avgAcc>=50?T.warn:T.danger },
          { l:"Total Questions", v:String(totalQ), c:T.indigo },
          { l:"Time Studied", v:`${Math.round(totalTime/60)}m`, c:T.purple },
          { l:"Best Score", v:`${maxAcc}%`, c:T.success },
          { l:"Lowest Score", v:`${minAcc}%`, c:minAcc<50?T.danger:T.warn },
        ].map((s,i)=>(
          <Card key={i} style={{ padding:18, textAlign:"center" }}>
            <p style={{ fontSize:11, color:T.muted, marginBottom:6, fontWeight:500, textTransform:"uppercase", letterSpacing:"0.04em" }}>{s.l}</p>
            <p style={{ fontFamily:"var(--font-h)", fontSize:24, fontWeight:800, color:s.c }}>{s.v}</p>
          </Card>
        ))}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1.4fr 1fr", gap:20, marginBottom:20 }}>
        {/* ACCURACY TREND */}
        <Card>
          <SectionHead title="Accuracy Trend" sub={`Last ${chartData.length} quizzes`}/>
          {chartData.length < 2 ? (
            <p style={{ fontSize:13, color:T.muted }}>Take at least 2 quizzes to see your trend.</p>
          ) : (
            <div style={{ position:"relative", height:140 }}>
              <svg width="100%" height="140" viewBox={`0 0 ${chartData.length*60} 140`} preserveAspectRatio="none">
                <defs>
                  <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={T.purple} stopOpacity="0.15"/>
                    <stop offset="100%" stopColor={T.purple} stopOpacity="0"/>
                  </linearGradient>
                </defs>
                {/* Grid lines */}
                {[0,25,50,75,100].map(v=>(
                  <line key={v} x1="0" y1={140-v*1.4} x2={chartData.length*60} y2={140-v*1.4} stroke={T.border} strokeWidth="1"/>
                ))}
                {/* Area */}
                <path
                  d={`M ${chartData.map((d,i)=>`${i*60+30},${140-d.accuracy*1.4}`).join(" L ")} L ${(chartData.length-1)*60+30},140 L 30,140 Z`}
                  fill="url(#lineGrad)"
                />
                {/* Line */}
                <polyline
                  points={chartData.map((d,i)=>`${i*60+30},${140-d.accuracy*1.4}`).join(" ")}
                  fill="none" stroke={T.purple} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round"
                />
                {/* Dots */}
                {chartData.map((d,i)=>(
                  <circle key={i} cx={i*60+30} cy={140-d.accuracy*1.4} r="4" fill={T.white} stroke={T.purple} strokeWidth="2"/>
                ))}
              </svg>
              <div style={{ display:"flex", justifyContent:"space-between", marginTop:8 }}>
                {chartData.map((d,i)=>(
                  <span key={i} style={{ fontSize:10, color:T.faint, textAlign:"center", flex:1 }}>{new Date(d.date).toLocaleDateString("en",{month:"short",day:"numeric"})}</span>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* WEAK TOPICS */}
        <Card>
          <SectionHead title="Weak Concepts"/>
          {topWeak.length===0 ? (
            <Empty icon="star" title="No weak spots!" sub="All concepts answered correctly so far."/>
          ) : topWeak.map(([concept,count]: any,i)=>(
            <div key={i} style={{ marginBottom:14 }}>
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:13, marginBottom:5 }}>
                <span style={{ color:T.text, fontWeight:500 }}>{concept}</span>
                <span style={{ fontSize:11, color:T.danger, fontWeight:600 }}>{count} mistake{count!==1?"s":""}</span>
              </div>
              <Bar value={Math.max(10,100-count*20)} color={count>3?T.danger:count>1?T.warn:T.success} h={4}/>
            </div>
          ))}
        </Card>
      </div>

      {/* PDF MASTERY */}
      {pdfStats.length>0 && (
        <Card>
          <SectionHead title="PDF Mastery" sub="Average accuracy per document"/>
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            {pdfStats.map((p: any,i: number)=>(
              <Bar key={i} value={p.mastery} color={p.mastery>=70?T.success:p.mastery>=50?T.warn:T.danger} label={`${p.name} (${p.attempts} quiz${p.attempts!==1?"zes":""})`} sub={p.mastery}/>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};
