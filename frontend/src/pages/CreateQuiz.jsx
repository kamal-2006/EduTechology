import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { courseAPI, quizAPI, aiAPI } from "../services/api.js";

/* ── Constants ─────────────────────────────────────────────── */
const STEPS = [
  { label: "Quiz Setup",  icon: "⚙️" },
  { label: "Questions",   icon: "❓" },
  { label: "Review",      icon: "✅" },
];
const MAX_OPTIONS = 6;

/* ── Helpers ────────────────────────────────────────────────── */
const uid = () => Math.random().toString(36).slice(2);
const emptyQ = () => ({ _key: uid(), questionText: "", options: ["", ""], correctIndex: -1 });
const toPayload = (q) => ({
  questionText:  q.questionText.trim(),
  options:       q.options.map((o) => o.trim()).filter(Boolean),
  correctAnswer: q.options[q.correctIndex]?.trim() || "",
});
const fromParsed = (q) => ({
  _key:         uid(),
  questionText: q.questionText || "",
  options:      q.options?.length >= 2 ? q.options : [...(q.options || []), "", ""].slice(0, Math.max(2, (q.options || []).length)),
  correctIndex: (q.options || []).findIndex((o) => o === q.correctAnswer),
});

/* ── Global Styles ──────────────────────────────────────────── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Nunito:wght@300;400;500;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #060d1a; font-family: 'Nunito', sans-serif; color: rgba(226,232,240,0.88); }
  @keyframes spin        { to { transform: rotate(360deg); } }
  @keyframes fadeSlideUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  @keyframes glowPulse   { 0%,100%{box-shadow:0 0 14px rgba(94,234,212,0.2)} 50%{box-shadow:0 0 28px rgba(94,234,212,0.45)} }
  ::-webkit-scrollbar       { width:5px; }
  ::-webkit-scrollbar-track { background:rgba(255,255,255,0.02); }
  ::-webkit-scrollbar-thumb { background:rgba(94,234,212,0.18); border-radius:999px; }
  .dark-input { transition: border-color 0.15s, box-shadow 0.15s; }
  .dark-input:focus { outline: none; border-color: rgba(94,234,212,0.5) !important; box-shadow: 0 0 0 3px rgba(94,234,212,0.08); }
  .tab-btn { transition: all 0.15s; }
  .tab-btn:hover:not(.active) { border-color: rgba(255,255,255,0.15) !important; color: rgba(226,232,240,0.7) !important; }
  .add-opt-btn:hover { border-color: rgba(94,234,212,0.35) !important; color: rgba(94,234,212,0.7) !important; }
  .q-card { transition: border-color 0.2s; }
  .step-pill { transition: all 0.2s; }
  @media (max-width: 540px) { .step-label { display: none; } }
`;

/* ── Design tokens ──────────────────────────────────────────── */
const T = {
  surface:   "rgba(255,255,255,0.03)",
  border:    "rgba(255,255,255,0.08)",
  borderFocus: "rgba(94,234,212,0.45)",
  text:      "rgba(226,232,240,0.88)",
  muted:     "rgba(148,163,184,0.5)",
  teal:      "#5eead4",
  indigo:    "#6366f1",
  red:       "#f87171",
  amber:     "#fbbf24",
  green:     "#34d399",
};

const darkInput = {
  width: "100%",
  padding: "0.65rem 0.9rem",
  border: `1.5px solid ${T.border}`,
  borderRadius: 10,
  fontSize: "0.875rem",
  background: "rgba(255,255,255,0.04)",
  color: T.text,
  outline: "none",
  boxSizing: "border-box",
  fontFamily: "'Nunito', sans-serif",
};

const darkSelect = {
  ...darkInput,
  cursor: "pointer",
  appearance: "none",
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%235eead4' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 10px center",
  backgroundColor: "rgba(255,255,255,0.04)",
  paddingRight: "2.2rem",
};

const darkTextarea = {
  ...darkInput,
  resize: "vertical",
  minHeight: 80,
};

const cardDark = {
  background: T.surface,
  border: `1px solid ${T.border}`,
  borderRadius: 16,
  padding: "1.5rem",
  marginBottom: "1rem",
};

/* ── Navbar ─────────────────────────────────────────────────── */
function Navbar() {
  return (
    <div style={{ background:"rgba(6,16,31,0.96)", borderBottom:"1px solid rgba(94,234,212,0.07)", padding:"0 1.75rem", display:"flex", alignItems:"center", height:"60px", position:"sticky", top:0, zIndex:50, backdropFilter:"blur(14px)" }}>
      <div style={{ display:"flex", alignItems:"center", gap:"0.625rem" }}>
        <div style={{ width:"30px", height:"30px", borderRadius:"8px", background:"linear-gradient(135deg,#14b8a6,#6366f1)", display:"flex", alignItems:"center", justifyContent:"center", animation:"glowPulse 3s ease-in-out infinite" }}>
          <svg width="17" height="17" fill="none" viewBox="0 0 48 48"><path d="M4 42.4379C4 42.4379 14.0962 36.0744 24 41.1692C35.0664 46.8624 44 42.2078 44 42.2078L44 7.01134C44 7.01134 35.068 11.6577 24.0031 5.96913C14.0971 0.876274 4 7.27094 4 7.27094L4 42.4379Z" fill="white"/></svg>
        </div>
        <span style={{ color:"white", fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:800, fontSize:"1.0625rem", letterSpacing:"-0.02em" }}>EduAI</span>
      </div>
    </div>
  );
}

