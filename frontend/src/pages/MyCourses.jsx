import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { levelRegAPI } from "../services/api";

/* ── Constants ─────────────────────────────────────────────── */
const DIFF_META = {
  Beginner:     { color:"#5eead4", bg:"rgba(94,234,212,0.12)",  border:"rgba(94,234,212,0.3)"  },
  Intermediate: { color:"#fbbf24", bg:"rgba(251,191,36,0.12)",  border:"rgba(251,191,36,0.3)"  },
  Advanced:     { color:"#f87171", bg:"rgba(248,113,113,0.12)", border:"rgba(248,113,113,0.3)" },
};

const FALLBACK_BG = [
  "linear-gradient(135deg,#14b8a6 0%,#6366f1 100%)",
  "linear-gradient(135deg,#f093fb 0%,#f5576c 100%)",
  "linear-gradient(135deg,#4facfe 0%,#00f2fe 100%)",
  "linear-gradient(135deg,#43e97b 0%,#38f9d7 100%)",
];

/* ── Styles ─────────────────────────────────────────────────── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Nunito:wght@300;400;500;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #060d1a; font-family: 'Nunito', sans-serif; }
  @keyframes spin        { to { transform: rotate(360deg); } }
  @keyframes fadeSlideUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fadeIn      { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
  @keyframes toastIn     { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
  @keyframes glowPulse   { 0%,100%{box-shadow:0 0 14px rgba(94,234,212,0.2)} 50%{box-shadow:0 0 28px rgba(94,234,212,0.45)} }
  @keyframes pulse       { 0%,100%{opacity:1} 50%{opacity:0.4} }
  ::-webkit-scrollbar       { width:5px; }
  ::-webkit-scrollbar-track { background:rgba(255,255,255,0.02); }
  ::-webkit-scrollbar-thumb { background:rgba(94,234,212,0.18); border-radius:999px; }
  .course-card { transition: all 0.22s !important; }
  .course-card:hover { transform: translateY(-4px) !important; border-color: rgba(94,234,212,0.28) !important; box-shadow: 0 16px 40px rgba(0,0,0,0.35) !important; }
  .study-btn { transition: all 0.2s; }
  .study-btn:hover { opacity: 0.88; transform: translateY(-1px); box-shadow: 0 6px 18px rgba(20,184,166,0.28) !important; }
  .rereg-btn:hover:not(:disabled) { background: rgba(248,113,113,0.15) !important; border-color: rgba(248,113,113,0.5) !important; }
  .browse-btn:hover { opacity: 0.88; transform: translateY(-1px); }
`;

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

/* ── Main ───────────────────────────────────────────────────── */
export default function MyCourses() {
  const navigate = useNavigate();
  const [courses,     setCourses]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [registering, setRegistering] = useState(null);
  const [toast,       setToast]       = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadData = useCallback(async () => {
    try {
      const res = await levelRegAPI.getAllCoursesStatus();
      const inProgress = (res.data.data || []).filter(c =>
        c.levelStatuses?.some(ls => ["active","failed"].includes(ls.status))
      );
      setCourses(inProgress);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleRegister = async (courseId, levelNumber) => {
    const key = `${courseId}-${levelNumber}`;
    setRegistering(key);
    try {
      await levelRegAPI.registerLevel(courseId, levelNumber);
      showToast(`Re-registered for Level ${levelNumber}!`);
      await loadData();
    } catch (err) {
      showToast(err.response?.data?.message || "Registration failed.", "error");
    } finally { setRegistering(null); }
  };

  /* ── Loading ──────────────────────────────────────────────── */
  if (loading) return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"100vh", background:"#060d1a", gap:"1rem" }}>
      <style>{STYLES}</style>
      <div style={{ width:"40px", height:"40px", border:"3px solid rgba(94,234,212,0.1)", borderTopColor:"#5eead4", borderRadius:"50%", animation:"spin 0.8s linear infinite" }} />
      <span style={{ color:"rgba(148,163,184,0.5)", fontSize:"0.875rem", fontFamily:"'Nunito',sans-serif" }}>Loading your courses…</span>
    </div>
  );

  return (
    <div style={{ minHeight:"100vh", background:"#060d1a" }}>
      <style>{STYLES}</style>
      <Navbar />

      {/* Toast */}
      {toast && (
        <div style={{ position:"fixed", bottom:"1.75rem", right:"1.75rem", zIndex:9999, display:"flex", alignItems:"center", gap:"0.625rem", padding:"0.75rem 1.125rem", borderRadius:"12px", fontWeight:700, fontSize:"0.875rem", fontFamily:"'Plus Jakarta Sans',sans-serif", background: toast.type === "success" ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.12)", border:`1px solid ${toast.type === "success" ? "rgba(16,185,129,0.35)" : "rgba(239,68,68,0.3)"}`, color: toast.type === "success" ? "#34d399" : "#fca5a5", boxShadow:"0 8px 28px rgba(0,0,0,0.35)", backdropFilter:"blur(12px)", animation:"toastIn 0.25s ease both" }}>
          <span style={{ fontSize:"1rem" }}>{toast.type === "success" ? "✅" : "⚠️"}</span>
          {toast.msg}
        </div>
      )}

      <div style={{ maxWidth:"1280px", margin:"0 auto", padding:"1.75rem 1.75rem 5rem", animation:"fadeSlideUp 0.45s ease both" }}>

        {/* Page header */}
        <div style={{ marginBottom:"1.75rem" }}>
          <div style={{ display:"flex", alignItems:"center", gap:"0.5rem", marginBottom:"0.4rem" }}>
            <div style={{ height:"14px", width:"3px", background:"linear-gradient(180deg,#5eead4,#6366f1)", borderRadius:"999px" }} />
            <p style={{ fontSize:"0.65rem", fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:700, color:"rgba(94,234,212,0.65)", letterSpacing:"0.12em", textTransform:"uppercase", margin:0 }}>Learning Hub</p>
          </div>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", flexWrap:"wrap", gap:"1rem" }}>
            <div>
              <h1 style={{ fontSize:"1.625rem", fontWeight:800, color:"white", fontFamily:"'Plus Jakarta Sans',sans-serif", letterSpacing:"-0.02em", marginBottom:"0.3rem" }}>My Courses</h1>
              <p style={{ color:"rgba(148,163,184,0.5)", fontSize:"0.875rem", fontFamily:"'Nunito',sans-serif" }}>Courses you're actively working on. Completed courses appear in Available Courses.</p>
            </div>
            {courses.length > 0 && (
              <div style={{ display:"flex", alignItems:"center", gap:"0.5rem", background:"rgba(94,234,212,0.06)", border:"1px solid rgba(94,234,212,0.15)", borderRadius:"10px", padding:"0.4rem 0.875rem" }}>
                <span style={{ width:"7px", height:"7px", borderRadius:"50%", background:"#5eead4", animation:"pulse 2s ease-in-out infinite" }} />
                <span style={{ fontSize:"0.78rem", fontWeight:700, color:"rgba(94,234,212,0.75)", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{courses.length} in progress</span>
              </div>
            )}
          </div>
        </div>

        {/* Empty state */}
        {courses.length === 0 ? (
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"5rem 1.5rem", background:"rgba(255,255,255,0.02)", border:"1px dashed rgba(94,234,212,0.12)", borderRadius:"20px", textAlign:"center" }}>
            <div style={{ fontSize:"3.5rem", marginBottom:"1rem" }}>🎯</div>
            <h2 style={{ fontSize:"1.1rem", fontWeight:800, color:"rgba(226,232,240,0.7)", fontFamily:"'Plus Jakarta Sans',sans-serif", marginBottom:"0.5rem" }}>No courses in progress</h2>
            <p style={{ color:"rgba(148,163,184,0.45)", fontSize:"0.875rem", fontFamily:"'Nunito',sans-serif", maxWidth:"340px", lineHeight:1.65, marginBottom:"1.5rem" }}>
              Browse available courses and register for a level to begin your learning journey.
            </p>
            <button className="browse-btn" onClick={() => navigate("/students")} style={{ display:"inline-flex", alignItems:"center", gap:"0.5rem", padding:"0.75rem 1.5rem", background:"linear-gradient(135deg,#14b8a6,#6366f1)", color:"white", border:"none", borderRadius:"12px", fontSize:"0.9rem", fontWeight:700, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif", boxShadow:"0 4px 16px rgba(20,184,166,0.22)", transition:"all 0.2s" }}>
              Browse Available Courses →
            </button>
          </div>
        ) : (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))", gap:"1.125rem" }}>
            {courses.map((course, idx) => {
              const diff         = DIFF_META[course.difficulty] || DIFF_META.Beginner;
              const totalLevels  = course.levelStatuses?.length || 0;
              const doneLevels   = course.levelStatuses?.filter(ls => ls.status === "completed").length || 0;
              const pct          = totalLevels > 0 ? Math.round((doneLevels / totalLevels) * 100) : 0;
              const activeLevels = course.levelStatuses?.filter(ls => ls.status === "active")  || [];
              const failedLevels = course.levelStatuses?.filter(ls => ls.status === "failed")  || [];
              const allDone      = pct === 100 && activeLevels.length === 0 && failedLevels.length === 0;

              return (
                <div key={course._id} onClick={() => navigate(`/courses/${course._id}`)} className="course-card" style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:"18px", overflow:"hidden", display:"flex", flexDirection:"column", boxShadow:"0 4px 16px rgba(0,0,0,0.2)" }}>

                  {/* Cover */}
                  <div style={{ height:"120px", position:"relative", flexShrink:0, background: course.image ? `linear-gradient(rgba(6,13,26,0.3),rgba(6,13,26,0.65)), url("${course.image}") center/cover` : FALLBACK_BG[idx % FALLBACK_BG.length], display:"flex", alignItems:"flex-end", justifyContent:"space-between", padding:"0.75rem 0.875rem" }}>
                    {/* Status badge */}
                    {activeLevels.length > 0 && (
                      <span style={{ display:"flex", alignItems:"center", gap:"0.35rem", padding:"0.2rem 0.625rem", borderRadius:"999px", fontSize:"0.62rem", fontWeight:700, fontFamily:"'Plus Jakarta Sans',sans-serif", background:"rgba(99,102,241,0.85)", color:"white", backdropFilter:"blur(4px)" }}>
                        <span style={{ width:"5px", height:"5px", borderRadius:"50%", background:"#a5f3fc", animation:"pulse 1.5s ease-in-out infinite" }} />
                        In Progress
                      </span>
                    )}
                    {allDone && (
                      <span style={{ padding:"0.2rem 0.625rem", borderRadius:"999px", fontSize:"0.62rem", fontWeight:700, fontFamily:"'Plus Jakarta Sans',sans-serif", background:"rgba(16,185,129,0.85)", color:"white", backdropFilter:"blur(4px)" }}>✓ Completed</span>
                    )}
                    {activeLevels.length === 0 && !allDone && <span />}
                    {/* Difficulty */}
                    <span style={{ padding:"0.2rem 0.625rem", borderRadius:"6px", fontSize:"0.62rem", fontWeight:700, letterSpacing:"0.06em", fontFamily:"'Plus Jakarta Sans',sans-serif", background:diff.bg, color:diff.color, border:`1px solid ${diff.border}` }}>
                      {course.difficulty?.toUpperCase()}
                    </span>
                  </div>

                  {/* Body */}
                  <div style={{ padding:"1.125rem 1.25rem 0", flex:1, display:"flex", flexDirection:"column", gap:"0.875rem" }}>

                    {/* Title */}
                    <h3 style={{ fontSize:"0.9375rem", fontWeight:800, color:"rgba(226,232,240,0.92)", fontFamily:"'Plus Jakarta Sans',sans-serif", lineHeight:1.35, margin:0 }}>{course.title}</h3>

                    {/* Progress */}
                    <div>
                      <div style={{ display:"flex", justifyContent:"space-between", fontSize:"0.68rem", fontWeight:700, marginBottom:"0.35rem" }}>
                        <span style={{ color:"rgba(148,163,184,0.5)", fontFamily:"'Plus Jakarta Sans',sans-serif", textTransform:"uppercase", letterSpacing:"0.07em" }}>Progress</span>
                        <span style={{ color: pct === 100 ? "#5eead4" : "#818cf8", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{doneLevels}/{totalLevels} levels · {pct}%</span>
                      </div>
                      <div style={{ height:"4px", background:"rgba(255,255,255,0.06)", borderRadius:"999px", overflow:"hidden" }}>
                        <div style={{ height:"100%", width:`${pct}%`, borderRadius:"999px", background: pct === 100 ? "linear-gradient(90deg,#5eead4,#14b8a6)" : "linear-gradient(90deg,#6366f1,#818cf8)", transition:"width 0.5s ease" }} />
                      </div>
                    </div>

                    {/* Level rows */}
                    {[...activeLevels, ...failedLevels].length > 0 && (
                      <div style={{ display:"flex", flexDirection:"column", gap:"0.375rem" }}>
                        {[...activeLevels, ...failedLevels].map(ls => {
                          const lvInfo  = course.levels?.find(l => l.levelNumber === ls.levelNumber);
                          const isActive = ls.status === "active";
                          const regKey  = `${course._id}-${ls.levelNumber}`;
                          const isBusy  = registering === regKey;

                          return (
                            <div key={ls.levelNumber} style={{ display:"flex", alignItems:"center", gap:"0.625rem", padding:"0.5rem 0.75rem", borderRadius:"10px", background: isActive ? "rgba(99,102,241,0.09)" : "rgba(248,113,113,0.07)", border:`1px solid ${isActive ? "rgba(99,102,241,0.22)" : "rgba(248,113,113,0.2)"}` }}>
                              {/* Badge */}
                              <div style={{ width:"24px", height:"24px", borderRadius:"7px", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:"0.68rem", fontFamily:"'Plus Jakarta Sans',sans-serif", background: isActive ? "rgba(99,102,241,0.3)" : "rgba(248,113,113,0.2)", color: isActive ? "#818cf8" : "#f87171" }}>
                                {isActive ? ls.levelNumber : "✗"}
                              </div>
                              {/* Label */}
                              <span style={{ flex:1, fontSize:"0.78rem", fontWeight:600, color:"rgba(203,213,225,0.75)", fontFamily:"'Nunito',sans-serif", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                                Level {ls.levelNumber}{lvInfo ? `: ${lvInfo.title}` : ""}
                                {!isActive && ls.score != null && (
                                  <span style={{ color:"#f87171", fontWeight:700 }}> · {ls.score}%</span>
                                )}
                              </span>
                              {/* Re-register */}
                              {!isActive && (
                                <button className="rereg-btn" disabled={isBusy} onClick={() => handleRegister(course._id, ls.levelNumber)} style={{ padding:"0.2rem 0.625rem", borderRadius:"999px", fontSize:"0.65rem", fontWeight:700, fontFamily:"'Plus Jakarta Sans',sans-serif", border:"1px solid rgba(248,113,113,0.3)", color:"#f87171", background:"rgba(248,113,113,0.07)", cursor: isBusy ? "not-allowed" : "pointer", flexShrink:0, transition:"all 0.18s" }}>
                                  {isBusy ? (
                                    <span style={{ display:"inline-block", width:"10px", height:"10px", border:"1.5px solid rgba(248,113,113,0.3)", borderTopColor:"#f87171", borderRadius:"50%", animation:"spin 0.7s linear infinite" }} />
                                  ) : "Re-register"}
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* All done message */}
                    {allDone && (
                      <div style={{ textAlign:"center", padding:"0.5rem 0.75rem", borderRadius:"10px", background:"rgba(16,185,129,0.08)", border:"1px solid rgba(16,185,129,0.18)" }}>
                        <span style={{ fontSize:"0.8rem", fontWeight:700, color:"#34d399", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>🎉 All levels completed!</span>
                      </div>
                    )}
                  </div>

                  {/* Footer CTA */}
                  <div style={{ padding:"1rem 1.25rem 1.25rem" }}>
                    <button className="study-btn"  style={{ width:"100%", padding:"0.7rem", display:"flex", alignItems:"center", justifyContent:"center", gap:"0.5rem", background:"linear-gradient(135deg,#14b8a6,#6366f1)", color:"white", border:"none", borderRadius:"11px", fontSize:"0.875rem", fontWeight:700, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif", boxShadow:"0 4px 14px rgba(20,184,166,0.22)" }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                      Study Now
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}