import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { courseAPI } from "../services/api.js";

/* ── Constants ─────────────────────────────────────────────── */
const CATEGORIES = [
  "Programming","Data Science","Machine Learning","Web Development",
  "Database","Cybersecurity","Cloud Computing","Mobile Development","Mathematics","Other",
];
const DIFFICULTIES = ["Beginner","Intermediate","Advanced"];
const DIFF_META = {
  Beginner:     { color:"#5eead4", bg:"rgba(94,234,212,0.12)",  border:"rgba(94,234,212,0.35)",  active:"rgba(94,234,212,0.18)"  },
  Intermediate: { color:"#fbbf24", bg:"rgba(251,191,36,0.12)",  border:"rgba(251,191,36,0.35)",  active:"rgba(251,191,36,0.18)"  },
  Advanced:     { color:"#f87171", bg:"rgba(248,113,113,0.12)", border:"rgba(248,113,113,0.35)", active:"rgba(248,113,113,0.18)" },
};

const STEPS = [
  { label:"Basic Info", icon:"📝" },
  { label:"Topics",     icon:"🏷️" },
  { label:"Levels",     icon:"🏗️" },
  { label:"Lessons",    icon:"📖" },
  { label:"Review",     icon:"✅" },
];

const emptyLevel  = (num)   => ({ levelNumber:num, title:"", studyNotes:"", videoUrl:"", isPublished:true });
const emptyLesson = (order) => ({ title:"", content:"", order });

/* ── Global styles ──────────────────────────────────────────── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Nunito:wght@300;400;500;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #060d1a; font-family: 'Nunito', sans-serif; }
  @keyframes spin        { to { transform: rotate(360deg); } }
  @keyframes fadeSlideUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
  @keyframes glowPulse   { 0%,100%{box-shadow:0 0 14px rgba(94,234,212,0.2)} 50%{box-shadow:0 0 26px rgba(94,234,212,0.45)} }
  ::-webkit-scrollbar       { width:5px; }
  ::-webkit-scrollbar-track { background:rgba(255,255,255,0.02); }
  ::-webkit-scrollbar-thumb { background:rgba(94,234,212,0.18); border-radius:999px; }
  .ec-input {
    width:100%; padding:0.65rem 0.875rem;
    background:rgba(15,23,42,0.65); border:1px solid rgba(94,234,212,0.14);
    border-radius:10px; color:#e2e8f0; font-family:'Nunito',sans-serif;
    font-size:0.875rem; outline:none; transition:all 0.22s;
  }
  .ec-input::placeholder { color:rgba(148,163,184,0.38); }
  .ec-input:focus { border-color:rgba(94,234,212,0.55); background:rgba(15,23,42,0.85); box-shadow:0 0 0 3px rgba(94,234,212,0.07); }
  .ec-textarea { resize:vertical; min-height:88px; font-family:'Nunito',sans-serif; }
  .ec-select { appearance:none; cursor:pointer;
    background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='13' height='13' viewBox='0 0 24 24' fill='none' stroke='%235eead4' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
    background-repeat:no-repeat; background-position:right 10px center; padding-right:2.25rem; }
  .ec-select option { background:#0a1628; color:#e2e8f0; }
  .step-btn { transition:all 0.18s; }
  .step-btn:hover:not(.step-active):not(.step-locked) { background:rgba(255,255,255,0.05) !important; color:rgba(226,232,240,0.8) !important; }
  .add-btn:hover { background:rgba(94,234,212,0.12) !important; border-color:rgba(94,234,212,0.55) !important; }
  .nav-back:hover  { border-color:rgba(94,234,212,0.3) !important; color:#5eead4 !important; }
  .nav-next:hover  { opacity:0.85; transform:translateY(-1px); }
  .remove-btn:hover { background:rgba(248,113,113,0.15) !important; }
  .topic-tag:hover .topic-x { opacity:1 !important; }
`;

/* ── Reusable atoms ─────────────────────────────────────────── */
function Label({ text, required, hint }) {
  return (
    <div style={{ marginBottom:"0.4rem" }}>
      <label style={{ fontSize:"0.75rem", fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:700, color:"rgba(203,213,225,0.75)", letterSpacing:"0.05em", textTransform:"uppercase" }}>
        {text}{required && <span style={{ color:"#f87171", marginLeft:"3px" }}>*</span>}
      </label>
      {hint && <p style={{ fontSize:"0.7rem", color:"rgba(148,163,184,0.45)", fontFamily:"'Nunito',sans-serif", marginTop:"0.2rem" }}>{hint}</p>}
    </div>
  );
}

