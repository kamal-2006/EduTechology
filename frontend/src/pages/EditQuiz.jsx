import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { quizAPI } from "../services/api.js";

/* ── Constants ─────────────────────────────────────────────── */
const STEPS = [
  { label:"Quiz Setup", icon:"⚙️" },
  { label:"Questions",  icon:"❓" },
  { label:"Review",     icon:"✅" },
];
const MAX_OPTIONS = 6;

/* ── Helpers ────────────────────────────────────────────────── */
const uid = () => Math.random().toString(36).slice(2);
const emptyQ = () => ({ _key:uid(), questionText:"", options:["",""], correctIndex:-1 });
const toPayload = (q) => ({
  questionText:  q.questionText.trim(),
  options:       q.options.map(o => o.trim()).filter(Boolean),
  correctAnswer: q.options[q.correctIndex]?.trim() || "",
});
const fromAPI = (q) => ({
  _key:         uid(),
  questionText: q.questionText || "",
  options:      q.options?.length >= 2 ? [...q.options] : [...(q.options||[]),"",""].slice(0, Math.max(2,(q.options||[]).length)),
  correctIndex: (q.options||[]).findIndex(o => o === q.correctAnswer),
});

/* ── Global Styles ──────────────────────────────────────────── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Nunito:wght@300;400;500;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #060d1a; font-family: 'Nunito', sans-serif; color: rgba(226,232,240,0.88); }
  @keyframes spin        { to { transform: rotate(360deg); } }
  @keyframes fadeSlideUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  @keyframes glowPulse   { 0%,100%{box-shadow:0 0 14px rgba(94,234,212,0.2)} 50%{box-shadow:0 0 28px rgba(94,234,212,0.45)} }
  ::-webkit-scrollbar { width:5px; }
  ::-webkit-scrollbar-track { background:rgba(255,255,255,0.02); }
  ::-webkit-scrollbar-thumb { background:rgba(94,234,212,0.18); border-radius:999px; }
  .dark-input { transition: border-color 0.15s, box-shadow 0.15s !important; }
  .dark-input:focus { outline:none !important; border-color:rgba(94,234,212,0.45) !important; box-shadow:0 0 0 3px rgba(94,234,212,0.07) !important; }
  .add-opt-btn:hover { border-color:rgba(94,234,212,0.35) !important; color:rgba(94,234,212,0.7) !important; }
  .add-q-btn:hover   { border-color:rgba(99,102,241,0.4) !important; color:rgba(129,140,248,0.9) !important; background:rgba(99,102,241,0.06) !important; }
  .step-pill { transition: all 0.2s; }
  @media (max-width: 540px) { .step-label { display:none; } }
`;

const T = {
  surface: "rgba(255,255,255,0.03)",
  border:  "rgba(255,255,255,0.08)",
  text:    "rgba(226,232,240,0.88)",
  muted:   "rgba(148,163,184,0.5)",
  teal:    "#5eead4",
  indigo:  "#6366f1",
  red:     "#f87171",
  amber:   "#fbbf24",
  green:   "#34d399",
};

const darkInput = {
  width:"100%", padding:"0.65rem 0.9rem",
  border:`1.5px solid ${T.border}`, borderRadius:10,
  fontSize:"0.875rem", background:"rgba(255,255,255,0.04)",
  color:T.text, outline:"none", boxSizing:"border-box",
  fontFamily:"'Nunito',sans-serif",
};
const darkTextarea = { ...darkInput, resize:"vertical", minHeight:80 };
const cardDark = { background:T.surface, border:`1px solid ${T.border}`, borderRadius:16, padding:"1.5rem", marginBottom:"1rem" };

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

/* ── Field ──────────────────────────────────────────────────── */
function Field({ label, required, hint, children }) {
  return (
    <div style={{ marginBottom:"1rem" }}>
      <label style={{ display:"block", fontSize:"0.72rem", fontWeight:700, color:T.muted, marginBottom:"0.4rem", fontFamily:"'Plus Jakarta Sans',sans-serif", textTransform:"uppercase", letterSpacing:"0.06em" }}>
        {label}{required && <span style={{ color:T.red }}> *</span>}
      </label>
      {children}
      {hint && <p style={{ margin:"0.3rem 0 0", fontSize:"0.73rem", color:T.muted }}>{hint}</p>}
    </div>
  );
}

