import React, { useState, useEffect, useRef } from 'react';
import { Card, Btn, Spin, Empty, SectionHead, T } from '../components/UI';
import { IC } from '../components/Icons';
import { chatWithTutor } from '../lib/gemini';

export const TutorPage = ({ pdfs, activePdf }: any) => {
  const [selectedPdf, setSelectedPdf] = useState(activePdf||null);
  const [msgs, setMsgs] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<any>(null);

  useEffect(()=>{ if(activePdf) setSelectedPdf(activePdf); }, [activePdf]);

  useEffect(()=>{
    if (selectedPdf && msgs.length===0) {
      setMsgs([{ role:"assistant", text:`Hi! I'm your Revixa AI Tutor for **${selectedPdf.name}**. I have full context of your study material. Ask me to explain concepts, clarify doubts, or generate extra practice questions on any topic.` }]);
    }
  }, [selectedPdf]);

  const send = async () => {
    const msg = input.trim();
    if (!msg || loading) return;
    setInput("");
    const newMsgs = [...msgs, { role:"user", text:msg }];
    setMsgs(newMsgs);
    setLoading(true);
    try {
      const reply = await chatWithTutor(
        selectedPdf.name,
        selectedPdf.concepts,
        selectedPdf.text?.slice(0,5000) || "",
        newMsgs
      );
      setMsgs(m=>[...m, { role:"assistant", text:reply }]);
    } catch {
      setMsgs(m=>[...m, { role:"assistant", text:"Sorry, I ran into a connection error. Please try again." }]);
    }
    setLoading(false);
  };

  useEffect(()=>{ bottomRef.current?.scrollIntoView({ behavior:"smooth" }); }, [msgs, loading]);

  const renderText = (text: string) => text.split(/\*\*(.*?)\*\*/g).map((p,i)=>
    i%2===1 ? <strong key={i} style={{ color:T.indigo, fontWeight:600 }}>{p}</strong> : <span key={i}>{p}</span>
  );

  const suggestions = ["Explain this concept in simple terms", "What are the key points I should remember?", "Give me a quiz question on this material", "Summarize the most important concepts"];

  if (!selectedPdf || pdfs.length===0) return (
    <div style={{ flex:1, padding:"32px", animation:"fadeIn 0.3s ease" }}>
      <SectionHead title="AI Tutor" sub="Ask anything about your study material"/>
      {pdfs.length===0 ? (
        <Card><Empty icon="bot" title="No PDFs yet" sub="Upload a study PDF first to chat with your AI Tutor."/></Card>
      ) : (
        <div style={{ maxWidth:540, margin:"0 auto" }}>
          <Card>
            <h3 style={{ fontFamily:"var(--font-h)", fontWeight:700, fontSize:16, marginBottom:16 }}>Select a PDF to study</h3>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {pdfs.map((pdf: any)=>(
                <div key={pdf.id} onClick={()=>setSelectedPdf(pdf)}
                  style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 16px", borderRadius:12, border:`1.5px solid ${T.border}`, cursor:"pointer", transition:"all 0.15s" }}
                  onMouseEnter={e=>{ e.currentTarget.style.borderColor=T.purple; e.currentTarget.style.background=`${T.purple}06`; }}
                  onMouseLeave={e=>{ e.currentTarget.style.borderColor=T.border; e.currentTarget.style.background="transparent"; }}>
                  <IC n="pdf" s={16} c={T.purple}/>
                  <div style={{ flex:1 }}>
                    <p style={{ fontSize:13, fontWeight:600, color:T.text }}>{pdf.name}</p>
                    <p style={{ fontSize:11, color:T.faint }}>{pdf.concepts.length} concepts extracted</p>
                  </div>
                  <IC n="bot" s={14} c={T.faint}/>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );

  return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
      {/* HEADER */}
      <div style={{ padding:"16px 32px", borderBottom:`1px solid ${T.border}`, display:"flex", alignItems:"center", justifyContent:"space-between", background:T.white, flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ width:40, height:40, borderRadius:11, background:"var(--grad)", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:T.shBtn, animation:"float 3s ease-in-out infinite" }}>
            <IC n="sparkle" s={18} c="#fff"/>
          </div>
          <div>
            <p style={{ fontFamily:"var(--font-h)", fontWeight:700, fontSize:14, color:T.text }}>Revixa AI Tutor</p>
            <p style={{ fontSize:12, color:T.success, display:"flex", alignItems:"center", gap:5, marginTop:1 }}>
              <span style={{ width:6, height:6, borderRadius:"50%", background:T.success, display:"inline-block" }}/>
              Trained on: {selectedPdf.name}
            </p>
          </div>
        </div>
        <Btn variant="ghost" size="sm" onClick={()=>{ setSelectedPdf(null); setMsgs([]); }}>Change PDF</Btn>
      </div>

      {/* MESSAGES */}
      <div style={{ flex:1, overflowY:"auto", padding:"24px 32px", display:"flex", flexDirection:"column", gap:18 }}>
        {msgs.length===1 && (
          <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
            {suggestions.map((s,i)=>(
              <button key={i} onClick={()=>setInput(s)}
                style={{ padding:"7px 14px", borderRadius:99, border:`1.5px solid ${T.border}`, background:T.white, color:T.muted, cursor:"pointer", fontSize:12, fontWeight:500, transition:"all 0.15s" }}
                onMouseEnter={e=>{ e.currentTarget.style.borderColor=T.purple; e.currentTarget.style.color=T.purple; }}
                onMouseLeave={e=>{ e.currentTarget.style.borderColor=T.border; e.currentTarget.style.color=T.muted; }}>
                {s}
              </button>
            ))}
          </div>
        )}

        {msgs.map((m,i)=>(
          <div key={i} style={{ display:"flex", gap:10, flexDirection:m.role==="user"?"row-reverse":"row", animation:"fadeUp 0.25s ease" }}>
            {m.role==="assistant" && (
              <div style={{ width:30, height:30, borderRadius:9, flexShrink:0, background:"var(--grad)", display:"flex", alignItems:"center", justifyContent:"center", marginTop:2 }}>
                <IC n="sparkle" s={12} c="#fff"/>
              </div>
            )}
            <div style={{ maxWidth:"70%", padding:"12px 16px", borderRadius:m.role==="user"?"16px 4px 16px 16px":"4px 16px 16px 16px", background:m.role==="user"?"var(--grad)":T.white, border:m.role==="assistant"?`1px solid ${T.border}`:"none", boxShadow:T.sh, fontSize:14, lineHeight:1.65, color:m.role==="user"?"#fff":T.text }}>
              {renderText(m.text)}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display:"flex", gap:10 }}>
            <div style={{ width:30, height:30, borderRadius:9, background:"var(--grad)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              <IC n="sparkle" s={12} c="#fff"/>
            </div>
            <div style={{ padding:"14px 18px", borderRadius:"4px 16px 16px 16px", background:T.white, border:`1px solid ${T.border}`, boxShadow:T.sh, display:"flex", gap:5, alignItems:"center" }}>
              {[0,0.2,0.4].map((d,i)=>(
                <div key={i} style={{ width:6, height:6, borderRadius:"50%", background:T.purple, animation:`bounce 1.2s ${d}s infinite` }}/>
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef}/>
      </div>

      {/* INPUT */}
      <div style={{ padding:"16px 32px", borderTop:`1px solid ${T.border}`, background:T.white, flexShrink:0 }}>
        <div style={{ display:"flex", gap:10, alignItems:"flex-end", background:T.bg, border:`1.5px solid ${T.border}`, borderRadius:14, padding:"10px 12px" }}>
          <textarea value={input} onChange={e=>setInput(e.target.value)}
            onKeyDown={e=>{ if(e.key==="Enter"&&!e.shiftKey){ e.preventDefault(); send(); } }}
            placeholder={`Ask about "${selectedPdf.name}"…`} rows={1}
            style={{ flex:1, background:"transparent", border:"none", outline:"none", color:T.text, fontSize:14, resize:"none", lineHeight:1.6, maxHeight:120, overflowY:"auto" }}/>
          <button onClick={send} disabled={!input.trim()||loading}
            style={{ width:34, height:34, borderRadius:9, flexShrink:0, background:input.trim()&&!loading?"var(--grad)":T.subtle, border:"none", cursor:input.trim()&&!loading?"pointer":"default", display:"flex", alignItems:"center", justifyContent:"center", transition:"all 0.18s", boxShadow:input.trim()&&!loading?T.shBtn:"none" }}>
            {loading ? <Spin s={13} c={T.purple}/> : <IC n="send" s={13} c={input.trim()?"#fff":T.faint}/>}
          </button>
        </div>
        <p style={{ fontSize:11, color:T.faint, textAlign:"center", marginTop:8 }}>AI responses are scoped to your uploaded document only.</p>
      </div>
    </div>
  );
};
