import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { courseAPI } from "../services/api.js";

const CATEGORIES = [
  "Programming","Data Science","Machine Learning","Web Development",
  "Database","Cybersecurity","Cloud Computing","Mobile Development","Mathematics","Other",
];
const DIFFICULTIES = ["Beginner", "Intermediate", "Advanced"];
const DIFF_STYLES = {
  Beginner:     { background: "#dcfce7", color: "#15803d" },
  Intermediate: { background: "#fef9c3", color: "#a16207" },
  Advanced:     { background: "#fee2e2", color: "#b91c1c" },
};

const emptyLevel  = (num) => ({ levelNumber: num, title: "", studyNotes: "", videoUrl: "", isPublished: true });
const emptyLesson = (order) => ({ title: "", content: "", order });

/* ── Shared UI atoms ──────────────────────────────────────────────────────── */
function SectionHeader({ icon, title, description }) {
  return (
    <div style={{ marginBottom: "1.25rem" }}>
      <h2 style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "1.05rem", fontWeight: 700, color: "var(--text)", margin: 0 }}>
        <span>{icon}</span>{title}
      </h2>
      {description && <p style={{ margin: "0.25rem 0 0", fontSize: "0.82rem", color: "var(--text-muted)" }}>{description}</p>}
    </div>
  );
}
function Field({ label, required, hint, children }) {
  return (
    <div style={{ marginBottom: "1.1rem" }}>
      <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--text)", marginBottom: "0.35rem" }}>
        {label} {required && <span style={{ color: "var(--danger)" }}>*</span>}
      </label>
      {children}
      {hint && <p style={{ margin: "0.3rem 0 0", fontSize: "0.75rem", color: "var(--text-muted)" }}>{hint}</p>}
    </div>
  );
}

