import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { courseAPI, quizAPI, levelRegAPI } from "../services/api";

const PASS_THRESHOLD = 60;

/* ── Status config ──────────────────────────────────────────── */
const STATUS_CFG = {
  locked:    { color:"rgba(148,163,184,0.4)", bg:"rgba(255,255,255,0.04)", border:"rgba(255,255,255,0.07)" },
  available: { color:"#818cf8",               bg:"rgba(99,102,241,0.1)",   border:"rgba(99,102,241,0.22)"  },
  active:    { color:"#5eead4",               bg:"rgba(94,234,212,0.08)",  border:"rgba(94,234,212,0.22)"  },
  completed: { color:"#5eead4",               bg:"rgba(94,234,212,0.08)",  border:"rgba(94,234,212,0.22)"  },
  failed:    { color:"#f87171",               bg:"rgba(248,113,113,0.08)", border:"rgba(248,113,113,0.22)" },
};

/* ── Styles ─────────────────────────────────────────────────── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Nunito:wght@300;400;500;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #060d1a; font-family: 'Nunito', sans-serif; color: rgba(226,232,240,0.88); }
  @keyframes spin        { to { transform: rotate(360deg); } }
  @keyframes fadeSlideUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  @keyframes glowPulse   { 0%,100%{box-shadow:0 0 14px rgba(94,234,212,0.2)} 50%{box-shadow:0 0 28px rgba(94,234,212,0.45)} }
  @keyframes popIn       { from{opacity:0;transform:scale(0.92)} to{opacity:1;transform:scale(1)} }
  @keyframes pulse       { 0%,100%{opacity:1} 50%{opacity:0.4} }
  ::-webkit-scrollbar { width:5px; }
  ::-webkit-scrollbar-track { background:rgba(255,255,255,0.02); }
  ::-webkit-scrollbar-thumb { background:rgba(94,234,212,0.18); border-radius:999px; }
  .option-row { transition: all 0.15s; }
  .option-row:hover { border-color: rgba(94,234,212,0.3) !important; background: rgba(94,234,212,0.03) !important; }
  .sidebar-lvl-btn { transition: background 0.15s; }
  .sidebar-lvl-btn:hover:not(:disabled) { background: rgba(255,255,255,0.04) !important; }
  .quick-link { transition: all 0.15s; }
  .quick-link:hover { color: #5eead4 !important; background: rgba(94,234,212,0.06) !important; }
  .tab-btn { transition: all 0.18s; }
  @media (max-width: 900px) {
    .level-grid { grid-template-columns: 1fr !important; }
    .sidebar { position: static !important; }
  }
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

/* ── Tab Button ─────────────────────────────────────────────── */
function TabBtn({ active, onClick, children }) {
  return (
    <button onClick={onClick} className="tab-btn"
      style={{ padding:"0.5rem 1.1rem", borderRadius:10, border:"none", cursor:"pointer", fontWeight:700, fontSize:"0.82rem",
        fontFamily:"'Plus Jakarta Sans',sans-serif",
        background: active ? "linear-gradient(135deg,rgba(20,184,166,0.2),rgba(99,102,241,0.2))" : "transparent",
        color: active ? T.teal : T.muted,
        borderBottom: active ? `2px solid ${T.teal}` : "2px solid transparent",
        boxShadow: active ? "0 0 12px rgba(94,234,212,0.1)" : "none",
      }}>
      {children}
    </button>
  );
}

