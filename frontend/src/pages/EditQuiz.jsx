import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { quizAPI } from "../services/api.js";

/* ── Constants ────────────────────────────────────────────────────────────── */
const STEPS = [
  { label: "Quiz Setup", icon: "⚙️" },
  { label: "Questions",  icon: "❓" },
  { label: "Review",     icon: "✅" },
];
const MAX_OPTIONS = 6;

/* ── Helpers ──────────────────────────────────────────────────────────────── */
const uid = () => Math.random().toString(36).slice(2);

const emptyQ = () => ({
  _key:         uid(),
  questionText: "",
  options:      ["", ""],
  correctIndex: -1,
});

const toPayload = (q) => ({
  questionText:  q.questionText.trim(),
  options:       q.options.map((o) => o.trim()).filter(Boolean),
  correctAnswer: q.options[q.correctIndex]?.trim() || "",
});

const fromAPI = (q) => ({
  _key:         uid(),
  questionText: q.questionText || "",
  options:      q.options?.length >= 2 ? [...q.options] : [...(q.options || []), "", ""].slice(0, Math.max(2, (q.options || []).length)),
  correctIndex: (q.options || []).findIndex((o) => o === q.correctAnswer),
});

/* ── Styles ───────────────────────────────────────────────────────────────── */
const inputStyle = { width: "100%", padding: "0.6rem 0.8rem", border: "1.5px solid var(--border)", borderRadius: 8, fontSize: "0.875rem", background: "var(--surface)", color: "var(--text)", outline: "none", boxSizing: "border-box", transition: "border-color 0.15s" };
const textareaStyle = { ...inputStyle, resize: "vertical", minHeight: 72, fontFamily: "inherit" };
const cardStyle = { background: "var(--surface)", border: "1.5px solid var(--border)", borderRadius: 14, padding: "1.4rem", marginBottom: "1rem" };
const btnPrimary = { padding: "0.65rem 1.5rem", background: "var(--primary)", color: "#fff", border: "none", borderRadius: 9, fontSize: "0.875rem", fontWeight: 600, cursor: "pointer" };
const btnOutline = { padding: "0.65rem 1.5rem", background: "transparent", color: "var(--text-muted)", border: "1.5px solid var(--border)", borderRadius: 9, fontSize: "0.875rem", fontWeight: 600, cursor: "pointer" };

/* ── Sub-components ───────────────────────────────────────────────────────── */
function Field({ label, required, hint, children }) {
  return (
    <div style={{ marginBottom: "1rem" }}>
      <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--text)", marginBottom: "0.35rem" }}>
        {label}{required && <span style={{ color: "var(--danger)" }}> *</span>}
      </label>
      {children}
      {hint && <p style={{ margin: "0.3rem 0 0", fontSize: "0.75rem", color: "var(--text-muted)" }}>{hint}</p>}
    </div>
  );
}

