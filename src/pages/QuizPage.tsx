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
- PICTURE-BASED QUESTIONS: If the document contains important diagrams, charts, or pictures, create questions based on them by explicitly referencing their title, figure number, or page number so the student can refer to the document. Do not confuse the student; ask only relevant things important for the exam.
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
- PICTURE-BASED QUESTIONS: If the document contains important diagrams, charts, or pictures, create questions based on them by explicitly referencing their title, figure number, or page number so the student can refer to the document. Do not confuse the student; ask only relevant things important for the exam.
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
- PICTURE-BASED QUESTIONS: If the document contains important diagrams, charts, or pictures, create questions based on them by explicitly referencing their title, figure number, or page number so the student can refer to the document. Do not confuse the student; ask only relevant things important for the exam.
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
- PICTURE-BASED QUESTIONS: If the document contains important diagrams, charts, or pictures, create questions based on them by explicitly referencing their title, figure number, or page number so the student can refer to the document. Do not confuse the student; ask only relevant things important for the exam.
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
  
  // CBT State
  const [qStates, setQStates] = useState<any[]>([]); 
  const [preGenCountdown, setPreGenCountdown] = useState<number | null>(null);
  const [examTimer, setExamTimer] = useState(0); 
  const [startTime, setStartTime] = useState<number | null>(null);
  
  const timerRef = useRef<any>(null);
  const examTimerRef = useRef<any>(null);

  useEffect(()=>{ if(activePdf) setSelectedPdf(activePdf); }, [activePdf]);

  useEffect(()=>{
    if(phase==="quiz"){
      examTimerRef.current = setInterval(() => {
        setExamTimer(t => {
          if (t <= 1) {
            clearInterval(examTimerRef.current);
            submitExam(true);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    } else { 
      clearInterval(examTimerRef.current); 
    }
    return ()=>clearInterval(examTimerRef.current);
  }, [phase]);

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
    
    setPhase("countdown");
    setPreGenCountdown(3);
    
    let counter = 3;
    timerRef.current = setInterval(() => {
      counter--;
      setPreGenCountdown(counter);
      if (counter <= 0) {
        clearInterval(timerRef.current);
        startGeneration();
      }
    }, 1000);
  };

  const startGeneration = async () => {
    setPhase("generating");
    try {
      const systemPrompt = buildSystemPrompt();
      const fileContent = selectedPdf.fileUri 
        ? { fileUri: selectedPdf.fileUri, mimeType: selectedPdf.mimeType, name: selectedPdf.name }
        : (selectedPdf.text?.slice(0, 9000) || selectedPdf.concepts.join(", "));

      const raw = await generateQuiz(
        systemPrompt,
        fileContent
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
      
      // Initialize CBT State
      const initialStates = normalised.map((_, i) => ({
        selected: null,
        status: i === 0 ? 'not_answered' : 'not_visited'
      }));
      setQStates(initialStates);
      
      setQi(0); 
      setStartTime(Date.now());
      setExamTimer(normalised.length * 120); // 2 minutes per question
      setPhase("quiz");
    } catch (e) {
      console.error("Quiz generation error:", e);
      showToast("AI could not generate the quiz. Please try again — ensure your file has enough readable text.", "danger");
      setPhase("setup");
    }
  };

  /* ── CBT Actions ── */
  const currentQ = questions[qi] || {};
  const isIntegerQ = currentQ.type === "integer";
  const currentState = qStates[qi] || {};

  const updateQState = (idx: number, updates: any) => {
    setQStates(prev => {
      const n = [...prev];
      n[idx] = { ...n[idx], ...updates };
      return n;
    });
  };

  const handleSelect = (val: any) => {
    updateQState(qi, { selected: val });
  };

  const navigateTo = (idx: number) => {
    // Update current question status if leaving
    setQStates(prev => {
      const n = [...prev];
      if (n[qi].status === 'not_visited' || n[qi].status === 'not_answered') {
        n[qi].status = n[qi].selected !== null ? 'answered' : 'not_answered';
      }
      if (n[idx].status === 'not_visited') {
        n[idx].status = 'not_answered';
      }
      return n;
    });
    setQi(idx);
  };

  const saveAndNext = () => {
    updateQState(qi, { status: currentState.selected !== null ? 'answered' : 'not_answered' });
    if (qi + 1 < questions.length) navigateTo(qi + 1);
  };

  const markAndNext = () => {
    updateQState(qi, { status: currentState.selected !== null ? 'answered_marked' : 'marked' });
    if (qi + 1 < questions.length) navigateTo(qi + 1);
  };

  const clearResponse = () => {
    updateQState(qi, { selected: null });
  };

  const submitExam = async (autoSubmit = false) => {
    if (!autoSubmit && !window.confirm("Are you sure you want to submit the exam?")) return;
    
    clearInterval(examTimerRef.current);
    
    // Calculate results
    let correctCount = 0;
    const finalAnswers = questions.map((q, i) => {
      const st = qStates[i];
      let isCorrect = false;
      if (q.type === "integer") {
        isCorrect = st.selected?.trim() === (q.intAns || "").trim();
      } else {
        isCorrect = st.selected === q.ans;
      }
      if (isCorrect) correctCount++;
      return { isCorrect, selected: st.selected, concept: q.concept };
    });

    const accuracy = Math.round((correctCount / questions.length) * 100);
    const timeTaken = Math.round((Date.now() - (startTime || Date.now())) / 1000);
    const weakConcepts = finalAnswers.filter(a => !a.isCorrect).map(a => a.concept).filter(Boolean);
    
    const attempt = {
      id: crypto.randomUUID(), userId: user.id, pdfId: selectedPdf.id,
      pdfName: selectedPdf.name, score: correctCount, totalQ: questions.length,
      accuracy, timeTaken, weakConcepts, exam: settings.exam, date: Date.now(),
    };
    
    addAttempt(attempt);
    await store.setAttempt(attempt.id, attempt);
    
    // Store final answers in state for result view
    setQStates(finalAnswers); 
    setPhase("result");
  };

  const totalCorrect = qStates.filter(a => a.isCorrect).length;
  const totalTime = startTime ? Math.round((Date.now() - startTime) / 1000) : 0;

  /* ─────────────────────────────────────────────────────
     SETUP PHASE
  ───────────────────────────────────────────────────── */
  if (phase === "setup") {
    return (
      <div style={{ flex:1, padding:"32px", animation:"fadeIn 0.3s ease" }}>
        <SectionHead title="Quiz Mode" sub="Configure your quiz and let AI generate exam-pattern questions"/>
        {pdfs.length === 0 ? (
          <Card><Empty icon="book" title="No files in your library" sub="Upload a study document first to generate quizzes." action={<Btn variant="primary" icon="upload">Upload File</Btn>}/></Card>
        ) : (
          <div style={{ maxWidth:620, margin:"0 auto" }}>
            <Card>
              <h3 style={{ fontFamily:"var(--font-h)", fontWeight:700, fontSize:16, marginBottom:20 }}>Quiz Settings</h3>

              {/* ① FILE SELECTOR */}
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
              {!selectedPdf && <p style={{ fontSize:12, color:T.warn, textAlign:"center", marginTop:8 }}>Select a file above to continue.</p>}
            </Card>
          </div>
        )}
      </div>
    );
  }

  /* ─────────────────────────────────────────────────────
     COUNTDOWN & GENERATING PHASES
  ───────────────────────────────────────────────────── */
  if (phase === "countdown") return (
    <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ textAlign:"center" }}>
        <h2 key={preGenCountdown} style={{ fontFamily:"var(--font-h)", fontSize:120, fontWeight:800, color:T.purple, margin:0, lineHeight:1, animation:"scaleIn 0.5s cubic-bezier(0.16, 1, 0.3, 1)" }}>
          {preGenCountdown}
        </h2>
        <p style={{ color:T.muted, marginTop:24, fontSize:18, fontWeight:500, animation:"fadeIn 0.5s ease" }}>Get ready for your exam...</p>
      </div>
    </div>
  );

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
        <div style={{ marginTop:24, width:240, margin:"24px auto 0", height:6, background:T.subtle, borderRadius:99, overflow:"hidden", position:"relative" }}>
          <div style={{ position:"absolute", top:0, bottom:0, width:"50%", background:T.purple, borderRadius:99, animation:"slideIndeterminate 1.5s infinite ease-in-out" }}/>
        </div>
      </div>
    </div>
  );

  /* ─────────────────────────────────────────────────────
     RESULT PHASE
  ───────────────────────────────────────────────────── */
  if (phase === "result") {
    const pct = Math.round(totalCorrect / questions.length * 100);
    const weakC = qStates.filter(a => !a.isCorrect).map(a => a.concept).filter(Boolean);
    const examProfile = EXAM_PROFILES[settings.exam];
    return (
      <div className="flex-1 flex flex-col bg-[#f8f9fa] overflow-y-auto">
        <div className="flex flex-col items-center justify-center p-6 md:p-10">
          <div className="max-w-3xl w-full">
            <Card style={{ textAlign:"center", padding:48, marginBottom: 24 }}>
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
                <Btn variant="primary" icon="refresh" onClick={()=>{ setPhase("setup"); setQuestions([]); setQStates([]); }}>New Quiz</Btn>
              </div>
            </Card>

            <h3 className="font-bold text-xl text-gray-800 mb-4 px-2">Review Answers</h3>
            <div className="flex flex-col gap-4">
              {questions.map((q, i) => {
                const st = qStates[i];
                return (
                  <Card key={i} style={{ padding: 24, borderLeft: `4px solid ${st.isCorrect ? T.success : T.danger}` }}>
                    <div className="flex justify-between items-start mb-4">
                      <h4 className="font-bold text-gray-800">Question {i + 1}</h4>
                      <Badge color={st.isCorrect ? T.success : T.danger}>{st.isCorrect ? "Correct" : "Incorrect"}</Badge>
                    </div>
                    <p className="text-gray-800 font-medium mb-4">{q.q}</p>
                    
                    {q.type !== "integer" ? (
                      <div className="flex flex-col gap-2 mb-4">
                        {(q.opts || []).map((opt: string, optIdx: number) => {
                          const isSelected = st.selected === optIdx;
                          const isCorrectAns = q.ans === optIdx;
                          let bg = "bg-gray-50";
                          let border = "border-gray-200";
                          if (isCorrectAns) { bg = "bg-green-50"; border = "border-green-500"; }
                          else if (isSelected && !isCorrectAns) { bg = "bg-red-50"; border = "border-red-500"; }
                          
                          return (
                            <div key={optIdx} className={`p-3 rounded-lg border-2 ${bg} ${border} flex items-center gap-3`}>
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 shrink-0
                                ${isCorrectAns ? 'bg-green-500 border-green-500 text-white' : isSelected ? 'bg-red-500 border-red-500 text-white' : 'border-gray-300 text-gray-500'}`}>
                                {String.fromCharCode(65+optIdx)}
                              </div>
                              <span className="text-sm text-gray-700">{opt}</span>
                              {isSelected && <span className="ml-auto text-xs font-bold text-gray-500">Your Answer</span>}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="flex gap-4 mb-4">
                        <div className="flex-1 p-3 rounded-lg border-2 border-gray-200 bg-gray-50">
                          <p className="text-xs text-gray-500 mb-1">Your Answer</p>
                          <p className={`font-bold ${st.isCorrect ? 'text-green-600' : 'text-red-600'}`}>{st.selected || "Not answered"}</p>
                        </div>
                        <div className="flex-1 p-3 rounded-lg border-2 border-green-200 bg-green-50">
                          <p className="text-xs text-green-600 mb-1">Correct Answer</p>
                          <p className="font-bold text-green-700">{q.intAns}</p>
                        </div>
                      </div>
                    )}
                    
                    <div className="p-4 rounded-lg bg-indigo-50 border border-indigo-100">
                      <p className="text-xs font-bold text-indigo-600 mb-1">Explanation</p>
                      <p className="text-sm text-indigo-900 leading-relaxed">{q.explanation}</p>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ─────────────────────────────────────────────────────
     QUIZ PHASE (CBT UI)
  ───────────────────────────────────────────────────── */
  const q = currentQ;
  const examProfile = EXAM_PROFILES[settings.exam];
  const mins = String(Math.floor(examTimer / 60)).padStart(2, "0");
  const secs = String(examTimer % 60).padStart(2, "0");

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'answered': return T.success;
      case 'not_answered': return T.danger;
      case 'marked': return T.purple;
      case 'answered_marked': return T.purple;
      default: return T.border;
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#f8f9fa] animate-fadeIn">
      {/* TOP BAR */}
      <div className="flex justify-between items-center px-4 md:px-6 py-3 bg-white border-b border-gray-200 shrink-0">
        <div>
          <h2 className="font-bold text-gray-800 text-lg md:text-xl font-['Inter']">{examProfile.badge} {examProfile.label} Practice Test</h2>
          <p className="text-xs text-gray-500">{selectedPdf?.name}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200">
            <IC n="clock" s={16} c={examTimer < 300 ? T.danger : T.text}/>
            <span className={`font-mono font-bold text-sm md:text-base ${examTimer < 300 ? 'text-red-500' : 'text-gray-800'}`}>
              {mins}:{secs}
            </span>
          </div>
          <button onClick={() => submitExam()} className="bg-red-50 text-red-600 hover:bg-red-100 px-4 py-1.5 rounded-lg text-sm font-bold transition-colors border border-red-200">
            Submit
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
        {/* MAIN QUESTION AREA */}
        <div className="flex-1 flex flex-col overflow-y-auto bg-white m-2 md:m-4 rounded-xl border border-gray-200 shadow-sm relative">
          <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50">
            <h3 className="font-bold text-gray-800 text-lg">Question {qi + 1}</h3>
            <div className="flex gap-2">
              <Badge color={q.type==="integer"?T.warn:T.purple}>{q.type==="integer"?"Integer":"MCQ"}</Badge>
              {q.concept && <Badge color={examProfile.color}>{q.concept}</Badge>}
            </div>
          </div>
          
          <div className="p-6 md:p-8 flex-1">
            <p className="text-lg md:text-xl font-medium text-gray-800 leading-relaxed mb-8">{q.q}</p>

            {/* MCQ OPTIONS */}
            {q.type !== "integer" && (
              <div className="flex flex-col gap-3">
                {(q.opts || []).map((opt: string, i: number) => {
                  const isSelected = currentState.selected === i;
                  return (
                    <div key={i} onClick={() => handleSelect(i)}
                      style={{
                        display: "flex", alignItems: "center", gap: 16, padding: "16px 20px", borderRadius: 16, border: `2px solid ${isSelected ? T.purple : T.border}`,
                        background: isSelected ? `${T.purple}08` : T.white, cursor: "pointer", transition: "all 0.2s ease",
                        boxShadow: isSelected ? `0 4px 12px ${T.purple}15` : "none"
                      }}
                      onMouseEnter={e => { if (!isSelected) { e.currentTarget.style.borderColor = `${T.purple}60`; e.currentTarget.style.background = T.subtle; } }}
                      onMouseLeave={e => { if (!isSelected) { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.background = T.white; } }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 14, fontWeight: 700, flexShrink: 0, transition: "all 0.2s ease",
                        background: isSelected ? T.purple : T.white, color: isSelected ? T.white : T.muted,
                        border: `2px solid ${isSelected ? T.purple : T.border}`
                      }}>
                        {String.fromCharCode(65+i)}
                      </div>
                      <span style={{ fontSize: 16, fontWeight: isSelected ? 600 : 500, color: isSelected ? T.purple : T.text, lineHeight: 1.5 }}>{opt}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* INTEGER INPUT */}
            {q.type === "integer" && (
              <div className="max-w-md">
                <p style={{ fontSize: 14, color: T.muted, marginBottom: 16, padding: "12px 16px", background: `${T.warn}10`, borderRadius: 12, border: `1px solid ${T.warn}30` }}>
                  🔢 <strong style={{ color: T.text }}>Integer Type Question</strong> — Type the exact numeric value below.
                </p>
                <input
                  type="number"
                  value={currentState.selected || ""}
                  onChange={e => handleSelect(e.target.value)}
                  placeholder="Type your answer here…"
                  style={{
                    width: "100%", padding: "16px 20px", borderRadius: 16, fontSize: 20, fontWeight: 700,
                    border: `2px solid ${T.border}`, outline: "none", transition: "all 0.2s ease", textAlign: "center",
                    color: T.text, background: T.white
                  }}
                  onFocus={e => { e.currentTarget.style.borderColor = T.purple; e.currentTarget.style.boxShadow = `0 0 0 4px ${T.purple}15`; }}
                  onBlur={e => { e.currentTarget.style.borderColor = currentState.selected ? T.purple : T.border; e.currentTarget.style.boxShadow = "none"; }}
                />
              </div>
            )}
          </div>

          {/* BOTTOM ACTION BAR */}
          <div className="p-4 border-t border-gray-200 bg-gray-50 flex flex-col md:flex-row gap-3 justify-between items-center sticky bottom-0">
            <div className="flex flex-wrap justify-center md:justify-start gap-2 w-full md:w-auto">
              <button onClick={markAndNext} className="flex-1 md:flex-none px-4 py-2 rounded-lg text-xs md:text-sm font-semibold bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors text-center">
                Mark & Next
              </button>
              <button onClick={clearResponse} className="flex-1 md:flex-none px-4 py-2 rounded-lg text-xs md:text-sm font-semibold bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors text-center">
                Clear
              </button>
            </div>
            <button onClick={saveAndNext} className="w-full md:w-auto px-6 py-2 rounded-lg text-sm font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-sm text-center">
              Save & Next
            </button>
          </div>
        </div>

        {/* RIGHT SIDEBAR - QUESTION PALETTE */}
        <div className="w-full md:w-80 flex flex-col bg-white m-2 md:m-4 md:ml-0 rounded-xl border border-gray-200 shadow-sm overflow-hidden shrink-0">
          <div className="p-4 border-b border-gray-100 bg-gray-50">
            <h3 className="font-bold text-gray-800">Question Palette</h3>
          </div>
          
          <div className="p-4 grid grid-cols-2 gap-y-3 gap-x-2 text-xs text-gray-600 border-b border-gray-100 bg-white">
            <div className="flex items-center gap-2"><div className="w-6 h-6 rounded-full border border-gray-300 bg-white"></div> Not Visited</div>
            <div className="flex items-center gap-2"><div className="w-6 h-6 rounded-full text-white flex items-center justify-center" style={{ background: T.danger }}></div> Not Answered</div>
            <div className="flex items-center gap-2"><div className="w-6 h-6 rounded-full text-white flex items-center justify-center" style={{ background: T.success }}></div> Answered</div>
            <div className="flex items-center gap-2"><div className="w-6 h-6 rounded-full text-white flex items-center justify-center" style={{ background: T.purple }}></div> Marked</div>
            <div className="flex items-center gap-2 col-span-2"><div className="w-6 h-6 rounded-full text-white flex items-center justify-center relative" style={{ background: T.purple }}><div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 rounded-full border border-white"></div></div> Answered & Marked</div>
          </div>

          <div className="p-4 overflow-y-auto flex-1">
            <div className="grid grid-cols-5 gap-2 md:gap-3">
              {questions.map((_, i) => {
                const st = qStates[i];
                const isCurrent = i === qi;
                let bg = T.white;
                let text = T.text;
                let border = T.border;
                let hasDot = false;

                if (st.status === 'answered') { bg = T.success; text = T.white; border = T.success; }
                else if (st.status === 'not_answered') { bg = T.danger; text = T.white; border = T.danger; }
                else if (st.status === 'marked') { bg = T.purple; text = T.white; border = T.purple; }
                else if (st.status === 'answered_marked') { bg = T.purple; text = T.white; border = T.purple; hasDot = true; }

                return (
                  <button key={i} onClick={() => navigateTo(i)}
                    style={{
                      position: "relative", width: "100%", aspectRatio: "1/1", borderRadius: "50%",
                      display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700,
                      background: bg, color: text, border: `2px solid ${border}`,
                      transition: "all 0.2s ease", cursor: "pointer",
                      transform: isCurrent ? "scale(1.1)" : "scale(1)",
                      boxShadow: isCurrent ? `0 0 0 4px ${T.purple}30` : "none",
                      zIndex: isCurrent ? 10 : 1
                    }}
                    onMouseEnter={e => { if (!isCurrent) e.currentTarget.style.transform = "scale(1.05)"; }}
                    onMouseLeave={e => { if (!isCurrent) e.currentTarget.style.transform = "scale(1)"; }}>
                    {i + 1}
                    {hasDot && <div style={{ position: "absolute", bottom: -2, right: -2, width: 12, height: 12, background: T.success, borderRadius: "50%", border: `2px solid ${T.white}` }}></div>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
