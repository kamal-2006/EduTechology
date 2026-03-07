import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { courseAPI, quizAPI, levelRegAPI } from "../services/api.js";

/* ── Constants ─────────────────────────────────────────────── */
const DIFF_META = {
  Beginner:     { color:"#5eead4", bg:"rgba(94,234,212,0.1)",  border:"rgba(94,234,212,0.3)"  },
  Intermediate: { color:"#fbbf24", bg:"rgba(251,191,36,0.1)",  border:"rgba(251,191,36,0.3)"  },
  Advanced:     { color:"#f87171", bg:"rgba(248,113,113,0.1)", border:"rgba(248,113,113,0.3)" },
};

const FALLBACK_BG = [
  "linear-gradient(135deg,#14b8a6 0%,#6366f1 100%)",
  "linear-gradient(135deg,#f093fb 0%,#f5576c 100%)",
  "linear-gradient(135deg,#4facfe 0%,#00f2fe 100%)",
];

const STATUS_CFG = {
  locked:    { label:"Locked",      bg:"rgba(255,255,255,0.04)", color:"rgba(148,163,184,0.4)", border:"rgba(255,255,255,0.07)", icon:"🔒" },
  available: { label:"Available",   bg:"rgba(99,102,241,0.1)",   color:"#818cf8",               border:"rgba(99,102,241,0.25)", icon:"📖" },
  active:    { label:"In Progress", bg:"rgba(94,234,212,0.08)",  color:"#5eead4",               border:"rgba(94,234,212,0.25)", icon:"⚡" },
  completed: { label:"Completed",   bg:"rgba(94,234,212,0.08)",  color:"#5eead4",               border:"rgba(94,234,212,0.25)", icon:"✓"  },
  failed:    { label:"Failed",      bg:"rgba(248,113,113,0.08)", color:"#f87171",               border:"rgba(248,113,113,0.25)",icon:"✗"  },
};

/* ── Styles ─────────────────────────────────────────────────── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Nunito:wght@300;400;500;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #060d1a; font-family: 'Nunito', sans-serif; color: rgba(226,232,240,0.88); }
  @keyframes spin        { to { transform: rotate(360deg); } }
  @keyframes fadeSlideUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  @keyframes glowPulse   { 0%,100%{box-shadow:0 0 14px rgba(94,234,212,0.2)} 50%{box-shadow:0 0 28px rgba(94,234,212,0.45)} }
  @keyframes pulse       { 0%,100%{opacity:1} 50%{opacity:0.4} }
  @keyframes toastIn     { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
  ::-webkit-scrollbar { width:5px; }
  ::-webkit-scrollbar-track { background:rgba(255,255,255,0.02); }
  ::-webkit-scrollbar-thumb { background:rgba(94,234,212,0.18); border-radius:999px; }
  .level-card { transition: all 0.2s; }
  .level-card:hover:not([data-locked="true"]) { border-color: rgba(94,234,212,0.22) !important; transform: translateY(-2px); box-shadow: 0 8px 28px rgba(0,0,0,0.3) !important; }
  .quiz-card  { transition: all 0.2s; }
  .quiz-card:hover  { border-color: rgba(99,102,241,0.3) !important; transform: translateY(-2px); }
  .lesson-row { transition: background 0.15s; }
  .lesson-row:hover { background: rgba(255,255,255,0.04) !important; }
  .ghost-btn { transition: all 0.15s; }
  .ghost-btn:hover { background: rgba(255,255,255,0.07) !important; }
  .primary-btn { transition: all 0.15s; }
  .primary-btn:hover { opacity: 0.88; transform: translateY(-1px); }
  .outline-btn { transition: all 0.15s; }
  .outline-btn:hover { background: rgba(255,255,255,0.05) !important; }
`;

const T = {
  surface: "rgba(255,255,255,0.03)",
  border:  "rgba(255,255,255,0.08)",
  text:    "rgba(226,232,240,0.88)",
  muted:   "rgba(148,163,184,0.5)",
  teal:    "#5eead4",
  indigo:  "#6366f1",
  red:     "#f87171",
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

/* ── Section Header ─────────────────────────────────────────── */
function SectionHeader({ icon, title }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:"0.5rem", marginBottom:"1rem" }}>
      <span style={{ fontSize:"1rem" }}>{icon}</span>
      <h2 style={{ fontSize:"0.9375rem", fontWeight:800, color:T.text, margin:0, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{title}</h2>
    </div>
  );
}

