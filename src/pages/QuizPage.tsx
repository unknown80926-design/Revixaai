import React, { useState, useEffect, useRef } from 'react';
import { Card, Btn, Badge, Spin, Bar, Empty, SectionHead, T } from '../components/UI';
import { IC } from '../components/Icons';
import { generateQuiz } from '../lib/gemini';
import { store } from '../lib/db';

const EXAM_PROFILES: any = {
  "IIT-JEE": {
    label: "IIT-JEE",
    badge: "🎯",
    color: "#7C3AED",
    desc: "JEE Main / Advanced pattern",
    systemPrompt: `You are an IIT-JEE expert question setter replicating the exact JEE Advanced / JEE Main examination standard.

EXAM PATTERN RULES — follow strictly:
- Questions must be of university-entrance difficulty: multi-step reasoning, application-based, NOT textbook definitions
- MCQ: Single correct, 4 options. Distractors must be plausible via common calculation errors or misconceptions
- Integer: Answer is a non-negative integer (0–9 range preferred, occasionally up to 99). No options provided. Student must derive the exact numerical answer
- Mixed: Distribute roughly 60% MCQ and 40% Integer
- Avoid straightforward recall. Every question must require 2–3 logical/mathematical steps
- Include numerical data, formulas, or scenario-based setups where appropriate
- Difficulty: Advanced (equivalent to JEE Advanced Paper 1/2)`
  },
  "NEET UG": {
    label: "NEET UG",
    badge: "🩺",
    color: "#059669",
    desc: "NMC NEET UG pattern",
    systemPrompt: `You are a NEET UG expert question setter replicating the exact NMC NEET UG examination standard.

EXAM PATTERN RULES — follow strictly:
- Questions test Biology (Botany + Zoology), Physics, and Chemistry at Class 11–12 NCERT level
- MCQ only: 4 options, single correct answer
- Difficulty: Moderate to high — questions must go beyond direct NCERT lines, testing application
- Include NCERT diagram-based reasoning, assertion-reason logic, and clinical/applied scenarios
- Distractors should represent common student misconceptions
- Language must be precise and clinical — no ambiguous phrasing
- Avoid trivial fact-recall. Prefer concept application and inter-topic linkage`
  },
  "UPSC PRE": {
    label: "UPSC PRE",
    badge: "🏛️",
    color: "#B45309",
    desc: "UPSC Civil Services Prelims pattern",
    systemPrompt: `You are a UPSC Civil Services Preliminary examination expert question setter.

EXAM PATTERN RULES — follow strictly:
- MCQ only: 4 options, single correct answer
- Questions test analytical ability, current affairs linkage, and conceptual understanding — NOT rote learning
- Include statement-based questions (e.g., "Which of the following statements is/are correct?") — this is the dominant UPSC format
- Questions may involve 2–4 statements about a concept; student must identify correct/incorrect ones
- Difficulty: Moderate (Prelims standard) with some tricky eliminations
- Frame questions that require connecting the material to real-world governance, policy, or GS context where relevant
- Language must be formal and government-examination style`
  },
  "Board Exam": {
    label: "Board Exam",
    badge: "📋",
    color: "#0891B2",
    desc: "CBSE / State Board pattern",
    systemPrompt: `You are a CBSE / State Board examination expert question setter.

EXAM PATTERN RULES — follow strictly:
- Questions follow Class 10–12 CBSE Board examination standard
- MCQ: 4 options, single correct answer, based on NCERT concepts and definitions
- Integer / Short Answer: Student writes a specific number or one-word answer
- Difficulty: Easy to moderate — questions should be solvable by a well-prepared Class 12 student
- Focus on definition-based, diagram interpretation, formula application, and direct concept questions
- Avoid overly complex multi-step problems — Board exams reward structured understanding
- Language must be clear, age-appropriate, and aligned with NCERT terminology`
  },
};

