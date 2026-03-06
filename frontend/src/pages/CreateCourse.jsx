import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { courseAPI } from "../services/api.js";
import { AuthContext } from "../App.jsx";

/* ── Constants ────────────────────────────────────────────────────────────── */
const CATEGORIES = [
  "Programming",
  "Data Science",
  "Machine Learning",
  "Web Development",
  "Database",
  "Cybersecurity",
  "Cloud Computing",
  "Mobile Development",
  "Mathematics",
  "Other",
];

const DIFFICULTIES = ["Beginner", "Intermediate", "Advanced"];

const DIFF_STYLES = {
  Beginner:     { background: "#dcfce7", color: "#15803d" },
  Intermediate: { background: "#fef9c3", color: "#a16207" },
  Advanced:     { background: "#fee2e2", color: "#b91c1c" },
};

/* ── Empty state factories ────────────────────────────────────────────────── */
const emptyLevel = (num) => ({
  levelNumber: num,
  title:       "",
  studyNotes:  "",
  videoUrl:    "",
  isPublished: true,
});

const emptyLesson = (order) => ({
  title:   "",
  content: "",
  order,
});

/* ── Section Header ───────────────────────────────────────────────────────── */
function SectionHeader({ icon, title, description }) {
  return (
    <div style={{ marginBottom: "1.25rem" }}>
      <h2 style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "1.05rem", fontWeight: 700, color: "var(--text)", margin: 0 }}>
        <span style={{ fontSize: "1.2rem" }}>{icon}</span>
        {title}
      </h2>
      {description && (
        <p style={{ margin: "0.25rem 0 0", fontSize: "0.82rem", color: "var(--text-muted)" }}>{description}</p>
      )}
    </div>
  );
}