function Field({ label, required, hint, children, fullWidth }) {
  return (
    <div style={{ gridColumn: fullWidth ? "1 / -1" : undefined, marginBottom:"0.25rem" }}>
      <Label text={label} required={required} hint={hint} />
      {children}
    </div>
  );
}

function CardSection({ children, accent = "rgba(94,234,212,0.25)" }) {
  return (
    <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:"16px", padding:"1.5rem 1.625rem", marginBottom:"1.125rem", position:"relative", overflow:"hidden" }}>
      <div style={{ position:"absolute", top:0, left:0, width:"3px", height:"100%", background:accent, borderRadius:"999px 0 0 999px" }} />
      {children}
    </div>
  );
}

function SectionTitle({ icon, title, description }) {
  return (
    <div style={{ marginBottom:"1.25rem" }}>
      <div style={{ display:"flex", alignItems:"center", gap:"0.5rem", marginBottom:"0.3rem" }}>
        <span style={{ fontSize:"1.1rem" }}>{icon}</span>
        <h2 style={{ fontSize:"1rem", fontWeight:800, color:"rgba(226,232,240,0.95)", fontFamily:"'Plus Jakarta Sans',sans-serif", margin:0 }}>{title}</h2>
      </div>
      {description && <p style={{ fontSize:"0.78rem", color:"rgba(148,163,184,0.5)", fontFamily:"'Nunito',sans-serif", marginLeft:"1.625rem" }}>{description}</p>}
    </div>
  );
}

/* ── Step Navigator ─────────────────────────────────────────── */
function StepNav({ current, onGo }) {
  return (
    <div style={{ display:"flex", gap:"0.25rem", background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:"14px", padding:"0.35rem", marginBottom:"1.875rem", flexWrap:"wrap" }}>
      {STEPS.map((s, i) => {
        const done   = i < current;
        const active = i === current;
        const locked = i > current;
        return (
          <button key={s.label} type="button"
            className={`step-btn${active ? " step-active" : ""}${locked ? " step-locked" : ""}`}
            onClick={() => !locked && onGo(i)}
            style={{
              flex:"1 1 0", display:"flex", alignItems:"center", justifyContent:"center", gap:"0.35rem",
              padding:"0.55rem 0.6rem", borderRadius:"10px", border:"none", cursor: locked ? "default" : "pointer",
              fontSize:"0.78rem", fontWeight: active ? 800 : done ? 600 : 500, whiteSpace:"nowrap",
              fontFamily:"'Plus Jakarta Sans',sans-serif",
              background: active ? "linear-gradient(135deg,#14b8a6,#6366f1)" : done ? "rgba(94,234,212,0.1)" : "transparent",
              color: active ? "white" : done ? "#5eead4" : "rgba(148,163,184,0.45)",
              transition:"all 0.18s",
            }}>
            <span>{s.icon}</span>
            <span>{s.label}</span>
            {done && <span style={{ fontSize:"0.65rem", opacity:0.8 }}>✓</span>}
          </button>
        );
      })}
    </div>
  );
}