/* ── Step Nav ───────────────────────────────────────────────── */
function StepNav({ current, onGo }) {
  return (
    <div style={{ display:"flex", gap:"0.375rem", background:"rgba(255,255,255,0.025)", borderRadius:14, padding:"0.375rem", marginBottom:"2rem", border:`1px solid ${T.border}` }}>
      {STEPS.map((s, i) => {
        const done = i < current; const active = i === current;
        return (
          <button key={s.label} type="button" onClick={() => { if (i < current) onGo(i); }} className="step-pill"
            style={{ flex:"1 1 0", display:"flex", alignItems:"center", justifyContent:"center", gap:"0.4rem", padding:"0.55rem 0.75rem", borderRadius:10, border:"none", cursor: i < current ? "pointer" : "default", fontSize:"0.78rem", fontWeight: active ? 800 : 600, whiteSpace:"nowrap",
              background: active ? "linear-gradient(135deg,#14b8a6,#6366f1)" : done ? "rgba(94,234,212,0.07)" : "transparent",
              color: active ? "white" : done ? T.teal : T.muted,
              fontFamily:"'Plus Jakarta Sans',sans-serif",
              boxShadow: active ? "0 4px 14px rgba(20,184,166,0.2)" : "none",
            }}>
            <span>{s.icon}</span>
            <span className="step-label">{s.label}</span>
            {done && <span style={{ fontSize:"0.6rem", background:"rgba(94,234,212,0.15)", color:T.teal, borderRadius:999, padding:"1px 5px", fontWeight:700 }}>✓</span>}
          </button>
        );
      })}
    </div>
  );
}

