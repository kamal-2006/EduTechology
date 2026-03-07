import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { levelRegAPI } from "../services/api";

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
  "linear-gradient(135deg,#43e97b 0%,#38f9d7 100%)",
];

/* ── Styles ─────────────────────────────────────────────────── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Nunito:wght@300;400;500;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #060d1a; font-family: 'Nunito', sans-serif; color: rgba(226,232,240,0.88); }
  @keyframes spin        { to { transform: rotate(360deg); } }
  @keyframes fadeSlideUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  @keyframes glowPulse   { 0%,100%{box-shadow:0 0 14px rgba(94,234,212,0.2)} 50%{box-shadow:0 0 28px rgba(94,234,212,0.45)} }
  @keyframes stagger      { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
  ::-webkit-scrollbar { width:5px; }
  ::-webkit-scrollbar-track { background:rgba(255,255,255,0.02); }
  ::-webkit-scrollbar-thumb { background:rgba(94,234,212,0.18); border-radius:999px; }
  .course-card { transition: all 0.22s !important; }
  .course-card:hover { transform: translateY(-4px) !important; border-color: rgba(94,234,212,0.25) !important; box-shadow: 0 16px 40px rgba(0,0,0,0.4) !important; }
  .study-btn { transition: all 0.2s; }
  .study-btn:hover { opacity: 0.88; transform: translateY(-1px); box-shadow: 0 6px 18px rgba(20,184,166,0.3) !important; }
  .filter-btn { transition: all 0.15s; }
  .filter-btn:hover { border-color: rgba(94,234,212,0.3) !important; color: rgba(94,234,212,0.7) !important; }
  .search-input:focus { border-color: rgba(94,234,212,0.45) !important; box-shadow: 0 0 0 3px rgba(94,234,212,0.07) !important; outline: none !important; }
`;

const T = {
  surface: "rgba(255,255,255,0.03)",
  border:  "rgba(255,255,255,0.08)",
  text:    "rgba(226,232,240,0.88)",
  muted:   "rgba(148,163,184,0.5)",
  teal:    "#5eead4",
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

/* ── Main ───────────────────────────────────────────────────── */
export default function Students() {
  const navigate = useNavigate();
  const [courses,     setCourses]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [diffFilter,  setDiffFilter]  = useState("All");

  const loadData = useCallback(async () => {
    try {
      const res = await levelRegAPI.getAllCoursesStatus();
      setCourses(res.data.data || []);
    } catch (err) {
      console.error("Failed to load courses:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const filtered = courses.filter(c => {
    const matchDiff   = diffFilter === "All" || c.difficulty === diffFilter;
    const matchSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchDiff && matchSearch;
  });

  /* ── Loading ──────────────────────────────────────────────── */
  if (loading) return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"100vh", background:"#060d1a", gap:"1rem" }}>
      <style>{STYLES}</style>
      <div style={{ width:"40px", height:"40px", border:"3px solid rgba(94,234,212,0.1)", borderTopColor:"#5eead4", borderRadius:"50%", animation:"spin 0.8s linear infinite" }} />
      <span style={{ color:T.muted, fontSize:"0.875rem", fontFamily:"'Nunito',sans-serif" }}>Loading courses…</span>
    </div>
  );

  const diffCounts = ["All","Beginner","Intermediate","Advanced"].map(d => ({
    label: d,
    count: d === "All" ? courses.length : courses.filter(c => c.difficulty === d).length,
  }));

  return (
    <div style={{ minHeight:"100vh", background:"#060d1a" }}>
      <style>{STYLES}</style>
      <Navbar />

      <div style={{ maxWidth:"1280px", margin:"0 auto", padding:"1.75rem 1.75rem 5rem", animation:"fadeSlideUp 0.45s ease both" }}>

        {/* ── Page Header ───────────────────────────────────── */}
        <div style={{ marginBottom:"1.75rem" }}>
          <div style={{ display:"flex", alignItems:"center", gap:"0.5rem", marginBottom:"0.4rem" }}>
            <div style={{ height:"14px", width:"3px", background:"linear-gradient(180deg,#5eead4,#6366f1)", borderRadius:"999px" }} />
            <p style={{ fontSize:"0.65rem", fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:700, color:"rgba(94,234,212,0.65)", letterSpacing:"0.12em", textTransform:"uppercase", margin:0 }}>Catalogue</p>
          </div>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", flexWrap:"wrap", gap:"1rem" }}>
            <div>
              <h1 style={{ fontSize:"1.625rem", fontWeight:800, color:"white", fontFamily:"'Plus Jakarta Sans',sans-serif", letterSpacing:"-0.02em", marginBottom:"0.3rem" }}>Available Courses</h1>
              <p style={{ color:T.muted, fontSize:"0.875rem" }}>Register level by level — each level unlocks after passing the previous quiz.</p>
            </div>
            {filtered.length > 0 && (
              <div style={{ display:"flex", alignItems:"center", gap:"0.5rem", background:"rgba(94,234,212,0.06)", border:"1px solid rgba(94,234,212,0.15)", borderRadius:"10px", padding:"0.4rem 0.875rem" }}>
                <span style={{ width:"7px", height:"7px", borderRadius:"50%", background:T.teal, animation:"glowPulse 2s ease-in-out infinite" }} />
                <span style={{ fontSize:"0.78rem", fontWeight:700, color:"rgba(94,234,212,0.75)", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{filtered.length} course{filtered.length !== 1 ? "s" : ""}</span>
              </div>
            )}
          </div>
        </div>

        {/* ── Toolbar ───────────────────────────────────────── */}
        <div style={{ display:"flex", gap:"0.75rem", flexWrap:"wrap", alignItems:"center", marginBottom:"1.75rem" }}>
          {/* Search */}
          <div style={{ position:"relative", flex:"1 1 200px" }}>
            <svg style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", pointerEvents:"none", color:T.muted }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input type="text" placeholder="Search courses…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="search-input"
              style={{ width:"100%", paddingLeft:36, paddingRight:14, paddingTop:9, paddingBottom:9, border:`1.5px solid ${T.border}`, borderRadius:10, fontSize:"0.875rem", background:"rgba(255,255,255,0.04)", color:T.text, outline:"none", fontFamily:"'Nunito',sans-serif", transition:"border-color 0.15s, box-shadow 0.15s" }} />
          </div>

          {/* Difficulty filters */}
          <div style={{ display:"flex", gap:"0.375rem", flexShrink:0 }}>
            {diffCounts.map(({ label, count }) => {
              const active = diffFilter === label;
              const dm = label !== "All" ? DIFF_META[label] : null;
              return (
                <button key={label} onClick={() => setDiffFilter(label)} className="filter-btn"
                  style={{ padding:"0.45rem 0.875rem", borderRadius:999, fontSize:"0.78rem", fontWeight:700, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif",
                    border: active
                      ? `1.5px solid ${dm ? dm.border : "rgba(94,234,212,0.4)"}`
                      : `1.5px solid ${T.border}`,
                    background: active
                      ? (dm ? dm.bg : "rgba(94,234,212,0.08)")
                      : "transparent",
                    color: active
                      ? (dm ? dm.color : T.teal)
                      : T.muted,
                  }}>
                  {label}
                  <span style={{ marginLeft:"0.35rem", fontSize:"0.65rem", opacity:0.7 }}>({count})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Empty State ────────────────────────────────────── */}
        {filtered.length === 0 ? (
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"5rem 1.5rem", background:"rgba(255,255,255,0.02)", border:"1px dashed rgba(94,234,212,0.12)", borderRadius:"20px", textAlign:"center" }}>
            <div style={{ fontSize:"3.5rem", marginBottom:"1rem" }}>📚</div>
            <h2 style={{ fontSize:"1.1rem", fontWeight:800, color:"rgba(226,232,240,0.7)", fontFamily:"'Plus Jakarta Sans',sans-serif", marginBottom:"0.5rem" }}>No courses found</h2>
            <p style={{ color:T.muted, fontSize:"0.875rem", maxWidth:"300px", lineHeight:1.65 }}>Try adjusting your search or filter.</p>
          </div>
        ) : (
          /* ── Cards Grid ─────────────────────────────────── */
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))", gap:"1.125rem" }}>
            {filtered.map((course, idx) => {
              const dm          = DIFF_META[course.difficulty] || DIFF_META.Beginner;
              const totalLevels = course.levelStatuses?.length || 0;
              const doneLevels  = course.levelStatuses?.filter(ls => ls.status === "completed").length || 0;
              const pct         = totalLevels > 0 ? Math.round((doneLevels / totalLevels) * 100) : 0;
              const hasProgress = doneLevels > 0;
              const allDone     = pct === 100;

              return (
                <div key={course._id} className="course-card" onClick={() => navigate(`/courses/${course._id}`)}
                  style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:18, overflow:"hidden", display:"flex", flexDirection:"column", boxShadow:"0 4px 16px rgba(0,0,0,0.2)", animation:`stagger 0.4s ease both`, animationDelay:`${idx * 0.04}s` }}>

                  {/* Cover */}
                  <div style={{ height:125, position:"relative", flexShrink:0,
                    background: course.image
                      ? `linear-gradient(rgba(6,13,26,0.3),rgba(6,13,26,0.65)), url("${course.image}") center/cover`
                      : FALLBACK_BG[idx % FALLBACK_BG.length],
                    display:"flex", alignItems:"flex-end", justifyContent:"space-between", padding:"0.75rem 0.875rem" }}>
                    {/* Status badge */}
                    {allDone ? (
                      <span style={{ padding:"0.2rem 0.625rem", borderRadius:999, fontSize:"0.62rem", fontWeight:700, fontFamily:"'Plus Jakarta Sans',sans-serif", background:"rgba(16,185,129,0.85)", color:"white", backdropFilter:"blur(4px)" }}>✓ Completed</span>
                    ) : hasProgress ? (
                      <span style={{ display:"flex", alignItems:"center", gap:"0.35rem", padding:"0.2rem 0.625rem", borderRadius:999, fontSize:"0.62rem", fontWeight:700, fontFamily:"'Plus Jakarta Sans',sans-serif", background:"rgba(99,102,241,0.85)", color:"white", backdropFilter:"blur(4px)" }}>
                        <span style={{ width:5, height:5, borderRadius:"50%", background:"#a5f3fc" }} />
                        In Progress
                      </span>
                    ) : (
                      <span style={{ padding:"0.2rem 0.625rem", borderRadius:999, fontSize:"0.62rem", fontWeight:700, fontFamily:"'Plus Jakarta Sans',sans-serif", background:"rgba(255,255,255,0.12)", color:"rgba(255,255,255,0.75)", backdropFilter:"blur(4px)" }}>New</span>
                    )}
                    {/* Difficulty badge */}
                    <span style={{ padding:"0.2rem 0.625rem", borderRadius:6, fontSize:"0.62rem", fontWeight:800, letterSpacing:"0.06em", fontFamily:"'Plus Jakarta Sans',sans-serif", background:dm.bg, color:dm.color, border:`1px solid ${dm.border}`, backdropFilter:"blur(4px)" }}>
                      {course.difficulty?.toUpperCase()}
                    </span>
                  </div>

                  {/* Body */}
                  <div style={{ padding:"1.1rem 1.25rem 0", flex:1, display:"flex", flexDirection:"column", gap:"0.75rem" }}>
                    <h3 style={{ fontSize:"0.9375rem", fontWeight:800, color:"rgba(226,232,240,0.92)", fontFamily:"'Plus Jakarta Sans',sans-serif", lineHeight:1.35, margin:0 }}>
                      {course.title}
                    </h3>

                    {/* Topics */}
                    {course.topics?.length > 0 && (
                      <div style={{ display:"flex", gap:"0.35rem", flexWrap:"wrap" }}>
                        {course.topics.slice(0, 3).map(t => (
                          <span key={t} style={{ padding:"2px 8px", borderRadius:999, fontSize:"0.65rem", fontWeight:700, background:"rgba(99,102,241,0.1)", color:"rgba(129,140,248,0.8)", border:"1px solid rgba(99,102,241,0.2)", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{t}</span>
                        ))}
                        {course.topics.length > 3 && (
                          <span style={{ padding:"2px 8px", borderRadius:999, fontSize:"0.65rem", fontWeight:700, background:"rgba(255,255,255,0.04)", color:T.muted, border:`1px solid ${T.border}`, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>+{course.topics.length - 3}</span>
                        )}
                      </div>
                    )}

                    {/* Progress bar */}
                    <div>
                      <div style={{ display:"flex", justifyContent:"space-between", fontSize:"0.68rem", fontWeight:700, marginBottom:"0.35rem", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                        <span style={{ color:T.muted, textTransform:"uppercase", letterSpacing:"0.07em" }}>Progress</span>
                        <span style={{ color: allDone ? T.teal : "rgba(129,140,248,0.85)" }}>{doneLevels}/{totalLevels} levels · {pct}%</span>
                      </div>
                      <div style={{ height:4, background:"rgba(255,255,255,0.06)", borderRadius:999, overflow:"hidden" }}>
                        <div style={{ height:"100%", width:`${pct}%`, borderRadius:999, transition:"width 0.5s ease",
                          background: allDone ? "linear-gradient(90deg,#5eead4,#14b8a6)" : "linear-gradient(90deg,#6366f1,#818cf8)" }} />
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div style={{ padding:"1rem 1.25rem 1.25rem" }}>
                    <button className="study-btn" 
                      style={{ width:"100%", padding:"0.7rem", display:"flex", alignItems:"center", justifyContent:"center", gap:"0.5rem", background:"linear-gradient(135deg,#14b8a6,#6366f1)", color:"white", border:"none", borderRadius:11, fontSize:"0.875rem", fontWeight:800, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif", boxShadow:"0 4px 14px rgba(20,184,166,0.22)" }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                      {allDone ? "Review Course" : hasProgress ? "Continue Learning" : "Start Course"}
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