export const QuizPage = ({ user, pdfs, activePdf, setActivePdf, addAttempt, showToast }: any) => {
  const [phase, setPhase] = useState("setup");
  const [selectedPdf, setSelectedPdf] = useState(activePdf || null);
  const [settings, setSettings] = useState({
    count: "10",
    difficulty: "Medium",
    qType: "MCQ",       // MCQ | Integer | Mixed
    exam: "Board Exam", // IIT-JEE | NEET UG | UPSC PRE | Board Exam
  });
  const [countError, setCountError] = useState("");
  const [questions, setQuestions] = useState<any[]>([]);
  const [qi, setQi] = useState(0);
  const [sel, setSel] = useState<number | null>(null);         // MCQ: index (number) | Integer: typed string
  const [intInput, setIntInput] = useState(""); // integer question typed answer
  const [revealed, setRevealed] = useState(false);
  const [answers, setAnswers] = useState<any[]>([]);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [qTime, setQTime] = useState(0);
  const timerRef = useRef<any>(null);

  useEffect(()=>{ if(activePdf) setSelectedPdf(activePdf); }, [activePdf]);

  useEffect(()=>{
    if(phase==="quiz"){
      timerRef.current = setInterval(()=>setQTime(t=>t+1), 1000);
    } else { clearInterval(timerRef.current); setQTime(0); }
    return ()=>clearInterval(timerRef.current);
  }, [phase, qi]);

  /* ── Validate question count ── */
  const validateCount = (val: string) => {
    const n = parseInt(val, 10);
    if (!val.trim() || isNaN(n)) return "Please enter a number.";
    if (n < 1) return "Minimum 1 question.";
    if (n > 40) return "Maximum 40 questions per session.";
    return "";
  };

  /* ── Build exam-aware system prompt ── */
  const buildSystemPrompt = () => {
    const examProfile = EXAM_PROFILES[settings.exam];
    const n = parseInt(settings.count, 10);

    // Determine actual type distribution
    let mcqCount = n, intCount = 0;
    if (settings.qType === "Integer") { mcqCount = 0; intCount = n; }
    else if (settings.qType === "Mixed") {
      mcqCount = Math.ceil(n * 0.6);
      intCount = n - mcqCount;
    }

    const typeInstructions = settings.qType === "MCQ"
      ? `ALL ${n} questions must be MCQ (4 options, single correct).`
      : settings.qType === "Integer"
      ? `ALL ${n} questions must be Integer type (no options — student writes the exact numeric answer).`
      : `Generate ${mcqCount} MCQ questions followed by ${intCount} Integer-type questions. Total = ${n}.`;

    return `${examProfile.systemPrompt}

QUESTION TYPE INSTRUCTIONS:
${typeInstructions}

DIFFICULTY OVERRIDE: ${settings.difficulty}

Generate EXACTLY ${n} questions total.`;
  };

  /* ── Generate quiz ── */
  const doGenerateQuiz = async () => {
    const err = validateCount(settings.count);
    if (err) { setCountError(err); return; }
    if (!selectedPdf) return;
    setPhase("generating");
    try {
      const systemPrompt = buildSystemPrompt();
      const raw = await generateQuiz(
        systemPrompt,
        selectedPdf.text?.slice(0, 9000) || selectedPdf.concepts.join(", ")
      );

      if (!Array.isArray(raw.questions) || raw.questions.length === 0)
        throw new Error("Empty questions array");

      // Normalise each question defensively
      const normalised = raw.questions.map((q: any, idx: number) => ({
        type:        q.type === "integer" ? "integer" : "mcq",
        q:           q.q || `Question ${idx + 1}`,
        opts:        Array.isArray(q.opts) ? q.opts : [],
        ans:         typeof q.ans === "number" ? q.ans : 0,
        intAns:      q.intAns != null ? String(q.intAns).trim() : null,
        explanation: q.explanation || "No explanation provided.",
        concept:     q.concept || "General",
      }));

      setQuestions(normalised);
      setQi(0); setSel(null); setIntInput(""); setRevealed(false); setAnswers([]);
      setStartTime(Date.now());
      setPhase("quiz");
    } catch (e) {
      console.error("Quiz generation error:", e);
      showToast("AI could not generate the quiz. Please try again — ensure your PDF has enough readable text.", "danger");
      setPhase("setup");
    }
  };

  /* ── Answer checking ── */
  const currentQ = questions[qi] || {};
  const isIntegerQ = currentQ.type === "integer";

  const canCheck = isIntegerQ ? intInput.trim() !== "" : sel !== null;

  const check = () => {
    if (!canCheck) return;
    setRevealed(true);
  };

  const isCurrentCorrect = () => {
    if (!revealed) return false;
    if (isIntegerQ) return intInput.trim() === (currentQ.intAns || "").trim();
    return sel === currentQ.ans;
  };

  const nextQ = async () => {
    const correct = isCurrentCorrect();
    const newAnswers = [
      ...answers,
      { isCorrect: correct, selected: isIntegerQ ? intInput : sel, concept: currentQ.concept, timeTaken: qTime },
    ];
    setAnswers(newAnswers);

    if (qi + 1 >= questions.length) {
      const totalCorrect = newAnswers.filter(a => a.isCorrect).length;
      const accuracy = Math.round((totalCorrect / questions.length) * 100);
      const timeTaken = Math.round((Date.now() - (startTime || Date.now())) / 1000);
      const weakConcepts = newAnswers.filter(a => !a.isCorrect).map(a => a.concept).filter(Boolean);
      const attempt = {
        id: crypto.randomUUID(), userId: user.id, pdfId: selectedPdf.id,
        pdfName: selectedPdf.name, score: totalCorrect, totalQ: questions.length,
        accuracy, timeTaken, weakConcepts, exam: settings.exam, date: Date.now(),
      };
      addAttempt(attempt);
      await store.setAttempt(attempt.id, attempt);
      setPhase("result");
    } else {
      setQi(q => q + 1); setSel(null); setIntInput(""); setRevealed(false);
    }
  };

  const totalCorrect = answers.filter(a => a.isCorrect).length;
  const totalTime = startTime ? Math.round((Date.now() - startTime) / 1000) : 0;
  const mins = String(Math.floor(qTime / 60)).padStart(2, "0");
  const secs = String(qTime % 60).padStart(2, "0");

  /* ─────────────────────────────────────────────────────
     SETUP PHASE
  ───────────────────────────────────────────────────── */
  if (phase === "setup") {
    return (
      <div style={{ flex:1, padding:"32px", animation:"fadeIn 0.3s ease" }}>
        <SectionHead title="Quiz Mode" sub="Configure your quiz and let AI generate exam-pattern questions"/>
        {pdfs.length === 0 ? (
          <Card><Empty icon="book" title="No PDFs in your library" sub="Upload a study PDF first to generate quizzes." action={<Btn variant="primary" icon="upload">Upload PDF</Btn>}/></Card>
        ) : (
          <div style={{ maxWidth:620, margin:"0 auto" }}>
            <Card>
              <h3 style={{ fontFamily:"var(--font-h)", fontWeight:700, fontSize:16, marginBottom:20 }}>Quiz Settings</h3>

              {/* ① PDF SELECTOR */}
              <div style={{ marginBottom:24 }}>
                <label style={{ display:"block", fontSize:13, fontWeight:600, color:T.text, marginBottom:8 }}>① Select Study Material</label>
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {pdfs.map((pdf: any) => (
                    <div key={pdf.id} onClick={()=>setSelectedPdf(pdf)}
                      style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 16px", borderRadius:12, border:`1.5px solid ${selectedPdf?.id===pdf.id?T.purple:T.border}`, background:selectedPdf?.id===pdf.id?`${T.purple}08`:T.white, cursor:"pointer", transition:"all 0.15s" }}>
                      <div style={{ width:10, height:10, borderRadius:"50%", border:`2px solid ${selectedPdf?.id===pdf.id?T.purple:T.border}`, background:selectedPdf?.id===pdf.id?T.purple:"transparent", flexShrink:0, transition:"all 0.15s" }}/>
                      <div style={{ flex:1 }}>
                        <p style={{ fontSize:13, fontWeight:600, color:T.text }}>{pdf.name}</p>
                        <p style={{ fontSize:11, color:T.faint }}>{pdf.pages} pages · {pdf.concepts.length} concepts</p>
                      </div>
                      <Badge color={pdf.color}>{pdf.subject}</Badge>
                    </div>
                  ))}
                </div>
              </div>

              {/* ② NUMBER + DIFFICULTY */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:24 }}>
                <div>
                  <label style={{ display:"block", fontSize:13, fontWeight:600, color:T.text, marginBottom:8 }}>② Number of Questions</label>
                  <input
                    type="number" min="1" max="40"
                    value={settings.count}
                    onChange={e => { setSettings(s=>({...s,count:e.target.value})); setCountError(validateCount(e.target.value)); }}
                    placeholder="e.g. 10"
                    style={{ width:"100%", padding:"10px 12px", borderRadius:12, border:`1.5px solid ${countError?T.danger:T.border}`, background:T.white, color:T.text, fontSize:14, outline:"none", transition:"border-color 0.18s" }}
                  />
                  {countError && <p style={{ fontSize:11, color:T.danger, marginTop:4 }}>{countError}</p>}
                  {!countError && <p style={{ fontSize:11, color:T.faint, marginTop:4 }}>Between 1 and 40</p>}
                </div>
                <div>
                  <label style={{ display:"block", fontSize:13, fontWeight:600, color:T.text, marginBottom:8 }}>Difficulty Level</label>
                  <select value={settings.difficulty} onChange={e=>setSettings(s=>({...s,difficulty:e.target.value}))}
                    style={{ width:"100%", padding:"10px 12px", borderRadius:12, border:`1.5px solid ${T.border}`, background:T.white, color:T.text, fontSize:13, outline:"none" }}>
                    {["Easy","Medium","Hard","Mixed"].map(d=><option key={d}>{d}</option>)}
                  </select>
                </div>
              </div>

              {/* ③ QUESTION TYPE */}
              <div style={{ marginBottom:24 }}>
                <label style={{ display:"block", fontSize:13, fontWeight:600, color:T.text, marginBottom:8 }}>③ Question Type</label>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10 }}>
                  {[
                    { value:"MCQ",     label:"MCQ",     sub:"4-option multiple choice", icon:"quiz" },
                    { value:"Integer", label:"Integer", sub:"Type the exact numeric answer", icon:"target" },
                    { value:"Mixed",   label:"Mixed",   sub:"60% MCQ + 40% Integer", icon:"sparkle" },
                  ].map(opt => (
                    <div key={opt.value} onClick={()=>setSettings(s=>({...s,qType:opt.value}))}
                      style={{ padding:"14px 12px", borderRadius:12, border:`1.5px solid ${settings.qType===opt.value?T.purple:T.border}`, background:settings.qType===opt.value?`${T.purple}08`:T.white, cursor:"pointer", textAlign:"center", transition:"all 0.15s" }}
                      onMouseEnter={e=>{ if(settings.qType!==opt.value) e.currentTarget.style.borderColor=T.purple; }}
                      onMouseLeave={e=>{ if(settings.qType!==opt.value) e.currentTarget.style.borderColor=T.border; }}>
                      <div style={{ width:32, height:32, borderRadius:9, background:settings.qType===opt.value?`${T.purple}14`:T.subtle, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 8px" }}>
                        <IC n={opt.icon} s={15} c={settings.qType===opt.value?T.purple:T.muted}/>
                      </div>
                      <p style={{ fontSize:13, fontWeight:700, color:settings.qType===opt.value?T.purple:T.text }}>{opt.label}</p>
                      <p style={{ fontSize:11, color:T.faint, marginTop:3, lineHeight:1.4 }}>{opt.sub}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* ④ EXAM TARGET */}
              <div style={{ marginBottom:28 }}>
                <label style={{ display:"block", fontSize:13, fontWeight:600, color:T.text, marginBottom:8 }}>④ Target Exam</label>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:10 }}>
                  {Object.entries(EXAM_PROFILES).map(([key, profile]: any) => {
                    const active = settings.exam === key;
                    return (
                      <div key={key} onClick={()=>setSettings(s=>({...s,exam:key}))}
                        style={{ padding:"14px 16px", borderRadius:12, border:`1.5px solid ${active?profile.color:T.border}`, background:active?`${profile.color}0D`:T.white, cursor:"pointer", transition:"all 0.15s", display:"flex", alignItems:"center", gap:12 }}
                        onMouseEnter={e=>{ if(!active) e.currentTarget.style.borderColor=profile.color; }}
                        onMouseLeave={e=>{ if(!active) e.currentTarget.style.borderColor=T.border; }}>
                        <div style={{ width:36, height:36, borderRadius:10, background:active?`${profile.color}18`:T.subtle, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontSize:18 }}>
                          {profile.badge}
                        </div>
                        <div style={{ flex:1 }}>
                          <p style={{ fontSize:13, fontWeight:700, color:active?profile.color:T.text }}>{profile.label}</p>
                          <p style={{ fontSize:11, color:T.faint, marginTop:2 }}>{profile.desc}</p>
                        </div>
                        <div style={{ width:10, height:10, borderRadius:"50%", border:`2px solid ${active?profile.color:T.border}`, background:active?profile.color:"transparent", flexShrink:0 }}/>
                      </div>
                    );
                  })}
                </div>
                {/* Exam hint */}
                <div style={{ marginTop:12, padding:"10px 14px", borderRadius:10, background:T.subtle, border:`1px solid ${T.border}` }}>
                  <p style={{ fontSize:12, color:T.muted, lineHeight:1.5 }}>
                    <strong style={{ color:T.text }}>{EXAM_PROFILES[settings.exam].badge} {settings.exam}:</strong>{" "}
                    {settings.exam === "IIT-JEE" && "Multi-step reasoning, JEE Advanced difficulty. Integer questions require exact numeric derivation."}
                    {settings.exam === "NEET UG" && "NCERT-level Biology/Physics/Chemistry with clinical application. Single correct MCQ format."}
                    {settings.exam === "UPSC PRE" && "Statement-based analytical MCQs. Tests conceptual clarity and current affairs application."}
                    {settings.exam === "Board Exam" && "CBSE/State Board standard. Clear, structured questions based on NCERT definitions and formulas."}
                  </p>
                </div>
              </div>

              <Btn variant="primary" full icon="sparkle" onClick={doGenerateQuiz} disabled={!selectedPdf || !!countError}>
                Generate {settings.exam} Quiz with AI
              </Btn>
              {!selectedPdf && <p style={{ fontSize:12, color:T.warn, textAlign:"center", marginTop:8 }}>Select a PDF above to continue.</p>}
            </Card>
          </div>
        )}
      </div>
    );
  }

  /* ─────────────────────────────────────────────────────
     GENERATING PHASE
  ───────────────────────────────────────────────────── */
  if (phase === "generating") return (
    <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ width:64, height:64, borderRadius:20, background:"var(--grad-s)", border:`1px solid rgba(108,99,255,0.15)`, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 20px", animation:"float 2s ease-in-out infinite" }}>
          <IC n="sparkle" s={28} c={T.purple}/>
        </div>
        <h3 style={{ fontFamily:"var(--font-h)", fontWeight:700, fontSize:19, color:T.text }}>Generating your quiz…</h3>
        <p style={{ color:T.muted, marginTop:8, fontSize:14 }}>
          Creating {settings.exam} pattern questions from "{selectedPdf?.name}"
        </p>
        <p style={{ color:T.faint, marginTop:4, fontSize:13 }}>
          {settings.count} × {settings.qType} · {settings.difficulty} difficulty
        </p>
        <div style={{ marginTop:24, width:240, margin:"24px auto 0" }}><Bar value={70} color={T.purple}/></div>
      </div>
    </div>
  );

  /* ─────────────────────────────────────────────────────
     RESULT PHASE
  ───────────────────────────────────────────────────── */
  if (phase === "result") {
    const pct = Math.round(totalCorrect / questions.length * 100);
    const weakC = answers.filter(a => !a.isCorrect).map(a => a.concept).filter(Boolean);
    const examProfile = EXAM_PROFILES[settings.exam];
    return (
      <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", padding:40 }}>
        <div style={{ maxWidth:520, width:"100%" }}>
          <Card style={{ textAlign:"center", padding:48 }}>
            <div style={{ fontSize:48, marginBottom:8 }}>{examProfile.badge}</div>
            <p style={{ fontSize:12, color:T.muted, marginBottom:12 }}>{examProfile.label} Simulation</p>
            <div style={{ fontSize:52, marginBottom:12 }}>{pct>=80?"🎉":pct>=60?"💪":"📚"}</div>
            <h2 style={{ fontFamily:"var(--font-h)", fontSize:26, fontWeight:800 }}>Quiz Complete!</h2>
            <div style={{ fontSize:56, fontWeight:800, fontFamily:"var(--font-h)", margin:"14px 0", color:pct>=80?T.success:pct>=60?T.warn:T.danger }}>{pct}%</div>
            <div style={{ display:"flex", gap:20, justifyContent:"center", fontSize:13, color:T.muted, marginBottom:20 }}>
              <span>{totalCorrect}/{questions.length} correct</span><span>·</span>
              <span>{Math.floor(totalTime/60)}m {totalTime%60}s</span>
              <span>·</span><span>{settings.qType}</span>
            </div>
            <div style={{ marginBottom:20 }}><Bar value={pct} color={pct>=80?T.success:pct>=60?T.warn:T.danger}/></div>
            {weakC.length>0 && (
              <div style={{ background:"rgba(239,68,68,0.05)", border:`1px solid rgba(239,68,68,0.15)`, borderRadius:12, padding:"12px 16px", marginBottom:20, textAlign:"left" }}>
                <p style={{ fontSize:13, fontWeight:600, color:T.danger, marginBottom:4 }}>Weak Areas Detected</p>
                <p style={{ fontSize:13, color:T.muted }}>{[...new Set(weakC)].slice(0,4).join(" · ")}</p>
              </div>
            )}
            <div style={{ display:"flex", gap:10, justifyContent:"center" }}>
              <Btn variant="primary" icon="refresh" onClick={()=>{ setPhase("setup"); setQuestions([]); setAnswers([]); }}>New Quiz</Btn>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  /* ─────────────────────────────────────────────────────
     QUIZ PHASE
  ───────────────────────────────────────────────────── */
  const q = currentQ;
  const correct_now = isCurrentCorrect();
  const examProfile = EXAM_PROFILES[settings.exam];

  return (
    <div style={{ flex:1, padding:"32px", animation:"fadeIn 0.3s ease" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
        <div>
          <p style={{ fontSize:12, color:T.muted }}>{selectedPdf?.name} · {examProfile.badge} {examProfile.label}</p>
          <h2 style={{ fontFamily:"var(--font-h)", fontSize:18, fontWeight:700, color:T.text }}>Question {qi+1} of {questions.length}</h2>
        </div>
        <div style={{ display:"flex", gap:10, alignItems:"center" }}>
          <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:13, color:T.muted, fontWeight:500 }}>
            <IC n="clock" s={13} c={T.faint}/>{mins}:{secs}
          </div>
          <Badge color={q.type==="integer"?T.warn:T.purple}>{q.type==="integer"?"Integer":"MCQ"}</Badge>
          {q.concept && <Badge color={examProfile.color}>{q.concept}</Badge>}
        </div>
      </div>

      {/* PROGRESS TRACK */}
      <div style={{ display:"flex", gap:5, marginBottom:28 }}>
        {questions.map((_,i)=>(
          <div key={i} style={{ flex:1, height:5, borderRadius:99, background:i<answers.length?(answers[i].isCorrect?T.success:T.danger):i===qi?examProfile.color:T.subtle, transition:"background 0.3s" }}/>
        ))}
      </div>

      <div style={{ maxWidth:660, margin:"0 auto" }}>
        <Card style={{ padding:32, marginBottom:16 }}>
          {/* Question type chip */}
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:16 }}>
            <span style={{ fontSize:11, fontWeight:600, padding:"3px 10px", borderRadius:99, background:`${examProfile.color}12`, color:examProfile.color, border:`1px solid ${examProfile.color}22` }}>
              {examProfile.badge} {examProfile.label} Pattern
            </span>
            <span style={{ fontSize:11, fontWeight:600, padding:"3px 10px", borderRadius:99, background:q.type==="integer"?`${T.warn}12`:`${T.purple}12`, color:q.type==="integer"?T.warn:T.purple, border:`1px solid ${q.type==="integer"?T.warn:T.purple}22` }}>
              {q.type==="integer"?"🔢 Integer Type":"☑ Multiple Choice"}
            </span>
          </div>

          <p style={{ fontSize:18, fontWeight:500, color:T.text, lineHeight:1.65, marginBottom:28 }}>{q.q}</p>

          {/* ── MCQ OPTIONS ── */}
          {q.type !== "integer" && (
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              {(q.opts || []).map((opt: string, i: number) => {
                let bg = T.white, border = T.border, color = T.text;
                if (!revealed) {
                  if (sel === i) { bg = `${T.purple}10`; border = T.purple; color = T.indigo; }
                } else {
                  if (i === q.ans) { bg = `${T.success}10`; border = T.success; color = T.success; }
                  else if (i === sel && i !== q.ans) { bg = `${T.danger}08`; border = T.danger; color = T.danger; }
                }
                return (
                  <button key={i} onClick={() => !revealed && setSel(i)}
                    style={{ display:"flex", alignItems:"center", gap:14, padding:"13px 18px", borderRadius:12, border:`1.5px solid ${border}`, background:bg, color, textAlign:"left", cursor:revealed?"default":"pointer", fontSize:14, fontWeight:500, transition:"all 0.18s" }}>
                    <span style={{ width:28, height:28, borderRadius:"50%", flexShrink:0, border:`1.5px solid ${border}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, background:revealed&&i===q.ans?T.success:revealed&&i===sel&&i!==q.ans?T.danger:"transparent", color:revealed&&(i===q.ans||i===sel)?"#fff":color }}>
                      {revealed&&i===q.ans?<IC n="check" s={12} c="#fff"/>:revealed&&i===sel&&i!==q.ans?<IC n="x" s={12} c="#fff"/>:String.fromCharCode(65+i)}
                    </span>
                    {opt}
                  </button>
                );
              })}
            </div>
          )}

          {/* ── INTEGER INPUT ── */}
          {q.type === "integer" && (
            <div>
              <p style={{ fontSize:13, color:T.muted, marginBottom:12, padding:"10px 14px", background:`${T.warn}08`, borderRadius:10, border:`1px solid ${T.warn}22` }}>
                🔢 <strong style={{ color:T.text }}>Integer Type Question</strong> — Calculate your answer and type the exact numeric value below. No options are provided.
              </p>
              <div style={{ display:"flex", gap:12, alignItems:"center" }}>
                <input
                  type="number"
                  value={intInput}
                  onChange={e => !revealed && setIntInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && canCheck && !revealed && check()}
                  placeholder="Type your answer here…"
                  disabled={revealed}
                  style={{
                    flex:1, padding:"14px 18px", borderRadius:12, fontSize:18, fontWeight:700,
                    border:`1.5px solid ${revealed ? (correct_now ? T.success : T.danger) : intInput ? T.purple : T.border}`,
                    background: revealed ? (correct_now ? `${T.success}08` : `${T.danger}06`) : T.white,
                    color: revealed ? (correct_now ? T.success : T.danger) : T.text,
                    outline:"none", transition:"all 0.18s", textAlign:"center",
                  }}
                />
                {revealed && (
                  <div style={{ fontSize:28 }}>{correct_now ? "✅" : "❌"}</div>
                )}
              </div>
              {revealed && !correct_now && (
                <div style={{ marginTop:10, padding:"10px 14px", borderRadius:10, background:`${T.success}08`, border:`1px solid ${T.success}22` }}>
                  <p style={{ fontSize:13, color:T.success, fontWeight:600 }}>Correct answer: <strong>{q.intAns}</strong></p>
                </div>
              )}
            </div>
          )}
        </Card>

        {/* EXPLANATION */}
        {revealed && (
          <Card style={{ padding:20, marginBottom:16, animation:"fadeUp 0.28s ease", background:correct_now?`${T.success}06`:`${T.danger}06`, border:`1px solid ${correct_now?`${T.success}25`:`${T.danger}25`}` }}>
            <p style={{ fontSize:13, fontWeight:700, color:correct_now?T.success:T.danger, marginBottom:6 }}>
              {correct_now ? "✓ Correct!" : "✗ Incorrect"}
            </p>
            <p style={{ fontSize:13, color:T.muted, lineHeight:1.65 }}>{q.explanation}</p>
          </Card>
        )}

        <div style={{ display:"flex", justifyContent:"flex-end", gap:10 }}>
          {!revealed
            ? <Btn variant="primary" icon="check" onClick={check} disabled={!canCheck}>Check Answer</Btn>
            : <Btn variant="primary" icon="arrow" onClick={nextQ}>{qi+1<questions.length?"Next Question":"Finish Quiz"}</Btn>
          }
        </div>
      </div>
    </div>
  );
};