/* ── Field wrapper ──────────────────────────────────────────── */
function Field({ label, required, hint, children }) {
  return (
    <div style={{ marginBottom: "1rem" }}>
      <label style={{ display:"block", fontSize:"0.78rem", fontWeight:700, color:T.muted, marginBottom:"0.4rem", fontFamily:"'Plus Jakarta Sans',sans-serif", textTransform:"uppercase", letterSpacing:"0.06em" }}>
        {label} {required && <span style={{ color: T.red }}>*</span>}
      </label>
      {children}
      {hint && <p style={{ margin:"0.3rem 0 0", fontSize:"0.73rem", color:T.muted }}>{hint}</p>}
    </div>
  );
}

/* ── Step Nav ───────────────────────────────────────────────── */
function StepNav({ current, onGo }) {
  return (
    <div style={{ display:"flex", gap:"0.375rem", background:"rgba(255,255,255,0.03)", borderRadius:14, padding:"0.375rem", marginBottom:"2rem", border:`1px solid ${T.border}` }}>
      {STEPS.map((s, i) => {
        const done   = i < current;
        const active = i === current;
        return (
          <button key={s.label} type="button" onClick={() => { if (i < current) onGo(i); }} className="step-pill"
            style={{ flex:"1 1 0", display:"flex", alignItems:"center", justifyContent:"center", gap:"0.4rem",
              padding:"0.55rem 0.75rem", borderRadius:10, border:"none", cursor: i < current ? "pointer" : "default",
              fontSize:"0.8rem", fontWeight: active ? 800 : 600, whiteSpace:"nowrap",
              background: active ? "linear-gradient(135deg,#14b8a6,#6366f1)" : done ? "rgba(94,234,212,0.08)" : "transparent",
              color: active ? "#fff" : done ? T.teal : T.muted,
              fontFamily:"'Plus Jakarta Sans',sans-serif",
              boxShadow: active ? "0 4px 14px rgba(20,184,166,0.22)" : "none",
            }}>
            <span>{s.icon}</span>
            <span className="step-label">{s.label}</span>
            {done && <span style={{ fontSize:"0.65rem", background:"rgba(94,234,212,0.15)", color:T.teal, borderRadius:999, padding:"1px 5px" }}>✓</span>}
          </button>
        );
      })}
    </div>
  );
}