/* ── Main Component ─────────────────────────────────────────── */
export default function EditCourse() {
  const { id }   = useParams();
  const navigate = useNavigate();

  const [step,       setStep]       = useState(0);
  const [loading,    setLoading]    = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState("");
  const [topicInput, setTopicInput] = useState("");

  const [basic, setBasic] = useState({
    title:"", description:"", category:"Programming", difficulty:"Beginner", image:"", maxAttempts:3,
  });
  const [topics,  setTopics]  = useState([]);
  const [levels,  setLevels]  = useState([emptyLevel(1)]);
  const [lessons, setLessons] = useState([emptyLesson(1)]);

  /* load */
  useEffect(() => {
    courseAPI.getById(id)
      .then(res => {
        const c = res.data.data;
        setBasic({ title:c.title||"", description:c.description||"", category:c.category||"Other", difficulty:c.difficulty||"Beginner", image:c.image||"", maxAttempts:c.maxAttempts||3 });
        setTopics(c.topics || []);
        setLevels(c.levels?.length > 0 ? c.levels.map(l => ({ levelNumber:l.levelNumber, title:l.title||"", studyNotes:l.studyNotes||"", videoUrl:l.videoUrl||"", isPublished:l.isPublished!==false })) : [emptyLevel(1)]);
        setLessons(c.lessons?.length > 0 ? c.lessons.map(l => ({ title:l.title||"", content:l.content||"", order:l.order||1 })) : [emptyLesson(1)]);
      })
      .catch(() => setError("Failed to load course."))
      .finally(() => setLoading(false));
  }, [id]);

  /* helpers */
  const setBasicField  = f => e => setBasic(p => ({ ...p, [f]: e.target.value }));
  const addTopic       = () => { const t = topicInput.trim(); if (t && !topics.includes(t)) setTopics(p => [...p, t]); setTopicInput(""); };
  const removeTopic    = i => setTopics(p => p.filter((_, j) => j !== i));
  const handleTopicKey = e => { if (e.key === "Enter") { e.preventDefault(); addTopic(); } };
  const setLevelField  = (idx, f) => e => { const v = f === "isPublished" ? e.target.checked : e.target.value; setLevels(p => p.map((l, i) => i === idx ? { ...l, [f]:v } : l)); };
  const addLevel       = () => setLevels(p => [...p, emptyLevel(p.length + 1)]);
  const removeLevel    = idx => setLevels(p => p.filter((_,i) => i !== idx).map((l,i) => ({ ...l, levelNumber:i+1 })));
  const setLessonField = (idx, f) => e => setLessons(p => p.map((l, i) => i === idx ? { ...l, [f]:e.target.value } : l));
  const addLesson      = () => setLessons(p => [...p, emptyLesson(p.length + 1)]);
  const removeLesson   = idx => setLessons(p => p.filter((_,i) => i !== idx).map((l,i) => ({ ...l, order:i+1 })));

  const validateStep = () => {
    setError("");
    if (step === 0) {
      if (!basic.title.trim())       { setError("Course title is required.");       return false; }
      if (!basic.description.trim()) { setError("Course description is required."); return false; }
    }
    if (step === 2) for (let i = 0; i < levels.length; i++) {
      if (!levels[i].title.trim()) { setError(`Level ${i+1} title is required.`); return false; }
    }
    if (step === 3) for (let i = 0; i < lessons.length; i++) {
      if (!lessons[i].title.trim() || !lessons[i].content.trim()) { setError(`Lesson ${i+1} title and content are required.`); return false; }
    }
    return true;
  };

  const next = () => { if (validateStep()) setStep(s => s + 1); };
  const back = () => { setError(""); setStep(s => s - 1); };

  const handleSubmit = async e => {
    e.preventDefault(); setError(""); setSubmitting(true);
    try {
      await courseAPI.update(id, { title:basic.title.trim(), description:basic.description.trim(), category:basic.category, difficulty:basic.difficulty, image:basic.image.trim(), maxAttempts:Number(basic.maxAttempts)||3, topics, levels, lessons });
      navigate(`/courses/${id}`);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update course.");
    } finally { setSubmitting(false); }
  };

  /* ── Step: Basic Info ─────────────────────────────────────── */
  const renderBasicInfo = () => (
    <CardSection>
      <SectionTitle icon="📝" title="Course Information" description="Update the core details students will see on the course listing." />
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1rem" }}>
        <Field label="Course Title" required fullWidth>
          <input className="ec-input" value={basic.title} onChange={setBasicField("title")} placeholder="e.g. Introduction to Python" />
        </Field>
        <Field label="Course Description" required fullWidth>
          <textarea className="ec-input ec-textarea" style={{ minHeight:"100px" }} value={basic.description} onChange={setBasicField("description")} placeholder="Describe what students will learn…" />
        </Field>
        <Field label="Category">
          <select className="ec-input ec-select" value={basic.category} onChange={setBasicField("category")}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Difficulty Level">
          <div style={{ display:"flex", gap:"0.5rem" }}>
            {DIFFICULTIES.map(d => {
              const dm = DIFF_META[d]; const active = basic.difficulty === d;
              return (
                <button key={d} type="button"
                  onClick={() => setBasic(p => ({ ...p, difficulty:d }))}
                  style={{ flex:1, padding:"0.6rem 0.4rem", borderRadius:"9px", border:`1px solid ${active ? dm.border : "rgba(255,255,255,0.08)"}`, background: active ? dm.active : "rgba(255,255,255,0.03)", color: active ? dm.color : "rgba(148,163,184,0.5)", fontSize:"0.775rem", fontWeight: active ? 700 : 500, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif", transition:"all 0.18s" }}>
                  {d}
                </button>
              );
            })}
          </div>
        </Field>
        <Field label="Cover Image URL" hint="Paste a direct image URL, or leave blank." fullWidth>
          <input className="ec-input" value={basic.image} onChange={setBasicField("image")} placeholder="https://example.com/image.jpg" />
          {basic.image && (
            <div style={{ marginTop:"0.75rem", borderRadius:"10px", overflow:"hidden", height:"110px", background:`url("${basic.image}") center/cover no-repeat rgba(15,23,42,0.6)`, border:"1px solid rgba(94,234,212,0.15)" }} />
          )}
        </Field>
        <Field label="Max Quiz Attempts per Level">
          <input type="number" min={1} max={10} className="ec-input" style={{ width:"7rem" }} value={basic.maxAttempts} onChange={setBasicField("maxAttempts")} />
        </Field>
      </div>
    </CardSection>
  );

  /* ── Step: Topics ─────────────────────────────────────────── */
  const renderTopics = () => (
    <CardSection accent="rgba(167,139,250,0.35)">
      <SectionTitle icon="🏷️" title="Course Topics" description="Press Enter or click Add after each topic tag." />
      <Field label="Add a Topic">
        <div style={{ display:"flex", gap:"0.625rem" }}>
          <input className="ec-input" style={{ flex:1 }} placeholder="e.g. Variables, Loops, Functions…" value={topicInput} onChange={e => setTopicInput(e.target.value)} onKeyDown={handleTopicKey} />
          <button type="button" onClick={addTopic} style={{ padding:"0.65rem 1.125rem", background:"linear-gradient(135deg,#14b8a6,#6366f1)", color:"white", border:"none", borderRadius:"10px", fontSize:"0.8rem", fontWeight:700, cursor:"pointer", whiteSpace:"nowrap", fontFamily:"'Plus Jakarta Sans',sans-serif", flexShrink:0 }}>
            + Add
          </button>
        </div>
      </Field>
      {topics.length > 0 && (
        <div style={{ display:"flex", flexWrap:"wrap", gap:"0.5rem", marginTop:"0.75rem" }}>
          {topics.map((t, i) => (
            <span key={i} className="topic-tag" style={{ display:"flex", alignItems:"center", gap:"0.35rem", padding:"0.3rem 0.75rem 0.3rem 0.875rem", borderRadius:"999px", background:"rgba(167,139,250,0.12)", border:"1px solid rgba(167,139,250,0.28)", color:"#c4b5fd", fontSize:"0.8rem", fontWeight:600, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
              {t}
              <button type="button" className="topic-x" onClick={() => removeTopic(i)} style={{ background:"none", border:"none", cursor:"pointer", color:"#c4b5fd", fontWeight:700, fontSize:"1rem", lineHeight:1, padding:0, opacity:0.6, transition:"opacity 0.15s" }}>×</button>
            </span>
          ))}
        </div>
      )}
      {topics.length === 0 && (
        <div style={{ marginTop:"0.875rem", padding:"1.25rem", borderRadius:"10px", border:"1px dashed rgba(167,139,250,0.18)", textAlign:"center", color:"rgba(148,163,184,0.38)", fontSize:"0.8rem", fontFamily:"'Nunito',sans-serif" }}>
          No topics added yet — they'll appear here as tags.
        </div>
      )}
    </CardSection>
  );

  /* ── Step: Levels ─────────────────────────────────────────── */
  const renderLevels = () => (
    <div>
      <SectionTitle icon="🏗️" title="Levels / Modules" description="Each level is a learning module with study notes, a video, and a quiz." />
      {levels.map((lv, idx) => (
        <div key={idx} style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(99,102,241,0.18)", borderRadius:"16px", padding:"1.375rem 1.5rem", marginBottom:"1rem", position:"relative", overflow:"hidden" }}>
          <div style={{ position:"absolute", top:0, left:0, width:"3px", height:"100%", background:"linear-gradient(180deg,#6366f1,#14b8a6)", borderRadius:"999px 0 0 999px" }} />
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1rem" }}>
            <div style={{ display:"flex", alignItems:"center", gap:"0.625rem" }}>
              <div style={{ width:"28px", height:"28px", borderRadius:"8px", background:"rgba(99,102,241,0.18)", border:"1px solid rgba(99,102,241,0.3)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <span style={{ fontSize:"0.75rem", fontWeight:800, color:"#818cf8", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{lv.levelNumber}</span>
              </div>
              <span style={{ fontWeight:800, fontSize:"0.9rem", color:"#818cf8", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>Level {lv.levelNumber}</span>
            </div>
            {levels.length > 1 && (
              <button type="button" className="remove-btn" onClick={() => removeLevel(idx)} style={{ padding:"0.3rem 0.75rem", background:"rgba(248,113,113,0.08)", color:"#f87171", border:"1px solid rgba(248,113,113,0.2)", borderRadius:"8px", fontSize:"0.72rem", fontWeight:700, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif", transition:"all 0.18s" }}>
                Remove
              </button>
            )}
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0.875rem" }}>
            <Field label="Level Title" required fullWidth>
              <input className="ec-input" placeholder={`e.g. Introduction to Level ${lv.levelNumber}`} value={lv.title} onChange={setLevelField(idx,"title")} />
            </Field>
            <Field label="Study Notes" fullWidth>
              <textarea className="ec-input ec-textarea" placeholder="Add notes, theory, or explanations for students…" value={lv.studyNotes} onChange={setLevelField(idx,"studyNotes")} />
            </Field>
            <Field label="Video URL" hint="YouTube embed or direct video URL.">
              <input className="ec-input" placeholder="https://youtube.com/embed/…" value={lv.videoUrl} onChange={setLevelField(idx,"videoUrl")} />
            </Field>
            <Field label="Visibility">
              <label style={{ display:"flex", alignItems:"center", gap:"0.625rem", cursor:"pointer", marginTop:"0.35rem" }}>
                <div style={{ position:"relative", width:"36px", height:"20px" }}>
                  <input type="checkbox" checked={lv.isPublished} onChange={setLevelField(idx,"isPublished")} style={{ opacity:0, position:"absolute", width:"100%", height:"100%", cursor:"pointer", zIndex:1 }} />
                  <div style={{ width:"36px", height:"20px", borderRadius:"999px", background: lv.isPublished ? "linear-gradient(135deg,#14b8a6,#6366f1)" : "rgba(255,255,255,0.1)", transition:"background 0.22s", border:"1px solid rgba(255,255,255,0.1)" }}>
                    <div style={{ position:"absolute", top:"3px", left: lv.isPublished ? "18px" : "3px", width:"14px", height:"14px", borderRadius:"50%", background:"white", transition:"left 0.22s", boxShadow:"0 1px 4px rgba(0,0,0,0.3)" }} />
                  </div>
                </div>
                <span style={{ fontSize:"0.8rem", color: lv.isPublished ? "rgba(94,234,212,0.8)" : "rgba(148,163,184,0.45)", fontFamily:"'Nunito',sans-serif", fontWeight:600 }}>
                  {lv.isPublished ? "Visible to students" : "Hidden (draft)"}
                </span>
              </label>
            </Field>
          </div>
        </div>
      ))}
      <button type="button" className="add-btn" onClick={addLevel} style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:"0.5rem", width:"100%", padding:"0.7rem", background:"rgba(94,234,212,0.05)", border:"1px dashed rgba(94,234,212,0.28)", borderRadius:"12px", color:"rgba(94,234,212,0.7)", fontSize:"0.82rem", fontWeight:700, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif", transition:"all 0.2s" }}>
        + Add Another Level
      </button>
    </div>
  );

  /* ── Step: Lessons ────────────────────────────────────────── */
  const renderLessons = () => (
    <div>
      <SectionTitle icon="📖" title="Lessons" description="Supplementary text lessons for the course." />
      {lessons.map((ls, idx) => (
        <div key={idx} style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(16,185,129,0.18)", borderRadius:"16px", padding:"1.375rem 1.5rem", marginBottom:"1rem", position:"relative", overflow:"hidden" }}>
          <div style={{ position:"absolute", top:0, left:0, width:"3px", height:"100%", background:"linear-gradient(180deg,#10b981,#14b8a6)", borderRadius:"999px 0 0 999px" }} />
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1rem" }}>
            <div style={{ display:"flex", alignItems:"center", gap:"0.625rem" }}>
              <div style={{ width:"28px", height:"28px", borderRadius:"8px", background:"rgba(16,185,129,0.14)", border:"1px solid rgba(16,185,129,0.28)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <span style={{ fontSize:"0.75rem", fontWeight:800, color:"#34d399", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{idx + 1}</span>
              </div>
              <span style={{ fontWeight:800, fontSize:"0.9rem", color:"#34d399", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>Lesson {idx + 1}</span>
            </div>
            {lessons.length > 1 && (
              <button type="button" className="remove-btn" onClick={() => removeLesson(idx)} style={{ padding:"0.3rem 0.75rem", background:"rgba(248,113,113,0.08)", color:"#f87171", border:"1px solid rgba(248,113,113,0.2)", borderRadius:"8px", fontSize:"0.72rem", fontWeight:700, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif", transition:"all 0.18s" }}>
                Remove
              </button>
            )}
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:"0.75rem" }}>
            <Field label="Title" required>
              <input className="ec-input" placeholder="e.g. What is a Variable?" value={ls.title} onChange={setLessonField(idx,"title")} />
            </Field>
            <Field label="Content" required>
              <textarea className="ec-input ec-textarea" style={{ minHeight:"110px" }} placeholder="Lesson content, notes, or reading material…" value={ls.content} onChange={setLessonField(idx,"content")} />
            </Field>
          </div>
        </div>
      ))}
      <button type="button" className="add-btn" onClick={addLesson} style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:"0.5rem", width:"100%", padding:"0.7rem", background:"rgba(16,185,129,0.05)", border:"1px dashed rgba(16,185,129,0.25)", borderRadius:"12px", color:"rgba(52,211,153,0.7)", fontSize:"0.82rem", fontWeight:700, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif", transition:"all 0.2s" }}>
        + Add Another Lesson
      </button>
    </div>
  );

  /* ── Step: Review ─────────────────────────────────────────── */
  const renderReview = () => {
    const dm = DIFF_META[basic.difficulty] || DIFF_META.Beginner;
    return (
      <CardSection accent="rgba(94,234,212,0.3)">
        <SectionTitle icon="✅" title="Review Changes" description="Confirm everything looks correct before saving." />
        <div style={{ display:"flex", flexDirection:"column", gap:"0.5rem" }}>
          {[
            ["Course Title",    basic.title || "—"],
            ["Description",     basic.description ? basic.description.slice(0,80) + (basic.description.length > 80 ? "…" : "") : "—"],
            ["Category",        basic.category],
            ["Difficulty",      basic.difficulty],
            ["Max Attempts",    String(basic.maxAttempts)],
            ["Topics",          topics.length > 0 ? topics.join(", ") : "None added"],
            ["Levels",          `${levels.length} level${levels.length !== 1 ? "s" : ""}: ${levels.map(l => l.title || `Level ${l.levelNumber}`).join(", ")}`],
            ["Lessons",         `${lessons.length} lesson${lessons.length !== 1 ? "s" : ""}`],
          ].map(([label, value]) => (
            <div key={label} style={{ display:"flex", gap:"0.875rem", padding:"0.625rem 0.875rem", background:"rgba(255,255,255,0.03)", borderRadius:"10px", border:"1px solid rgba(255,255,255,0.06)" }}>
              <span style={{ fontSize:"0.75rem", fontWeight:700, color:"rgba(148,163,184,0.5)", fontFamily:"'Plus Jakarta Sans',sans-serif", textTransform:"uppercase", letterSpacing:"0.06em", minWidth:"120px", paddingTop:"1px" }}>{label}</span>
              <span style={{ fontSize:"0.875rem", color: label === "Difficulty" ? dm.color : "rgba(226,232,240,0.85)", fontFamily:"'Nunito',sans-serif", fontWeight: label === "Difficulty" ? 700 : 400 }}>{value}</span>
            </div>
          ))}
        </div>
      </CardSection>
    );
  };

  const stepContent = [renderBasicInfo, renderTopics, renderLevels, renderLessons, renderReview];

  /* ── Loading ──────────────────────────────────────────────── */
  if (loading) return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"100vh", background:"#060d1a", gap:"1rem" }}>
      <style>{STYLES}</style>
      <div style={{ width:"40px", height:"40px", border:"3px solid rgba(94,234,212,0.12)", borderTopColor:"#5eead4", borderRadius:"50%", animation:"spin 0.8s linear infinite" }} />
      <span style={{ color:"rgba(148,163,184,0.5)", fontSize:"0.875rem", fontFamily:"'Nunito',sans-serif" }}>Loading course…</span>
    </div>
  );

  /* ── Render ───────────────────────────────────────────────── */
  return (
    <div style={{ minHeight:"100vh", background:"#060d1a" }}>
      <style>{STYLES}</style>

      {/* Navbar */}
      <div style={{ background:"rgba(6,16,31,0.96)", borderBottom:"1px solid rgba(94,234,212,0.07)", padding:"0 1.75rem", display:"flex", justifyContent:"space-between", alignItems:"center", height:"60px", position:"sticky", top:0, zIndex:50, backdropFilter:"blur(14px)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"0.625rem" }}>
          <div style={{ width:"30px", height:"30px", borderRadius:"8px", background:"linear-gradient(135deg,#14b8a6,#6366f1)", display:"flex", alignItems:"center", justifyContent:"center", animation:"glowPulse 3s ease-in-out infinite" }}>
            <svg width="17" height="17" fill="none" viewBox="0 0 48 48"><path d="M4 42.4379C4 42.4379 14.0962 36.0744 24 41.1692C35.0664 46.8624 44 42.2078 44 42.2078L44 7.01134C44 7.01134 35.068 11.6577 24.0031 5.96913C14.0971 0.876274 4 7.27094 4 7.27094L4 42.4379Z" fill="white"/></svg>
          </div>
          <span style={{ color:"white", fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:800, fontSize:"1.0625rem", letterSpacing:"-0.02em" }}>EduAI</span>
        </div>
        <button onClick={() => navigate(-1)} style={{ display:"flex", alignItems:"center", gap:"0.4rem", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.09)", borderRadius:"9px", padding:"0.45rem 0.875rem", color:"rgba(148,163,184,0.6)", fontSize:"0.78rem", fontWeight:600, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif", transition:"all 0.2s" }}
          onMouseEnter={e => { e.currentTarget.style.borderColor="rgba(94,234,212,0.3)"; e.currentTarget.style.color="#5eead4"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor="rgba(255,255,255,0.09)"; e.currentTarget.style.color="rgba(148,163,184,0.6)"; }}>
          ← Back
        </button>
      </div>

      {/* Page body */}
      <div style={{ maxWidth:"760px", margin:"0 auto", padding:"2rem 1.5rem 4rem", animation:"fadeSlideUp 0.5s ease both" }}>

        {/* Page title */}
        <div style={{ marginBottom:"1.75rem" }}>
          <div style={{ display:"flex", alignItems:"center", gap:"0.5rem", marginBottom:"0.4rem" }}>
            <div style={{ height:"14px", width:"3px", background:"linear-gradient(180deg,#5eead4,#6366f1)", borderRadius:"999px" }} />
            <p style={{ fontSize:"0.65rem", fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:700, color:"rgba(94,234,212,0.65)", letterSpacing:"0.12em", textTransform:"uppercase", margin:0 }}>Course Management</p>
          </div>
          <h1 style={{ fontSize:"1.625rem", fontWeight:800, color:"white", fontFamily:"'Plus Jakarta Sans',sans-serif", letterSpacing:"-0.02em", marginBottom:"0.3rem" }}>Edit Course</h1>
          <p style={{ color:"rgba(148,163,184,0.5)", fontSize:"0.875rem", fontFamily:"'Nunito',sans-serif" }}>Update the course content, levels, and settings.</p>
        </div>

        {/* Step nav */}
        <StepNav current={step} onGo={i => { if (i < step) { setError(""); setStep(i); } }} />

        {/* Step indicator */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"1.25rem" }}>
          <span style={{ fontSize:"0.72rem", color:"rgba(148,163,184,0.45)", fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:600 }}>
            Step {step + 1} of {STEPS.length}
          </span>
          <div style={{ display:"flex", gap:"0.3rem" }}>
            {STEPS.map((_, i) => (
              <div key={i} style={{ height:"3px", width: i === step ? "20px" : "8px", borderRadius:"999px", background: i < step ? "#5eead4" : i === step ? "linear-gradient(90deg,#14b8a6,#6366f1)" : "rgba(255,255,255,0.08)", transition:"all 0.3s" }} />
            ))}
          </div>
        </div>

        {/* Step content */}
        <form onSubmit={handleSubmit}>
          {stepContent[step]()}

          {/* Error */}
          {error && (
            <div style={{ display:"flex", alignItems:"center", gap:"0.5rem", padding:"0.75rem 1rem", background:"rgba(239,68,68,0.07)", border:"1px solid rgba(239,68,68,0.2)", borderRadius:"10px", color:"#fca5a5", fontSize:"0.875rem", fontFamily:"'Nunito',sans-serif", marginTop:"1rem" }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink:0 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {error}
            </div>
          )}

          {/* Nav buttons */}
          <div style={{ display:"flex", justifyContent:"space-between", marginTop:"1.625rem" }}>
            <button type="button" className="nav-back" disabled={step === 0} onClick={back}
              style={{ display:"flex", alignItems:"center", gap:"0.4rem", padding:"0.7rem 1.25rem", background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:"10px", color: step === 0 ? "rgba(148,163,184,0.25)" : "rgba(148,163,184,0.6)", fontSize:"0.875rem", fontWeight:700, cursor: step === 0 ? "not-allowed" : "pointer", fontFamily:"'Plus Jakarta Sans',sans-serif", transition:"all 0.2s", opacity: step === 0 ? 0.5 : 1 }}>
              ← Back
            </button>

            {step < STEPS.length - 1 ? (
              <button type="button" className="nav-next" onClick={next}
                style={{ display:"flex", alignItems:"center", gap:"0.4rem", padding:"0.7rem 1.5rem", background:"linear-gradient(135deg,#14b8a6,#6366f1)", color:"white", border:"none", borderRadius:"10px", fontSize:"0.875rem", fontWeight:700, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif", transition:"all 0.22s", boxShadow:"0 4px 14px rgba(20,184,166,0.25)" }}>
                Next Step →
              </button>
            ) : (
              <button type="submit" disabled={submitting} className="nav-next"
                style={{ display:"flex", alignItems:"center", gap:"0.5rem", padding:"0.7rem 1.5rem", background: submitting ? "rgba(16,185,129,0.4)" : "linear-gradient(135deg,#059669,#10b981)", color:"white", border:"none", borderRadius:"10px", fontSize:"0.875rem", fontWeight:700, cursor: submitting ? "not-allowed" : "pointer", fontFamily:"'Plus Jakarta Sans',sans-serif", transition:"all 0.22s", boxShadow:"0 4px 14px rgba(16,185,129,0.25)" }}>
                {submitting ? (
                  <><span style={{ width:"14px", height:"14px", border:"2px solid rgba(255,255,255,0.3)", borderTopColor:"white", borderRadius:"50%", animation:"spin 0.7s linear infinite", display:"inline-block" }} /> Saving…</>
                ) : <>💾 Save Changes</>}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}