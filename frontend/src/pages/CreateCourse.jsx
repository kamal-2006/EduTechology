import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { courseAPI } from "../services/api.js";
import { AuthContext } from "../App.jsx";

/* ── Constants ─────────────────────────────────────────────── */
const CATEGORIES = ["Programming","Data Science","Machine Learning","Web Development","Database","Cybersecurity","Cloud Computing","Mobile Development","Mathematics","Other"];
const DIFFICULTIES = ["Beginner","Intermediate","Advanced"];
const DIFF_META = {
  Beginner:     { color:"#5eead4", bg:"rgba(94,234,212,0.1)",  border:"rgba(94,234,212,0.3)"  },
  Intermediate: { color:"#fbbf24", bg:"rgba(251,191,36,0.1)",  border:"rgba(251,191,36,0.3)"  },
  Advanced:     { color:"#f87171", bg:"rgba(248,113,113,0.1)", border:"rgba(248,113,113,0.3)" },
};
const STEPS = [
  { label:"Basic Info", icon:"📝" },
  { label:"Topics",     icon:"🏷️" },
  { label:"Levels",     icon:"🏗️" },
  { label:"Lessons",    icon:"📖" },
  { label:"Review",     icon:"✅" },
];

/* ── Factories ─────────────────────────────────────────────── */
const emptyLevel  = (num)   => ({ levelNumber:num, title:"", studyNotes:"", videoUrl:"", isPublished:true });
const emptyLesson = (order) => ({ title:"", content:"", order });

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
  .diff-btn { transition: all 0.15s; }
  .diff-btn:hover { opacity: 0.85; }
  .add-btn:hover { border-color:rgba(94,234,212,0.35) !important; color:rgba(94,234,212,0.75) !important; background:rgba(94,234,212,0.04) !important; }
  .step-pill { transition: all 0.2s; }
  .topic-tag { transition: all 0.15s; }
  @media (max-width: 600px) { .step-label { display:none; } }
