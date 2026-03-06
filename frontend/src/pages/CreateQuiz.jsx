import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { courseAPI, quizAPI } from "../services/api.js";

/* ── Constants ────────────────────────────────────────────────────────────── */
const STEPS = [
  { label: "Quiz Setup",  icon: "⚙️" },
  { label: "Questions",   icon: "❓" },
  { label: "Review",      icon: "✅" },
];

const MAX_OPTIONS = 6;

/* ── Helpers ──────────────────────────────────────────────────────────────── */
const uid = () => Math.random().toString(36).slice(2);

const emptyQ = () => ({
  _key:         uid(),
  questionText: "",
  options:      ["", ""],
  correctIndex: -1,   // index into options[] that is the correct answer
});

/** Convert internal question state → API payload shape */
const toPayload = (q) => ({
  questionText:  q.questionText.trim(),
  options:       q.options.map((o) => o.trim()).filter(Boolean),
  correctAnswer: q.options[q.correctIndex]?.trim() || "",
});

/** Convert parsed question from API → internal state shape */
const fromParsed = (q) => ({
  _key:         uid(),
  questionText: q.questionText || "",
  options:      q.options?.length >= 2 ? q.options : [...(q.options || []), "", ""].slice(0, Math.max(2, (q.options || []).length)),
  correctIndex: (q.options || []).findIndex((o) => o === q.correctAnswer),
});

/* ── Shared style tokens ──────────────────────────────────────────────────── */
const inputStyle = {
  width: "100%",
  padding: "0.6rem 0.8rem",
  border: "1.5px solid var(--border)",
  borderRadius: 8,
  fontSize: "0.875rem",
  background: "var(--surface)",
  color: "var(--text)",
  outline: "none",
  boxSizing: "border-box",
  transition: "border-color 0.15s",
};

const selectStyle = {
  ...inputStyle,
  cursor: "pointer",
  appearance: "none",
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 10px center",
  paddingRight: "2.2rem",
};

const textareaStyle = {
  ...inputStyle,
  resize: "vertical",
  minHeight: 72,
  fontFamily: "inherit",
};

const btnPrimary = {
  padding: "0.65rem 1.5rem",
  background: "var(--primary)",
  color: "#fff",
  border: "none",
  borderRadius: 9,
  fontSize: "0.875rem",
  fontWeight: 600,
  cursor: "pointer",
};

const btnOutline = {
  padding: "0.65rem 1.5rem",
  background: "transparent",
  color: "var(--text-muted)",
  border: "1.5px solid var(--border)",
  borderRadius: 9,
  fontSize: "0.875rem",
  fontWeight: 600,
  cursor: "pointer",
};

const cardStyle = {
  background: "var(--surface)",
  border: "1.5px solid var(--border)",
  borderRadius: 14,
  padding: "1.4rem",
  marginBottom: "1rem",
};

/* ── Sub-components ───────────────────────────────────────────────────────── */
function Field({ label, required, hint, children }) {
  return (
    <div style={{ marginBottom: "1rem" }}>
      <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--text)", marginBottom: "0.35rem" }}>
        {label} {required && <span style={{ color: "var(--danger)" }}>*</span>}
      </label>
      {children}
      {hint && <p style={{ margin: "0.3rem 0 0", fontSize: "0.75rem", color: "var(--text-muted)" }}>{hint}</p>}
    </div>
  );
}