/* ── Main ───────────────────────────────────────────────────── */
export default function CoursePage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [course,        setCourse]        = useState(null);
  const [quizzes,       setQuizzes]       = useState([]);
  const [levelStatuses, setLevelStatuses] = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState("");
  const [registering,   setRegistering]   = useState(null);
  const [regMsg,        setRegMsg]        = useState({ text:"", type:"" });

  const raw     = localStorage.getItem("user");
  const user    = raw ? JSON.parse(raw) : {};
  const isAdmin = ["admin","faculty"].includes(user.role);

  useEffect(() => {
    if (id === "create") { setLoading(false); return; }
    const fetchAll = async () => {
      try {
        const promises = [courseAPI.getById(id), quizAPI.getByCourse(id)];
        if (!isAdmin) promises.push(levelRegAPI.getCourseStatus(id));
        const results = await Promise.all(promises);
        setCourse(results[0].data.data);
        setQuizzes(results[1].data.data);
        if (!isAdmin) setLevelStatuses(results[2].data.data?.levelStatuses || []);
      } catch { setError("Failed to load course."); }
      finally  { setLoading(false); }
    };
    fetchAll();
  }, [id, isAdmin]);

  const handleLevelRegister = async (levelNumber) => {
    setRegistering(levelNumber);
    setRegMsg({ text:"", type:"" });
    try {
      await levelRegAPI.registerLevel(id, levelNumber);
      const res = await levelRegAPI.getCourseStatus(id);
      setLevelStatuses(res.data.data?.levelStatuses || []);
      setRegMsg({ text:`Registered for Level ${levelNumber}!`, type:"success" });
      setTimeout(() => setRegMsg({ text:"", type:"" }), 3000);
    } catch (err) {
      setRegMsg({ text: err.response?.data?.message || "Registration failed.", type:"error" });
      setTimeout(() => setRegMsg({ text:"", type:"" }), 3500);
    } finally { setRegistering(null); }
  };

  /* ── Loading ──────────────────────────────────────────────── */
  if (loading) return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"100vh", background:"#060d1a", gap:"1rem" }}>
      <style>{STYLES}</style>
      <div style={{ width:"40px", height:"40px", border:"3px solid rgba(94,234,212,0.1)", borderTopColor:"#5eead4", borderRadius:"50%", animation:"spin 0.8s linear infinite" }} />
      <span style={{ color:T.muted, fontSize:"0.875rem", fontFamily:"'Nunito',sans-serif" }}>Loading course…</span>
    </div>
  );

  /* ── Error ────────────────────────────────────────────────── */
  if (error || (!course && id !== "create")) return (
    <div style={{ minHeight:"100vh", background:"#060d1a", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <style>{STYLES}</style>
      <div style={{ padding:"1.25rem 2rem", borderRadius:14, background:"rgba(248,113,113,0.08)", border:"1px solid rgba(248,113,113,0.25)", color:T.red, fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:600 }}>
        ⚠️ {error || "Course not found."}
      </div>
    </div>
  );

  const totalLevels  = course?.levels?.length  || 0;
  const totalLessons = course?.lessons?.length || 0;
  const doneLevels   = levelStatuses.filter(ls => ls.status === "completed").length;
  const pct          = totalLevels > 0 ? Math.round((doneLevels / totalLevels) * 100) : 0;
  const dm           = DIFF_META[course?.difficulty] || DIFF_META.Beginner;

  return (
    <div style={{ minHeight:"100vh", background:"#060d1a" }}>
      <style>{STYLES}</style>
      <Navbar />

      <div style={{ maxWidth:"1100px", margin:"0 auto", padding:"1.75rem 1.75rem 5rem", animation:"fadeSlideUp 0.45s ease both" }}>

        {/* ── Hero Banner ───────────────────────────────────── */}
        <div style={{ borderRadius:20, overflow:"hidden", marginBottom:"1.75rem", position:"relative", minHeight:220, display:"flex", flexDirection:"column", justifyContent:"flex-end", padding:"2rem",
          background: course.image
            ? `linear-gradient(rgba(6,13,26,0.35), rgba(6,13,26,0.78)), url("${course.image}") center/cover`
            : FALLBACK_BG[totalLevels % FALLBACK_BG.length],
          boxShadow:"0 8px 40px rgba(0,0,0,0.45)",
        }}>
          {/* Back */}
          <button className="ghost-btn" onClick={() => navigate(isAdmin ? "/" : "/students")}
            style={{ position:"absolute", top:"1rem", left:"1rem", display:"flex", alignItems:"center", gap:"0.35rem", padding:"0.4rem 0.9rem", borderRadius:999, background:"rgba(6,13,26,0.55)", backdropFilter:"blur(8px)", color:"rgba(226,232,240,0.85)", border:"1px solid rgba(255,255,255,0.15)", fontSize:"0.8rem", fontWeight:700, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
            ← Back
          </button>

          {/* Edit (admin) */}
          {isAdmin && (
            <button className="ghost-btn" onClick={() => navigate(`/courses/edit/${id}`)}
              style={{ position:"absolute", top:"1rem", right:"1rem", display:"flex", alignItems:"center", gap:"0.35rem", padding:"0.4rem 0.9rem", borderRadius:999, background:"rgba(6,13,26,0.55)", backdropFilter:"blur(8px)", color:"rgba(226,232,240,0.85)", border:"1px solid rgba(255,255,255,0.15)", fontSize:"0.8rem", fontWeight:700, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
              ✏️ Edit Course
            </button>
          )}

          {/* Difficulty badge */}
          <span style={{ position:"absolute", top: isAdmin ? "3.5rem" : "1rem", right:"1rem", padding:"3px 12px", borderRadius:999, fontSize:"0.72rem", fontWeight:800, fontFamily:"'Plus Jakarta Sans',sans-serif", background:dm.bg, color:dm.color, border:`1px solid ${dm.border}`, backdropFilter:"blur(6px)" }}>
            {course.difficulty}
          </span>

          {/* Title */}
          <h1 style={{ margin:0, fontSize:"clamp(1.3rem,3vw,2rem)", fontWeight:800, color:"white", lineHeight:1.2, fontFamily:"'Plus Jakarta Sans',sans-serif", textShadow:"0 2px 12px rgba(0,0,0,0.5)" }}>
            {course.title}
          </h1>

          {/* Topic chips */}
          {course.topics?.length > 0 && (
            <div style={{ display:"flex", gap:"0.4rem", flexWrap:"wrap", marginTop:"0.5rem" }}>
              {course.topics.map(t => (
                <span key={t} style={{ padding:"2px 10px", borderRadius:999, fontSize:"0.7rem", fontWeight:600, background:"rgba(255,255,255,0.12)", color:"rgba(255,255,255,0.8)", backdropFilter:"blur(4px)", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{t}</span>
              ))}
            </div>
          )}

          {/* Stats */}
          <div style={{ display:"flex", gap:"1.25rem", marginTop:"0.875rem", flexWrap:"wrap" }}>
            {[
              { icon:"📚", val:`${totalLevels} Level${totalLevels!==1?"s":""}` },
              { icon:"📋", val:`${totalLessons} Lesson${totalLessons!==1?"s":""}` },
              ...(!isAdmin && totalLevels > 0 ? [{ icon:"🎯", val:`${pct}% Complete` }] : []),
            ].map(s => (
              <span key={s.val} style={{ fontSize:"0.82rem", fontWeight:600, color:"rgba(255,255,255,0.75)", display:"flex", alignItems:"center", gap:"0.3rem", fontFamily:"'Nunito',sans-serif" }}>
                {s.icon} {s.val}
              </span>
            ))}
          </div>

          {/* Progress bar */}
          {!isAdmin && totalLevels > 0 && (
            <div style={{ marginTop:"1rem" }}>
              <div style={{ height:5, background:"rgba(255,255,255,0.15)", borderRadius:999 }}>
                <div style={{ height:"100%", width:`${pct}%`, borderRadius:999, transition:"width 0.5s", background: pct===100 ? T.teal : "linear-gradient(90deg,#6366f1,#818cf8)" }} />
              </div>
            </div>
          )}
        </div>

        {/* ── Description ───────────────────────────────────── */}
        {course.description && (
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:16, padding:"1.1rem 1.4rem", marginBottom:"1.75rem" }}>
            <p style={{ margin:0, color:T.muted, lineHeight:1.75, fontSize:"0.875rem" }}>{course.description}</p>
          </div>
        )}

        {/* ── Toast ─────────────────────────────────────────── */}
        {regMsg.text && (
          <div style={{ position:"fixed", bottom:"1.75rem", right:"1.75rem", zIndex:9999, display:"flex", alignItems:"center", gap:"0.625rem", padding:"0.75rem 1.125rem", borderRadius:12, fontWeight:700, fontSize:"0.875rem", fontFamily:"'Plus Jakarta Sans',sans-serif",
            background: regMsg.type==="success" ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.1)",
            border:`1px solid ${regMsg.type==="success" ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`,
            color: regMsg.type==="success" ? T.green : T.red,
            boxShadow:"0 8px 28px rgba(0,0,0,0.4)", backdropFilter:"blur(12px)", animation:"toastIn 0.25s ease both",
          }}>
            <span>{regMsg.type==="success" ? "✅" : "⚠️"}</span>
            {regMsg.text}
          </div>
        )}

        {/* ── LEVELS (Student) ──────────────────────────────── */}
        {!isAdmin && totalLevels > 0 && (
          <section style={{ marginBottom:"2rem" }}>
            <SectionHeader icon="📚" title="Course Levels" />
            <div style={{ display:"flex", flexDirection:"column", gap:"0.625rem" }}>
              {course.levels.map(lv => {
                const ls       = levelStatuses.find(s => s.levelNumber === lv.levelNumber);
                const status   = ls?.status || "locked";
                const sc       = STATUS_CFG[status] || STATUS_CFG.locked;
                const isBusy   = registering === lv.levelNumber;
                const attempts = ls?.attemptCount || 0;
                const scoreStr = ls?.score != null ? ` · ${ls.score}%` : "";
                const isLocked = status === "locked";

                return (
                  <div key={lv.levelNumber} className="level-card" data-locked={isLocked}
                    style={{ display:"flex", alignItems:"center", gap:"1rem", flexWrap:"wrap", background:T.surface, border:`1px solid ${sc.border}`, borderRadius:14, padding:"1rem 1.25rem", opacity: isLocked ? 0.5 : 1, boxShadow:"0 2px 12px rgba(0,0,0,0.15)" }}>

                    {/* Circle icon */}
                    <div style={{ width:44, height:44, borderRadius:12, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.1rem", background:sc.bg, border:`1.5px solid ${sc.border}` }}>
                      {sc.icon}
                    </div>

                    {/* Info */}
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:"0.5rem", flexWrap:"wrap", marginBottom:"0.2rem" }}>
                        <span style={{ fontWeight:800, fontSize:"0.9rem", color:T.text, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                          Level {lv.levelNumber}: {lv.title}
                        </span>
                        <span style={{ padding:"2px 9px", borderRadius:999, fontSize:"0.65rem", fontWeight:700, background:sc.bg, color:sc.color, border:`1px solid ${sc.border}`, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                          {sc.label}{status!=="locked"&&status!=="available" ? scoreStr : ""}
                        </span>
                        {status === "active" && (
                          <span style={{ width:6, height:6, borderRadius:"50%", background:T.teal, animation:"pulse 1.5s ease-in-out infinite", flexShrink:0 }} />
                        )}
                      </div>
                      <div style={{ fontSize:"0.75rem", color:T.muted }}>
                        {attempts > 0 ? `${attempts} attempt${attempts>1?"s":""}` : "Not started"}
                      </div>
                    </div>

                    {/* CTA */}
                    <div style={{ flexShrink:0 }}>
                      {status === "locked" && (
                        <button disabled style={{ padding:"0.4rem 0.875rem", borderRadius:8, border:`1px solid ${T.border}`, background:"transparent", color:T.muted, fontSize:"0.78rem", fontWeight:700, cursor:"not-allowed", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>🔒 Locked</button>
                      )}
                      {status === "available" && (
                        <button className="primary-btn" disabled={isBusy} onClick={() => handleLevelRegister(lv.levelNumber)}
                          style={{ padding:"0.4rem 1rem", borderRadius:9, border:"none", background:"linear-gradient(135deg,#14b8a6,#6366f1)", color:"white", fontSize:"0.8rem", fontWeight:800, cursor: isBusy?"default":"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif", boxShadow:"0 3px 10px rgba(20,184,166,0.2)" }}>
                          {isBusy ? <span style={{ display:"inline-block", width:12, height:12, border:"2px solid rgba(255,255,255,0.3)", borderTopColor:"white", borderRadius:"50%", animation:"spin 0.8s linear infinite" }} /> : "Register"}
                        </button>
                      )}
                      {status === "active" && (
                        <button className="primary-btn" onClick={() => navigate(`/courses/${id}/level/${lv.levelNumber}`)}
                          style={{ padding:"0.4rem 1rem", borderRadius:9, border:"none", background:"linear-gradient(135deg,#14b8a6,#6366f1)", color:"white", fontSize:"0.8rem", fontWeight:800, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif", display:"flex", alignItems:"center", gap:"0.35rem", boxShadow:"0 3px 10px rgba(20,184,166,0.2)" }}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg> Study Now
                        </button>
                      )}
                      {status === "completed" && (
                        <button className="outline-btn" onClick={() => navigate(`/courses/${id}/level/${lv.levelNumber}`)}
                          style={{ padding:"0.4rem 1rem", borderRadius:9, border:`1px solid rgba(94,234,212,0.3)`, background:"rgba(94,234,212,0.05)", color:T.teal, fontSize:"0.78rem", fontWeight:700, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                          Review
                        </button>
                      )}
                      {status === "failed" && (
                        <button className="outline-btn" disabled={isBusy} onClick={() => handleLevelRegister(lv.levelNumber)}
                          style={{ padding:"0.4rem 1rem", borderRadius:9, border:`1px solid rgba(248,113,113,0.3)`, background:"rgba(248,113,113,0.06)", color:T.red, fontSize:"0.78rem", fontWeight:700, cursor: isBusy?"default":"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                          {isBusy ? "…" : "Re-register"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ── LESSONS ───────────────────────────────────────── */}
        <section style={{ marginBottom:"2rem" }}>
          <SectionHeader icon="📋" title="Course Contents" />
          {(!course.lessons || course.lessons.length === 0) ? (
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", padding:"3.5rem 1.5rem", background:T.surface, border:`1px dashed rgba(94,234,212,0.12)`, borderRadius:16, textAlign:"center" }}>
              <div style={{ fontSize:"2.5rem", marginBottom:"0.75rem" }}>📋</div>
              <p style={{ color:T.muted, fontSize:"0.875rem" }}>No lessons have been added yet.</p>
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:"0.5rem" }}>
              {course.lessons.map((lesson, idx) => (
                <div key={idx} className="lesson-row" style={{ display:"flex", alignItems:"flex-start", gap:"0.875rem", background:T.surface, border:`1px solid ${T.border}`, borderRadius:12, padding:"0.9rem 1.1rem" }}>
                  <div style={{ width:32, height:32, borderRadius:9, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:"0.75rem", fontFamily:"'Plus Jakarta Sans',sans-serif", background:"rgba(99,102,241,0.12)", color:"rgba(129,140,248,0.85)", border:"1px solid rgba(99,102,241,0.2)" }}>
                    {lesson.order ?? idx + 1}
                  </div>
                  <div>
                    <div style={{ fontWeight:700, fontSize:"0.875rem", color:T.text, marginBottom:"0.2rem", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{lesson.title}</div>
                    {lesson.content && (
                      <div style={{ fontSize:"0.8rem", color:T.muted, lineHeight:1.55 }}>{lesson.content}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── QUIZZES (Admin) ───────────────────────────────── */}
        {isAdmin && (
          <section>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"1rem", flexWrap:"wrap", gap:"0.75rem" }}>
              <div style={{ display:"flex", alignItems:"center", gap:"0.5rem" }}>
                <span style={{ fontSize:"1rem" }}>📝</span>
                <h2 style={{ fontSize:"0.9375rem", fontWeight:800, color:T.text, margin:0, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>Quizzes</h2>
                <span style={{ padding:"2px 9px", borderRadius:999, fontSize:"0.65rem", fontWeight:700, background:"rgba(94,234,212,0.08)", color:T.teal, border:"1px solid rgba(94,234,212,0.2)", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                  {quizzes.length}
                </span>
              </div>
              <button className="primary-btn" onClick={() => navigate(`/quiz/create`)}
                style={{ padding:"0.45rem 1rem", borderRadius:9, border:"none", background:"linear-gradient(135deg,#14b8a6,#6366f1)", color:"white", fontSize:"0.8rem", fontWeight:800, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif", boxShadow:"0 3px 10px rgba(20,184,166,0.2)", display:"flex", alignItems:"center", gap:"0.35rem" }}>
                + New Quiz
              </button>
            </div>

            {quizzes.length === 0 ? (
              <div style={{ display:"flex", flexDirection:"column", alignItems:"center", padding:"3.5rem 1.5rem", background:T.surface, border:`1px dashed rgba(94,234,212,0.12)`, borderRadius:16, textAlign:"center" }}>
                <div style={{ fontSize:"2.5rem", marginBottom:"0.75rem" }}>📝</div>
                <p style={{ color:T.muted, fontSize:"0.875rem" }}>No quizzes for this course yet.</p>
              </div>
            ) : (
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:"0.875rem" }}>
                {quizzes.map(quiz => (
                  <div key={quiz._id} className="quiz-card" style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:16, padding:"1.25rem", display:"flex", flexDirection:"column", gap:"0.75rem" }}>
                    <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:"0.5rem" }}>
                      <span style={{ fontWeight:800, fontSize:"0.875rem", color:T.text, fontFamily:"'Plus Jakarta Sans',sans-serif", lineHeight:1.3 }}>
                        📝 {quiz.title}
                      </span>
                      <span style={{ padding:"2px 9px", borderRadius:999, fontSize:"0.65rem", fontWeight:700, background:"rgba(99,102,241,0.1)", color:"rgba(129,140,248,0.85)", border:"1px solid rgba(99,102,241,0.2)", flexShrink:0, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                        L{quiz.levelNumber ?? 1}
                      </span>
                    </div>
                    <p style={{ margin:0, fontSize:"0.78rem", color:T.muted }}>
                      {quiz.questions?.length ?? 0} questions · {quiz.totalMarks} marks
                    </p>
                    <div style={{ display:"flex", gap:"0.5rem", flexWrap:"wrap" }}>
                      <Link to={`/quiz/${quiz._id}?courseId=${course._id}`}
                        style={{ padding:"0.4rem 0.875rem", borderRadius:8, background:"linear-gradient(135deg,#14b8a6,#6366f1)", color:"white", fontSize:"0.78rem", fontWeight:800, textDecoration:"none", fontFamily:"'Plus Jakarta Sans',sans-serif", boxShadow:"0 2px 8px rgba(20,184,166,0.18)" }}>
                        Preview →
                      </Link>
                      <button className="outline-btn" onClick={() => navigate(`/quiz/edit/${quiz._id}`)}
                        style={{ padding:"0.4rem 0.875rem", borderRadius:8, border:`1px solid ${T.border}`, background:"transparent", color:T.muted, fontSize:"0.78rem", fontWeight:700, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                        ✏️ Edit
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}