/* ── Main ───────────────────────────────────────────────────── */
export default function LevelPage() {
  const { courseId, levelNum } = useParams();
  const levelNumber = parseInt(levelNum, 10);
  const navigate    = useNavigate();

  const [course,        setCourse]        = useState(null);
  const [levelStatuses, setLevelStatuses] = useState([]);
  const [quiz,          setQuiz]          = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState(null);
  const [answers,       setAnswers]       = useState({});
  const [submitted,     setSubmitted]     = useState(false);
  const [result,        setResult]        = useState(null);
  const [submitting,    setSubmitting]    = useState(false);
  const [tab,           setTab]           = useState("notes");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [cRes, csRes, qRes] = await Promise.all([
          courseAPI.getById(courseId),
          levelRegAPI.getCourseStatus(courseId),
          quizAPI.getByCourse(courseId),
        ]);
        const allQuizzes = qRes.data.data || [];
        const statuses   = csRes.data.data?.levelStatuses || [];
        const thisSt     = statuses.find(s => s.levelNumber === levelNumber);

        if (!thisSt || (thisSt.status !== "active" && thisSt.status !== "completed")) {
          const msg =
            !thisSt || thisSt.status === "locked"  ? "This level is locked. Complete the previous level first." :
            thisSt.status === "available"           ? "Register for this level before studying."                  :
            thisSt.status === "failed"              ? "You failed this level. Re-register from Available Courses." :
                                                      "You do not have access to this level.";
          setError(msg); setLoading(false); return;
        }

        const levelQuiz = allQuizzes.find(q => q.levelNumber === levelNumber) || (levelNumber === 1 && allQuizzes[0]) || null;
        setCourse(cRes.data.data);
        setLevelStatuses(statuses);
        setQuiz(levelQuiz);
      } catch (err) { setError(err.response?.data?.message || "Failed to load level."); }
      finally { setLoading(false); }
    };
    load();
  }, [courseId, levelNum]);

  const level           = course?.levels?.find(l => l.levelNumber === levelNumber);
  const levels          = course?.levels || [];
  const thisStatus      = levelStatuses.find(s => s.levelNumber === levelNumber);
  const isCompleted     = thisStatus?.status === "completed";
  const nextLevelInfo   = levels.find(l => l.levelNumber === levelNumber + 1);
  const nextLevelStatus = levelStatuses.find(s => s.levelNumber === levelNumber + 1);

  const handleSubmit = async () => {
    if (!quiz) return;
    const unanswered = quiz.questions.filter(q => !answers[q._id]);
    if (unanswered.length > 0) { alert(`Please answer all ${unanswered.length} remaining question(s).`); return; }
    setSubmitting(true);
    try {
      const res   = await levelRegAPI.submitQuiz(courseId, levelNumber, answers, 5);
      const d     = res.data.data;
      const score = d?.score ?? 0;
      const total = quiz.questions.length;
      setResult({ score, correct: Math.round((score / 100) * total), total, passed: d?.passed ?? score >= PASS_THRESHOLD });
      setSubmitted(true);
      const csRes = await levelRegAPI.getCourseStatus(courseId);
      setLevelStatuses(csRes.data.data?.levelStatuses || []);
    } catch (err) { alert(err.response?.data?.message || "Submission failed."); }
    finally { setSubmitting(false); }
  };

  const getEmbedUrl = (url) => {
    if (!url) return null;
    const match = url.match(/(?:v=|youtu\.be\/)([^&?\s]+)/);
    return match ? `https://www.youtube-nocookie.com/embed/${match[1]}?rel=0&modestbranding=1` : null;
  };

  /* ── Loading ──────────────────────────────────────────────── */
  if (loading) return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"100vh", background:"#060d1a", gap:"1rem" }}>
      <style>{STYLES}</style>
      <div style={{ width:"40px", height:"40px", border:"3px solid rgba(94,234,212,0.1)", borderTopColor:"#5eead4", borderRadius:"50%", animation:"spin 0.8s linear infinite" }} />
      <span style={{ color:T.muted, fontSize:"0.875rem", fontFamily:"'Nunito',sans-serif" }}>Loading level…</span>
    </div>
  );

  /* ── Error ────────────────────────────────────────────────── */
  if (error) return (
    <div style={{ minHeight:"100vh", background:"#060d1a" }}>
      <style>{STYLES}</style>
      <Navbar />
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"calc(100vh - 60px)", gap:"1.5rem", textAlign:"center", padding:"2rem" }}>
        <div style={{ width:64, height:64, borderRadius:"50%", background:"rgba(248,113,113,0.1)", border:"1.5px solid rgba(248,113,113,0.25)", display:"flex", alignItems:"center", justifyContent:"center" }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>
        <h2 style={{ fontSize:"1rem", fontWeight:800, color:T.text, margin:0, fontFamily:"'Plus Jakarta Sans',sans-serif", maxWidth:380 }}>{error}</h2>
        <div style={{ display:"flex", gap:"0.75rem", flexWrap:"wrap", justifyContent:"center" }}>
          <button onClick={() => navigate("/students")} style={{ padding:"0.65rem 1.4rem", background:"linear-gradient(135deg,#14b8a6,#6366f1)", color:"white", border:"none", borderRadius:11, fontSize:"0.875rem", fontWeight:800, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>Browse Courses</button>
          <button onClick={() => navigate(-1)} style={{ padding:"0.65rem 1.4rem", background:T.surface, color:T.muted, border:`1px solid ${T.border}`, borderRadius:11, fontSize:"0.875rem", fontWeight:700, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>Go Back</button>
        </div>
      </div>
    </div>
  );

  if (!level) return (
    <div style={{ minHeight:"100vh", background:"#060d1a", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:"1rem" }}>
      <style>{STYLES}</style>
      <p style={{ color:T.muted, fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:700 }}>Level {levelNumber} not found.</p>
      <button onClick={() => navigate("/students")} style={{ padding:"0.65rem 1.4rem", background:"linear-gradient(135deg,#14b8a6,#6366f1)", color:"white", border:"none", borderRadius:11, fontWeight:800, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>Back to Courses</button>
    </div>
  );

  const embedUrl = getEmbedUrl(level.videoUrl);
  const passed   = result?.passed ?? false;
  const answeredCount = Object.keys(answers).length;

  return (
    <div style={{ minHeight:"100vh", background:"#060d1a" }}>
      <style>{STYLES}</style>
      <Navbar />

      <div style={{ maxWidth:1280, margin:"0 auto", padding:"0 1.5rem 4rem", animation:"fadeSlideUp 0.45s ease both" }}>

        {/* ── Breadcrumb ─────────────────────────────────────── */}
        <nav style={{ display:"flex", alignItems:"center", gap:"0.4rem", padding:"1.25rem 0 1rem", flexWrap:"wrap" }}>
          {[
            { label:"My Courses", to:"/my-courses" },
            { label:course.title, to:`/courses/${courseId}` },
          ].map((crumb, i) => (
            <span key={crumb.to} style={{ display:"flex", alignItems:"center", gap:"0.4rem" }}>
              {i > 0 && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={T.muted} strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>}
              <Link to={crumb.to} style={{ color:T.muted, fontSize:"0.78rem", textDecoration:"none", fontWeight:600, fontFamily:"'Plus Jakarta Sans',sans-serif", maxWidth:160, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", transition:"color 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.color = T.teal}
                onMouseLeave={e => e.currentTarget.style.color = T.muted}>
                {crumb.label}
              </Link>
            </span>
          ))}
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={T.muted} strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
          <span style={{ color:T.teal, fontSize:"0.78rem", fontWeight:700, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
            Level {levelNumber}: {level.title}
          </span>
        </nav>

        {/* ── Grid ───────────────────────────────────────────── */}
        <div className="level-grid" style={{ display:"grid", gridTemplateColumns:"1fr 290px", gap:"1.5rem", alignItems:"start" }}>

          {/* ══ CONTENT COLUMN ══ */}
          <div>
            {/* Level title card */}
            <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:16, padding:"1.25rem 1.5rem", marginBottom:"1.25rem" }}>
              <div style={{ display:"flex", alignItems:"center", gap:"0.6rem", marginBottom:"0.3rem", flexWrap:"wrap" }}>
                <span style={{ fontWeight:800, fontSize:"0.68rem", color:T.teal, textTransform:"uppercase", letterSpacing:"0.1em", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                  Level {levelNumber}
                </span>
                {isCompleted && (
                  <span style={{ padding:"2px 10px", borderRadius:999, fontSize:"0.65rem", fontWeight:700, fontFamily:"'Plus Jakarta Sans',sans-serif", background:"rgba(94,234,212,0.1)", color:T.teal, border:"1px solid rgba(94,234,212,0.25)" }}>
                    ✓ Completed
                  </span>
                )}
                {thisStatus?.status === "active" && (
                  <span style={{ display:"flex", alignItems:"center", gap:"0.35rem", padding:"2px 10px", borderRadius:999, fontSize:"0.65rem", fontWeight:700, fontFamily:"'Plus Jakarta Sans',sans-serif", background:"rgba(99,102,241,0.1)", color:"#818cf8", border:"1px solid rgba(99,102,241,0.2)" }}>
                    <span style={{ width:5, height:5, borderRadius:"50%", background:"#818cf8", animation:"pulse 1.5s ease-in-out infinite" }} />
                    In Progress
                  </span>
                )}
              </div>
              <h1 style={{ margin:0, fontSize:"clamp(1.1rem,2.5vw,1.4rem)", fontWeight:800, color:T.text, lineHeight:1.25, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                {level.title}
              </h1>
            </div>

            {/* Tabs */}
            <div style={{ display:"flex", gap:"0.25rem", marginBottom:"1.25rem", background:"rgba(255,255,255,0.025)", padding:"4px", borderRadius:12, width:"fit-content", border:`1px solid ${T.border}` }}>
              <TabBtn active={tab === "notes"} onClick={() => setTab("notes")}>📖 Study Notes</TabBtn>
              {quiz && (
                <TabBtn active={tab === "quiz"} onClick={() => setTab("quiz")}>
                  ❓ Level Quiz
                  {isCompleted && <span style={{ marginLeft:"0.35rem", padding:"1px 7px", borderRadius:999, fontSize:"0.6rem", background:"rgba(94,234,212,0.12)", color:T.teal, fontWeight:700, border:"1px solid rgba(94,234,212,0.2)" }}>Passed</span>}
                </TabBtn>
              )}
            </div>

            {/* ── NOTES TAB ────────────────────────────────── */}
            {tab === "notes" && (
              <div>
                {/* Video */}
                {embedUrl ? (
                  <div style={{ borderRadius:16, overflow:"hidden", marginBottom:"1.25rem", boxShadow:"0 8px 32px rgba(0,0,0,0.5)", background:"#000", position:"relative", paddingTop:"56.25%" }}>
                    <iframe src={embedUrl} title={level.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      style={{ position:"absolute", top:0, left:0, width:"100%", height:"100%", border:"none" }} />
                  </div>
                ) : (
                  <div style={{ borderRadius:16, marginBottom:"1.25rem", padding:"2.5rem", background:"rgba(255,255,255,0.02)", border:`1px dashed rgba(94,234,212,0.12)`, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:"0.75rem", textAlign:"center" }}>
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={T.muted} strokeWidth="1.5">
                      <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                    </svg>
                    <p style={{ color:T.muted, fontSize:"0.875rem", fontWeight:600, margin:0, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>No video available for this level.</p>
                  </div>
                )}

                {/* Study Notes */}
                <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:16, overflow:"hidden", marginBottom:"1.25rem" }}>
                  <div style={{ padding:"0.875rem 1.25rem", borderBottom:`1px solid ${T.border}`, display:"flex", alignItems:"center", gap:"0.6rem", background:"rgba(255,255,255,0.02)" }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={T.teal} strokeWidth="2">
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                      <line x1="16" y1="13" x2="8" y2="13"/>
                      <line x1="16" y1="17" x2="8" y2="17"/>
                    </svg>
                    <span style={{ fontWeight:800, fontSize:"0.82rem", color:T.text, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>Study Notes</span>
                  </div>
                  <div style={{ padding:"1.5rem", lineHeight:1.8, color:T.text, fontSize:"0.9rem", fontFamily:"'Nunito',sans-serif" }}>
                    {level.studyNotes
                      ? level.studyNotes.split("\n").map((line, i) => (
                          line.trim() ? <p key={i} style={{ margin:"0 0 0.85rem", color:"rgba(203,213,225,0.8)" }}>{line}</p> : <br key={i} />
                        ))
                      : <p style={{ color:T.muted, margin:0, fontStyle:"italic" }}>No study notes available for this level.</p>
                    }
                  </div>
                </div>

                {/* CTA to quiz */}
                {quiz && !isCompleted && (
                  <div style={{ borderRadius:16, padding:"1.5rem", background:"linear-gradient(135deg,rgba(20,184,166,0.12),rgba(99,102,241,0.12))", border:"1px solid rgba(94,234,212,0.2)", textAlign:"center" }}>
                    <p style={{ color:T.muted, margin:"0 0 1rem", fontSize:"0.875rem" }}>Ready to test your knowledge?</p>
                    <button onClick={() => setTab("quiz")}
                      style={{ padding:"0.65rem 1.75rem", background:"linear-gradient(135deg,#14b8a6,#6366f1)", color:"white", border:"none", borderRadius:11, fontSize:"0.875rem", fontWeight:800, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif", boxShadow:"0 4px 14px rgba(20,184,166,0.22)" }}>
                      Take Level Quiz →
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ── QUIZ TAB ─────────────────────────────────── */}
            {tab === "quiz" && quiz && (
              <div>
                {!submitted ? (
                  <div>
                    {/* Quiz header */}
                    <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:16, padding:"1.25rem 1.5rem", marginBottom:"1.25rem" }}>
                      <h2 style={{ margin:"0 0 0.75rem", fontSize:"1rem", fontWeight:800, color:T.text, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{quiz.title}</h2>
                      <div style={{ display:"flex", gap:"1.25rem", alignItems:"center", flexWrap:"wrap" }}>
                        <span style={{ fontSize:"0.78rem", color:T.muted, fontFamily:"'Nunito',sans-serif" }}>{quiz.questions.length} questions</span>
                        <span style={{ fontSize:"0.78rem", color:T.muted }}>Pass: <strong style={{ color:T.amber }}>{PASS_THRESHOLD}%</strong></span>
                        <div style={{ flex:1, minWidth:120 }}>
                          <div style={{ display:"flex", justifyContent:"space-between", fontSize:"0.7rem", color:T.muted, marginBottom:"0.3rem", fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:700 }}>
                            <span>Answered</span>
                            <span style={{ color:T.teal }}>{answeredCount} / {quiz.questions.length}</span>
                          </div>
                          <div style={{ height:4, background:"rgba(255,255,255,0.06)", borderRadius:999 }}>
                            <div style={{ height:"100%", width:`${(answeredCount/quiz.questions.length)*100}%`, background:"linear-gradient(90deg,#14b8a6,#6366f1)", borderRadius:999, transition:"width 0.3s" }} />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Questions */}
                    <div style={{ display:"flex", flexDirection:"column", gap:"1rem", marginBottom:"1.5rem" }}>
                      {quiz.questions.map((q, qi) => {
                        const answered = !!answers[q._id];
                        return (
                          <div key={q._id} style={{ background:T.surface, border:`1px solid ${answered ? "rgba(94,234,212,0.25)" : T.border}`, borderRadius:16, padding:"1.25rem 1.5rem", transition:"border-color 0.2s" }}>
                            <div style={{ display:"flex", gap:"0.875rem", marginBottom:"1rem" }}>
                              <div style={{ width:28, height:28, borderRadius:8, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:"0.78rem", fontFamily:"'Plus Jakarta Sans',sans-serif",
                                background: answered ? "linear-gradient(135deg,#14b8a6,#6366f1)" : "rgba(255,255,255,0.05)",
                                color: answered ? "white" : T.muted }}>
                                {qi + 1}
                              </div>
                              <p style={{ margin:0, fontWeight:600, fontSize:"0.9rem", color:T.text, lineHeight:1.55, flex:1, fontFamily:"'Nunito',sans-serif" }}>{q.questionText}</p>
                            </div>
                            <div style={{ display:"flex", flexDirection:"column", gap:"0.45rem" }}>
                              {q.options.map(opt => {
                                const sel = answers[q._id] === opt;
                                return (
                                  <label key={opt} className="option-row" style={{ display:"flex", alignItems:"center", gap:"0.75rem", padding:"0.75rem 1rem", borderRadius:10, cursor:"pointer",
                                    border:`1.5px solid ${sel ? "rgba(94,234,212,0.4)" : T.border}`,
                                    background: sel ? "rgba(94,234,212,0.06)" : "transparent", transition:"all 0.15s" }}>
                                    <div style={{ width:18, height:18, borderRadius:"50%", flexShrink:0, border:`2px solid ${sel ? T.teal : T.border}`, background: sel ? T.teal : "transparent", display:"flex", alignItems:"center", justifyContent:"center", transition:"all 0.15s" }}>
                                      {sel && <div style={{ width:6, height:6, borderRadius:"50%", background:"#060d1a" }} />}
                                    </div>
                                    <input type="radio" name={q._id} value={opt} checked={sel}
                                      onChange={() => setAnswers(prev => ({ ...prev, [q._id]:opt }))}
                                      style={{ display:"none" }} />
                                    <span style={{ fontSize:"0.875rem", color: sel ? T.teal : "rgba(203,213,225,0.75)", fontWeight: sel ? 700 : 400, fontFamily:"'Nunito',sans-serif" }}>{opt}</span>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Submit */}
                    <button
                      style={{ width:"100%", padding:"0.875rem", borderRadius:12, border:"none", fontSize:"0.9rem", fontWeight:800, cursor: (submitting || answeredCount < quiz.questions.length) ? "not-allowed" : "pointer", fontFamily:"'Plus Jakarta Sans',sans-serif", display:"flex", alignItems:"center", justifyContent:"center", gap:"0.5rem", transition:"all 0.2s",
                        background: (submitting || answeredCount < quiz.questions.length) ? "rgba(255,255,255,0.04)" : "linear-gradient(135deg,#14b8a6,#6366f1)",
                        color: (submitting || answeredCount < quiz.questions.length) ? T.muted : "white",
                        boxShadow: (submitting || answeredCount < quiz.questions.length) ? "none" : "0 4px 18px rgba(20,184,166,0.25)",
                      }}
                      disabled={submitting || answeredCount < quiz.questions.length}
                      onClick={handleSubmit}>
                      {submitting
                        ? <><span style={{ display:"inline-block", width:14, height:14, border:"2px solid rgba(255,255,255,0.2)", borderTopColor:T.teal, borderRadius:"50%", animation:"spin 0.8s linear infinite" }} /> Submitting…</>
                        : `Submit Quiz (${answeredCount}/${quiz.questions.length} answered)`
                      }
                    </button>
                  </div>
                ) : (
                  /* ── Result ──────────────────────────────── */
                  <div style={{ background:T.surface, border:`1px solid ${passed ? "rgba(94,234,212,0.25)" : "rgba(248,113,113,0.25)"}`, borderRadius:20, padding:"2.5rem 2rem", textAlign:"center", animation:"popIn 0.3s ease both" }}>
                    <div style={{ fontSize:"2.5rem", marginBottom:"0.75rem" }}>{passed ? "🎉" : "📚"}</div>
                    <h2 style={{ margin:"0 0 0.3rem", fontSize:"1.3rem", fontWeight:800, color:T.text, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                      {passed ? "You passed!" : "Keep practising!"}
                    </h2>
                    <p style={{ color:T.muted, margin:"0 0 2rem", fontSize:"0.875rem" }}>
                      {passed ? "Great work completing this level." : "Review the notes and try again."}
                    </p>

                    {/* Score circle */}
                    <div style={{ display:"flex", justifyContent:"center", marginBottom:"2rem" }}>
                      <div style={{ width:110, height:110, borderRadius:"50%", border:`5px solid ${passed ? T.teal : T.red}`, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
                        background: passed ? "rgba(94,234,212,0.06)" : "rgba(248,113,113,0.06)",
                        boxShadow: passed ? "0 0 28px rgba(94,234,212,0.15)" : "0 0 28px rgba(248,113,113,0.15)" }}>
                        <span style={{ fontSize:"1.75rem", fontWeight:800, color: passed ? T.teal : T.red, lineHeight:1, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{result.score}%</span>
                        <span style={{ fontSize:"0.65rem", color:T.muted, fontWeight:700, fontFamily:"'Plus Jakarta Sans',sans-serif", textTransform:"uppercase", letterSpacing:"0.06em" }}>Score</span>
                      </div>
                    </div>

                    {/* Stats */}
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"0.75rem", marginBottom:"2rem" }}>
                      {[
                        { label:"Correct",   value:`${result.correct} / ${result.total}` },
                        { label:"Pass Mark", value:`${PASS_THRESHOLD}%` },
                        { label:"Status",    value: passed ? "Passed ✓" : "Failed ✗", color: passed ? T.teal : T.red },
                      ].map(s => (
                        <div key={s.label} style={{ background:"rgba(255,255,255,0.025)", border:`1px solid ${T.border}`, borderRadius:12, padding:"0.9rem 0.5rem" }}>
                          <div style={{ fontSize:"1rem", fontWeight:800, color: s.color || T.text, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{s.value}</div>
                          <div style={{ fontSize:"0.68rem", color:T.muted, marginTop:"0.2rem", textTransform:"uppercase", letterSpacing:"0.05em", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{s.label}</div>
                        </div>
                      ))}
                    </div>

                    {/* Actions */}
                    <div style={{ display:"flex", gap:"0.75rem", flexWrap:"wrap", justifyContent:"center" }}>
                      {passed ? (
                        nextLevelInfo ? (
                          <button onClick={() => navigate(`/courses/${courseId}/level/${nextLevelStatus?.status === "active" ? nextLevelInfo.levelNumber : ""}`.replace(/level\/$/, "students"))}
                            style={{ padding:"0.65rem 1.75rem", background:"linear-gradient(135deg,#14b8a6,#6366f1)", color:"white", border:"none", borderRadius:11, fontWeight:800, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif", boxShadow:"0 4px 14px rgba(20,184,166,0.22)" }}>
                            {nextLevelStatus?.status === "active" ? `Study Level ${nextLevelInfo.levelNumber} →` : `Register Level ${nextLevelInfo.levelNumber} →`}
                          </button>
                        ) : (
                          <button onClick={() => navigate("/my-courses")}
                            style={{ padding:"0.65rem 1.75rem", background:"linear-gradient(135deg,#10b981,#059669)", color:"white", border:"none", borderRadius:11, fontWeight:800, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif", boxShadow:"0 4px 14px rgba(16,185,129,0.25)" }}>
                            🏆 Course Complete — My Courses
                          </button>
                        )
                      ) : (
                        <>
                          <button onClick={() => { setAnswers({}); setSubmitted(false); setResult(null); setTab("notes"); }}
                            style={{ padding:"0.65rem 1.4rem", background:T.surface, color:T.muted, border:`1px solid ${T.border}`, borderRadius:11, fontWeight:700, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                            Review Notes
                          </button>
                          <button onClick={() => navigate("/students")}
                            style={{ padding:"0.65rem 1.4rem", background:"linear-gradient(135deg,#14b8a6,#6366f1)", color:"white", border:"none", borderRadius:11, fontWeight:800, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                            Re-register in Available Courses
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ══ SIDEBAR ══ */}
          <aside className="sidebar" style={{ position:"sticky", top:"1.5rem", display:"flex", flexDirection:"column", gap:"1rem" }}>

            {/* Course info + Level list */}
            <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:16, overflow:"hidden" }}>
              <div style={{ padding:"0.875rem 1.1rem", borderBottom:`1px solid ${T.border}`, background:"rgba(255,255,255,0.02)" }}>
                <p style={{ margin:0, fontSize:"0.65rem", fontWeight:700, color:T.muted, textTransform:"uppercase", letterSpacing:"0.08em", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>Course</p>
                <p style={{ margin:"0.2rem 0 0", fontWeight:800, fontSize:"0.875rem", color:T.text, lineHeight:1.35, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{course.title}</p>
              </div>

              <div style={{ padding:"0.625rem 0" }}>
                <p style={{ margin:"0 0 0.5rem", padding:"0 1.1rem", fontSize:"0.65rem", fontWeight:700, color:T.muted, textTransform:"uppercase", letterSpacing:"0.08em", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>Levels</p>
                {levels.map(lv => {
                  const st       = levelStatuses.find(s => s.levelNumber === lv.levelNumber);
                  const status   = st?.status || "locked";
                  const isCur    = lv.levelNumber === levelNumber;
                  const canClick = (status === "active" || status === "completed" || status === "failed") && !isCur;
                  const sc       = STATUS_CFG[status] || STATUS_CFG.locked;
                  const icon     = status === "completed" ? "✓" : status === "failed" ? "✗" : status === "locked" ? "🔒" : lv.levelNumber;

                  return (
                    <button key={lv.levelNumber} className="sidebar-lvl-btn" disabled={!canClick}
                      onClick={() => canClick && navigate(`/courses/${courseId}/level/${lv.levelNumber}`)}
                      style={{ display:"flex", alignItems:"center", gap:"0.65rem", width:"100%", padding:"0.6rem 1.1rem", textAlign:"left",
                        background: isCur ? "rgba(94,234,212,0.06)" : "transparent",
                        border:"none", borderLeft:`3px solid ${isCur ? T.teal : "transparent"}`,
                        cursor: canClick ? "pointer" : isCur ? "default" : "not-allowed",
                        transition:"background 0.15s",
                      }}>
                      <div style={{ width:26, height:26, borderRadius:7, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:"0.7rem", fontFamily:"'Plus Jakarta Sans',sans-serif",
                        background: isCur ? "linear-gradient(135deg,#14b8a6,#6366f1)" : sc.bg,
                        color: isCur ? "white" : sc.color,
                        border: isCur ? "none" : `1.5px solid ${sc.border}`,
                      }}>
                        {icon}
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:"0.78rem", fontWeight: isCur ? 700 : 500, color: isCur ? T.teal : T.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                          {lv.title}
                        </div>
                        {st?.score != null && (
                          <div style={{ fontSize:"0.65rem", color:T.muted, marginTop:1 }}>{st.score}%</div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick links */}
            <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:16, padding:"1rem 1.1rem" }}>
              <p style={{ margin:"0 0 0.65rem", fontSize:"0.65rem", fontWeight:700, color:T.muted, textTransform:"uppercase", letterSpacing:"0.08em", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>Quick Links</p>
              <div style={{ display:"flex", flexDirection:"column", gap:"0.25rem" }}>
                {[
                  { to:`/courses/${courseId}`, icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>, label:"Course Details" },
                  { to:"/my-courses", icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>, label:"My Courses" },
                ].map(link => (
                  <Link key={link.to} to={link.to} className="quick-link"
                    style={{ fontSize:"0.8rem", color:T.muted, textDecoration:"none", display:"flex", alignItems:"center", gap:"0.45rem", padding:"0.45rem 0.5rem", borderRadius:8, fontWeight:600, fontFamily:"'Plus Jakarta Sans',sans-serif", transition:"all 0.15s" }}>
                    {link.icon}{link.label}
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}