function StepNav({ current, total, onGo }) {
  return (
    <div style={{ display: "flex", gap: "0.25rem", background: "var(--bg-secondary)", borderRadius: 12, padding: "0.4rem", marginBottom: "2rem", flexWrap: "wrap" }}>
      {STEPS.map((s, i) => {
        const done   = i < current;
        const active = i === current;
        return (
          <button key={s.label} type="button" onClick={() => { if (i < current) onGo(i); }}
            style={{ flex: "1 1 0", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem",
              padding: "0.55rem 0.75rem", borderRadius: 9, border: "none", cursor: i < current ? "pointer" : "default",
              fontSize: "0.8rem", fontWeight: active ? 700 : 500,
              background: active ? "var(--primary)" : done ? "var(--primary-light)" : "transparent",
              color: active ? "#fff" : done ? "var(--primary)" : "var(--text-muted)",
              transition: "all 0.15s", whiteSpace: "nowrap",
            }}>
            <span>{s.icon}</span>
            <span className="step-label">{s.label}</span>
            {done && <span style={{ fontSize: "0.7rem" }}>✓</span>}
          </button>
        );
      })}
    </div>
  );
}

/* ── QuestionCard ─────────────────────────────────────────────────────────── */
function QuestionCard({ q, index, total, onChange, onRemove }) {
  const setField = (field, value) => onChange({ ...q, [field]: value });

  const setOptionText = (optIdx, value) => {
    const opts = [...q.options];
    opts[optIdx] = value;
    // Keep correctIndex pointing to the same option even if its text changed
    onChange({ ...q, options: opts });
  };

  const addOption = () => {
    if (q.options.length >= MAX_OPTIONS) return;
    onChange({ ...q, options: [...q.options, ""] });
  };

  const removeOption = (optIdx) => {
    const opts = q.options.filter((_, i) => i !== optIdx);
    const newCorrect = q.correctIndex === optIdx
      ? -1
      : q.correctIndex > optIdx
        ? q.correctIndex - 1
        : q.correctIndex;
    onChange({ ...q, options: opts, correctIndex: newCorrect });
  };

  const isValid =
    q.questionText.trim() &&
    q.options.filter((o) => o.trim()).length >= 2 &&
    q.correctIndex >= 0 &&
    q.options[q.correctIndex]?.trim();

  return (
    <div style={{
      ...cardStyle,
      border: `1.5px solid ${isValid ? "var(--border)" : "var(--warning)"}`,
      position: "relative",
    }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <div style={{ width: 28, height: 28, borderRadius: "50%", background: isValid ? "var(--primary)" : "var(--warning)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem", fontWeight: 700, flexShrink: 0 }}>
            {index + 1}
          </div>
          <span style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--text)" }}>Question {index + 1}</span>
          {!isValid && (
            <span style={{ fontSize: "0.72rem", background: "var(--warning-light)", color: "var(--warning-dark)", padding: "0.2rem 0.5rem", borderRadius: 999, fontWeight: 600 }}>
              Incomplete
            </span>
          )}
        </div>
        {total > 1 && (
          <button type="button" onClick={onRemove} style={{ background: "var(--danger-light)", color: "var(--danger)", border: "none", borderRadius: 7, padding: "0.3rem 0.7rem", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer" }}>
            Remove
          </button>
        )}
      </div>

      {/* Question text */}
      <Field label="Question Text" required>
        <textarea
          style={textareaStyle}
          placeholder="Enter the question here..."
          value={q.questionText}
          onChange={(e) => setField("questionText", e.target.value)}
          onFocus={(e) => (e.target.style.borderColor = "var(--primary)")}
          onBlur={(e)  => (e.target.style.borderColor = "var(--border)")}
        />
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
                {/* Correct answer radio */}
                <button
                  type="button"
                  onClick={() => onChange({ ...q, correctIndex: isCorrect ? -1 : optIdx })}
                  title={isCorrect ? "Marked as correct" : "Mark as correct answer"}
                  style={{
                    width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                    border: `2px solid ${isCorrect ? "var(--success)" : "var(--border)"}`,
                    background: isCorrect ? "var(--success)" : "transparent",
                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                    padding: 0, transition: "all 0.15s",
                  }}
                >
                  {isCorrect && (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>

                {/* Option letter label */}
                <span style={{ width: 22, textAlign: "center", fontSize: "0.8rem", fontWeight: 700, color: isCorrect ? "var(--success)" : "var(--text-muted)", flexShrink: 0 }}>
                  {String.fromCharCode(65 + optIdx)}
                </span>

                {/* Option text */}
                <input
                  style={{
                    ...inputStyle,
                    flex: 1,
                    border: `1.5px solid ${isCorrect ? "var(--success)" : "var(--border)"}`,
                    background: isCorrect ? "var(--success-lighter)" : "var(--surface)",
                  }}
                  placeholder={`Option ${String.fromCharCode(65 + optIdx)}`}
                  value={opt}
                  onChange={(e) => setOptionText(optIdx, e.target.value)}
                  onFocus={(e) => (e.target.style.borderColor = isCorrect ? "var(--success)" : "var(--primary)")}
                  onBlur={(e)  => (e.target.style.borderColor = isCorrect ? "var(--success)" : "var(--border)")}
                />

                {/* Remove option */}
                {q.options.length > 2 && (
                  <button type="button" onClick={() => removeOption(optIdx)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: "1.1rem", lineHeight: 1, padding: "0 4px", flexShrink: 0 }} title="Remove option">
                    ×
                  </button>
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

/* ── File Upload Zone ─────────────────────────────────────────────────────── */
function FileUploadZone({ onFile, uploading, dragOver, onDragOver, onDragLeave, onDrop, fileInputRef }) {
  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={() => !uploading && fileInputRef.current?.click()}
      style={{
        border: `2px dashed ${dragOver ? "var(--primary)" : "var(--border)"}`,
        borderRadius: 14,
        padding: "3rem 2rem",
        textAlign: "center",
        cursor: uploading ? "default" : "pointer",
        background: dragOver ? "var(--primary-lighter)" : "var(--bg-secondary)",
        transition: "all 0.2s",
      }}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,.csv,.xlsx,.xls"
        style={{ display: "none" }}
        onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
      />
      {uploading ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem" }}>
          <div style={{ width: 36, height: 36, border: "3px solid var(--border)", borderTopColor: "var(--primary)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          <span style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>Parsing file…</span>
        </div>
      ) : (
        <>
          <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>📂</div>
          <p style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--text)", marginBottom: "0.35rem" }}>
            {dragOver ? "Drop your file here" : "Drag & drop or click to browse"}
          </p>
          <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: 0 }}>
            Supported formats: <strong>JSON</strong>, <strong>CSV</strong>, <strong>Excel (.xlsx / .xls)</strong> — max 5 MB
          </p>
        </>
      )}
    </div>
  );
}

/* ── Format Guide ─────────────────────────────────────────────────────────── */
function FormatGuide() {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ marginTop: "1.25rem" }}>
      <button type="button" onClick={() => setOpen((v) => !v)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--primary)", fontSize: "0.82rem", fontWeight: 600, padding: 0, display: "flex", alignItems: "center", gap: "0.3rem" }}>
        <span>{open ? "▲" : "▼"}</span> View expected file format
      </button>
      {open && (
        <div style={{ marginTop: "0.75rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {/* JSON */}
          <div style={{ background: "var(--bg-secondary)", borderRadius: 10, padding: "0.9rem 1rem" }}>
            <div style={{ fontWeight: 700, fontSize: "0.8rem", marginBottom: "0.4rem" }}>JSON</div>
            <pre style={{ margin: 0, fontSize: "0.72rem", color: "var(--text-muted)", whiteSpace: "pre-wrap", fontFamily: "monospace" }}>{`[
  {
    "questionText": "What is 2 + 2?",
    "options": ["1", "2", "3", "4"],
    "correctAnswer": "4"
  },
  ...
]`}</pre>
          </div>
          {/* CSV */}
          <div style={{ background: "var(--bg-secondary)", borderRadius: 10, padding: "0.9rem 1rem" }}>
            <div style={{ fontWeight: 700, fontSize: "0.8rem", marginBottom: "0.4rem" }}>CSV (first row = header)</div>
            <pre style={{ margin: 0, fontSize: "0.72rem", color: "var(--text-muted)", whiteSpace: "pre-wrap", fontFamily: "monospace" }}>{`questionText,option1,option2,option3,option4,correctAnswer
What is 2+2?,1,2,3,4,4
Capital of France?,Berlin,Madrid,Paris,Rome,Paris`}</pre>
          </div>
          {/* Excel */}
          <div style={{ background: "var(--bg-secondary)", borderRadius: 10, padding: "0.9rem 1rem" }}>
            <div style={{ fontWeight: 700, fontSize: "0.8rem", marginBottom: "0.4rem" }}>Excel (.xlsx)</div>
            <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--text-muted)" }}>
              Same columns as CSV but in a spreadsheet. Use the first sheet. Column headers must match the CSV format above.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Main Page ────────────────────────────────────────────────────────────── */
export default function CreateQuiz() {
  const navigate  = useNavigate();
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

  const [setup, setSetup] = useState({
    courseId:    "",
    levelNumber: "",    // "" = general (no level), otherwise a number string
    title:       "",
    timeLimit:   "",    // minutes; "" = no limit
    totalMarks:  10,
  });

  /* ── Load courses ──────────────────────────────────────────────────────── */
  useEffect(() => {
    courseAPI.getAll()
      .then((res) => setCourses(res.data.data || []))
      .catch(() => {})
      .finally(() => setLoadingC(false));
  }, []);

  const selectedCourse = courses.find((c) => c._id === setup.courseId) || null;

  /* ── Setup field helpers ───────────────────────────────────────────────── */
  const setSetupField = (field) => (e) =>
    setSetup((prev) => ({ ...prev, [field]: e.target.value }));

  /* ── Question helpers ──────────────────────────────────────────────────── */
  const updateQ = (idx, updated) =>
    setQuestions((prev) => prev.map((q, i) => (i === idx ? updated : q)));

  const removeQ = (idx) =>
    setQuestions((prev) => prev.filter((_, i) => i !== idx));

  const addQ = () =>
    setQuestions((prev) => [...prev, emptyQ()]);

  /* ── File upload ───────────────────────────────────────────────────────── */
  const handleFile = async (file) => {
    setUploading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res    = await quizAPI.parseFile(fd);
      const parsed = (res.data.data || []).map(fromParsed);
      if (parsed.length === 0) {
        setError("No valid questions found in the file. Check the format guide below.");
        return;
      }
      const merge = window.confirm(
        `${parsed.length} question${parsed.length !== 1 ? "s" : ""} parsed.\n\nReplace existing questions with the imported ones?`
      );
      setQuestions(merge ? parsed : [...questions, ...parsed]);
      // Switch to manual view so user can review / edit
      setUploadMode(false);
    } catch (err) {
      setError(err.response?.data?.message || "File parsing failed. Check the format and try again.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  /* ── Validation ────────────────────────────────────────────────────────── */
  const validateStep = () => {
    setError("");
    if (step === 0) {
      if (!setup.courseId)    { setError("Please select a course.");     return false; }
      if (!setup.title.trim()) { setError("Quiz title is required.");    return false; }
    }
    if (step === 1) {
      if (questions.length === 0) { setError("Add at least one question."); return false; }
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        if (!q.questionText.trim()) {
          setError(`Question ${i + 1}: question text is required.`);
          return false;
        }
        const filled = q.options.filter((o) => o.trim());
        if (filled.length < 2) {
          setError(`Question ${i + 1}: provide at least 2 answer options.`);
          return false;
        }
        if (q.correctIndex < 0 || !q.options[q.correctIndex]?.trim()) {
          setError(`Question ${i + 1}: mark one option as the correct answer.`);
          return false;
        }
      }
    }
    return true;
  };

  const next = () => { if (validateStep()) setStep((s) => s + 1); };
  const back = () => { setError(""); setStep((s) => s - 1); };

  /* ── Submit ────────────────────────────────────────────────────────────── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const payload = {
        courseId:    setup.courseId,
        title:       setup.title.trim(),
        levelNumber: setup.levelNumber !== "" ? Number(setup.levelNumber) : null,
        timeLimit:   setup.timeLimit   !== "" ? Number(setup.timeLimit)   : null,
        totalMarks:  Number(setup.totalMarks) || 10,
        questions:   questions.map(toPayload),
      };
      await quizAPI.create(payload);
      navigate(`/courses/${setup.courseId}`);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create quiz. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  /* ══════════════════════════════════════════════════════════════════════════
     Step renders
  ══════════════════════════════════════════════════════════════════════════ */

  /* ── Step 0: Quiz Setup ────────────────────────────────────────────────── */
  const renderSetup = () => (
    <div style={cardStyle}>
      <h2 style={{ margin: "0 0 1.25rem", fontSize: "1rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <span>⚙️</span> Quiz Details
      </h2>

      {/* Course */}
      <Field label="Course" required hint="The quiz will be attached to this course.">
        {loadingC ? (
          <div style={{ ...inputStyle, color: "var(--text-muted)" }}>Loading courses…</div>
        ) : (
          <select
            style={selectStyle}
            value={setup.courseId}
            onChange={(e) => {
              setSetupField("courseId")(e);
              setSetup((p) => ({ ...p, courseId: e.target.value, levelNumber: "" }));
            }}
          >
            <option value="">— Select a course —</option>
            {courses.map((c) => (
              <option key={c._id} value={c._id}>{c.title}</option>
            ))}
          </select>
        )}
      </Field>

      {/* Level */}
      <Field label="Level / Module" hint="Choose a specific level or leave as General to attach to the whole course.">
        <select
          style={selectStyle}
          value={setup.levelNumber}
          onChange={setSetupField("levelNumber")}
          disabled={!selectedCourse}
        >
          <option value="">General (not level-specific)</option>
          {(selectedCourse?.levels || []).map((lv) => (
            <option key={lv.levelNumber} value={String(lv.levelNumber)}>
              Level {lv.levelNumber} — {lv.title}
            </option>
          ))}
        </select>
      </Field>

      {/* Title */}
      <Field label="Quiz Title" required>
        <input
          style={inputStyle}
          placeholder="e.g. Python Basics Quiz"
          value={setup.title}
          onChange={setSetupField("title")}
          onFocus={(e) => (e.target.style.borderColor = "var(--primary)")}
          onBlur={(e)  => (e.target.style.borderColor = "var(--border)")}
        />
      </Field>

      {/* Time limit + Total marks in a 2-col grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        <Field label="Time Limit" hint="Leave blank for no limit.">
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <input
              type="number"
              min={1}
              max={300}
              style={{ ...inputStyle, width: "7rem" }}
              placeholder="e.g. 30"
              value={setup.timeLimit}
              onChange={setSetupField("timeLimit")}
              onFocus={(e) => (e.target.style.borderColor = "var(--primary)")}
              onBlur={(e)  => (e.target.style.borderColor = "var(--border)")}
            />
            <span style={{ fontSize: "0.82rem", color: "var(--text-muted)", whiteSpace: "nowrap" }}>minutes</span>
          </div>
        </Field>

        <Field label="Total Marks" hint="Used for display purposes.">
          <input
            type="number"
            min={1}
            style={{ ...inputStyle, width: "7rem" }}
            value={setup.totalMarks}
            onChange={setSetupField("totalMarks")}
            onFocus={(e) => (e.target.style.borderColor = "var(--primary)")}
            onBlur={(e)  => (e.target.style.borderColor = "var(--border)")}
          />
        </Field>
      </div>
    </div>
  );

  /* ── Step 1: Questions ─────────────────────────────────────────────────── */
  const renderQuestions = () => (
    <div>
      {/* Tab bar: Manual / Upload */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem" }}>
        {[
          { id: false, icon: "✏️", label: "Manual Entry" },
          { id: true,  icon: "📁", label: "Upload File" },
        ].map((tab) => (
          <button
            key={String(tab.id)}
            type="button"
            onClick={() => { setUploadMode(tab.id); setError(""); }}
            style={{
              display: "flex", alignItems: "center", gap: "0.4rem",
              padding: "0.55rem 1.1rem", borderRadius: 9,
              border: `1.5px solid ${uploadMode === tab.id ? "var(--primary)" : "var(--border)"}`,
              background: uploadMode === tab.id ? "var(--primary)" : "var(--surface)",
              color: uploadMode === tab.id ? "#fff" : "var(--text-muted)",
              fontSize: "0.83rem", fontWeight: 600, cursor: "pointer", transition: "all 0.15s",
            }}>
            <span>{tab.icon}</span>{tab.label}
          </button>
        ))}
        <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", fontSize: "0.8rem", color: "var(--text-muted)" }}>
          {questions.length} question{questions.length !== 1 ? "s" : ""} added
        </span>
      </div>

      {uploadMode ? (
        /* ─── File Upload tab ─────────────────────────────────────────────── */
        <div style={cardStyle}>
          <h3 style={{ margin: "0 0 1rem", fontSize: "0.95rem", fontWeight: 700 }}>📁 Upload Quiz File</h3>
          <FileUploadZone
            onFile={handleFile}
            uploading={uploading}
            dragOver={dragOver}
            fileInputRef={fileInputRef}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
          />
          <FormatGuide />
          {questions.length > 0 && (
            <div style={{ marginTop: "1rem", padding: "0.75rem 1rem", background: "var(--success-lighter)", border: "1.5px solid var(--success-light)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
              <span style={{ fontSize: "0.83rem", color: "var(--success-dark)", fontWeight: 600 }}>
                ✓ {questions.length} question{questions.length !== 1 ? "s" : ""} ready
              </span>
              <button type="button" onClick={() => setUploadMode(false)} style={{ ...btnPrimary, padding: "0.4rem 1rem", fontSize: "0.8rem", background: "var(--success)" }}>
                Review Questions →
              </button>
            </div>
          )}
        </div>
      ) : (
        /* ─── Manual Entry tab ────────────────────────────────────────────── */
        <div>
          {questions.map((q, idx) => (
            <QuestionCard
              key={q._key}
              q={q}
              index={idx}
              total={questions.length}
              onChange={(updated) => updateQ(idx, updated)}
              onRemove={() => removeQ(idx)}
            />
          ))}

          <button
            type="button"
            onClick={addQ}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem", width: "100%", padding: "0.7rem", background: "var(--primary-light)", color: "var(--primary)", border: "1.5px dashed var(--primary)", borderRadius: 9, fontSize: "0.85rem", fontWeight: 600, cursor: "pointer" }}>
            + Add Question
          </button>
        </div>
      )}
    </div>
  );

  /* ── Step 2: Review ────────────────────────────────────────────────────── */
  const renderReview = () => {
    const course = selectedCourse;
    const levelLabel = setup.levelNumber
      ? `Level ${setup.levelNumber}${course?.levels?.find((l) => l.levelNumber === Number(setup.levelNumber)) ? ` — ${course.levels.find((l) => l.levelNumber === Number(setup.levelNumber)).title}` : ""}`
      : "General (whole course)";

    return (
      <div>
        {/* Summary card */}
        <div style={{ ...cardStyle, background: "var(--primary-lighter)", border: "1.5px solid var(--primary-light)" }}>
          <h3 style={{ margin: "0 0 0.75rem", fontSize: "1rem", fontWeight: 800 }}>{setup.title}</h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
            <Chip icon="📚" label={course?.title || "—"} />
            <Chip icon="🏗️" label={levelLabel} />
            <Chip icon="❓" label={`${questions.length} question${questions.length !== 1 ? "s" : ""}`} />
            {setup.timeLimit && <Chip icon="⏱️" label={`${setup.timeLimit} min`} />}
            <Chip icon="🏆" label={`${setup.totalMarks} marks`} />
          </div>
        </div>

        {/* Questions list */}
        <div style={cardStyle}>
          <h4 style={{ margin: "0 0 1rem", fontSize: "0.875rem", fontWeight: 700 }}>All Questions</h4>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {questions.map((q, idx) => {
              const payload = toPayload(q);
              return (
                <div key={q._key} style={{ padding: "0.85rem 1rem", background: "var(--bg-secondary)", borderRadius: 10 }}>
                  <div style={{ fontWeight: 600, fontSize: "0.875rem", marginBottom: "0.6rem" }}>
                    <span style={{ color: "var(--text-muted)", marginRight: "0.4rem", fontWeight: 700 }}>Q{idx + 1}.</span>
                    {payload.questionText || <span style={{ color: "var(--text-muted)", fontStyle: "italic" }}>No text</span>}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                    {payload.options.map((opt, oi) => {
                      const correct = opt === payload.correctAnswer;
                      return (
                        <div key={oi} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8rem" }}>
                          <span style={{ width: 20, height: 20, borderRadius: "50%", background: correct ? "var(--success)" : "var(--surface)", border: `1.5px solid ${correct ? "var(--success)" : "var(--border)"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            {correct && <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5"><polyline points="20 6 9 17 4 12" /></svg>}
                          </span>
                          <span style={{ color: correct ? "var(--success-dark)" : "var(--text)", fontWeight: correct ? 700 : 400 }}>
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

        <p style={{ textAlign: "center", fontSize: "0.82rem", color: "var(--text-muted)" }}>
          Everything looks good? Click <strong>Publish Quiz</strong> to save.
        </p>
      </div>
    );
  };

  const stepContent = [renderSetup, renderQuestions, renderReview];

  /* ── Layout ────────────────────────────────────────────────────────────── */
  return (
    <div className="page" style={{ maxWidth: 760, margin: "0 auto" }}>
      {/* Page header */}
      <div className="page-header" style={{ marginBottom: "1.5rem" }}>
        <button
          type="button"
          onClick={() => navigate(-1)}
          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.82rem", fontWeight: 600, padding: 0, marginBottom: "0.5rem" }}
        >
          ← Back
        </button>
        <h1 className="page-title">Create Quiz</h1>
        <p className="page-subtitle">Build a quiz manually or import questions from a file.</p>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <StepNav current={step} total={STEPS.length} onGo={setStep} />

        {error && (
          <div className="alert alert-error" style={{ marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            {error}
          </div>
        )}

        {stepContent[step]()}

        {/* Nav buttons */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1.25rem" }}>
          <button type="button" onClick={back} style={{ ...btnOutline, visibility: step === 0 ? "hidden" : "visible" }}>
            ← Back
          </button>

          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>Step {step + 1} of {STEPS.length}</span>

            {step < STEPS.length - 1 ? (
              <button type="button" onClick={next} style={btnPrimary}>
                Continue →
              </button>
            ) : (
              <button
                type="submit"
                disabled={submitting}
                style={{ ...btnPrimary, background: submitting ? "var(--text-muted)" : "var(--success)", minWidth: 160, display: "flex", alignItems: "center", gap: "0.4rem", justifyContent: "center" }}
              >
                {submitting ? (
                  <>
                    <span style={{ display: "inline-block", width: 14, height: 14, border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                    Publishing…
                  </>
                ) : "✓ Publish Quiz"}
              </button>
            )}
          </div>
        </div>
      </form>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 540px) { .step-label { display: none; } }
      `}</style>
    </div>
  );
}

/* ── Small chip badge used in Review ─────────────────────────────────────── */
function Chip({ icon, label }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", padding: "0.3rem 0.75rem", background: "var(--surface)", border: "1.5px solid var(--border)", borderRadius: 999, fontSize: "0.78rem", fontWeight: 600, color: "var(--text)" }}>
      {icon} {label}
    </span>
  );
}