`;

/* ── Design tokens ──────────────────────────────────────────── */
const T = {
  surface:  "rgba(255,255,255,0.03)",
  border:   "rgba(255,255,255,0.08)",
  text:     "rgba(226,232,240,0.88)",
  muted:    "rgba(148,163,184,0.5)",
  teal:     "#5eead4",
  indigo:   "#6366f1",
  red:      "#f87171",
  amber:    "#fbbf24",
  green:    "#34d399",
};

const darkInput = {
  width:"100%", padding:"0.65rem 0.9rem",
  border:`1.5px solid ${T.border}`, borderRadius:10,
  fontSize:"0.875rem", background:"rgba(255,255,255,0.04)",
  color:T.text, outline:"none", boxSizing:"border-box",
  fontFamily:"'Nunito',sans-serif",
};
const darkSelect = {
  ...darkInput, cursor:"pointer", appearance:"none",
  backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%235eead4' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
  backgroundRepeat:"no-repeat", backgroundPosition:"right 10px center", paddingRight:"2.2rem",
};
const darkTextarea = { ...darkInput, resize:"vertical", minHeight:88, fontFamily:"'Nunito',sans-serif" };
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
        {label} {required && <span style={{ color:T.red }}>*</span>}
      </label>
      {children}
      {hint && <p style={{ margin:"0.3rem 0 0", fontSize:"0.73rem", color:T.muted }}>{hint}</p>}
    </div>
  );
}

/* ── Section Header ─────────────────────────────────────────── */
function SectionHeader({ icon, title, description }) {
  return (
    <div style={{ marginBottom:"1.25rem" }}>
      <h2 style={{ display:"flex", alignItems:"center", gap:"0.5rem", fontSize:"1rem", fontWeight:800, color:T.text, margin:0, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
        <span>{icon}</span>{title}
      </h2>
      {description && <p style={{ margin:"0.25rem 0 0", fontSize:"0.8rem", color:T.muted }}>{description}</p>}
    </div>
  );
}

/* ── Step Nav ───────────────────────────────────────────────── */
function StepNav({ current, onGo }) {
  return (
    <div style={{ display:"flex", gap:"0.375rem", background:"rgba(255,255,255,0.025)", borderRadius:14, padding:"0.375rem", marginBottom:"2rem", border:`1px solid ${T.border}`, flexWrap:"wrap" }}>
      {STEPS.map((s, i) => {
        const done   = i < current;
        const active = i === current;
        return (
          <button key={s.label} type="button" onClick={() => onGo(i)} className="step-pill"
            style={{ flex:"1 1 0", display:"flex", alignItems:"center", justifyContent:"center", gap:"0.4rem", padding:"0.55rem 0.75rem", borderRadius:10, border:"none", cursor: i <= current ? "pointer" : "default", fontSize:"0.78rem", fontWeight:active ? 800 : 600, whiteSpace:"nowrap",
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

/* ── Main ───────────────────────────────────────────────────── */
export default function CreateCourse() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [step,       setStep]       = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState("");
  const [topicInput, setTopicInput] = useState("");

  const [basic,   setBasic]   = useState({ title:"", description:"", category:"Programming", difficulty:"Beginner", image:"", maxAttempts:3 });
  const [topics,  setTopics]  = useState([]);
  const [levels,  setLevels]  = useState([emptyLevel(1)]);
  const [lessons, setLessons] = useState([emptyLesson(1)]);

  const setBasicField  = (field) => (e) => setBasic(p => ({ ...p, [field]: e.target.value }));
  const setLevelField  = (idx, field) => (e) => { const val = field === "isPublished" ? e.target.checked : e.target.value; setLevels(p => p.map((l, i) => i === idx ? { ...l, [field]:val } : l)); };
  const setLessonField = (idx, field) => (e) => setLessons(p => p.map((l, i) => i === idx ? { ...l, [field]:e.target.value } : l));
  const addTopic       = () => { const t = topicInput.trim(); if (t && !topics.includes(t)) setTopics(p => [...p, t]); setTopicInput(""); };
  const removeTopic    = (idx) => setTopics(p => p.filter((_,i) => i !== idx));
  const addLevel       = () => setLevels(p => [...p, emptyLevel(p.length + 1)]);
  const removeLevel    = (idx) => setLevels(p => p.filter((_,i) => i !== idx).map((l,i) => ({ ...l, levelNumber:i+1 })));
  const addLesson      = () => setLessons(p => [...p, emptyLesson(p.length + 1)]);
  const removeLesson   = (idx) => setLessons(p => p.filter((_,i) => i !== idx).map((l,i) => ({ ...l, order:i+1 })));

  const validateStep = () => {
    setError("");
    if (step === 0) {
      if (!basic.title.trim())       { setError("Course title is required.");       return false; }
      if (!basic.description.trim()) { setError("Course description is required."); return false; }
    }
    if (step === 2) {
      for (let i = 0; i < levels.length; i++) {
        if (!levels[i].title.trim()) { setError(`Level ${i+1} title is required.`); return false; }
      }
    }
    if (step === 3) {
      for (let i = 0; i < lessons.length; i++) {
        if (!lessons[i].title.trim() || !lessons[i].content.trim()) { setError(`Lesson ${i+1} title and content are required.`); return false; }
      }
    }
    return true;
  };

  const next = () => { if (validateStep()) setStep(s => s + 1); };
  const back = () => { setError(""); setStep(s => s - 1); };

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(""); setSubmitting(true);
    try {
      const res = await courseAPI.create({ title:basic.title.trim(), description:basic.description.trim(), category:basic.category, difficulty:basic.difficulty, image:basic.image.trim(), maxAttempts:Number(basic.maxAttempts)||3, topics, levels, lessons });
      navigate(`/courses/${res.data.data._id}`);
    } catch (err) { setError(err.response?.data?.message || "Failed to create course."); }
    finally { setSubmitting(false); }
  };

  /* ── Step 0: Basic Info ─────────────────────────────────── */
  const renderBasicInfo = () => (
    <div style={cardDark}>
      <SectionHeader icon="📝" title="Course Information" description="Core details students will see on the course listing." />
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1rem" }}>
        <div style={{ gridColumn:"1 / -1" }}>
          <Field label="Course Title" required>
            <input className="dark-input" style={darkInput} placeholder="e.g. Introduction to Python" value={basic.title} onChange={setBasicField("title")} />
          </Field>
        </div>
        <div style={{ gridColumn:"1 / -1" }}>
          <Field label="Course Description" required>
            <textarea className="dark-input" style={{ ...darkTextarea, minHeight:100 }} placeholder="Describe what students will learn…" value={basic.description} onChange={setBasicField("description")} />
          </Field>
        </div>
        <Field label="Category">
          <select className="dark-input" style={darkSelect} value={basic.category} onChange={setBasicField("category")}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Difficulty Level">
          <div style={{ display:"flex", gap:"0.5rem" }}>
            {DIFFICULTIES.map(d => {
              const active = basic.difficulty === d;
              const dm = DIFF_META[d];
              return (
                <button key={d} type="button" className="diff-btn" onClick={() => setBasic(p => ({ ...p, difficulty:d }))}
                  style={{ flex:1, padding:"0.6rem", borderRadius:9, border:`1.5px solid ${active ? dm.border : T.border}`, background: active ? dm.bg : "transparent", color: active ? dm.color : T.muted, fontSize:"0.8rem", fontWeight:700, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                  {d}
                </button>
              );
            })}
          </div>
        </Field>
        <div style={{ gridColumn:"1 / -1" }}>
          <Field label="Course Cover Image URL" hint="Paste a direct URL (e.g. Unsplash). Leave blank for a default gradient.">
            <input className="dark-input" style={darkInput} placeholder="https://images.unsplash.com/photo-…" value={basic.image} onChange={setBasicField("image")} />
            {basic.image && (
              <div style={{ marginTop:"0.6rem", borderRadius:10, overflow:"hidden", height:110, background:`url("${basic.image}") center/cover no-repeat rgba(255,255,255,0.03)`, border:`1px solid ${T.border}` }} />
            )}
          </Field>
        </div>
        <Field label="Max Quiz Attempts per Level" hint="How many times a student can attempt each level's quiz before being blocked.">
          <input type="number" min={1} max={10} className="dark-input" style={{ ...darkInput, width:"8rem" }} value={basic.maxAttempts} onChange={setBasicField("maxAttempts")} />
        </Field>
      </div>
    </div>
  );

  /* ── Step 1: Topics ─────────────────────────────────────── */
  const renderTopics = () => (
    <div style={cardDark}>
      <SectionHeader icon="🏷️" title="Course Topics" description="List the key topics covered. Press Enter or click Add after each one." />
      <Field label="Add a Topic">
        <div style={{ display:"flex", gap:"0.5rem" }}>
          <input className="dark-input" style={{ ...darkInput, flex:1 }} placeholder="e.g. Variables, Control Flow, Functions…" value={topicInput}
            onChange={(e) => setTopicInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTopic(); } }} />
          <button type="button" onClick={addTopic}
            style={{ padding:"0.65rem 1.1rem", background:"linear-gradient(135deg,#14b8a6,#6366f1)", color:"white", border:"none", borderRadius:10, fontSize:"0.875rem", fontWeight:800, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif", whiteSpace:"nowrap", boxShadow:"0 3px 10px rgba(20,184,166,0.2)" }}>
            + Add
          </button>
        </div>
      </Field>
      {topics.length > 0 ? (
        <div style={{ display:"flex", flexWrap:"wrap", gap:"0.5rem", marginTop:"0.5rem" }}>
          {topics.map((t, idx) => (
            <span key={idx} className="topic-tag" style={{ display:"inline-flex", alignItems:"center", gap:"0.4rem", padding:"0.35rem 0.75rem", background:"rgba(99,102,241,0.1)", color:"rgba(129,140,248,0.85)", border:"1px solid rgba(99,102,241,0.22)", borderRadius:999, fontSize:"0.8rem", fontWeight:700, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
              {t}
              <button type="button" onClick={() => removeTopic(idx)} style={{ background:"none", border:"none", cursor:"pointer", color:"rgba(129,140,248,0.6)", fontSize:"1rem", lineHeight:1, padding:0 }}>×</button>
            </span>
          ))}
        </div>
      ) : (
        <p style={{ color:T.muted, fontSize:"0.82rem", fontStyle:"italic", marginTop:"0.5rem" }}>No topics added yet. Topics help students understand what the course covers.</p>
      )}
    </div>
  );

  /* ── Step 2: Levels ─────────────────────────────────────── */
  const renderLevels = () => (
    <div>
      <div style={{ ...cardDark, marginBottom:"0.75rem" }}>
        <SectionHeader icon="🏗️" title="Course Levels / Modules" description="Levels are unlocked sequentially — students must pass each level's quiz before advancing." />
      </div>
      {levels.map((level, idx) => (
        <div key={idx} style={{ ...cardDark }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1rem" }}>
            <div style={{ display:"flex", alignItems:"center", gap:"0.6rem" }}>
              <div style={{ width:28, height:28, borderRadius:8, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:"0.78rem", fontFamily:"'Plus Jakarta Sans',sans-serif", background:"linear-gradient(135deg,#14b8a6,#6366f1)", color:"white" }}>
                {idx + 1}
              </div>
              <span style={{ fontWeight:800, fontSize:"0.9rem", color:T.text, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>Level {idx + 1}</span>
            </div>
            {levels.length > 1 && (
              <button type="button" onClick={() => removeLevel(idx)} style={{ background:"rgba(248,113,113,0.08)", color:T.red, border:"1px solid rgba(248,113,113,0.2)", borderRadius:8, padding:"0.3rem 0.7rem", fontSize:"0.72rem", fontWeight:700, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                Remove
              </button>
            )}
          </div>
          <Field label="Level Title" required>
            <input className="dark-input" style={darkInput} placeholder="e.g. Python Basics" value={level.title} onChange={setLevelField(idx, "title")} />
          </Field>
          <Field label="Study Notes / Content" hint="Plain text only.">
            <textarea className="dark-input" style={{ ...darkTextarea, minHeight:110 }} placeholder="Paste or type the study content for this level…" value={level.studyNotes} onChange={setLevelField(idx, "studyNotes")} />
          </Field>
          <Field label="Video URL" hint="YouTube or any direct video link for this level.">
            <input className="dark-input" style={darkInput} placeholder="https://www.youtube.com/watch?v=…" value={level.videoUrl} onChange={setLevelField(idx, "videoUrl")} />
          </Field>
          <label style={{ display:"flex", alignItems:"center", gap:"0.6rem", cursor:"pointer", fontSize:"0.82rem", fontWeight:600, color:T.muted, fontFamily:"'Nunito',sans-serif", userSelect:"none" }}>
            <div style={{ position:"relative", width:34, height:20, borderRadius:999, background: level.isPublished ? "rgba(94,234,212,0.25)" : T.border, border:`1.5px solid ${level.isPublished ? "rgba(94,234,212,0.4)" : T.border}`, transition:"all 0.2s", cursor:"pointer" }}
              onClick={() => setLevels(p => p.map((l,i) => i === idx ? { ...l, isPublished:!l.isPublished } : l))}>
              <div style={{ position:"absolute", top:1, left: level.isPublished ? 14 : 1, width:14, height:14, borderRadius:"50%", background: level.isPublished ? T.teal : "rgba(148,163,184,0.4)", transition:"all 0.2s" }} />
            </div>
            <span style={{ color: level.isPublished ? T.teal : T.muted }}>
              {level.isPublished ? "Published" : "Draft"} — {level.isPublished ? "visible to students" : "hidden from students"}
            </span>
          </label>
        </div>
      ))}
      <button type="button" onClick={addLevel} className="add-btn" style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:"0.4rem", width:"100%", padding:"0.75rem", background:"rgba(99,102,241,0.04)", color:"rgba(129,140,248,0.6)", border:"1.5px dashed rgba(99,102,241,0.2)", borderRadius:12, fontSize:"0.85rem", fontWeight:700, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif", transition:"all 0.15s", marginTop:"0.25rem" }}>
        + Add Level
      </button>
    </div>
  );

  /* ── Step 3: Lessons ────────────────────────────────────── */
  const renderLessons = () => (
    <div>
      <div style={{ ...cardDark, marginBottom:"0.75rem" }}>
        <SectionHeader icon="📖" title="Lessons / Learning Materials" description="Lessons are the individual reading units listed inside the course overview." />
      </div>
      {lessons.map((lesson, idx) => (
        <div key={idx} style={{ ...cardDark }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1rem" }}>
            <div style={{ display:"flex", alignItems:"center", gap:"0.6rem" }}>
              <div style={{ width:28, height:28, borderRadius:8, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:"0.78rem", fontFamily:"'Plus Jakarta Sans',sans-serif", background:"rgba(99,102,241,0.15)", color:"rgba(129,140,248,0.85)", border:"1px solid rgba(99,102,241,0.2)" }}>
                {idx + 1}
              </div>
              <span style={{ fontWeight:800, fontSize:"0.9rem", color:T.text, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>Lesson {idx + 1}</span>
            </div>
            {lessons.length > 1 && (
              <button type="button" onClick={() => removeLesson(idx)} style={{ background:"rgba(248,113,113,0.08)", color:T.red, border:"1px solid rgba(248,113,113,0.2)", borderRadius:8, padding:"0.3rem 0.7rem", fontSize:"0.72rem", fontWeight:700, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                Remove
              </button>
            )}
          </div>
          <Field label="Lesson Title" required>
            <input className="dark-input" style={darkInput} placeholder="e.g. Variables and Data Types" value={lesson.title} onChange={setLessonField(idx, "title")} />
          </Field>
          <Field label="Lesson Content" required>
            <textarea className="dark-input" style={{ ...darkTextarea, minHeight:100 }} placeholder="Summarise what this lesson covers…" value={lesson.content} onChange={setLessonField(idx, "content")} />
          </Field>
        </div>
      ))}
      <button type="button" onClick={addLesson} className="add-btn" style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:"0.4rem", width:"100%", padding:"0.75rem", background:"rgba(99,102,241,0.04)", color:"rgba(129,140,248,0.6)", border:"1.5px dashed rgba(99,102,241,0.2)", borderRadius:12, fontSize:"0.85rem", fontWeight:700, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif", transition:"all 0.15s", marginTop:"0.25rem" }}>
        + Add Lesson
      </button>
    </div>
  );

  /* ── Step 4: Review ─────────────────────────────────────── */
  const renderReview = () => {
    const dm = DIFF_META[basic.difficulty];
    return (
      <div>
        {/* Summary */}
        <div style={{ ...cardDark, display:"flex", gap:"1.25rem", alignItems:"flex-start", background:"rgba(99,102,241,0.05)", border:"1px solid rgba(99,102,241,0.18)" }}>
          {basic.image ? (
            <img src={basic.image} alt="cover" style={{ width:100, height:70, objectFit:"cover", borderRadius:10, flexShrink:0 }} onError={(e) => { e.target.style.display="none"; }} />
          ) : (
            <div style={{ width:100, height:70, borderRadius:10, flexShrink:0, background:"linear-gradient(135deg,#14b8a6,#6366f1)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.8rem" }}>📚</div>
          )}
          <div style={{ flex:1 }}>
            <h3 style={{ margin:"0 0 0.3rem", fontSize:"1.05rem", fontWeight:800, color:T.text, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{basic.title || "Untitled Course"}</h3>
            <p style={{ margin:"0 0 0.625rem", fontSize:"0.82rem", color:T.muted, lineHeight:1.55 }}>{basic.description || "—"}</p>
            <div style={{ display:"flex", gap:"0.4rem", flexWrap:"wrap" }}>
              {[
                { label:basic.category,                  style:{ background:"rgba(99,102,241,0.1)", color:"rgba(129,140,248,0.85)", border:"1px solid rgba(99,102,241,0.2)" } },
                { label:basic.difficulty,                style:{ background:dm.bg, color:dm.color, border:`1px solid ${dm.border}` } },
                { label:`${levels.length} level${levels.length!==1?"s":""}`,   style:{ background:"rgba(255,255,255,0.04)", color:T.muted, border:`1px solid ${T.border}` } },
                { label:`${lessons.length} lesson${lessons.length!==1?"s":""}`, style:{ background:"rgba(255,255,255,0.04)", color:T.muted, border:`1px solid ${T.border}` } },
                { label:`Max ${basic.maxAttempts} attempt${basic.maxAttempts!=1?"s":""}/level`, style:{ background:"rgba(251,191,36,0.08)", color:T.amber, border:"1px solid rgba(251,191,36,0.2)" } },
              ].map(({ label, style }) => (
                <span key={label} style={{ ...style, padding:"0.25rem 0.65rem", borderRadius:999, fontSize:"0.72rem", fontWeight:700, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{label}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Topics */}
        {topics.length > 0 && (
          <div style={cardDark}>
            <h4 style={{ margin:"0 0 0.75rem", fontSize:"0.78rem", fontWeight:700, color:T.muted, textTransform:"uppercase", letterSpacing:"0.06em", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>🏷️ Topics</h4>
            <div style={{ display:"flex", flexWrap:"wrap", gap:"0.4rem" }}>
              {topics.map((t,i) => (
                <span key={i} style={{ padding:"0.3rem 0.7rem", background:"rgba(99,102,241,0.1)", color:"rgba(129,140,248,0.85)", border:"1px solid rgba(99,102,241,0.2)", borderRadius:999, fontSize:"0.78rem", fontWeight:700, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{t}</span>
              ))}
            </div>
          </div>
        )}

        {/* Levels */}
        <div style={cardDark}>
          <h4 style={{ margin:"0 0 0.875rem", fontSize:"0.78rem", fontWeight:700, color:T.muted, textTransform:"uppercase", letterSpacing:"0.06em", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>🏗️ Levels ({levels.length})</h4>
          <div style={{ display:"flex", flexDirection:"column", gap:"0.5rem" }}>
            {levels.map((l,i) => (
              <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:"0.75rem", padding:"0.75rem 0.9rem", background:"rgba(255,255,255,0.025)", border:`1px solid ${T.border}`, borderRadius:11 }}>
                <div style={{ width:24, height:24, borderRadius:7, background:"linear-gradient(135deg,#14b8a6,#6366f1)", color:"white", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"0.7rem", fontWeight:800, flexShrink:0, marginTop:1, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{i+1}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:700, fontSize:"0.875rem", color:T.text, marginBottom:2, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{l.title || "Untitled Level"}</div>
                  {l.videoUrl && <div style={{ fontSize:"0.73rem", color:T.muted, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>🎬 {l.videoUrl}</div>}
                  {l.studyNotes && <div style={{ fontSize:"0.73rem", color:T.muted, marginTop:2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>📄 {l.studyNotes.slice(0,80)}{l.studyNotes.length > 80 ? "…" : ""}</div>}
                </div>
                <span style={{ fontSize:"0.65rem", padding:"2px 8px", borderRadius:999, fontWeight:700, flexShrink:0, fontFamily:"'Plus Jakarta Sans',sans-serif",
                  background: l.isPublished ? "rgba(94,234,212,0.1)" : "rgba(255,255,255,0.04)",
                  color:      l.isPublished ? T.teal : T.muted,
                  border:     `1px solid ${l.isPublished ? "rgba(94,234,212,0.25)" : T.border}`,
                }}>{l.isPublished ? "Published" : "Draft"}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Lessons */}
        <div style={cardDark}>
          <h4 style={{ margin:"0 0 0.875rem", fontSize:"0.78rem", fontWeight:700, color:T.muted, textTransform:"uppercase", letterSpacing:"0.06em", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>📖 Lessons ({lessons.length})</h4>
          <div style={{ display:"flex", flexDirection:"column", gap:"0.5rem" }}>
            {lessons.map((l,i) => (
              <div key={i} style={{ display:"flex", gap:"0.65rem", padding:"0.75rem 0.9rem", background:"rgba(255,255,255,0.025)", border:`1px solid ${T.border}`, borderRadius:11 }}>
                <span style={{ fontWeight:800, color:T.muted, fontSize:"0.72rem", marginTop:1, flexShrink:0, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>#{i+1}</span>
                <div>
                  <div style={{ fontWeight:700, fontSize:"0.875rem", color:T.text, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{l.title || "Untitled Lesson"}</div>
                  <div style={{ fontSize:"0.75rem", color:T.muted, marginTop:2 }}>{l.content.slice(0,100)}{l.content.length > 100 ? "…" : ""}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p style={{ textAlign:"center", fontSize:"0.8rem", color:T.muted, marginTop:"0.25rem" }}>
          Review everything above, then click <strong style={{ color:T.teal }}>Publish Course</strong> to save.
        </p>
      </div>
    );
  };

  const stepContent = [renderBasicInfo, renderTopics, renderLevels, renderLessons, renderReview];

  /* ── Layout ─────────────────────────────────────────────── */
  return (
    <div style={{ minHeight:"100vh", background:"#060d1a" }}>
      <style>{STYLES}</style>
      <Navbar />

      <div style={{ maxWidth:780, margin:"0 auto", padding:"1.75rem 1.75rem 5rem", animation:"fadeSlideUp 0.45s ease both" }}>
        {/* Page Header */}
        <div style={{ marginBottom:"1.75rem" }}>
          <button type="button" onClick={() => navigate(-1)} style={{ background:"none", border:"none", cursor:"pointer", color:T.muted, display:"flex", alignItems:"center", gap:"0.3rem", fontSize:"0.8rem", fontWeight:700, padding:0, marginBottom:"0.875rem", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
            ← Back
          </button>
          <div style={{ display:"flex", alignItems:"center", gap:"0.5rem", marginBottom:"0.4rem" }}>
            <div style={{ height:"14px", width:"3px", background:"linear-gradient(180deg,#5eead4,#6366f1)", borderRadius:"999px" }} />
            <p style={{ fontSize:"0.65rem", fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:700, color:"rgba(94,234,212,0.65)", letterSpacing:"0.12em", textTransform:"uppercase", margin:0 }}>Course Builder</p>
          </div>
          <h1 style={{ fontSize:"1.625rem", fontWeight:800, color:"white", fontFamily:"'Plus Jakarta Sans',sans-serif", letterSpacing:"-0.02em", marginBottom:"0.3rem" }}>Create New Course</h1>
          <p style={{ color:T.muted, fontSize:"0.875rem" }}>Fill in each section to build a complete, structured course for your students.</p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <StepNav current={step} onGo={(i) => { if (i < step) { setError(""); setStep(i); } }} />

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
              <span style={{ fontSize:"0.75rem", color:T.muted, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>Step {step+1} of {STEPS.length}</span>
              {step < STEPS.length - 1 ? (
                <button type="button" onClick={next} style={{ padding:"0.65rem 1.5rem", background:"linear-gradient(135deg,#14b8a6,#6366f1)", color:"white", border:"none", borderRadius:11, fontSize:"0.875rem", fontWeight:800, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif", boxShadow:"0 4px 14px rgba(20,184,166,0.22)" }}>
                  Continue →
                </button>
              ) : (
                <button type="submit" disabled={submitting} style={{ padding:"0.65rem 1.75rem", background: submitting ? "rgba(255,255,255,0.05)" : "linear-gradient(135deg,#10b981,#059669)", color: submitting ? T.muted : "white", border:"none", borderRadius:11, fontSize:"0.875rem", fontWeight:800, cursor: submitting ? "default" : "pointer", fontFamily:"'Plus Jakarta Sans',sans-serif", minWidth:160, display:"flex", alignItems:"center", gap:"0.4rem", justifyContent:"center", boxShadow: submitting ? "none" : "0 4px 14px rgba(16,185,129,0.25)", transition:"all 0.2s" }}>
                  {submitting ? (
                    <><span style={{ display:"inline-block", width:14, height:14, border:"2px solid rgba(255,255,255,0.2)", borderTopColor:T.green, borderRadius:"50%", animation:"spin 0.8s linear infinite" }} /> Publishing…</>
                  ) : "✓ Publish Course"}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}