/* ── Form Field ───────────────────────────────────────────────────────────── */
function Field({ label, required, children, hint }) {
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

const textareaStyle = {
  ...inputStyle,
  resize: "vertical",
  minHeight: 80,
  fontFamily: "inherit",
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

/* ── Step indicator ───────────────────────────────────────────────────────── */
const STEPS = [
  { label: "Basic Info",   icon: "📝" },
  { label: "Topics",       icon: "🏷️" },
  { label: "Levels",       icon: "🏗️" },
  { label: "Lessons",      icon: "📖" },
  { label: "Review",       icon: "✅" },
];

function StepNav({ current, onGo }) {
  return (
    <div style={{
      display: "flex",
      gap: "0.25rem",
      background: "var(--bg-secondary)",
      borderRadius: 12,
      padding: "0.4rem",
      marginBottom: "2rem",
      flexWrap: "wrap",
    }}>
      {STEPS.map((s, i) => {
        const done    = i < current;
        const active  = i === current;
        return (
          <button
            key={s.label}
            type="button"
            onClick={() => onGo(i)}
            style={{
              flex: "1 1 0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.4rem",
              padding: "0.55rem 0.75rem",
              borderRadius: 9,
              border: "none",
              cursor: "pointer",
              fontSize: "0.8rem",
              fontWeight: active ? 700 : 500,
              background: active ? "var(--primary)" : done ? "var(--primary-light)" : "transparent",
              color: active ? "#fff" : done ? "var(--primary)" : "var(--text-muted)",
              transition: "all 0.15s",
              whiteSpace: "nowrap",
            }}
          >
            <span>{s.icon}</span>
            <span className="step-label">{s.label}</span>
            {done && <span style={{ fontSize: "0.7rem" }}>✓</span>}
          </button>
        );
      })}
    </div>
  );
}

/* ── Main Component ───────────────────────────────────────────────────────── */
export default function CreateCourse() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [step,       setStep]       = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState("");
  const [topicInput, setTopicInput] = useState("");

  /* ── Form state ─────────────────────────────────────────────────────── */
  const [basic, setBasic] = useState({
    title:       "",
    description: "",
    category:    "Programming",
    difficulty:  "Beginner",
    image:       "",
    maxAttempts: 3,
  });

  const [topics,  setTopics]  = useState([]);
  const [levels,  setLevels]  = useState([emptyLevel(1)]);
  const [lessons, setLessons] = useState([emptyLesson(1)]);

  /* ── Basic field helpers ─────────────────────────────────────────────── */
  const setBasicField = (field) => (e) =>
    setBasic((prev) => ({ ...prev, [field]: e.target.value }));

  /* ── Topics helpers ──────────────────────────────────────────────────── */
  const addTopic = () => {
    const t = topicInput.trim();
    if (t && !topics.includes(t)) {
      setTopics((prev) => [...prev, t]);
    }
    setTopicInput("");
  };

  const removeTopic = (idx) =>
    setTopics((prev) => prev.filter((_, i) => i !== idx));

  const handleTopicKey = (e) => {
    if (e.key === "Enter") { e.preventDefault(); addTopic(); }
  };

  /* ── Level helpers ───────────────────────────────────────────────────── */
  const setLevelField = (idx, field) => (e) => {
    const val = field === "isPublished" ? e.target.checked : e.target.value;
    setLevels((prev) => prev.map((l, i) => i === idx ? { ...l, [field]: val } : l));
  };

  const addLevel = () =>
    setLevels((prev) => [...prev, emptyLevel(prev.length + 1)]);

  const removeLevel = (idx) =>
    setLevels((prev) =>
      prev
        .filter((_, i) => i !== idx)
        .map((l, i) => ({ ...l, levelNumber: i + 1 }))
    );

  /* ── Lesson helpers ──────────────────────────────────────────────────── */
  const setLessonField = (idx, field) => (e) =>
    setLessons((prev) => prev.map((l, i) => i === idx ? { ...l, [field]: e.target.value } : l));

  const addLesson = () =>
    setLessons((prev) => [...prev, emptyLesson(prev.length + 1)]);

  const removeLesson = (idx) =>
    setLessons((prev) =>
      prev
        .filter((_, i) => i !== idx)
        .map((l, i) => ({ ...l, order: i + 1 }))
    );

  /* ── Validation ──────────────────────────────────────────────────────── */
  const validateStep = () => {
    setError("");
    if (step === 0) {
      if (!basic.title.trim())       { setError("Course title is required.");       return false; }
      if (!basic.description.trim()) { setError("Course description is required."); return false; }
    }
    if (step === 2) {
      for (let i = 0; i < levels.length; i++) {
        if (!levels[i].title.trim()) {
          setError(`Level ${i + 1} title is required.`);
          return false;
        }
      }
    }
    if (step === 3) {
      for (let i = 0; i < lessons.length; i++) {
        if (!lessons[i].title.trim() || !lessons[i].content.trim()) {
          setError(`Lesson ${i + 1} title and content are required.`);
          return false;
        }
      }
    }
    return true;
  };

  const next = () => { if (validateStep()) setStep((s) => s + 1); };
  const back = () => { setError(""); setStep((s) => s - 1); };

  /* ── Submit ──────────────────────────────────────────────────────────── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const payload = {
        title:       basic.title.trim(),
        description: basic.description.trim(),
        category:    basic.category,
        difficulty:  basic.difficulty,
        image:       basic.image.trim(),
        maxAttempts: Number(basic.maxAttempts) || 3,
        topics,
        levels,
        lessons,
      };
      const res = await courseAPI.create(payload);
      navigate(`/courses/${res.data.data._id}`);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create course. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Render helpers ──────────────────────────────────────────────────── */
  const cardStyle = {
    background: "var(--surface)",
    border: "1.5px solid var(--border)",
    borderRadius: 14,
    padding: "1.5rem",
    marginBottom: "1.25rem",
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
    transition: "background 0.15s",
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

  const btnDanger = {
    padding: "0.3rem 0.7rem",
    background: "var(--danger-light)",
    color: "var(--danger)",
    border: "none",
    borderRadius: 7,
    fontSize: "0.75rem",
    fontWeight: 600,
    cursor: "pointer",
  };

  const btnAdd = {
    display: "flex",
    alignItems: "center",
    gap: "0.4rem",
    padding: "0.55rem 1rem",
    background: "var(--primary-light)",
    color: "var(--primary)",
    border: "1.5px dashed var(--primary)",
    borderRadius: 9,
    fontSize: "0.82rem",
    fontWeight: 600,
    cursor: "pointer",
    width: "100%",
    justifyContent: "center",
    marginTop: "0.75rem",
  };

  /* ── Step 0: Basic Info ────────────────────────────────────────────── */
  const renderBasicInfo = () => (
    <div style={cardStyle}>
      <SectionHeader icon="📝" title="Course Information" description="Core details students will see on the course listing." />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        <div style={{ gridColumn: "1 / -1" }}>
          <Field label="Course Title" required>
            <input
              style={inputStyle}
              placeholder="e.g. Introduction to Python"
              value={basic.title}
              onChange={setBasicField("title")}
              onFocus={(e) => (e.target.style.borderColor = "var(--primary)")}
              onBlur={(e)  => (e.target.style.borderColor = "var(--border)")}
            />
          </Field>
        </div>

        <div style={{ gridColumn: "1 / -1" }}>
          <Field label="Course Description" required>
            <textarea
              style={{ ...textareaStyle, minHeight: 100 }}
              placeholder="Describe what students will learn in this course..."
              value={basic.description}
              onChange={setBasicField("description")}
              onFocus={(e) => (e.target.style.borderColor = "var(--primary)")}
              onBlur={(e)  => (e.target.style.borderColor = "var(--border)")}
            />
          </Field>
        </div>

        <Field label="Category">
          <select
            style={selectStyle}
            value={basic.category}
            onChange={setBasicField("category")}
          >
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>

        <Field label="Difficulty Level">
          <div style={{ display: "flex", gap: "0.5rem" }}>
            {DIFFICULTIES.map((d) => {
              const active = basic.difficulty === d;
              const ds = DIFF_STYLES[d];
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => setBasic((p) => ({ ...p, difficulty: d }))}
                  style={{
                    flex: 1,
                    padding: "0.6rem",
                    borderRadius: 8,
                    border: `2px solid ${active ? ds.color : "var(--border)"}`,
                    background: active ? ds.background : "transparent",
                    color: active ? ds.color : "var(--text-muted)",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >{d}</button>
              );
            })}
          </div>
        </Field>

        <div style={{ gridColumn: "1 / -1" }}>
          <Field label="Course Cover Image URL" hint="Paste a direct URL to an image (e.g. Unsplash). Leave blank to use a default gradient.">
            <input
              style={inputStyle}
              placeholder="https://images.unsplash.com/photo-..."
              value={basic.image}
              onChange={setBasicField("image")}
              onFocus={(e) => (e.target.style.borderColor = "var(--primary)")}
              onBlur={(e)  => (e.target.style.borderColor = "var(--border)")}
            />
          </Field>
        </div>

        <Field label="Max Quiz Attempts per Level" hint="How many times a student can attempt each level's quiz before they are blocked.">
          <input
            type="number"
            min={1}
            max={10}
            style={{ ...inputStyle, width: "8rem" }}
            value={basic.maxAttempts}
            onChange={setBasicField("maxAttempts")}
            onFocus={(e) => (e.target.style.borderColor = "var(--primary)")}
            onBlur={(e)  => (e.target.style.borderColor = "var(--border)")}
          />
        </Field>
      </div>
    </div>
  );

  /* ── Step 1: Topics ──────────────────────────────────────────────────── */
  const renderTopics = () => (
    <div style={cardStyle}>
      <SectionHeader icon="🏷️" title="Course Topics" description="List the key topics covered. Press Enter or click Add after each one." />

      <Field label="Add a Topic">
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <input
            style={{ ...inputStyle, flex: 1 }}
            placeholder="e.g. Variables, Control Flow, Functions..."
            value={topicInput}
            onChange={(e) => setTopicInput(e.target.value)}
            onKeyDown={handleTopicKey}
            onFocus={(e) => (e.target.style.borderColor = "var(--primary)")}
            onBlur={(e)  => (e.target.style.borderColor = "var(--border)")}
          />
          <button type="button" onClick={addTopic} style={{ ...btnPrimary, padding: "0.6rem 1.1rem", whiteSpace: "nowrap" }}>
            + Add
          </button>
        </div>
      </Field>

      {topics.length > 0 ? (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.5rem" }}>
          {topics.map((t, idx) => (
            <span key={idx} style={{
              display: "inline-flex", alignItems: "center", gap: "0.4rem",
              padding: "0.35rem 0.75rem",
              background: "var(--primary-light)", color: "var(--primary)",
              borderRadius: 999, fontSize: "0.8rem", fontWeight: 600,
            }}>
              {t}
              <button type="button" onClick={() => removeTopic(idx)} style={{
                background: "none", border: "none", cursor: "pointer",
                color: "var(--primary)", fontSize: "0.9rem", lineHeight: 1, padding: 0,
              }}>×</button>
            </span>
          ))}
        </div>
      ) : (
        <p style={{ color: "var(--text-muted)", fontSize: "0.82rem", fontStyle: "italic" }}>
          No topics added yet. Topics help students understand what the course covers.
        </p>
      )}
    </div>
  );

  /* ── Step 2: Levels ──────────────────────────────────────────────────── */
  const renderLevels = () => (
    <div>
      <div style={{ ...cardStyle, marginBottom: "0.75rem" }}>
        <SectionHeader
          icon="🏗️"
          title="Course Levels / Modules"
          description="Levels are unlocked sequentially — students must pass each level's quiz before advancing."
        />
      </div>

      {levels.map((level, idx) => (
        <div key={idx} style={{ ...cardStyle }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <div style={{
                width: 28, height: 28, borderRadius: "50%",
                background: "var(--primary)", color: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "0.8rem", fontWeight: 700, flexShrink: 0,
              }}>
                {idx + 1}
              </div>
              <span style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--text)" }}>
                Level {idx + 1}
              </span>
            </div>
            {levels.length > 1 && (
              <button type="button" onClick={() => removeLevel(idx)} style={btnDanger}>
                Remove
              </button>
            )}
          </div>

          <Field label="Level Title" required>
            <input
              style={inputStyle}
              placeholder={`e.g. Python Basics`}
              value={level.title}
              onChange={setLevelField(idx, "title")}
              onFocus={(e) => (e.target.style.borderColor = "var(--primary)")}
              onBlur={(e)  => (e.target.style.borderColor = "var(--border)")}
            />
          </Field>

          <Field label="Study Notes / Content" hint="Markdown is not rendered — plain text only.">
            <textarea
              style={{ ...textareaStyle, minHeight: 120 }}
              placeholder="Paste or type the study content for this level..."
              value={level.studyNotes}
              onChange={setLevelField(idx, "studyNotes")}
              onFocus={(e) => (e.target.style.borderColor = "var(--primary)")}
              onBlur={(e)  => (e.target.style.borderColor = "var(--border)")}
            />
          </Field>

          <Field label="Video URL" hint="YouTube or any direct video link for this level.">
            <input
              style={inputStyle}
              placeholder="https://www.youtube.com/watch?v=..."
              value={level.videoUrl}
              onChange={setLevelField(idx, "videoUrl")}
              onFocus={(e) => (e.target.style.borderColor = "var(--primary)")}
              onBlur={(e)  => (e.target.style.borderColor = "var(--border)")}
            />
          </Field>

          <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontSize: "0.82rem", fontWeight: 600, color: "var(--text)" }}>
            <input
              type="checkbox"
              checked={level.isPublished}
              onChange={setLevelField(idx, "isPublished")}
              style={{ width: 16, height: 16, accentColor: "var(--primary)" }}
            />
            Published (visible to students immediately)
          </label>
        </div>
      ))}

      <button type="button" onClick={addLevel} style={btnAdd}>
        <span style={{ fontSize: "1.1rem" }}>+</span> Add Level
      </button>
    </div>
  );

  /* ── Step 3: Lessons ─────────────────────────────────────────────────── */
  const renderLessons = () => (
    <div>
      <div style={{ ...cardStyle, marginBottom: "0.75rem" }}>
        <SectionHeader
          icon="📖"
          title="Lessons / Learning Materials"
          description="Lessons are the individual reading units listed inside the course overview."
        />
      </div>

      {lessons.map((lesson, idx) => (
        <div key={idx} style={{ ...cardStyle }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <span style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--text)" }}>
              Lesson {idx + 1}
            </span>
            {lessons.length > 1 && (
              <button type="button" onClick={() => removeLesson(idx)} style={btnDanger}>
                Remove
              </button>
            )}
          </div>

          <Field label="Lesson Title" required>
            <input
              style={inputStyle}
              placeholder="e.g. Variables and Data Types"
              value={lesson.title}
              onChange={setLessonField(idx, "title")}
              onFocus={(e) => (e.target.style.borderColor = "var(--primary)")}
              onBlur={(e)  => (e.target.style.borderColor = "var(--border)")}
            />
          </Field>

          <Field label="Lesson Content" required>
            <textarea
              style={{ ...textareaStyle, minHeight: 100 }}
              placeholder="Summarise what this lesson covers..."
              value={lesson.content}
              onChange={setLessonField(idx, "content")}
              onFocus={(e) => (e.target.style.borderColor = "var(--primary)")}
              onBlur={(e)  => (e.target.style.borderColor = "var(--border)")}
            />
          </Field>
        </div>
      ))}

      <button type="button" onClick={addLesson} style={btnAdd}>
        <span style={{ fontSize: "1.1rem" }}>+</span> Add Lesson
      </button>
    </div>
  );

  /* ── Step 4: Review ──────────────────────────────────────────────────── */
  const renderReview = () => {
    const ds = DIFF_STYLES[basic.difficulty];
    return (
      <div>
        {/* Summary header */}
        <div style={{ ...cardStyle, display: "flex", gap: "1.25rem", alignItems: "flex-start" }}>
          {basic.image ? (
            <img
              src={basic.image}
              alt="cover"
              style={{ width: 100, height: 70, objectFit: "cover", borderRadius: 10, flexShrink: 0 }}
              onError={(e) => { e.target.style.display = "none"; }}
            />
          ) : (
            <div style={{
              width: 100, height: 70, borderRadius: 10, flexShrink: 0,
              background: "var(--primary-gradient)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "1.8rem",
            }}>📚</div>
          )}
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: "0 0 0.3rem", fontSize: "1.1rem", fontWeight: 800 }}>{basic.title || "Untitled Course"}</h3>
            <p style={{ margin: "0 0 0.5rem", fontSize: "0.82rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
              {basic.description || "—"}
            </p>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              <span style={{ padding: "0.25rem 0.65rem", borderRadius: 999, background: "var(--primary-light)", color: "var(--primary)", fontSize: "0.75rem", fontWeight: 600 }}>
                {basic.category}
              </span>
              <span style={{ padding: "0.25rem 0.65rem", borderRadius: 999, ...ds, fontSize: "0.75rem", fontWeight: 600 }}>
                {basic.difficulty}
              </span>
              <span style={{ padding: "0.25rem 0.65rem", borderRadius: 999, background: "var(--surface-2)", color: "var(--text-muted)", fontSize: "0.75rem", fontWeight: 600 }}>
                {levels.length} level{levels.length !== 1 ? "s" : ""}
              </span>
              <span style={{ padding: "0.25rem 0.65rem", borderRadius: 999, background: "var(--surface-2)", color: "var(--text-muted)", fontSize: "0.75rem", fontWeight: 600 }}>
                {lessons.length} lesson{lessons.length !== 1 ? "s" : ""}
              </span>
              <span style={{ padding: "0.25rem 0.65rem", borderRadius: 999, background: "var(--warning-light)", color: "var(--warning-dark)", fontSize: "0.75rem", fontWeight: 600 }}>
                Max {basic.maxAttempts} attempt{basic.maxAttempts !== 1 ? "s" : ""} / level
              </span>
            </div>
          </div>
        </div>

        {/* Topics */}
        {topics.length > 0 && (
          <div style={cardStyle}>
            <h4 style={{ margin: "0 0 0.75rem", fontSize: "0.875rem", fontWeight: 700 }}>🏷️ Topics</h4>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
              {topics.map((t, i) => (
                <span key={i} style={{ padding: "0.3rem 0.7rem", background: "var(--primary-light)", color: "var(--primary)", borderRadius: 999, fontSize: "0.78rem", fontWeight: 600 }}>
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Levels summary */}
        <div style={cardStyle}>
          <h4 style={{ margin: "0 0 0.75rem", fontSize: "0.875rem", fontWeight: 700 }}>🏗️ Levels ({levels.length})</h4>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            {levels.map((l, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", padding: "0.7rem", background: "var(--bg-secondary)", borderRadius: 9 }}>
                <div style={{ width: 24, height: 24, borderRadius: "50%", background: "var(--primary)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: 700, flexShrink: 0, marginTop: 1 }}>
                  {i + 1}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: "0.875rem", marginBottom: 2 }}>{l.title || "Untitled Level"}</div>
                  {l.videoUrl && (
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      🎬 {l.videoUrl}
                    </div>
                  )}
                  {l.studyNotes && (
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      📄 {l.studyNotes.slice(0, 80)}{l.studyNotes.length > 80 ? "…" : ""}
                    </div>
                  )}
                </div>
                <span style={{ fontSize: "0.7rem", padding: "0.2rem 0.5rem", borderRadius: 6, background: l.isPublished ? "var(--success-light)" : "var(--surface-2)", color: l.isPublished ? "var(--success)" : "var(--text-muted)", fontWeight: 600, flexShrink: 0 }}>
                  {l.isPublished ? "Published" : "Draft"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Lessons summary */}
        <div style={cardStyle}>
          <h4 style={{ margin: "0 0 0.75rem", fontSize: "0.875rem", fontWeight: 700 }}>📖 Lessons ({lessons.length})</h4>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {lessons.map((l, i) => (
              <div key={i} style={{ display: "flex", gap: "0.6rem", padding: "0.6rem", background: "var(--bg-secondary)", borderRadius: 9 }}>
                <span style={{ fontWeight: 700, color: "var(--text-muted)", fontSize: "0.75rem", marginTop: 1, flexShrink: 0 }}>#{i + 1}</span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>{l.title || "Untitled Lesson"}</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 2 }}>
                    {l.content.slice(0, 100)}{l.content.length > 100 ? "…" : ""}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", textAlign: "center" }}>
          Review everything above, then click <strong>Publish Course</strong> to save.
        </p>
      </div>
    );
  };

  const stepContent = [renderBasicInfo, renderTopics, renderLevels, renderLessons, renderReview];

  /* ── Layout ──────────────────────────────────────────────────────────── */
  return (
    <div className="page" style={{ maxWidth: 780, margin: "0 auto" }}>
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => navigate(-1)}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.82rem", fontWeight: 600, padding: 0 }}
          >
            ← Back
          </button>
        </div>
        <h1 className="page-title" style={{ marginTop: "0.5rem" }}>Create New Course</h1>
        <p className="page-subtitle">
          Fill in each section to build a complete, structured course for your students.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        {/* Step navigation */}
        <StepNav current={step} onGo={(i) => { if (i < step) { setError(""); setStep(i); } }} />

        {/* Error banner */}
        {error && (
          <div className="alert alert-error" style={{ marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            {error}
          </div>
        )}

        {/* Current step content */}
        {stepContent[step]()}

        {/* Navigation buttons */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1rem" }}>
          <button type="button" onClick={back} style={{ ...btnOutline, visibility: step === 0 ? "hidden" : "visible" }}>
            ← Back
          </button>

          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
              Step {step + 1} of {STEPS.length}
            </span>

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
                ) : (
                  <>✓ Publish Course</>
                )}
              </button>
            )}
          </div>
        </div>
      </form>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 540px) {
          .step-label { display: none; }
        }
      `}</style>
    </div>
  );
}
