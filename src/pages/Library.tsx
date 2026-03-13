import React, { useState, useRef } from 'react';
import { Card, Btn, Badge, Spin, Bar, Empty, T } from '../components/UI';
import { IC } from '../components/Icons';
import { extractTextFromPDF } from '../lib/pdf';
import { extractMetadata } from '../lib/gemini';
import { store } from '../lib/db';

export const Library = ({ user, pdfs, setPdfs, setPage, setActivePdf, showToast }: any) => {
  const [drag, setDrag] = useState(false);
  const [processing, setProcessing] = useState<any>(null); // { name, step, progress }
  const fileRef = useRef<HTMLInputElement>(null);

  const SUBJECT_COLORS = ["#6C63FF","#10B981","#F59E0B","#EF4444","#0891B2","#7C3AED","#DB2777"];

  const processFile = async (file: File) => {
    if (!file || file.type !== "application/pdf") { showToast("Please upload a PDF file.", "danger"); return; }
    if (file.size > 20*1024*1024) { showToast("PDF must be under 20 MB.", "danger"); return; }

    setProcessing({ name:file.name, step:"Extracting text…", progress:15 });

    try {
      // Step 1: Extract text
      const { text, pages } = await extractTextFromPDF(file);
      if (!text || text.length < 50) { showToast("Could not read text from this PDF. Try a text-based PDF.", "danger"); setProcessing(null); return; }

      setProcessing({ name:file.name, step:"Analyzing concepts with AI…", progress:45 });

      // Step 2: AI extracts metadata + key concepts
      const truncated = text.slice(0, 6000);
      const meta = await extractMetadata(truncated);

      setProcessing({ name:file.name, step:"Saving to your library…", progress:85 });

      const pdf = {
        id: crypto.randomUUID(),
        userId: user.id,
        name: meta.title || file.name.replace(".pdf",""),
        subject: meta.subject || "General",
        pages,
        concepts: meta.concepts || [],
        summary: meta.summary || "",
        text: text.slice(0, 12000), // store first 12k chars for AI context
        uploadedAt: Date.now(),
        color: SUBJECT_COLORS[Math.floor(Math.random()*SUBJECT_COLORS.length)],
        quizIds: [],
        flashcardIds: [],
      };

      await store.setPdf(pdf.id, pdf);

      const newPdfs = [pdf, ...pdfs];
      setPdfs(newPdfs);
      setProcessing(null);
      showToast(`"${pdf.name}" added to your library!`, "success");
    } catch (err) {
      setProcessing(null);
      showToast("Failed to process PDF. Please try again.", "danger");
    }
  };

  const deletePdf = async (pdfId: string) => {
    await store.deletePdf(pdfId);
    setPdfs(pdfs.filter((p: any)=>p.id!==pdfId));
    showToast("PDF deleted.", "info");
  };

  const handleFiles = (files: FileList | null) => { if (files?.[0]) processFile(files[0]); };

  return (
    <div style={{ padding:"32px", flex:1, animation:"fadeIn 0.3s ease" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:32 }}>
        <div>
          <h2 style={{ fontFamily:"var(--font-h)", fontSize:24, fontWeight:700, color:T.text }}>PDF Library</h2>
          <p style={{ color:T.muted, marginTop:4, fontSize:14 }}>{pdfs.length} document{pdfs.length!==1?"s":""} in your library.</p>
        </div>
        <Btn variant="primary" icon="upload" onClick={()=>fileRef.current?.click()}>Upload PDF</Btn>
        <input ref={fileRef} type="file" accept=".pdf" style={{ display:"none" }} onChange={e=>handleFiles(e.target.files)}/>
      </div>

      {/* PROCESSING STATE */}
      {processing && (
        <Card style={{ marginBottom:28, background:"var(--grad-s)", border:`1px solid rgba(108,99,255,0.2)` }}>
          <div style={{ display:"flex", alignItems:"center", gap:16 }}>
            <Spin s={28} c={T.purple}/>
            <div style={{ flex:1 }}>
              <p style={{ fontWeight:600, fontSize:15, color:T.text }}>{processing.name}</p>
              <p style={{ fontSize:13, color:T.muted, marginTop:2 }}>{processing.step}</p>
              <div style={{ marginTop:10 }}><Bar value={processing.progress} color={T.purple} h={4}/></div>
            </div>
          </div>
        </Card>
      )}

      {/* UPLOAD ZONE */}
      <div
        onDragEnter={()=>setDrag(true)} onDragLeave={()=>setDrag(false)}
        onDragOver={e=>e.preventDefault()} onDrop={e=>{ e.preventDefault(); setDrag(false); handleFiles(e.dataTransfer.files); }}
        onClick={()=>fileRef.current?.click()}
        style={{ border:`2px dashed ${drag?T.purple:"#D1D5DB"}`, borderRadius:20, padding:"44px 24px", textAlign:"center", cursor:"pointer", background:drag?`${T.purple}06`:"transparent", marginBottom:28, transition:"all 0.2s" }}>
        <div style={{ width:52, height:52, borderRadius:"50%", background:drag?`${T.purple}14`:T.subtle, border:`1px solid ${drag?`${T.purple}40`:T.border}`, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 14px" }}>
          <IC n="upload" s={22} c={drag?T.purple:T.muted}/>
        </div>
        <p style={{ fontWeight:600, fontSize:15, color:T.text }}>Drop your PDF here</p>
        <p style={{ color:T.muted, fontSize:13, marginTop:4 }}>or click to browse · Max 20 MB · Text-based PDF only</p>
      </div>

      {/* PDF GRID */}
      {pdfs.length === 0 && !processing ? (
        <Empty icon="book" title="Your library is empty" sub="Upload a PDF to generate quizzes, flashcards, and more."/>
      ) : (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))", gap:20 }}>
          {pdfs.map((pdf: any,i: number)=>(
            <Card key={pdf.id} style={{ animationDelay:`${i*0.06}s` }}>
              <div style={{ height:4, background:pdf.color, borderRadius:99, marginBottom:20, marginTop:-24, marginLeft:-24, marginRight:-24, width:"calc(100% + 48px)" }}/>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
                <Badge color={pdf.color}>{pdf.subject}</Badge>
                <button onClick={()=>deletePdf(pdf.id)} style={{ background:"none", border:"none", cursor:"pointer", padding:4, borderRadius:6 }} title="Delete">
                  <IC n="trash" s={14} c={T.faint}/>
                </button>
              </div>
              <h3 style={{ fontFamily:"var(--font-h)", fontWeight:700, fontSize:15, color:T.text, marginBottom:6, lineHeight:1.35 }}>{pdf.name}</h3>
              <p style={{ fontSize:12, color:T.faint, marginBottom:10 }}>Uploaded {new Date(pdf.uploadedAt).toLocaleDateString()}</p>
              {pdf.summary && <p style={{ fontSize:13, color:T.muted, lineHeight:1.6, marginBottom:12 }}>{pdf.summary.slice(0,120)}{pdf.summary.length>120?"…":""}</p>}
              <div style={{ display:"flex", gap:14, fontSize:12, color:T.muted, marginBottom:16 }}>
                <span>{pdf.pages} pages</span><span>·</span><span>{pdf.concepts.length} concepts</span>
              </div>
              {pdf.concepts.length > 0 && (
                <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginBottom:16 }}>
                  {pdf.concepts.slice(0,4).map((c: string,ci: number)=>(
                    <span key={ci} style={{ fontSize:11, padding:"2px 8px", borderRadius:99, background:T.subtle, color:T.muted, border:`1px solid ${T.border}` }}>{c}</span>
                  ))}
                  {pdf.concepts.length>4&&<span style={{ fontSize:11, color:T.faint }}>+{pdf.concepts.length-4} more</span>}
                </div>
              )}
              <div style={{ display:"flex", gap:8, marginTop:4 }}>
                <Btn variant="primary" size="sm" icon="quiz" style={{ flex:1, justifyContent:"center" }} onClick={()=>{ setActivePdf(pdf); setPage("quiz"); }}>Generate Quiz</Btn>
                <Btn variant="secondary" size="sm" icon="flash" style={{ flex:1, justifyContent:"center" }} onClick={()=>{ setActivePdf(pdf); setPage("flashcard"); }}>Flashcards</Btn>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
