import React from 'react';
import { Btn, Badge, Card, T } from '../components/UI';
import { IC } from '../components/Icons';

export const Landing = ({ onGetStarted }: any) => {
  const features = [
    { icon:"target", title:"AI Quiz Engine", desc:"Generates conceptual questions that test true understanding, not surface-level recall.", color:T.purple },
    { icon:"flash",  title:"Smart Flashcards", desc:"Spaced-repetition cards built directly from your document's key concepts and definitions.", color:T.warn },
    { icon:"chart",  title:"Performance Analytics", desc:"Track mastery per topic, surface weak areas, and watch your improvement over time.", color:T.success },
    { icon:"bot",    title:"AI Doubt Tutor", desc:"Ask anything about your uploaded material. Get clear, step-by-step explanations.", color:T.indigo },
    { icon:"brain",  title:"Adaptive Revision", desc:"System detects weak concepts automatically and generates targeted revision sessions.", color:"#E11D48" },
    { icon:"sparkle",title:"Concept Extraction", desc:"Deep AI parsing creates a structured concept map from every page of your PDF.", color:"#0891B2" },
  ];

  return (
    <div style={{ minHeight:"100vh", background:T.bg }}>
      {/* NAV */}
      <nav style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 6%", height:68, background:"rgba(248,249,252,0.85)", backdropFilter:"blur(12px)", borderBottom:`1px solid ${T.border}`, position:"sticky", top:0, zIndex:100 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:36, height:36, borderRadius:10, background:"var(--grad)", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 2px 12px rgba(42,46,127,0.25)" }}>
            <IC n="brain" s={17} c="#fff"/>
          </div>
          <span style={{ fontFamily:"var(--font-h)", fontSize:19, fontWeight:700, color:T.indigo }}>
            Revixa <span style={{ color:T.purple }}>AI</span>
          </span>
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <Btn variant="primary" size="sm" onClick={onGetStarted}>Get Started Free</Btn>
        </div>
      </nav>

      {/* HERO */}
      <div style={{ padding:"96px 6% 80px", maxWidth:1100, margin:"0 auto", textAlign:"center" }}>
        <div className="fu"><Badge color={T.purple}>✦ AI-Powered Learning Platform</Badge></div>
        <h1 className="fu" style={{ fontFamily:"var(--font-h)", fontSize:"clamp(40px,6vw,72px)", fontWeight:800, lineHeight:1.08, letterSpacing:"-0.04em", color:T.text, margin:"22px 0 18px", animationDelay:"0.07s" }}>
          Turn Any PDF Into<br/>
          <span style={{ background:"var(--grad)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>Intelligent Quizzes.</span>
        </h1>
        <p className="fu" style={{ fontSize:"clamp(16px,2vw,18px)", color:T.muted, maxWidth:500, margin:"0 auto 40px", lineHeight:1.75, animationDelay:"0.13s" }}>
          Upload your study material. Revixa AI extracts every concept, generates intelligent quizzes, builds flashcards, and tracks your mastery — in seconds.
        </p>
        <div className="fu" style={{ display:"flex", gap:12, justifyContent:"center", flexWrap:"wrap", animationDelay:"0.18s" }}>
          <Btn variant="primary" size="lg" icon="upload" onClick={onGetStarted}>Upload PDF Free</Btn>
        </div>

        {/* STATS */}
        <div className="fu" style={{ display:"flex", justifyContent:"center", gap:0, marginTop:72, borderTop:`1px solid ${T.border}`, paddingTop:48, flexWrap:"wrap", animationDelay:"0.22s" }}>
          {[["PDF→Quiz","In 30 seconds"],["6 AI Tools","In one platform"],["100%","Concept-based"],["Free","To get started"]].map(([v,l],i,arr)=>(
            <div key={i} style={{ padding:"0 36px", borderRight:i<arr.length-1?`1px solid ${T.border}`:"none", textAlign:"center", minWidth:130 }}>
              <div style={{ fontFamily:"var(--font-h)", fontSize:26, fontWeight:800, color:T.indigo }}>{v}</div>
              <div style={{ fontSize:13, color:T.muted, marginTop:3 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* FEATURES */}
      <div style={{ padding:"0 6% 80px", maxWidth:1100, margin:"0 auto" }}>
        <div style={{ textAlign:"center", marginBottom:48 }}>
          <h2 style={{ fontFamily:"var(--font-h)", fontSize:34, fontWeight:700, color:T.text, letterSpacing:"-0.03em" }}>Six systems. One goal.</h2>
          <p style={{ color:T.muted, marginTop:10, fontSize:15 }}>Everything you need to turn passive reading into active mastery.</p>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(300px, 1fr))", gap:20 }}>
          {features.map((f,i)=>(
            <Card key={i} style={{ animationDelay:`${i*0.06}s` }}>
              <div style={{ width:44, height:44, borderRadius:12, background:`${f.color}12`, border:`1px solid ${f.color}20`, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:16 }}>
                <IC n={f.icon} s={20} c={f.color}/>
              </div>
              <h3 style={{ fontFamily:"var(--font-h)", fontWeight:700, fontSize:16, color:T.text, marginBottom:8 }}>{f.title}</h3>
              <p style={{ fontSize:14, color:T.muted, lineHeight:1.65 }}>{f.desc}</p>
            </Card>
          ))}
        </div>
      </div>

      {/* CTA BAND */}
      <div style={{ padding:"0 6% 96px", maxWidth:1100, margin:"0 auto" }}>
        <div style={{ background:"var(--grad)", borderRadius:24, padding:"56px 64px", display:"flex", alignItems:"center", justifyContent:"space-between", gap:32, flexWrap:"wrap", boxShadow:"0 8px 40px rgba(42,46,127,0.25)" }}>
          <div>
            <h2 style={{ fontFamily:"var(--font-h)", fontSize:30, fontWeight:800, color:"#fff", letterSpacing:"-0.02em" }}>Ready to study smarter?</h2>
            <p style={{ color:"rgba(255,255,255,0.7)", marginTop:8, fontSize:15 }}>Free to start. No credit card required.</p>
          </div>
          <Btn variant="yellow" size="lg" icon="arrow" onClick={onGetStarted}>Open Revixa AI</Btn>
        </div>
      </div>
    </div>
  );
};