const inputStyle   = { width: "100%", padding: "0.6rem 0.8rem", border: "1.5px solid var(--border)", borderRadius: 8, fontSize: "0.875rem", background: "var(--surface)", color: "var(--text)", outline: "none", boxSizing: "border-box", transition: "border-color 0.15s" };
const textareaStyle = { ...inputStyle, resize: "vertical", minHeight: 80, fontFamily: "inherit" };
const selectStyle  = { ...inputStyle, cursor: "pointer", appearance: "none", backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center", paddingRight: "2.2rem" };
const cardStyle    = { background: "var(--surface)", border: "1.5px solid var(--border)", borderRadius: 14, padding: "1.5rem", marginBottom: "1.25rem" };
const btnPrimary   = { padding: "0.65rem 1.5rem", background: "var(--primary)", color: "#fff", border: "none", borderRadius: 9, fontSize: "0.875rem", fontWeight: 600, cursor: "pointer" };
const btnOutline   = { padding: "0.65rem 1.5rem", background: "transparent", color: "var(--text-muted)", border: "1.5px solid var(--border)", borderRadius: 9, fontSize: "0.875rem", fontWeight: 600, cursor: "pointer" };
const btnDanger    = { padding: "0.3rem 0.7rem", background: "var(--danger-light)", color: "var(--danger)", border: "none", borderRadius: 7, fontSize: "0.75rem", fontWeight: 600, cursor: "pointer" };
const btnAdd       = { display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.55rem 1rem", background: "var(--primary-light)", color: "var(--primary)", border: "1.5px dashed var(--primary)", borderRadius: 9, fontSize: "0.82rem", fontWeight: 600, cursor: "pointer", width: "100%", justifyContent: "center", marginTop: "0.75rem" };

const STEPS = [
  { label: "Basic Info", icon: "📝" },
  { label: "Topics",     icon: "🏷️" },
  { label: "Levels",     icon: "🏗️" },
  { label: "Lessons",    icon: "📖" },
  { label: "Review",     icon: "✅" },
];
function StepNav({ current, onGo }) {
  return (
    <div style={{ display: "flex", gap: "0.25rem", background: "var(--bg-secondary)", borderRadius: 12, padding: "0.4rem", marginBottom: "2rem", flexWrap: "wrap" }}>
      {STEPS.map((s, i) => {
        const done = i < current; const active = i === current;
        return (
          <button key={s.label} type="button" onClick={() => onGo(i)} style={{ flex: "1 1 0", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem", padding: "0.55rem 0.75rem", borderRadius: 9, border: "none", cursor: "pointer", fontSize: "0.8rem", fontWeight: active ? 700 : 500, background: active ? "var(--primary)" : done ? "var(--primary-light)" : "transparent", color: active ? "#fff" : done ? "var(--primary)" : "var(--text-muted)", transition: "all 0.15s", whiteSpace: "nowrap" }}>
            <span>{s.icon}</span><span>{s.label}</span>{done && <span style={{ fontSize: "0.7rem" }}>✓</span>}
          </button>
        );
      })}
    </div>
  );
}

/* ── Main Component ───────────────────────────────────────────────────────── */
export default function EditCourse() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [step,       setStep]       = useState(0);
  const [loading,    setLoading]    = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState("");
  const [topicInput, setTopicInput] = useState("");

  const [basic, setBasic] = useState({
    title: "", description: "", category: "Programming", difficulty: "Beginner", image: "", maxAttempts: 3,
  });
  const [topics,  setTopics]  = useState([]);
  const [levels,  setLevels]  = useState([emptyLevel(1)]);
  const [lessons, setLessons] = useState([emptyLesson(1)]);

  /* ── Load existing course ─────────────────────────────────────────────── */
  useEffect(() => {
    courseAPI.getById(id)
      .then((res) => {
        const c = res.data.data;
        setBasic({
          title:       c.title       || "",
          description: c.description || "",
          category:    c.category    || "Other",
          difficulty:  c.difficulty  || "Beginner",
          image:       c.image       || "",
          maxAttempts: c.maxAttempts || 3,
        });
        setTopics(c.topics || []);
        setLevels(c.levels?.length > 0 ? c.levels.map((l) => ({
          levelNumber: l.levelNumber,
          title:       l.title       || "",
          studyNotes:  l.studyNotes  || "",
          videoUrl:    l.videoUrl    || "",
          isPublished: l.isPublished !== false,
        })) : [emptyLevel(1)]);
        setLessons(c.lessons?.length > 0 ? c.lessons.map((l) => ({
          title:   l.title   || "",
          content: l.content || "",
          order:   l.order   || 1,
        })) : [emptyLesson(1)]);
      })
      .catch(() => setError("Failed to load course."))
      .finally(() => setLoading(false));
  }, [id]);

  /* ── Field helpers ────────────────────────────────────────────────────── */
  const setBasicField   = (f) => (e) => setBasic((p) => ({ ...p, [f]: e.target.value }));
  const addTopic        = () => { const t = topicInput.trim(); if (t && !topics.includes(t)) setTopics((p) => [...p, t]); setTopicInput(""); };
  const removeTopic     = (idx) => setTopics((p) => p.filter((_, i) => i !== idx));
  const handleTopicKey  = (e) => { if (e.key === "Enter") { e.preventDefault(); addTopic(); } };
  const setLevelField   = (idx, f) => (e) => { const v = f === "isPublished" ? e.target.checked : e.target.value; setLevels((p) => p.map((l, i) => i === idx ? { ...l, [f]: v } : l)); };
  const addLevel        = () => setLevels((p) => [...p, emptyLevel(p.length + 1)]);
  const removeLevel     = (idx) => setLevels((p) => p.filter((_, i) => i !== idx).map((l, i) => ({ ...l, levelNumber: i + 1 })));
  const setLessonField  = (idx, f) => (e) => setLessons((p) => p.map((l, i) => i === idx ? { ...l, [f]: e.target.value } : l));
  const addLesson       = () => setLessons((p) => [...p, emptyLesson(p.length + 1)]);
  const removeLesson    = (idx) => setLessons((p) => p.filter((_, i) => i !== idx).map((l, i) => ({ ...l, order: i + 1 })));

  const validateStep = () => {
    setError("");
    if (step === 0) {
      if (!basic.title.trim())       { setError("Course title is required.");       return false; }
      if (!basic.description.trim()) { setError("Course description is required."); return false; }
    }
    if (step === 2) {
      for (let i = 0; i < levels.length; i++) {
        if (!levels[i].title.trim()) { setError(`Level ${i + 1} title is required.`); return false; }
      }
    }
    if (step === 3) {
      for (let i = 0; i < lessons.length; i++) {
        if (!lessons[i].title.trim() || !lessons[i].content.trim()) {
          setError(`Lesson ${i + 1} title and content are required.`); return false;
        }
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
      await courseAPI.update(id, {
        title:       basic.title.trim(),
        description: basic.description.trim(),
        category:    basic.category,
        difficulty:  basic.difficulty,
        image:       basic.image.trim(),
        maxAttempts: Number(basic.maxAttempts) || 3,
        topics, levels, lessons,
      });
      navigate(`/courses/${id}`);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update course.");
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Step renderers ───────────────────────────────────────────────────── */
  const renderBasicInfo = () => (
    <div style={cardStyle}>
      <SectionHeader icon="📝" title="Course Information" description="Update the core details students will see on the course listing." />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        <div style={{ gridColumn: "1 / -1" }}>
          <Field label="Course Title" required>
            <input style={inputStyle} value={basic.title} onChange={setBasicField("title")}
              onFocus={(e) => (e.target.style.borderColor = "var(--primary)")} onBlur={(e) => (e.target.style.borderColor = "var(--border)")} />
          </Field>
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <Field label="Course Description" required>
            <textarea style={{ ...textareaStyle, minHeight: 100 }} value={basic.description} onChange={setBasicField("description")}
              onFocus={(e) => (e.target.style.borderColor = "var(--primary)")} onBlur={(e) => (e.target.style.borderColor = "var(--border)")} />
          </Field>
        </div>
        <Field label="Category">
          <select style={selectStyle} value={basic.category} onChange={setBasicField("category")}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Difficulty Level">
          <div style={{ display: "flex", gap: "0.5rem" }}>
            {DIFFICULTIES.map((d) => {
              const active = basic.difficulty === d; const ds = DIFF_STYLES[d];
              return (
                <button key={d} type="button" onClick={() => setBasic((p) => ({ ...p, difficulty: d }))} style={{ flex: 1, padding: "0.6rem", borderRadius: 8, border: `2px solid ${active ? ds.color : "var(--border)"}`, background: active ? ds.background : "transparent", color: active ? ds.color : "var(--text-muted)", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer" }}>{d}</button>
              );
            })}
          </div>
        </Field>
        <div style={{ gridColumn: "1 / -1" }}>
          <Field label="Cover Image URL" hint="Paste a direct image URL, or leave blank.">
            <input style={inputStyle} value={basic.image} onChange={setBasicField("image")}
              onFocus={(e) => (e.target.style.borderColor = "var(--primary)")} onBlur={(e) => (e.target.style.borderColor = "var(--border)")} />
            {basic.image && (
              <div style={{ marginTop: "0.6rem", borderRadius: 8, overflow: "hidden", height: 110, background: `url("${basic.image}") center/cover no-repeat #f1f5f9`, border: "1.5px solid var(--border)" }} />
            )}
          </Field>
        </div>
        <Field label="Max Quiz Attempts per Level">
          <input type="number" min={1} max={10} style={{ ...inputStyle, width: "8rem" }} value={basic.maxAttempts} onChange={setBasicField("maxAttempts")}
            onFocus={(e) => (e.target.style.borderColor = "var(--primary)")} onBlur={(e) => (e.target.style.borderColor = "var(--border)")} />
        </Field>
      </div>
    </div>
  );

  const renderTopics = () => (
    <div style={cardStyle}>
      <SectionHeader icon="🏷️" title="Course Topics" description="Press Enter or click Add after each topic." />
      <Field label="Add a Topic">
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <input style={{ ...inputStyle, flex: 1 }} placeholder="e.g. Variables" value={topicInput}
            onChange={(e) => setTopicInput(e.target.value)} onKeyDown={handleTopicKey}
            onFocus={(e) => (e.target.style.borderColor = "var(--primary)")} onBlur={(e) => (e.target.style.borderColor = "var(--border)")} />
          <button type="button" style={{ ...btnPrimary, padding: "0.6rem 1rem", whiteSpace: "nowrap" }} onClick={addTopic}>+ Add</button>
        </div>
      </Field>
      {topics.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
          {topics.map((t, i) => (
            <span key={i} style={{ display: "flex", alignItems: "center", gap: "0.3rem", padding: "4px 12px", borderRadius: 999, background: "var(--primary-light)", color: "var(--primary)", fontSize: "0.82rem", fontWeight: 600 }}>
              {t}
              <button type="button" onClick={() => removeTopic(i)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--primary)", fontWeight: 700, fontSize: "0.9rem", lineHeight: 1, padding: 0 }}>×</button>
            </span>
          ))}
        </div>
      )}
    </div>
  );

  const renderLevels = () => (
    <div>
      <SectionHeader icon="🏗️" title="Levels / Modules" description="Each level is a learning module with study notes, a video, and a quiz." />
      {levels.map((lv, idx) => (
        <div key={idx} style={{ ...cardStyle, borderLeft: "4px solid var(--primary)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.85rem" }}>
            <span style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--primary)" }}>Level {lv.levelNumber}</span>
            {levels.length > 1 && <button type="button" style={btnDanger} onClick={() => removeLevel(idx)}>Remove</button>}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.9rem" }}>
            <div style={{ gridColumn: "1 / -1" }}>
              <Field label="Level Title" required>
                <input style={inputStyle} placeholder={`Level ${lv.levelNumber} Title`} value={lv.title} onChange={setLevelField(idx, "title")}
                  onFocus={(e) => (e.target.style.borderColor = "var(--primary)")} onBlur={(e) => (e.target.style.borderColor = "var(--border)")} />
              </Field>
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <Field label="Study Notes">
                <textarea style={{ ...textareaStyle, minHeight: 90 }} placeholder="Add notes, theory, or explanations..." value={lv.studyNotes} onChange={setLevelField(idx, "studyNotes")}
                  onFocus={(e) => (e.target.style.borderColor = "var(--primary)")} onBlur={(e) => (e.target.style.borderColor = "var(--border)")} />
              </Field>
            </div>
            <Field label="Video URL" hint="YouTube embed or direct video URL.">
              <input style={inputStyle} placeholder="https://youtube.com/embed/..." value={lv.videoUrl} onChange={setLevelField(idx, "videoUrl")}
                onFocus={(e) => (e.target.style.borderColor = "var(--primary)")} onBlur={(e) => (e.target.style.borderColor = "var(--border)")} />
            </Field>
            <Field label="Published">
              <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                <input type="checkbox" checked={lv.isPublished} onChange={setLevelField(idx, "isPublished")} />
                <span style={{ fontSize: "0.82rem" }}>Visible to students</span>
              </label>
            </Field>
          </div>
        </div>
      ))}
      <button type="button" style={btnAdd} onClick={addLevel}>+ Add Level</button>
    </div>
  );

  const renderLessons = () => (
    <div>
      <SectionHeader icon="📖" title="Lessons" description="Supplementary text lessons for the course." />
      {lessons.map((ls, idx) => (
        <div key={idx} style={{ ...cardStyle, borderLeft: "4px solid #10b981" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
            <span style={{ fontWeight: 700, fontSize: "0.9rem", color: "#10b981" }}>Lesson {idx + 1}</span>
            {lessons.length > 1 && <button type="button" style={btnDanger} onClick={() => removeLesson(idx)}>Remove</button>}
          </div>
          <Field label="Title" required>
            <input style={inputStyle} placeholder="Lesson Title" value={ls.title} onChange={setLessonField(idx, "title")}
              onFocus={(e) => (e.target.style.borderColor = "var(--primary)")} onBlur={(e) => (e.target.style.borderColor = "var(--border)")} />
          </Field>
          <Field label="Content" required>
            <textarea style={{ ...textareaStyle, minHeight: 110 }} placeholder="Lesson content, notes, or reading material..." value={ls.content} onChange={setLessonField(idx, "content")}
              onFocus={(e) => (e.target.style.borderColor = "var(--primary)")} onBlur={(e) => (e.target.style.borderColor = "var(--border)")} />
          </Field>
        </div>
      ))}
      <button type="button" style={btnAdd} onClick={addLesson}>+ Add Lesson</button>
    </div>
  );

  const renderReview = () => (
    <div style={cardStyle}>
      <SectionHeader icon="✅" title="Review Changes" description="Confirm everything looks correct before saving." />
      <div style={{ display: "grid", gap: "0.75rem" }}>
        <ReviewRow label="Title"        value={basic.title} />
        <ReviewRow label="Category"     value={basic.category} />
        <ReviewRow label="Difficulty"   value={basic.difficulty} />
        <ReviewRow label="Max Attempts" value={basic.maxAttempts} />
        <ReviewRow label="Topics"       value={topics.length > 0 ? topics.join(", ") : "—"} />
        <ReviewRow label="Levels"       value={`${levels.length} level${levels.length !== 1 ? "s" : ""}: ${levels.map((l) => l.title || `Level ${l.levelNumber}`).join(", ")}`} />
        <ReviewRow label="Lessons"      value={`${lessons.length} lesson${lessons.length !== 1 ? "s" : ""}`} />
      </div>
    </div>
  );

  const stepContent = [renderBasicInfo, renderTopics, renderLevels, renderLessons, renderReview];

  if (loading) return <div className="spinner-wrap"><div className="spinner" /><span>Loading course…</span></div>;

  return (
    <div className="page" style={{ maxWidth: 780 }}>
      <div className="page-header">
        <h1 className="page-title">Edit Course</h1>
        <p className="page-subtitle">Update the course content, levels, and settings.</p>
      </div>

      <StepNav current={step} onGo={(i) => { if (i < step) { setError(""); setStep(i); } }} />

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

function ReviewRow({ label, value }) {
  return (
    <div style={{ display: "flex", gap: "0.75rem", padding: "0.6rem 0.75rem", background: "var(--bg)", borderRadius: 8, fontSize: "0.875rem" }}>
      <span style={{ fontWeight: 700, color: "var(--text-muted)", minWidth: 120 }}>{label}</span>
      <span style={{ color: "var(--text)" }}>{String(value)}</span>
    </div>
  );
}