function StepNav({ current, onGo }) {
  return (
    <div style={{ display: "flex", gap: "0.25rem", background: "var(--bg-secondary)", borderRadius: 12, padding: "0.4rem", marginBottom: "2rem", flexWrap: "wrap" }}>
      {STEPS.map((s, i) => {
        const done = i < current; const active = i === current;
        return (
          <button key={s.label} type="button" onClick={() => { if (i < current) onGo(i); }}
            style={{ flex: "1 1 0", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem", padding: "0.55rem 0.75rem", borderRadius: 9, border: "none", cursor: i < current ? "pointer" : "default", fontSize: "0.8rem", fontWeight: active ? 700 : 500, background: active ? "var(--primary)" : done ? "var(--primary-light)" : "transparent", color: active ? "#fff" : done ? "var(--primary)" : "var(--text-muted)", transition: "all 0.15s", whiteSpace: "nowrap" }}>
            <span>{s.icon}</span><span>{s.label}</span>{done && <span style={{ fontSize: "0.7rem" }}>✓</span>}
          </button>
        );
      })}
    </div>
  );
}

function QuestionCard({ q, index, total, onChange, onRemove }) {
  const setOptionText = (optIdx, value) => {
    const opts = [...q.options]; opts[optIdx] = value;
    onChange({ ...q, options: opts });
  };
  const addOption = () => { if (q.options.length >= MAX_OPTIONS) return; onChange({ ...q, options: [...q.options, ""] }); };
  const removeOption = (optIdx) => {
    const opts = q.options.filter((_, i) => i !== optIdx);
    const newCorrect = q.correctIndex === optIdx ? -1 : q.correctIndex > optIdx ? q.correctIndex - 1 : q.correctIndex;
    onChange({ ...q, options: opts, correctIndex: newCorrect });
  };
  const isValid = q.questionText.trim() && q.options.filter((o) => o.trim()).length >= 2 && q.correctIndex >= 0 && q.options[q.correctIndex]?.trim();

  return (
    <div style={{ ...cardStyle, border: `1.5px solid ${isValid ? "var(--border)" : "var(--warning)"}` }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <div style={{ width: 28, height: 28, borderRadius: "50%", background: isValid ? "var(--primary)" : "var(--warning)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem", fontWeight: 700, flexShrink: 0 }}>
            {index + 1}
          </div>
          <span style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--text)" }}>Question {index + 1}</span>
          {!isValid && <span style={{ fontSize: "0.72rem", background: "var(--warning-light)", color: "var(--warning-dark)", padding: "0.2rem 0.5rem", borderRadius: 999, fontWeight: 600 }}>Incomplete</span>}
        </div>
        {total > 1 && (
          <button type="button" onClick={onRemove} style={{ background: "var(--danger-light)", color: "var(--danger)", border: "none", borderRadius: 7, padding: "0.3rem 0.7rem", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer" }}>
            Remove
          </button>
        )}
      </div>

      {/* Question text */}
      <Field label="Question Text" required>
        <textarea style={textareaStyle} placeholder="Enter the question here..." value={q.questionText}
          onChange={(e) => onChange({ ...q, questionText: e.target.value })}
          onFocus={(e) => (e.target.style.borderColor = "var(--primary)")} onBlur={(e) => (e.target.style.borderColor = "var(--border)")} />
      </Field>

      {/* Options */}
      <div>
        <label style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text)", display: "block", marginBottom: "0.5rem" }}>
          Answer Options <span style={{ color: "var(--danger)" }}>*</span>
          <span style={{ fontWeight: 400, color: "var(--text-muted)", marginLeft: "0.4rem" }}>(click the circle to mark the correct answer)</span>
        </label>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem" }}>
          {q.options.map((opt, optIdx) => {
            const isCorrect = q.correctIndex === optIdx;
            return (
              <div key={optIdx} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <button type="button" onClick={() => onChange({ ...q, correctIndex: isCorrect ? -1 : optIdx })}
                  style={{ width: 22, height: 22, borderRadius: "50%", flexShrink: 0, border: `2px solid ${isCorrect ? "var(--success)" : "var(--border)"}`, background: isCorrect ? "var(--success)" : "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0, transition: "all 0.15s" }}>
                  {isCorrect && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5"><polyline points="20 6 9 17 4 12" /></svg>}
                </button>
                <span style={{ width: 22, textAlign: "center", fontSize: "0.8rem", fontWeight: 700, color: isCorrect ? "var(--success)" : "var(--text-muted)", flexShrink: 0 }}>
                  {String.fromCharCode(65 + optIdx)}
                </span>
                <input style={{ ...inputStyle, flex: 1, border: `1.5px solid ${isCorrect ? "var(--success)" : "var(--border)"}`, background: isCorrect ? "var(--success-lighter)" : "var(--surface)" }}
                  placeholder={`Option ${String.fromCharCode(65 + optIdx)}`} value={opt}
                  onChange={(e) => setOptionText(optIdx, e.target.value)}
                  onFocus={(e) => (e.target.style.borderColor = isCorrect ? "var(--success)" : "var(--primary)")}
                  onBlur={(e) => (e.target.style.borderColor = isCorrect ? "var(--success)" : "var(--border)")} />
                {q.options.length > 2 && (
                  <button type="button" onClick={() => removeOption(optIdx)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: "1.1rem", lineHeight: 1, padding: "0 4px", flexShrink: 0 }}>×</button>
                )}
              </div>
            );
          })}
        </div>
        {q.options.length < MAX_OPTIONS && (
          <button type="button" onClick={addOption} style={{ marginTop: "0.6rem", display: "inline-flex", alignItems: "center", gap: "0.3rem", padding: "0.4rem 0.9rem", borderRadius: 7, border: "1.5px dashed var(--border)", background: "transparent", color: "var(--text-muted)", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer" }}>
            + Add Option
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Main Component ───────────────────────────────────────────────────────── */
export default function EditQuiz() {
  const { quizId } = useParams();
  const navigate = useNavigate();

  const [step,       setStep]       = useState(0);
  const [loading,    setLoading]    = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState("");
  const [courseId,   setCourseId]   = useState(null); // to redirect back

  const [setup, setSetup] = useState({
    title:       "",
    levelNumber: "",
    timeLimit:   "",
    totalMarks:  10,
  });
  const [questions, setQuestions] = useState([emptyQ()]);

  /* ── Load existing quiz ───────────────────────────────────────────────── */
  useEffect(() => {
    quizAPI.getById(quizId)
      .then((res) => {
        const q = res.data.data;
        setCourseId(q.courseId?._id || q.courseId || null);
        setSetup({
          title:       q.title        || "",
          levelNumber: q.levelNumber  != null ? String(q.levelNumber) : "",
          timeLimit:   q.timeLimit    != null ? String(q.timeLimit)   : "",
          totalMarks:  q.totalMarks   ?? 10,
        });
        setQuestions(q.questions?.length > 0 ? q.questions.map(fromAPI) : [emptyQ()]);
      })
      .catch(() => setError("Failed to load quiz."))
      .finally(() => setLoading(false));
  }, [quizId]);

  /* ── Helpers ──────────────────────────────────────────────────────────── */
  const setSetupField = (field) => (e) => setSetup((prev) => ({ ...prev, [field]: e.target.value }));
  const updateQ  = (idx, updated) => setQuestions((prev) => prev.map((q, i) => i === idx ? updated : q));
  const removeQ  = (idx)          => setQuestions((prev) => prev.filter((_, i) => i !== idx));
  const addQ     = ()             => setQuestions((prev) => [...prev, emptyQ()]);

  const validateStep = () => {
    setError("");
    if (step === 0) {
      if (!setup.title.trim()) { setError("Quiz title is required."); return false; }
    }
    if (step === 1) {
      if (questions.length === 0) { setError("Add at least one question."); return false; }
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        if (!q.questionText.trim()) { setError(`Question ${i + 1}: question text is required.`); return false; }
        if (q.options.filter((o) => o.trim()).length < 2) { setError(`Question ${i + 1}: provide at least 2 answer options.`); return false; }
        if (q.correctIndex < 0 || !q.options[q.correctIndex]?.trim()) { setError(`Question ${i + 1}: mark one option as the correct answer.`); return false; }
      }
    }
    return true;
  };

  const next = () => { if (validateStep()) setStep((s) => s + 1); };
  const back = () => { setError(""); setStep((s) => s - 1); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setSubmitting(true);
    try {
      await quizAPI.update(quizId, {
        title:       setup.title.trim(),
        levelNumber: setup.levelNumber !== "" ? Number(setup.levelNumber) : null,
        timeLimit:   setup.timeLimit   !== "" ? Number(setup.timeLimit)   : null,
        totalMarks:  Number(setup.totalMarks) || 10,
        questions:   questions.map(toPayload),
      });
      if (courseId) navigate(`/courses/${courseId}`);
      else          navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update quiz.");
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Step renderers ───────────────────────────────────────────────────── */
  const renderSetup = () => (
    <div style={cardStyle}>
      <h2 style={{ margin: "0 0 1.25rem", fontSize: "1rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <span>⚙️</span> Quiz Details
      </h2>
      <Field label="Quiz Title" required>
        <input style={inputStyle} placeholder="e.g. Python Basics Quiz" value={setup.title}
          onChange={setSetupField("title")}
          onFocus={(e) => (e.target.style.borderColor = "var(--primary)")} onBlur={(e) => (e.target.style.borderColor = "var(--border)")} />
      </Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        <Field label="Level Number" hint="Leave as-is or change the level this quiz belongs to.">
          <input type="number" min={1} style={{ ...inputStyle, width: "7rem" }} placeholder="e.g. 1" value={setup.levelNumber}
            onChange={setSetupField("levelNumber")}
            onFocus={(e) => (e.target.style.borderColor = "var(--primary)")} onBlur={(e) => (e.target.style.borderColor = "var(--border)")} />
        </Field>
        <Field label="Time Limit" hint="Leave blank for no limit.">
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <input type="number" min={1} max={300} style={{ ...inputStyle, width: "7rem" }} placeholder="e.g. 30" value={setup.timeLimit}
              onChange={setSetupField("timeLimit")}
              onFocus={(e) => (e.target.style.borderColor = "var(--primary)")} onBlur={(e) => (e.target.style.borderColor = "var(--border)")} />
            <span style={{ fontSize: "0.82rem", color: "var(--text-muted)", whiteSpace: "nowrap" }}>minutes</span>
          </div>
        </Field>
        <Field label="Total Marks">
          <input type="number" min={1} style={{ ...inputStyle, width: "7rem" }} value={setup.totalMarks}
            onChange={setSetupField("totalMarks")}
            onFocus={(e) => (e.target.style.borderColor = "var(--primary)")} onBlur={(e) => (e.target.style.borderColor = "var(--border)")} />
        </Field>
      </div>
    </div>
  );

  const renderQuestions = () => (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span>❓</span> Questions
        </h2>
        <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{questions.length} question{questions.length !== 1 ? "s" : ""}</span>
      </div>
      {questions.map((q, idx) => (
        <QuestionCard key={q._key} q={q} index={idx} total={questions.length}
          onChange={(updated) => updateQ(idx, updated)} onRemove={() => removeQ(idx)} />
      ))}
      <button type="button" onClick={addQ} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem", padding: "0.55rem 1rem", background: "var(--primary-light)", color: "var(--primary)", border: "1.5px dashed var(--primary)", borderRadius: 9, fontSize: "0.82rem", fontWeight: 600, cursor: "pointer", width: "100%", marginTop: "0.5rem" }}>
        + Add Question
      </button>
    </div>
  );

  const renderReview = () => (
    <div style={cardStyle}>
      <h2 style={{ margin: "0 0 1.25rem", fontSize: "1rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <span>✅</span> Review Changes
      </h2>
      <div style={{ display: "grid", gap: "0.75rem" }}>
        {[
          ["Title",       setup.title || "—"],
          ["Level",       setup.levelNumber || "General"],
          ["Time Limit",  setup.timeLimit ? `${setup.timeLimit} minutes` : "No limit"],
          ["Total Marks", setup.totalMarks],
          ["Questions",   `${questions.length} question${questions.length !== 1 ? "s" : ""}`],
        ].map(([label, value]) => (
          <div key={label} style={{ display: "flex", gap: "0.75rem", padding: "0.6rem 0.75rem", background: "var(--bg)", borderRadius: 8, fontSize: "0.875rem" }}>
            <span style={{ fontWeight: 700, color: "var(--text-muted)", minWidth: 110 }}>{label}</span>
            <span style={{ color: "var(--text)" }}>{String(value)}</span>
          </div>
        ))}
      </div>
    </div>
  );

  const stepContent = [renderSetup, renderQuestions, renderReview];

  if (loading) return <div className="spinner-wrap"><div className="spinner" /><span>Loading quiz…</span></div>;

  return (
    <div className="page" style={{ maxWidth: 780 }}>
      <div className="page-header">
        <h1 className="page-title">Edit Quiz</h1>
        <p className="page-subtitle">Update quiz details, questions, and settings.</p>
      </div>

      <StepNav current={step} onGo={(i) => { setError(""); setStep(i); }} />

      <form onSubmit={handleSubmit}>
        {stepContent[step]()}

        {error && <div className="alert alert-error" style={{ marginTop: "1rem" }}>{error}</div>}

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "1.5rem" }}>
          <button type="button" style={step === 0 ? { ...btnOutline, opacity: 0.4, cursor: "not-allowed" } : btnOutline}
            disabled={step === 0} onClick={back}>← Back</button>
          {step < STEPS.length - 1
            ? <button type="button" style={btnPrimary} onClick={next}>Next →</button>
            : <button type="submit" style={{ ...btnPrimary, background: "#059669" }} disabled={submitting}>
                {submitting ? "Saving…" : "💾 Save Changes"}
              </button>
          }
        </div>
      </form>
    </div>
  );
}