/* ── Question Card ──────────────────────────────────────────── */
function QuestionCard({ q, index, total, onChange, onRemove }) {
  const setOptionText = (optIdx, value) => { const opts = [...q.options]; opts[optIdx] = value; onChange({ ...q, options:opts }); };
  const addOption     = () => { if (q.options.length < MAX_OPTIONS) onChange({ ...q, options:[...q.options,""] }); };
  const removeOption  = (optIdx) => {
    const opts       = q.options.filter((_,i) => i !== optIdx);
    const newCorrect = q.correctIndex === optIdx ? -1 : q.correctIndex > optIdx ? q.correctIndex - 1 : q.correctIndex;
    onChange({ ...q, options:opts, correctIndex:newCorrect });
  };
  const isValid = q.questionText.trim() && q.options.filter(o => o.trim()).length >= 2 && q.correctIndex >= 0 && q.options[q.correctIndex]?.trim();

  return (
    <div style={{ ...cardDark, border:`1px solid ${isValid ? T.border : "rgba(251,191,36,0.3)"}`, marginBottom:"0.875rem" }}>
      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1rem" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"0.6rem" }}>
          <div style={{ width:28, height:28, borderRadius:8, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:"0.78rem", fontFamily:"'Plus Jakarta Sans',sans-serif",
            background: isValid ? "linear-gradient(135deg,#14b8a6,#6366f1)" : "rgba(251,191,36,0.15)",
            color: isValid ? "white" : T.amber }}>
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
          value={q.questionText} onChange={(e) => onChange({ ...q, questionText:e.target.value })} />
      </Field>

      {/* Options */}
      <div>
        <label style={{ fontSize:"0.72rem", fontWeight:700, color:T.muted, display:"block", marginBottom:"0.5rem", textTransform:"uppercase", letterSpacing:"0.06em", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
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
                <input className="dark-input"
                  style={{ ...darkInput, flex:1, border:`1.5px solid ${isCorrect ? "rgba(94,234,212,0.4)" : T.border}`, background: isCorrect ? "rgba(94,234,212,0.05)" : "rgba(255,255,255,0.04)" }}
                  placeholder={`Option ${String.fromCharCode(65 + optIdx)}`} value={opt}
                  onChange={(e) => setOptionText(optIdx, e.target.value)} />
                {q.options.length > 2 && (
                  <button type="button" onClick={() => removeOption(optIdx)} style={{ background:"none", border:"none", cursor:"pointer", color:T.muted, fontSize:"1.1rem", lineHeight:1, padding:"0 4px", flexShrink:0 }}>×</button>
                )}
              </div>
            );
          })}
        </div>
        {q.options.length < MAX_OPTIONS && (
          <button type="button" onClick={addOption} className="add-opt-btn"
            style={{ marginTop:"0.6rem", display:"inline-flex", alignItems:"center", gap:"0.3rem", padding:"0.4rem 0.9rem", borderRadius:8, border:`1.5px dashed ${T.border}`, background:"transparent", color:T.muted, fontSize:"0.75rem", fontWeight:700, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif", transition:"all 0.15s" }}>
            + Add Option
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Main ───────────────────────────────────────────────────── */
export default function EditQuiz() {
  const { quizId } = useParams();
  const navigate   = useNavigate();

  const [step,       setStep]       = useState(0);
  const [loading,    setLoading]    = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState("");
  const [courseId,   setCourseId]   = useState(null);
  const [setup,      setSetup]      = useState({ title:"", levelNumber:"", timeLimit:"", totalMarks:10 });
  const [questions,  setQuestions]  = useState([emptyQ()]);

  useEffect(() => {
    quizAPI.getById(quizId)
      .then(res => {
        const q = res.data.data;
        setCourseId(q.courseId?._id || q.courseId || null);
        setSetup({ title:q.title||"", levelNumber:q.levelNumber!=null?String(q.levelNumber):"", timeLimit:q.timeLimit!=null?String(q.timeLimit):"", totalMarks:q.totalMarks??10 });
        setQuestions(q.questions?.length > 0 ? q.questions.map(fromAPI) : [emptyQ()]);
      })
      .catch(() => setError("Failed to load quiz."))
      .finally(() => setLoading(false));
  }, [quizId]);

  const setSetupField = (field) => (e) => setSetup(p => ({ ...p, [field]:e.target.value }));
  const updateQ  = (idx, u) => setQuestions(p => p.map((q,i) => i===idx ? u : q));
  const removeQ  = (idx)    => setQuestions(p => p.filter((_,i) => i!==idx));
  const addQ     = ()       => setQuestions(p => [...p, emptyQ()]);

  const validateStep = () => {
    setError("");
    if (step === 0) { if (!setup.title.trim()) { setError("Quiz title is required."); return false; } }
    if (step === 1) {
      if (!questions.length) { setError("Add at least one question."); return false; }
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        if (!q.questionText.trim()) { setError(`Question ${i+1}: text is required.`); return false; }
        if (q.options.filter(o => o.trim()).length < 2) { setError(`Question ${i+1}: provide at least 2 options.`); return false; }
        if (q.correctIndex < 0 || !q.options[q.correctIndex]?.trim()) { setError(`Question ${i+1}: mark the correct answer.`); return false; }
      }
    }
    return true;
  };

  const next = () => { if (validateStep()) setStep(s => s+1); };
  const back = () => { setError(""); setStep(s => s-1); };

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(""); setSubmitting(true);
    try {
      await quizAPI.update(quizId, { title:setup.title.trim(), levelNumber:setup.levelNumber!==""?Number(setup.levelNumber):null, timeLimit:setup.timeLimit!==""?Number(setup.timeLimit):null, totalMarks:Number(setup.totalMarks)||10, questions:questions.map(toPayload) });
      navigate(courseId ? `/courses/${courseId}` : "/");
    } catch (err) { setError(err.response?.data?.message || "Failed to update quiz."); }
    finally { setSubmitting(false); }
  };

  /* ── Loading ──────────────────────────────────────────────── */
  if (loading) return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"100vh", background:"#060d1a", gap:"1rem" }}>
      <style>{STYLES}</style>
      <div style={{ width:"40px", height:"40px", border:"3px solid rgba(94,234,212,0.1)", borderTopColor:"#5eead4", borderRadius:"50%", animation:"spin 0.8s linear infinite" }} />
      <span style={{ color:T.muted, fontSize:"0.875rem", fontFamily:"'Nunito',sans-serif" }}>Loading quiz…</span>
    </div>
  );

  /* ── Step 0: Setup ────────────────────────────────────────── */
  const renderSetup = () => (
    <div style={cardDark}>
      <div style={{ display:"flex", alignItems:"center", gap:"0.5rem", marginBottom:"1.25rem" }}>
        <span style={{ fontSize:"1.1rem" }}>⚙️</span>
        <h2 style={{ fontSize:"1rem", fontWeight:800, color:T.text, fontFamily:"'Plus Jakarta Sans',sans-serif", margin:0 }}>Quiz Details</h2>
      </div>
      <Field label="Quiz Title" required>
        <input className="dark-input" style={darkInput} placeholder="e.g. Python Basics Quiz" value={setup.title} onChange={setSetupField("title")} />
      </Field>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1rem" }}>
        <Field label="Level Number" hint="Leave as-is or change the level this quiz belongs to.">
          <input type="number" min={1} className="dark-input" style={{ ...darkInput, width:"7rem" }} placeholder="e.g. 1" value={setup.levelNumber} onChange={setSetupField("levelNumber")} />
        </Field>
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
  const renderQuestions = () => (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1rem" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"0.5rem" }}>
          <span style={{ fontSize:"1rem" }}>❓</span>
          <h2 style={{ margin:0, fontSize:"0.9375rem", fontWeight:800, color:T.text, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>Questions</h2>
        </div>
        <span style={{ fontSize:"0.75rem", color:T.muted, fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:700 }}>{questions.length} question{questions.length!==1?"s":""}</span>
      </div>
      {questions.map((q, idx) => (
        <QuestionCard key={q._key} q={q} index={idx} total={questions.length}
          onChange={u => updateQ(idx, u)} onRemove={() => removeQ(idx)} />
      ))}
      <button type="button" onClick={addQ} className="add-q-btn"
        style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:"0.4rem", width:"100%", padding:"0.75rem", background:"rgba(99,102,241,0.04)", color:"rgba(129,140,248,0.6)", border:"1.5px dashed rgba(99,102,241,0.2)", borderRadius:12, fontSize:"0.85rem", fontWeight:700, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif", transition:"all 0.15s", marginTop:"0.25rem" }}>
        + Add Question
      </button>
    </div>
  );

  /* ── Step 2: Review ───────────────────────────────────────── */
  const renderReview = () => (
    <div style={cardDark}>
      <div style={{ display:"flex", alignItems:"center", gap:"0.5rem", marginBottom:"1.25rem" }}>
        <span style={{ fontSize:"1.1rem" }}>✅</span>
        <h2 style={{ fontSize:"1rem", fontWeight:800, color:T.text, fontFamily:"'Plus Jakarta Sans',sans-serif", margin:0 }}>Review Changes</h2>
      </div>
      <div style={{ display:"grid", gap:"0.5rem" }}>
        {[
          ["Title",       setup.title || "—"],
          ["Level",       setup.levelNumber || "General"],
          ["Time Limit",  setup.timeLimit ? `${setup.timeLimit} minutes` : "No limit"],
          ["Total Marks", String(setup.totalMarks)],
          ["Questions",   `${questions.length} question${questions.length!==1?"s":""}`],
        ].map(([label, value]) => (
          <div key={label} style={{ display:"flex", gap:"0.75rem", padding:"0.7rem 0.9rem", background:"rgba(255,255,255,0.025)", border:`1px solid ${T.border}`, borderRadius:10, fontSize:"0.875rem" }}>
            <span style={{ fontWeight:700, color:T.muted, minWidth:110, fontSize:"0.78rem", textTransform:"uppercase", letterSpacing:"0.05em", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{label}</span>
            <span style={{ color:T.text, fontWeight:600, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{value}</span>
          </div>
        ))}
      </div>
      <p style={{ textAlign:"center", fontSize:"0.8rem", color:T.muted, marginTop:"1.25rem" }}>
        Happy with the changes? Click <strong style={{ color:T.green }}>Save Changes</strong> to update.
      </p>
    </div>
  );

  const stepContent = [renderSetup, renderQuestions, renderReview];

  /* ── Layout ─────────────────────────────────────────────────── */
  return (
    <div style={{ minHeight:"100vh", background:"#060d1a" }}>
      <style>{STYLES}</style>
      <Navbar />

      <div style={{ maxWidth:760, margin:"0 auto", padding:"1.75rem 1.75rem 5rem", animation:"fadeSlideUp 0.45s ease both" }}>
        {/* Page Header */}
        <div style={{ marginBottom:"1.75rem" }}>
          <button type="button" onClick={() => navigate(courseId ? `/courses/${courseId}` : "/")}
            style={{ background:"none", border:"none", cursor:"pointer", color:T.muted, display:"flex", alignItems:"center", gap:"0.3rem", fontSize:"0.8rem", fontWeight:700, padding:0, marginBottom:"0.875rem", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
            ← Back
          </button>
          <div style={{ display:"flex", alignItems:"center", gap:"0.5rem", marginBottom:"0.4rem" }}>
            <div style={{ height:"14px", width:"3px", background:"linear-gradient(180deg,#5eead4,#6366f1)", borderRadius:"999px" }} />
            <p style={{ fontSize:"0.65rem", fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:700, color:"rgba(94,234,212,0.65)", letterSpacing:"0.12em", textTransform:"uppercase", margin:0 }}>Quiz Editor</p>
          </div>
          <h1 style={{ fontSize:"1.625rem", fontWeight:800, color:"white", fontFamily:"'Plus Jakarta Sans',sans-serif", letterSpacing:"-0.02em", marginBottom:"0.3rem" }}>Edit Quiz</h1>
          <p style={{ color:T.muted, fontSize:"0.875rem" }}>Update quiz details, questions, and settings.</p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <StepNav current={step} onGo={(i) => { setError(""); setStep(i); }} />

          {error && (
            <div style={{ marginBottom:"1rem", padding:"0.85rem 1rem", borderRadius:12, background:"rgba(248,113,113,0.08)", border:"1px solid rgba(248,113,113,0.25)", color:T.red, fontSize:"0.85rem", fontWeight:600, display:"flex", alignItems:"center", gap:"0.5rem", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {error}
            </div>
          )}

          {stepContent[step]()}

          {/* Nav buttons */}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:"1.5rem" }}>
            <button type="button" onClick={back}
              style={{ padding:"0.65rem 1.4rem", background:T.surface, color: step===0 ? "rgba(148,163,184,0.25)" : T.muted, border:`1px solid ${T.border}`, borderRadius:11, fontSize:"0.875rem", fontWeight:700, cursor: step===0 ? "not-allowed" : "pointer", fontFamily:"'Plus Jakarta Sans',sans-serif", opacity: step===0 ? 0.5 : 1 }}
              disabled={step===0}>
              ← Back
            </button>
            <div style={{ display:"flex", gap:"0.5rem", alignItems:"center" }}>
              <span style={{ fontSize:"0.75rem", color:T.muted, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>Step {step+1} of {STEPS.length}</span>
              {step < STEPS.length - 1 ? (
                <button type="button" onClick={next}
                  style={{ padding:"0.65rem 1.5rem", background:"linear-gradient(135deg,#14b8a6,#6366f1)", color:"white", border:"none", borderRadius:11, fontSize:"0.875rem", fontWeight:800, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif", boxShadow:"0 4px 14px rgba(20,184,166,0.22)" }}>
                  Continue →
                </button>
              ) : (
                <button type="submit" disabled={submitting}
                  style={{ padding:"0.65rem 1.75rem", background: submitting ? "rgba(255,255,255,0.05)" : "linear-gradient(135deg,#10b981,#059669)", color: submitting ? T.muted : "white", border:"none", borderRadius:11, fontSize:"0.875rem", fontWeight:800, cursor: submitting ? "default" : "pointer", fontFamily:"'Plus Jakarta Sans',sans-serif", minWidth:160, display:"flex", alignItems:"center", gap:"0.4rem", justifyContent:"center", boxShadow: submitting ? "none" : "0 4px 14px rgba(16,185,129,0.25)", transition:"all 0.2s" }}>
                  {submitting
                    ? <><span style={{ display:"inline-block", width:14, height:14, border:"2px solid rgba(255,255,255,0.2)", borderTopColor:T.green, borderRadius:"50%", animation:"spin 0.8s linear infinite" }} /> Saving…</>
                    : "💾 Save Changes"
                  }
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}