/* ── Question Card ──────────────────────────────────────────── */
function QuestionCard({ q, index, total, onChange, onRemove }) {
  const setField       = (field, value) => onChange({ ...q, [field]: value });
  const setOptionText  = (optIdx, val)  => { const opts = [...q.options]; opts[optIdx] = val; onChange({ ...q, options: opts }); };
  const addOption      = ()             => { if (q.options.length < MAX_OPTIONS) onChange({ ...q, options: [...q.options, ""] }); };
  const removeOption   = (optIdx)       => {
    const opts       = q.options.filter((_, i) => i !== optIdx);
    const newCorrect = q.correctIndex === optIdx ? -1 : q.correctIndex > optIdx ? q.correctIndex - 1 : q.correctIndex;
    onChange({ ...q, options: opts, correctIndex: newCorrect });
  };
  const isValid = q.questionText.trim() && q.options.filter(o => o.trim()).length >= 2 && q.correctIndex >= 0 && q.options[q.correctIndex]?.trim();

  return (
    <div className="q-card" style={{ ...cardDark, border:`1px solid ${isValid ? T.border : "rgba(251,191,36,0.3)"}`, marginBottom:"0.875rem" }}>
      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1rem" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"0.6rem" }}>
          <div style={{ width:28, height:28, borderRadius:8, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:"0.78rem", fontFamily:"'Plus Jakarta Sans',sans-serif",
            background: isValid ? "linear-gradient(135deg,#14b8a6,#6366f1)" : "rgba(251,191,36,0.15)", color: isValid ? "white" : T.amber }}>
            {index + 1}
          </div>
          <span style={{ fontWeight:800, fontSize:"0.875rem", color:T.text, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>Question {index + 1}</span>
          {!isValid && (
            <span style={{ fontSize:"0.65rem", background:"rgba(251,191,36,0.1)", color:T.amber, padding:"2px 8px", borderRadius:999, fontWeight:700, border:"1px solid rgba(251,191,36,0.25)", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
              Incomplete
            </span>
          )}
        </div>
        {total > 1 && (
          <button type="button" onClick={onRemove} style={{ background:"rgba(248,113,113,0.08)", color:T.red, border:"1px solid rgba(248,113,113,0.2)", borderRadius:8, padding:"0.3rem 0.7rem", fontSize:"0.72rem", fontWeight:700, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
            Remove
          </button>
        )}
      </div>

      {/* Question text */}
      <Field label="Question Text" required>
        <textarea className="dark-input" style={darkTextarea} placeholder="Enter the question here…"
          value={q.questionText} onChange={(e) => setField("questionText", e.target.value)} />
      </Field>

      {/* Options */}
      <div>
        <label style={{ fontSize:"0.78rem", fontWeight:700, color:T.muted, display:"block", marginBottom:"0.5rem", textTransform:"uppercase", letterSpacing:"0.06em", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
          Answer Options <span style={{ color:T.red }}>*</span>
          <span style={{ fontWeight:500, color:"rgba(148,163,184,0.35)", marginLeft:"0.4rem", textTransform:"none", letterSpacing:0 }}>— click circle to mark correct</span>
        </label>
        <div style={{ display:"flex", flexDirection:"column", gap:"0.45rem" }}>
          {q.options.map((opt, optIdx) => {
            const isCorrect = q.correctIndex === optIdx;
            return (
              <div key={optIdx} style={{ display:"flex", alignItems:"center", gap:"0.5rem" }}>
                <button type="button" onClick={() => onChange({ ...q, correctIndex: isCorrect ? -1 : optIdx })}
                  style={{ width:22, height:22, borderRadius:"50%", flexShrink:0, border:`2px solid ${isCorrect ? T.teal : T.border}`, background: isCorrect ? T.teal : "transparent", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", padding:0, transition:"all 0.15s" }}>
                  {isCorrect && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#060d1a" strokeWidth="3.5"><polyline points="20 6 9 17 4 12"/></svg>}
                </button>
                <span style={{ width:22, textAlign:"center", fontSize:"0.78rem", fontWeight:800, color: isCorrect ? T.teal : T.muted, flexShrink:0, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                  {String.fromCharCode(65 + optIdx)}
                </span>
                <input className="dark-input" style={{ ...darkInput, flex:1, border:`1.5px solid ${isCorrect ? "rgba(94,234,212,0.4)" : T.border}`, background: isCorrect ? "rgba(94,234,212,0.05)" : "rgba(255,255,255,0.04)" }}
                  placeholder={`Option ${String.fromCharCode(65 + optIdx)}`} value={opt} onChange={(e) => setOptionText(optIdx, e.target.value)} />
                {q.options.length > 2 && (
                  <button type="button" onClick={() => removeOption(optIdx)} style={{ background:"none", border:"none", cursor:"pointer", color:T.muted, fontSize:"1.1rem", lineHeight:1, padding:"0 4px", flexShrink:0 }}>×</button>
                )}
              </div>
            );
          })}
        </div>
        {q.options.length < MAX_OPTIONS && (
          <button type="button" onClick={addOption} className="add-opt-btn" style={{ marginTop:"0.6rem", display:"inline-flex", alignItems:"center", gap:"0.3rem", padding:"0.4rem 0.9rem", borderRadius:8, border:`1.5px dashed ${T.border}`, background:"transparent", color:T.muted, fontSize:"0.75rem", fontWeight:700, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif", transition:"all 0.15s" }}>
            + Add Option
          </button>
        )}
      </div>
    </div>
  );
}

/* ── File Upload Zone ───────────────────────────────────────── */
function FileUploadZone({ onFile, uploading, dragOver, onDragOver, onDragLeave, onDrop, fileInputRef }) {
  return (
    <div onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}
      onClick={() => !uploading && fileInputRef.current?.click()}
      style={{ border:`2px dashed ${dragOver ? "rgba(94,234,212,0.5)" : T.border}`, borderRadius:16, padding:"3rem 2rem", textAlign:"center", cursor: uploading ? "default" : "pointer", background: dragOver ? "rgba(94,234,212,0.04)" : "rgba(255,255,255,0.02)", transition:"all 0.2s" }}>
      <input ref={fileInputRef} type="file" accept=".json,.csv,.xlsx,.xls" style={{ display:"none" }} onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
      {uploading ? (
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:"0.75rem" }}>
          <div style={{ width:36, height:36, border:`3px solid ${T.border}`, borderTopColor:T.teal, borderRadius:"50%", animation:"spin 0.8s linear infinite" }} />
          <span style={{ color:T.muted, fontSize:"0.875rem" }}>Parsing file…</span>
        </div>
      ) : (
        <>
          <div style={{ fontSize:"2.5rem", marginBottom:"0.75rem" }}>📂</div>
          <p style={{ fontWeight:800, fontSize:"0.95rem", color:T.text, marginBottom:"0.35rem", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
            {dragOver ? "Drop your file here" : "Drag & drop or click to browse"}
          </p>
          <p style={{ fontSize:"0.8rem", color:T.muted, margin:0 }}>
            Supported: <span style={{ color:T.teal, fontWeight:700 }}>JSON · CSV · Excel</span> — max 5 MB
          </p>
        </>
      )}
    </div>
  );
}

/* ── Format Guide ───────────────────────────────────────────── */
function FormatGuide() {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ marginTop:"1.25rem" }}>
      <button type="button" onClick={() => setOpen(v => !v)} style={{ background:"none", border:"none", cursor:"pointer", color:T.teal, fontSize:"0.8rem", fontWeight:700, padding:0, display:"flex", alignItems:"center", gap:"0.3rem", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
        <span style={{ fontSize:"0.65rem" }}>{open ? "▲" : "▼"}</span> View expected file format
      </button>
      {open && (
        <div style={{ marginTop:"0.75rem", display:"flex", flexDirection:"column", gap:"0.75rem" }}>
          {[
            { title:"JSON", code:`[\n  {\n    "questionText": "What is 2 + 2?",\n    "options": ["1","2","3","4"],\n    "correctAnswer": "4"\n  }\n]` },
            { title:"CSV (first row = header)", code:`questionText,option1,option2,option3,option4,correctAnswer\nWhat is 2+2?,1,2,3,4,4` },
          ].map(({ title, code }) => (
            <div key={title} style={{ background:"rgba(255,255,255,0.03)", border:`1px solid ${T.border}`, borderRadius:10, padding:"0.9rem 1rem" }}>
              <div style={{ fontWeight:700, fontSize:"0.75rem", marginBottom:"0.4rem", color:T.teal, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{title}</div>
              <pre style={{ margin:0, fontSize:"0.72rem", color:T.muted, whiteSpace:"pre-wrap", fontFamily:"monospace" }}>{code}</pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Main Page ──────────────────────────────────────────────── */
export default function CreateQuiz() {
  const navigate     = useNavigate();
  const fileInputRef = useRef(null);

  const [step,       setStep]       = useState(0);
  const [courses,    setCourses]    = useState([]);
  const [loadingC,   setLoadingC]   = useState(true);
  const [questions,  setQuestions]  = useState([emptyQ()]);
  const [uploadMode, setUploadMode] = useState(false);
  const [dragOver,   setDragOver]   = useState(false);
  const [uploading,  setUploading]  = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState("");
  const [aiMode,     setAiMode]     = useState(false);
  const [generating, setGenerating] = useState(false);
  const [aiInputs,   setAiInputs]   = useState({ concepts:"", paragraph:"", numberOfQuestions:5, difficulty:"Medium" });
  const [setup,      setSetup]      = useState({ courseId:"", levelNumber:"", title:"", timeLimit:"", totalMarks:10 });

  useEffect(() => {
    courseAPI.getAll()
      .then((res) => setCourses(res.data.data || []))
      .catch(() => {})
      .finally(() => setLoadingC(false));
  }, []);

  const selectedCourse   = courses.find((c) => c._id === setup.courseId) || null;
  const setSetupField    = (field) => (e) => setSetup(p => ({ ...p, [field]: e.target.value }));
  const setAiField       = (field) => (e) => setAiInputs(p => ({ ...p, [field]: e.target.value }));
  const updateQ          = (idx, updated) => setQuestions(p => p.map((q, i) => i === idx ? updated : q));
  const removeQ          = (idx)          => setQuestions(p => p.filter((_, i) => i !== idx));
  const addQ             = ()             => setQuestions(p => [...p, emptyQ()]);
  const resetAiForm      = ()             => { setAiInputs({ concepts:"", paragraph:"", numberOfQuestions:5, difficulty:"Medium" }); setError(""); };

  const handleFile = async (file) => {
    setUploading(true); setError("");
    try {
      const fd = new FormData(); fd.append("file", file);
      const res    = await quizAPI.parseFile(fd);
      const parsed = (res.data.data || []).map(fromParsed);
      if (!parsed.length) { setError("No valid questions found. Check the format guide below."); return; }
      const merge = window.confirm(`${parsed.length} question${parsed.length !== 1 ? "s" : ""} parsed.\n\nReplace existing questions?`);
      setQuestions(merge ? parsed : [...questions, ...parsed]);
      setUploadMode(false);
    } catch (err) { setError(err.response?.data?.message || "File parsing failed."); }
    finally { setUploading(false); if (fileInputRef.current) fileInputRef.current.value = ""; }
  };

  const handleAIGenerate = async () => {
    setGenerating(true); setError("");
    try {
      const cleanConcepts  = (aiInputs.concepts  || "").trim();
      const cleanParagraph = (aiInputs.paragraph || "").trim();
      if (!cleanConcepts && !cleanParagraph) { setError("Please provide concepts or a paragraph."); setGenerating(false); return; }
      const res = await aiAPI.generateQuiz({ concepts: cleanConcepts, paragraph: cleanParagraph, numberOfQuestions: Number(aiInputs.numberOfQuestions), difficulty: aiInputs.difficulty });
      const aiQ = (res.data.data.questions || []).map(q => ({ _key: uid(), questionText: q.question, options: [q.optionA, q.optionB, q.optionC, q.optionD], correctIndex: ["A","B","C","D"].indexOf(q.correctAnswer) }));
      if (!aiQ.length) { setError("No questions were generated. Please try again."); return; }
      const merge = questions.length === 1 && !questions[0].questionText.trim()
        ? true
        : window.confirm(`${aiQ.length} questions generated.\n\nReplace existing questions?`);
      setQuestions(merge ? aiQ : [...questions, ...aiQ]);
      setAiMode(false); setUploadMode(false); resetAiForm();
    } catch (err) { setError(err.response?.data?.message || "Failed to generate questions."); }
    finally { setGenerating(false); }
  };

  const validateStep = () => {
    setError("");
    if (step === 0) {
      if (!setup.courseId)     { setError("Please select a course.");    return false; }
      if (!setup.title.trim()) { setError("Quiz title is required.");    return false; }
    }
    if (step === 1) {
      if (!questions.length) { setError("Add at least one question."); return false; }
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        if (!q.questionText.trim()) { setError(`Question ${i + 1}: text is required.`); return false; }
        if (q.options.filter(o => o.trim()).length < 2) { setError(`Question ${i + 1}: provide at least 2 options.`); return false; }
        if (q.correctIndex < 0 || !q.options[q.correctIndex]?.trim()) { setError(`Question ${i + 1}: mark the correct answer.`); return false; }
      }
    }
    return true;
  };

  const next = () => { if (validateStep()) setStep(s => s + 1); };
  const back = () => { setError(""); setStep(s => s - 1); };

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(""); setSubmitting(true);
    try {
      await quizAPI.create({ courseId: setup.courseId, title: setup.title.trim(), levelNumber: setup.levelNumber !== "" ? Number(setup.levelNumber) : null, timeLimit: setup.timeLimit !== "" ? Number(setup.timeLimit) : null, totalMarks: Number(setup.totalMarks) || 10, questions: questions.map(toPayload) });
      navigate(`/courses/${setup.courseId}`);
    } catch (err) { setError(err.response?.data?.message || "Failed to create quiz."); }
    finally { setSubmitting(false); }
  };

  /* ── Step 0: Setup ────────────────────────────────────────── */
  const renderSetup = () => (
    <div style={cardDark}>
      <div style={{ display:"flex", alignItems:"center", gap:"0.5rem", marginBottom:"1.25rem" }}>
        <span style={{ fontSize:"1.1rem" }}>⚙️</span>
        <h2 style={{ fontSize:"1rem", fontWeight:800, color:T.text, fontFamily:"'Plus Jakarta Sans',sans-serif", margin:0 }}>Quiz Details</h2>
      </div>

      <Field label="Course" required hint="The quiz will be attached to this course.">
        {loadingC
          ? <div style={{ ...darkInput, color:T.muted }}>Loading courses…</div>
          : <select className="dark-input" style={darkSelect} value={setup.courseId}
              onChange={(e) => { setSetupField("courseId")(e); setSetup(p => ({ ...p, courseId: e.target.value, levelNumber: "" })); }}>
              <option style={{text:'black' , backgroundColor:"black"}} value="">— Select a course —</option>
              {courses.map(c => <option style={{text:'black' , backgroundColor:"black"}}  key={c._id} value={c._id}>{c.title}</option>)}
            </select>
        }
      </Field>

      <Field label="Level / Module" hint="Leave as General to attach to the whole course.">
        <select className="dark-input" style={darkSelect} value={setup.levelNumber} onChange={setSetupField("levelNumber")} disabled={!selectedCourse}>
          <option style={{text:'black' , backgroundColor:"black"}}  value="">General (not level-specific)</option>
          {(selectedCourse?.levels || []).map(lv => (
            <option style={{text:'black' , backgroundColor:"black"}}  key={lv.levelNumber} value={String(lv.levelNumber)}>Level {lv.levelNumber} — {lv.title}</option>
          ))}
        </select>
      </Field>

      <Field label="Quiz Title" required>
        <input className="dark-input" style={darkInput} placeholder="e.g. Python Basics Quiz" value={setup.title} onChange={setSetupField("title")} />
      </Field>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1rem" }}>
        <Field label="Time Limit" hint="Leave blank for no limit.">
          <div style={{ display:"flex", alignItems:"center", gap:"0.5rem" }}>
            <input type="number" min={1} max={300} className="dark-input" style={{ ...darkInput, width:"7rem" }} placeholder="30" value={setup.timeLimit} onChange={setSetupField("timeLimit")} />
            <span style={{ fontSize:"0.82rem", color:T.muted, whiteSpace:"nowrap" }}>minutes</span>
          </div>
        </Field>
        <Field label="Total Marks">
          <input type="number" min={1} className="dark-input" style={{ ...darkInput, width:"7rem" }} value={setup.totalMarks} onChange={setSetupField("totalMarks")} />
        </Field>
      </div>
    </div>
  );

  /* ── Step 1: Questions ────────────────────────────────────── */
  const renderQuestions = () => {
    const tabs = [
      { id:"manual", icon:"✏️", label:"Manual Entry" },
      { id:"upload", icon:"📁", label:"Upload File"  },
      { id:"ai",     icon:"🤖", label:"Generate with AI" },
    ];
    const activeTab = aiMode ? "ai" : uploadMode ? "upload" : "manual";

    return (
      <div>
        {/* Tabs */}
        <div style={{ display:"flex", gap:"0.5rem", marginBottom:"1.25rem", flexWrap:"wrap", alignItems:"center" }}>
          {tabs.map(tab => {
            const isActive = tab.id === activeTab;
            return (
              <button key={tab.id} type="button" className="tab-btn"
                onClick={() => { setUploadMode(tab.id === "upload"); setAiMode(tab.id === "ai"); setError(""); if (tab.id !== "ai") resetAiForm(); }}
                style={{ display:"flex", alignItems:"center", gap:"0.4rem", padding:"0.55rem 1.1rem", borderRadius:10,
                  border:`1.5px solid ${isActive ? "rgba(94,234,212,0.35)" : T.border}`,
                  background: isActive ? "rgba(94,234,212,0.08)" : T.surface,
                  color: isActive ? T.teal : T.muted,
                  fontSize:"0.8rem", fontWeight:700, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif",
                }}>
                <span>{tab.icon}</span>{tab.label}
              </button>
            );
          })}
          <span style={{ marginLeft:"auto", fontSize:"0.75rem", color:T.muted, fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:700 }}>
            {questions.length} question{questions.length !== 1 ? "s" : ""} added
          </span>
        </div>

        {/* AI Tab */}
        {aiMode && (
          <div style={cardDark}>
            <div style={{ display:"flex", alignItems:"center", gap:"0.5rem", marginBottom:"0.5rem" }}>
              <span style={{ fontSize:"1.1rem" }}>🤖</span>
              <h3 style={{ margin:0, fontSize:"0.95rem", fontWeight:800, color:T.text, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>Generate Quiz with AI</h3>
            </div>
            <p style={{ fontSize:"0.82rem", color:T.muted, marginBottom:"1.5rem" }}>Let AI create questions based on concepts or a topic paragraph.</p>

            <Field label="Concepts (comma separated)" hint="e.g., Python loops, Functions, Data structures">
              <input className="dark-input" style={darkInput} placeholder="Enter concepts separated by commas…" value={aiInputs.concepts} onChange={setAiField("concepts")} disabled={generating} />
            </Field>

            <div style={{ display:"flex", alignItems:"center", gap:"0.75rem", margin:"1rem 0" }}>
              <div style={{ flex:1, height:1, background:T.border }} />
              <span style={{ fontSize:"0.72rem", fontWeight:700, color:T.muted, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>OR</span>
              <div style={{ flex:1, height:1, background:T.border }} />
            </div>

            <Field label="Topic / Paragraph" hint="Provide a detailed paragraph or topic description">
              <textarea className="dark-input" style={darkTextarea} placeholder="Enter a topic or paragraph of content…" value={aiInputs.paragraph} onChange={setAiField("paragraph")} disabled={generating} />
            </Field>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1rem", marginTop:"0.5rem" }}>
              <Field label="Number of Questions" required>
                <input type="number" min={1} max={20} className="dark-input" style={darkInput} value={aiInputs.numberOfQuestions} onChange={setAiField("numberOfQuestions")} disabled={generating} />
              </Field>
              <Field label="Difficulty" required>
                <select className="dark-input" style={darkSelect} value={aiInputs.difficulty} onChange={setAiField("difficulty")} disabled={generating}>
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </Field>
            </div>

            <button type="button" onClick={handleAIGenerate} disabled={generating}
              style={{ width:"100%", marginTop:"1.5rem", padding:"0.75rem", display:"flex", alignItems:"center", justifyContent:"center", gap:"0.5rem", borderRadius:11, border:"none", fontSize:"0.875rem", fontWeight:800, cursor: generating ? "default" : "pointer", fontFamily:"'Plus Jakarta Sans',sans-serif",
                background: generating ? "rgba(255,255,255,0.05)" : "linear-gradient(135deg,#14b8a6,#6366f1)", color: generating ? T.muted : "white",
                boxShadow: generating ? "none" : "0 4px 14px rgba(20,184,166,0.22)", transition:"all 0.2s",
              }}>
              {generating ? (
                <><span style={{ display:"inline-block", width:14, height:14, border:"2px solid rgba(255,255,255,0.2)", borderTopColor:T.teal, borderRadius:"50%", animation:"spin 0.8s linear infinite" }} /> Generating questions…</>
              ) : <><span>✨</span> Generate Quiz with AI</>}
            </button>

            {questions.length > 0 && !generating && (
              <div style={{ marginTop:"1rem", padding:"0.75rem 1rem", background:"rgba(94,234,212,0.06)", border:"1px solid rgba(94,234,212,0.2)", borderRadius:10, display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:"0.5rem" }}>
                <span style={{ fontSize:"0.82rem", color:T.teal, fontWeight:700, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>✓ {questions.length} question{questions.length !== 1 ? "s" : ""} ready</span>
                <button type="button" onClick={() => { setAiMode(false); setUploadMode(false); }} style={{ padding:"0.35rem 0.875rem", borderRadius:8, border:"none", background:"rgba(94,234,212,0.15)", color:T.teal, fontSize:"0.75rem", fontWeight:700, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                  Review Questions →
                </button>
              </div>
            )}
          </div>
        )}

        {/* Upload Tab */}
        {uploadMode && !aiMode && (
          <div style={cardDark}>
            <h3 style={{ margin:"0 0 1rem", fontSize:"0.95rem", fontWeight:800, color:T.text, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>📁 Upload Quiz File</h3>
            <FileUploadZone onFile={handleFile} uploading={uploading} dragOver={dragOver} fileInputRef={fileInputRef}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files?.[0]; if (f) handleFile(f); }} />
            <FormatGuide />
            {questions.length > 0 && (
              <div style={{ marginTop:"1rem", padding:"0.75rem 1rem", background:"rgba(94,234,212,0.06)", border:"1px solid rgba(94,234,212,0.2)", borderRadius:10, display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:"0.5rem" }}>
                <span style={{ fontSize:"0.82rem", color:T.teal, fontWeight:700, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>✓ {questions.length} question{questions.length !== 1 ? "s" : ""} ready</span>
                <button type="button" onClick={() => setUploadMode(false)} style={{ padding:"0.35rem 0.875rem", borderRadius:8, border:"none", background:"rgba(94,234,212,0.15)", color:T.teal, fontSize:"0.75rem", fontWeight:700, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                  Review Questions →
                </button>
              </div>
            )}
          </div>
        )}

        {/* Manual Tab */}
        {!uploadMode && !aiMode && (
          <div>
            {questions.map((q, idx) => (
              <QuestionCard key={q._key} q={q} index={idx} total={questions.length}
                onChange={(updated) => updateQ(idx, updated)} onRemove={() => removeQ(idx)} />
            ))}
            <button type="button" onClick={addQ} style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:"0.4rem", width:"100%", padding:"0.75rem", background:"rgba(99,102,241,0.06)", color:"rgba(129,140,248,0.8)", border:"1.5px dashed rgba(99,102,241,0.25)", borderRadius:12, fontSize:"0.85rem", fontWeight:700, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif", transition:"all 0.15s" }}>
              + Add Question
            </button>
          </div>
        )}
      </div>
    );
  };

  /* ── Step 2: Review ───────────────────────────────────────── */
  const renderReview = () => {
    const course     = selectedCourse;
    const levelLabel = setup.levelNumber
      ? `Level ${setup.levelNumber}${course?.levels?.find(l => l.levelNumber === Number(setup.levelNumber)) ? ` — ${course.levels.find(l => l.levelNumber === Number(setup.levelNumber)).title}` : ""}`
      : "General";

    return (
      <div>
        {/* Summary */}
        <div style={{ ...cardDark, background:"rgba(99,102,241,0.06)", border:"1px solid rgba(99,102,241,0.2)", marginBottom:"1rem" }}>
          <h3 style={{ margin:"0 0 0.875rem", fontSize:"1.05rem", fontWeight:800, color:T.text, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{setup.title}</h3>
          <div style={{ display:"flex", flexWrap:"wrap", gap:"0.5rem" }}>
            {[["📚", course?.title || "—"], ["🏗️", levelLabel], ["❓", `${questions.length} question${questions.length !== 1 ? "s" : ""}`], ...(setup.timeLimit ? [["⏱️", `${setup.timeLimit} min`]] : []), ["🏆", `${setup.totalMarks} marks`]].map(([icon, label]) => (
              <span key={label} style={{ display:"inline-flex", alignItems:"center", gap:"0.3rem", padding:"0.3rem 0.75rem", background:"rgba(255,255,255,0.05)", border:`1px solid ${T.border}`, borderRadius:999, fontSize:"0.78rem", fontWeight:700, color:T.text, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                {icon} {label}
              </span>
            ))}
          </div>
        </div>

        {/* Questions */}
        <div style={cardDark}>
          <h4 style={{ margin:"0 0 1rem", fontSize:"0.82rem", fontWeight:700, color:T.muted, textTransform:"uppercase", letterSpacing:"0.06em", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>All Questions</h4>
          <div style={{ display:"flex", flexDirection:"column", gap:"0.75rem" }}>
            {questions.map((q, idx) => {
              const payload = toPayload(q);
              return (
                <div key={q._key} style={{ padding:"0.9rem 1rem", background:"rgba(255,255,255,0.025)", border:`1px solid ${T.border}`, borderRadius:12 }}>
                  <div style={{ fontWeight:700, fontSize:"0.875rem", marginBottom:"0.6rem", color:T.text, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                    <span style={{ color:T.muted, marginRight:"0.4rem", fontSize:"0.75rem" }}>Q{idx + 1}.</span>
                    {payload.questionText || <span style={{ color:T.muted, fontStyle:"italic" }}>No text</span>}
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", gap:"0.3rem" }}>
                    {payload.options.map((opt, oi) => {
                      const correct = opt === payload.correctAnswer;
                      return (
                        <div key={oi} style={{ display:"flex", alignItems:"center", gap:"0.5rem", fontSize:"0.8rem" }}>
                          <span style={{ width:18, height:18, borderRadius:"50%", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", background: correct ? T.teal : "transparent", border:`1.5px solid ${correct ? T.teal : T.border}` }}>
                            {correct && <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#060d1a" strokeWidth="4"><polyline points="20 6 9 17 4 12"/></svg>}
                          </span>
                          <span style={{ color: correct ? T.teal : T.muted, fontWeight: correct ? 700 : 400, fontFamily:"'Nunito',sans-serif" }}>
                            {String.fromCharCode(65 + oi)}. {opt}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <p style={{ textAlign:"center", fontSize:"0.8rem", color:T.muted, marginTop:"0.5rem" }}>
          Everything looks good? Click <strong style={{ color:T.teal }}>Publish Quiz</strong> to save.
        </p>
      </div>
    );
  };

  const stepContent = [renderSetup, renderQuestions, renderReview];

  /* ── Layout ─────────────────────────────────────────────────── */
  return (
    <div style={{ minHeight:"100vh", background:"#060d1a" }}>
      <style>{STYLES}</style>
      <Navbar />

      <div style={{ maxWidth:760, margin:"0 auto", padding:"1.75rem 1.75rem 5rem", animation:"fadeSlideUp 0.45s ease both" }}>
        {/* Page header */}
        <div style={{ marginBottom:"1.75rem" }}>
          <button type="button" onClick={() => navigate(-1)} style={{ background:"none", border:"none", cursor:"pointer", color:T.muted, display:"flex", alignItems:"center", gap:"0.3rem", fontSize:"0.8rem", fontWeight:700, padding:0, marginBottom:"0.875rem", fontFamily:"'Plus Jakarta Sans',sans-serif", transition:"color 0.15s" }}>
            ← Back
          </button>
          <div style={{ display:"flex", alignItems:"center", gap:"0.5rem", marginBottom:"0.4rem" }}>
            <div style={{ height:"14px", width:"3px", background:"linear-gradient(180deg,#5eead4,#6366f1)", borderRadius:"999px" }} />
            <p style={{ fontSize:"0.65rem", fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:700, color:"rgba(94,234,212,0.65)", letterSpacing:"0.12em", textTransform:"uppercase", margin:0 }}>Quiz Builder</p>
          </div>
          <h1 style={{ fontSize:"1.625rem", fontWeight:800, color:"white", fontFamily:"'Plus Jakarta Sans',sans-serif", letterSpacing:"-0.02em", marginBottom:"0.3rem" }}>Create Quiz</h1>
          <p style={{ color:T.muted, fontSize:"0.875rem" }}>Build a quiz manually, import from a file, or generate with AI.</p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <StepNav current={step} onGo={setStep} />

          {error && (
            <div style={{ marginBottom:"1rem", padding:"0.85rem 1rem", borderRadius:12, background:"rgba(248,113,113,0.08)", border:"1px solid rgba(248,113,113,0.25)", color:T.red, fontSize:"0.85rem", fontWeight:600, display:"flex", alignItems:"center", gap:"0.5rem", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {error}
            </div>
          )}

          {stepContent[step]()}

          {/* Nav buttons */}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:"1.5rem" }}>
            <button type="button" onClick={back} style={{ visibility: step === 0 ? "hidden" : "visible", padding:"0.65rem 1.4rem", background:T.surface, color:T.muted, border:`1px solid ${T.border}`, borderRadius:11, fontSize:"0.875rem", fontWeight:700, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
              ← Back
            </button>
            <div style={{ display:"flex", gap:"0.5rem", alignItems:"center" }}>
              <span style={{ fontSize:"0.75rem", color:T.muted, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>Step {step + 1} of {STEPS.length}</span>
              {step < STEPS.length - 1 ? (
                <button type="button" onClick={next} style={{ padding:"0.65rem 1.5rem", background:"linear-gradient(135deg,#14b8a6,#6366f1)", color:"white", border:"none", borderRadius:11, fontSize:"0.875rem", fontWeight:800, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif", boxShadow:"0 4px 14px rgba(20,184,166,0.22)" }}>
                  Continue →
                </button>
              ) : (
                <button type="submit" disabled={submitting} style={{ padding:"0.65rem 1.75rem", background: submitting ? "rgba(255,255,255,0.05)" : "linear-gradient(135deg,#10b981,#059669)", color: submitting ? T.muted : "white", border:"none", borderRadius:11, fontSize:"0.875rem", fontWeight:800, cursor: submitting ? "default" : "pointer", fontFamily:"'Plus Jakarta Sans',sans-serif", minWidth:160, display:"flex", alignItems:"center", gap:"0.4rem", justifyContent:"center", boxShadow: submitting ? "none" : "0 4px 14px rgba(16,185,129,0.25)", transition:"all 0.2s" }}>
                  {submitting ? (
                    <><span style={{ display:"inline-block", width:14, height:14, border:"2px solid rgba(255,255,255,0.2)", borderTopColor:T.green, borderRadius:"50%", animation:"spin 0.8s linear infinite" }} /> Publishing…</>
                  ) : "✓ Publish Quiz"}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}