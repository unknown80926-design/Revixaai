import React, { useState, useEffect } from 'react';
import { Card, Btn, Badge, Empty, SectionHead, Bar, T } from '../components/UI';
import { IC } from '../components/Icons';
import { generateFlashcards } from '../lib/gemini';
import { store } from '../lib/db';

export const FlashcardPage = ({ user, pdfs, activePdf, showToast }: any) => {
  const [selectedPdf, setSelectedPdf] = useState(activePdf||null);
  const [cards, setCards] = useState<any[]>([]);
  const [generating, setGenerating] = useState(false);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlip] = useState(false);
  const [known, setKnown] = useState<number[]>([]);
  const [learning, setLearning] = useState<number[]>([]);
  const [done, setDone] = useState(false);

  useEffect(()=>{ if(activePdf) setSelectedPdf(activePdf); }, [activePdf]);

  const doGenerateCards = async (pdf: any) => {
    setGenerating(true);
    try {
      const cached = await store.getFlashcards(user.id, pdf.id);
      if (cached?.cards?.length) { 
        setCards(cached.cards); setIdx(0); setFlip(false); setKnown([]); setLearning([]); setDone(false); setGenerating(false); return; 
      }

      const raw = await generateFlashcards(
        pdf.text?.slice(0,7000) || pdf.concepts.join(", ")
      );
      
      const newCards = raw.cards || [];
      
      const deckId = crypto.randomUUID();
      await store.setFlashcards(deckId, {
        userId: user.id,
        pdfId: pdf.id,
        cards: newCards
      });
      
      setCards(newCards); setIdx(0); setFlip(false); setKnown([]); setLearning([]); setDone(false);
    } catch {
      showToast("Failed to generate flashcards. Please try again.", "danger");
    }
    setGenerating(false);
  };

  const next = (know: boolean) => {
    if (know) setKnown(k=>[...k,idx]); else setLearning(l=>[...l,idx]);
    setFlip(false);
    if (idx+1 >= cards.length) { setDone(true); return; }
    setTimeout(()=>setIdx(i=>i+1), 150);
  };

  if (!selectedPdf || pdfs.length===0) return (
    <div style={{ flex:1, padding:"32px", animation:"fadeIn 0.3s ease" }}>
      <SectionHead title="Flashcards" sub="AI-generated flashcards from your study material"/>
      {pdfs.length===0 ? (
        <Card><Empty icon="flash" title="No PDFs yet" sub="Upload a PDF to generate flashcards."/></Card>
      ) : (
        <div style={{ maxWidth:540, margin:"0 auto" }}>
          <Card>
            <h3 style={{ fontFamily:"var(--font-h)", fontWeight:700, fontSize:16, marginBottom:16 }}>Choose a PDF</h3>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {pdfs.map((pdf: any)=>(
                <div key={pdf.id} onClick={()=>{ setSelectedPdf(pdf); doGenerateCards(pdf); }}
                  style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 16px", borderRadius:12, border:`1.5px solid ${T.border}`, cursor:"pointer", transition:"all 0.15s" }}
                  onMouseEnter={e=>{ e.currentTarget.style.borderColor=T.purple; e.currentTarget.style.background=`${T.purple}06`; }}
                  onMouseLeave={e=>{ e.currentTarget.style.borderColor=T.border; e.currentTarget.style.background="transparent"; }}>
                  <IC n="pdf" s={16} c={T.purple}/>
                  <div style={{ flex:1 }}>
                    <p style={{ fontSize:13, fontWeight:600, color:T.text }}>{pdf.name}</p>
                    <p style={{ fontSize:11, color:T.faint }}>{pdf.concepts.length} concepts</p>
                  </div>
                  <IC n="arrow" s={14} c={T.faint}/>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );

  if (generating) return (
    <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ width:60, height:60, borderRadius:18, background:"var(--grad-s)", border:`1px solid rgba(108,99,255,0.15)`, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px", animation:"float 2s ease-in-out infinite" }}>
          <IC n="flash" s={26} c={T.purple}/>
        </div>
        <p style={{ fontFamily:"var(--font-h)", fontWeight:700, fontSize:17, color:T.text }}>Creating flashcards…</p>
        <p style={{ color:T.muted, fontSize:13, marginTop:6 }}>Extracting key concepts from "{selectedPdf?.name}"</p>
      </div>
    </div>
  );

  if (done) return (
    <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", padding:40 }}>
      <Card style={{ maxWidth:420, width:"100%", textAlign:"center", padding:44 }}>
        <div style={{ fontSize:48, marginBottom:12 }}>🎊</div>
        <h2 style={{ fontFamily:"var(--font-h)", fontSize:22, fontWeight:800, color:T.text }}>Deck Complete!</h2>
        <div style={{ display:"flex", gap:20, justifyContent:"center", marginTop:16, marginBottom:24 }}>
          <div style={{ textAlign:"center" }}><p style={{ fontSize:26, fontWeight:800, color:T.success, fontFamily:"var(--font-h)" }}>{known.length}</p><p style={{ fontSize:12, color:T.muted }}>Known</p></div>
          <div style={{ textAlign:"center" }}><p style={{ fontSize:26, fontWeight:800, color:T.warn, fontFamily:"var(--font-h)" }}>{learning.length}</p><p style={{ fontSize:12, color:T.muted }}>Still learning</p></div>
        </div>
        <div style={{ display:"flex", gap:10, justifyContent:"center" }}>
          <Btn variant="primary" icon="refresh" onClick={()=>{ setIdx(0); setFlip(false); setKnown([]); setLearning([]); setDone(false); }}>Review Again</Btn>
          <Btn variant="secondary" onClick={()=>{ setSelectedPdf(null); setCards([]); }}>Change PDF</Btn>
        </div>
      </Card>
    </div>
  );

  const card = cards[idx];
  return (
    <div style={{ flex:1, padding:"32px", animation:"fadeIn 0.3s ease" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:28 }}>
        <div>
          <h2 style={{ fontFamily:"var(--font-h)", fontSize:22, fontWeight:700, color:T.text }}>Flashcards</h2>
          <p style={{ color:T.muted, fontSize:13, marginTop:3 }}>{selectedPdf?.name}</p>
        </div>
        <div style={{ display:"flex", gap:10, alignItems:"center" }}>
          <Badge color={T.success}>✓ {known.length} Known</Badge>
          <Badge color={T.warn}>↺ {learning.length} Learning</Badge>
          <Btn variant="ghost" size="sm" onClick={()=>{ setSelectedPdf(null); setCards([]); }}>Change PDF</Btn>
        </div>
      </div>

      <div style={{ maxWidth:520, margin:"0 auto" }}>
        <div style={{ marginBottom:24 }}>
          <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:T.faint, marginBottom:6 }}>
            <span>Card {idx+1} of {cards.length}</span>
            <span>{Math.round((idx/cards.length)*100)}% through</span>
          </div>
          <Bar value={Math.round((idx/cards.length)*100)} color={T.purple} h={4}/>
        </div>

        {/* FLIP CARD */}
        <div onClick={()=>setFlip(f=>!f)} style={{ cursor:"pointer", perspective:1200, height:300, marginBottom:24 }}>
          <div style={{ width:"100%", height:"100%", position:"relative", transformStyle:"preserve-3d", transition:"transform 0.55s cubic-bezier(0.4,0,0.2,1)", transform:flipped?"rotateY(180deg)":"rotateY(0deg)" }}>
            {/* FRONT */}
            <div style={{ position:"absolute", inset:0, backfaceVisibility:"hidden", background:T.white, borderRadius:20, boxShadow:T.sh, border:`1px solid ${T.border}`, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", textAlign:"center", padding:36 }}>
              <Badge color={T.purple}>Concept</Badge>
              <p style={{ fontFamily:"var(--font-h)", fontSize:18, fontWeight:700, color:T.text, lineHeight:1.45, marginTop:16 }}>{card?.front}</p>
              <p style={{ fontSize:12, color:T.faint, marginTop:20 }}>Click to reveal answer</p>
            </div>
            {/* BACK */}
            <div style={{ position:"absolute", inset:0, backfaceVisibility:"hidden", transform:"rotateY(180deg)", background:"var(--grad)", borderRadius:20, boxShadow:"0 8px 32px rgba(42,46,127,0.25)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", textAlign:"center", padding:36 }}>
              <Badge color="#fff" style={{ background:"rgba(255,255,255,0.2)", border:"1px solid rgba(255,255,255,0.3)" }}>Answer</Badge>
              <p style={{ fontSize:15, color:"#fff", lineHeight:1.7, marginTop:16 }}>{card?.back}</p>
            </div>
          </div>
        </div>

        {flipped ? (
          <div style={{ display:"flex", gap:12, animation:"fadeUp 0.25s ease" }}>
            <Btn variant="danger" style={{ flex:1, justifyContent:"center" }} icon="refresh" onClick={()=>next(false)}>Still Learning</Btn>
            <Btn variant="success" style={{ flex:1, justifyContent:"center" }} icon="check" onClick={()=>next(true)}>Got It!</Btn>
          </div>
        ) : (
          <div style={{ display:"flex", justifyContent:"center", gap:12 }}>
            <Btn variant="secondary" icon="arrowL" onClick={()=>{ setFlip(false); setIdx(i=>(i-1+cards.length)%cards.length); }}>Prev</Btn>
            <Btn variant="secondary" icon="arrow" onClick={()=>{ setFlip(false); setIdx(i=>(i+1)%cards.length); }}>Next</Btn>
          </div>
        )}
      </div>
    </div>
  );
};
