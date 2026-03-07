import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { analyticsAPI, levelRegAPI } from "../services/api.js";
import RecommendationsPanel from "../components/RecommendationsPanel.jsx";

/* ── Constants ─────────────────────────────────────────────── */
const FALLBACK_BG = [
  "linear-gradient(135deg,#14b8a6 0%,#6366f1 100%)",
  "linear-gradient(135deg,#f093fb 0%,#f5576c 100%)",
  "linear-gradient(135deg,#4facfe 0%,#00f2fe 100%)",
  "linear-gradient(135deg,#43e97b 0%,#38f9d7 100%)",
];

const DIFF_META = {
  Beginner:     { color:"#5eead4", bg:"rgba(94,234,212,0.12)",  border:"rgba(94,234,212,0.3)"  },
  Intermediate: { color:"#fbbf24", bg:"rgba(251,191,36,0.12)",  border:"rgba(251,191,36,0.3)"  },
  Advanced:     { color:"#f87171", bg:"rgba(248,113,113,0.12)", border:"rgba(248,113,113,0.3)" },
};

const GLOBAL_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Nunito:wght@300;400;500;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #060d1a; font-family: 'Nunito', sans-serif; }
  @keyframes spin          { to { transform: rotate(360deg); } }
  @keyframes fadeSlideUp   { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  @keyframes glowPulse     { 0%,100%{box-shadow:0 0 14px rgba(94,234,212,0.2)} 50%{box-shadow:0 0 26px rgba(94,234,212,0.45)} }
  @keyframes shimmer       { 0%{background-position:-200% center} 100%{background-position:200% center} }
  @keyframes progressFill  { from{width:0} to{width:var(--w)} }
  ::-webkit-scrollbar       { width: 5px; }
  ::-webkit-scrollbar-track { background: rgba(255,255,255,0.02); }
  ::-webkit-scrollbar-thumb { background: rgba(94,234,212,0.18); border-radius:999px; }
  .search-input::placeholder { color: rgba(148,163,184,0.4); }
  .search-input:focus { border-color: rgba(94,234,212,0.45) !important; background: rgba(15,23,42,0.9) !important; box-shadow: 0 0 0 3px rgba(94,234,212,0.06) !important; }
  .stat-card:hover  { border-color: rgba(94,234,212,0.22) !important; background: rgba(255,255,255,0.05) !important; transform: translateY(-2px); }
  .course-card:hover { transform: translateY(-4px) !important; border-color: rgba(94,234,212,0.28) !important; box-shadow: 0 16px 40px rgba(0,0,0,0.35) !important; }
  .qa-card:hover    { border-color: rgba(94,234,212,0.3) !important; background: rgba(255,255,255,0.05) !important; transform: translateY(-2px); }
  .icon-btn:hover   { border-color: rgba(94,234,212,0.35) !important; background: rgba(94,234,212,0.06) !important; }
  .history-btn:hover { border-color: rgba(94,234,212,0.3) !important; color: #5eead4 !important; }
  .quick-action-row:hover { background: rgba(255,255,255,0.05) !important; border-color: rgba(94,234,212,0.22) !important; }
`;

/* ── Spinner ────────────────────────────────────────────────── */
function Spinner() {
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"100vh", background:"#060d1a", gap:"1rem" }}>
      <style>{GLOBAL_STYLES}</style>
      <div style={{ width:"42px", height:"42px", border:"3px solid rgba(94,234,212,0.12)", borderTopColor:"#5eead4", borderRadius:"50%", animation:"spin 0.8s linear infinite" }} />
      <span style={{ color:"rgba(148,163,184,0.5)", fontSize:"0.875rem", fontFamily:"'Nunito',sans-serif" }}>Loading your dashboard…</span>
    </div>
  );
}

/* ── Navbar ─────────────────────────────────────────────────── */
function Navbar({ user, isAdmin = false }) {
  return (
    <div style={{ background:"rgba(6,16,31,0.96)", borderBottom:"1px solid rgba(94,234,212,0.07)", padding:"0 1.75rem", display:"flex", justifyContent:"space-between", alignItems:"center", height:"62px", position:"sticky", top:0, zIndex:50, backdropFilter:"blur(14px)" }}>
      <div style={{ display:"flex", alignItems:"center", gap:"0.625rem" }}>
        <div style={{ width:"32px", height:"32px", borderRadius:"8px", background:"linear-gradient(135deg,#14b8a6,#6366f1)", display:"flex", alignItems:"center", justifyContent:"center", animation:"glowPulse 3s ease-in-out infinite" }}>
          <svg width="18" height="18" fill="none" viewBox="0 0 48 48"><path d="M4 42.4379C4 42.4379 14.0962 36.0744 24 41.1692C35.0664 46.8624 44 42.2078 44 42.2078L44 7.01134C44 7.01134 35.068 11.6577 24.0031 5.96913C14.0971 0.876274 4 7.27094 4 7.27094L4 42.4379Z" fill="white"/></svg>
        </div>
        <span style={{ color:"white", fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:800, fontSize:"1.1rem", letterSpacing:"-0.02em" }}>EduAI</span>
        {isAdmin && (
          <span style={{ background:"rgba(167,139,250,0.15)", border:"1px solid rgba(167,139,250,0.3)", borderRadius:"999px", padding:"0.15rem 0.5rem", fontSize:"0.58rem", fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:700, color:"#a78bfa", letterSpacing:"0.08em", textTransform:"uppercase" }}>Admin</span>
        )}
      </div>
      {!isAdmin && (
        <div style={{ position:"relative", flex:1, maxWidth:"360px", margin:"0 2rem" }}>
          <svg style={{ position:"absolute", left:"0.8rem", top:"50%", transform:"translateY(-50%)", width:"15px", height:"15px", color:"rgba(148,163,184,0.35)", pointerEvents:"none" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input type="text" placeholder="Search courses, lessons…" className="search-input" style={{ width:"100%", background:"rgba(15,23,42,0.65)", border:"1px solid rgba(94,234,212,0.1)", borderRadius:"10px", padding:"0.575rem 0.875rem 0.575rem 2.35rem", color:"#e2e8f0", fontSize:"0.875rem", outline:"none", fontFamily:"'Nunito',sans-serif", transition:"all 0.25s" }} />
        </div>
      )}
      <div style={{ display:"flex", alignItems:"center", gap:"0.75rem" }}>
        {!isAdmin && (
          <button className="icon-btn" style={{ position:"relative", width:"36px", height:"36px", border:"1px solid rgba(255,255,255,0.07)", background:"rgba(255,255,255,0.03)", borderRadius:"10px", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", transition:"all 0.2s" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(148,163,184,0.6)" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            <span style={{ position:"absolute", top:"7px", right:"7px", width:"7px", height:"7px", background:"#5eead4", borderRadius:"50%", border:"1.5px solid #06101f" }} />
          </button>
        )}
        <div style={{ display:"flex", alignItems:"center", gap:"0.6rem" }}>
          <div style={{ textAlign:"right" }}>
            <div style={{ fontSize:"0.8rem", fontWeight:700, color:"rgba(226,232,240,0.9)", fontFamily:"'Plus Jakarta Sans',sans-serif", lineHeight:1.2 }}>{user.name || "User"}</div>
            <div style={{ fontSize:"0.65rem", color: isAdmin ? "rgba(167,139,250,0.6)" : "rgba(94,234,212,0.6)", fontFamily:"'Nunito',sans-serif", textTransform:"capitalize" }}>{isAdmin ? "Administrator" : "Premium Member"}</div>
          </div>
          <div style={{ width:"36px", height:"36px", borderRadius:"10px", background: isAdmin ? "linear-gradient(135deg,#7c3aed,#6366f1)" : "linear-gradient(135deg,#14b8a6,#6366f1)", display:"flex", alignItems:"center", justifyContent:"center", color:"white", fontWeight:800, fontSize:"0.875rem", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
            {(user.name || "U").charAt(0).toUpperCase()}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Section Header ─────────────────────────────────────────── */
function SectionHeader({ title, linkTo, linkLabel = "View All", badge }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1rem" }}>
      <div style={{ display:"flex", alignItems:"center", gap:"0.625rem" }}>
        <div style={{ height:"15px", width:"3px", background:"linear-gradient(180deg,#5eead4,#6366f1)", borderRadius:"999px" }} />
        <h2 style={{ fontSize:"0.9375rem", fontWeight:800, color:"rgba(226,232,240,0.95)", fontFamily:"'Plus Jakarta Sans',sans-serif", margin:0 }}>{title}</h2>
        {badge && (
          <span style={{ background:"rgba(94,234,212,0.12)", border:"1px solid rgba(94,234,212,0.25)", borderRadius:"999px", padding:"0.15rem 0.5rem", fontSize:"0.6rem", fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:700, color:"#5eead4", letterSpacing:"0.08em", textTransform:"uppercase" }}>{badge}</span>
        )}
      </div>
      {linkTo && (
        <Link to={linkTo} style={{ fontSize:"0.75rem", fontWeight:700, color:"rgba(94,234,212,0.65)", textDecoration:"none", fontFamily:"'Plus Jakarta Sans',sans-serif", transition:"color 0.2s" }}
          onMouseEnter={e => e.currentTarget.style.color="#5eead4"}
          onMouseLeave={e => e.currentTarget.style.color="rgba(94,234,212,0.65)"}>
          {linkLabel} →
        </Link>
      )}
    </div>
  );
}

/* ── Stat Card ──────────────────────────────────────────────── */
function StatCard({ icon, value, label, trend, subtext, progressBar, accentColor = "#5eead4", suffix = "", isText = false }) {
  const display = isText ? value : `${value}${suffix}`;
  return (
    <div className="stat-card" style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:"14px", padding:"1.2rem 1.3rem", transition:"all 0.22s", position:"relative", overflow:"hidden", cursor:"default" }}>
      <div style={{ position:"absolute", top:"-18px", right:"-18px", width:"72px", height:"72px", borderRadius:"50%", background:`radial-gradient(circle, ${accentColor}1a 0%, transparent 70%)`, pointerEvents:"none" }} />
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"0.7rem" }}>
        <span style={{ fontSize:"0.65rem", fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:700, color:"rgba(148,163,184,0.55)", letterSpacing:"0.1em", textTransform:"uppercase" }}>{label}</span>
        <div style={{ width:"32px", height:"32px", borderRadius:"9px", background:`${accentColor}16`, border:`1px solid ${accentColor}28`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"0.9375rem" }}>{icon}</div>
      </div>
      <div style={{ fontSize:"1.5rem", fontWeight:800, color:"white", fontFamily:"'Plus Jakarta Sans',sans-serif", letterSpacing:"-0.02em", marginBottom:"0.25rem", lineHeight:1 }}>{display}</div>
      {trend   && <div style={{ fontSize:"0.7rem", color:"#5eead4", fontWeight:600, fontFamily:"'Nunito',sans-serif", marginTop:"0.3rem" }}>↗ {trend}</div>}
      {subtext && <div style={{ fontSize:"0.7rem", color:"rgba(148,163,184,0.55)", fontFamily:"'Nunito',sans-serif", marginTop:"0.25rem" }}>{subtext}</div>}
      {progressBar !== undefined && (
        <div style={{ height:"3px", background:"rgba(255,255,255,0.06)", borderRadius:"999px", marginTop:"0.8rem", overflow:"hidden" }}>
          <div style={{ height:"100%", width:`${progressBar}%`, background:`linear-gradient(90deg,${accentColor},#6366f1)`, borderRadius:"999px" }} />
        </div>
      )}
    </div>
  );
}

/* ── Activity Item ──────────────────────────────────────────── */
function ActivityItem({ icon, accentColor, title, subtitle, time }) {
  return (
    <div style={{ display:"flex", gap:"0.8rem", alignItems:"flex-start" }}>
      <div style={{ width:"36px", height:"36px", borderRadius:"10px", background:`${accentColor}16`, border:`1px solid ${accentColor}28`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"0.9375rem", flexShrink:0 }}>{icon}</div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:"0.8375rem", fontWeight:700, color:"rgba(226,232,240,0.9)", fontFamily:"'Plus Jakarta Sans',sans-serif", marginBottom:"0.1rem" }}>{title}</div>
        <div style={{ fontSize:"0.75rem", color:"rgba(148,163,184,0.65)", fontFamily:"'Nunito',sans-serif", marginBottom:"0.2rem", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{subtitle}</div>
        <div style={{ fontSize:"0.62rem", color:"rgba(94,234,212,0.55)", fontWeight:700, fontFamily:"'Plus Jakarta Sans',sans-serif", letterSpacing:"0.08em", textTransform:"uppercase" }}>{time}</div>
      </div>
    </div>
  );
}

/* ── Course Card ────────────────────────────────────────────── */
function CourseCard({ course, idx, onClick }) {
  const totalLevels = course.levelStatuses?.length || 0;
  const doneLevels  = course.levelStatuses?.filter(ls => ls.status === "completed").length || 0;
  const pct         = totalLevels > 0 ? Math.round((doneLevels / totalLevels) * 100) : 0;
  const diff        = DIFF_META[course.difficulty] || DIFF_META.Beginner;
  const activeLvl   = course.levelStatuses?.find(ls => ls.status === "active");

  return (
    <div onClick={onClick} className="course-card" style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:"14px", overflow:"hidden", cursor:"pointer", transition:"all 0.22s" }}>
      <div style={{ height:"100px", position:"relative", background: course.image ? `linear-gradient(rgba(6,13,26,0.35),rgba(6,13,26,0.65)), url("${course.image}") center/cover` : FALLBACK_BG[idx % FALLBACK_BG.length], display:"flex", alignItems:"flex-end", justifyContent:"space-between", padding:"0.625rem 0.75rem" }}>
        <span style={{ padding:"0.2rem 0.55rem", borderRadius:"6px", fontSize:"0.62rem", fontWeight:700, letterSpacing:"0.07em", fontFamily:"'Plus Jakarta Sans',sans-serif", background:diff.bg, color:diff.color, border:`1px solid ${diff.border}` }}>
          {course.difficulty?.toUpperCase() || "COURSE"}
        </span>
        {activeLvl && (
          <span style={{ padding:"0.2rem 0.55rem", borderRadius:"6px", fontSize:"0.62rem", fontWeight:700, fontFamily:"'Plus Jakarta Sans',sans-serif", background:"rgba(99,102,241,0.85)", color:"white", backdropFilter:"blur(4px)" }}>
            ⚡ Lvl {activeLvl.levelNumber}
          </span>
        )}
      </div>
      <div style={{ padding:"0.9rem 1rem" }}>
        <h3 style={{ fontSize:"0.875rem", fontWeight:700, color:"rgba(226,232,240,0.95)", fontFamily:"'Plus Jakarta Sans',sans-serif", marginBottom:"0.25rem", lineHeight:1.35 }}>{course.title}</h3>
        <p style={{ fontSize:"0.72rem", color:"rgba(148,163,184,0.6)", fontFamily:"'Nunito',sans-serif", marginBottom:"0.8rem" }}>
          {course.instructor ? `By ${course.instructor}` : "EduAI Course"}
        </p>
        <div style={{ display:"flex", justifyContent:"space-between", fontSize:"0.68rem", fontWeight:700, marginBottom:"0.35rem" }}>
          <span style={{ color:"rgba(148,163,184,0.6)", fontFamily:"'Nunito',sans-serif" }}>Progress</span>
          <span style={{ color: pct === 100 ? "#5eead4" : "#818cf8", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{doneLevels}/{totalLevels} · {pct}%</span>
        </div>
        <div style={{ height:"3px", background:"rgba(255,255,255,0.06)", borderRadius:"999px", overflow:"hidden" }}>
          <div style={{ height:"100%", width:`${pct}%`, background: pct === 100 ? "linear-gradient(90deg,#5eead4,#14b8a6)" : "linear-gradient(90deg,#6366f1,#818cf8)", borderRadius:"999px", transition:"width 0.5s ease" }} />
        </div>
      </div>
    </div>
  );
}

/* ── Main Dashboard ─────────────────────────────────────────── */
export default function Dashboard() {
  const raw      = localStorage.getItem("user");
  const user     = raw ? JSON.parse(raw) : {};
  const navigate = useNavigate();
  const location = useLocation();

  const [myCourses, setMyCourses] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState("");

  useEffect(() => {
    setLoading(true); setError("");
    const fetchData = async () => {
      try {
        if (["admin","faculty"].includes(user.role)) {
          const aRes = await analyticsAPI.getAdminAnalytics();
          setAnalytics(aRes.data.data);
        } else {
          const [csRes, aRes] = await Promise.all([
            levelRegAPI.getAllCoursesStatus(),
            analyticsAPI.getStudentAnalytics(user.id),
          ]);
          const inProgress = (csRes.data.data || []).filter(c =>
            c.levelStatuses?.some(ls => ["active","failed"].includes(ls.status))
          );
          setMyCourses(inProgress);
          setAnalytics(aRes.data.data);
        }
      } catch {
        setError("Failed to load dashboard data.");
      } finally { setLoading(false); }
    };
    fetchData();
  }, [location.key]);

  if (loading) return <Spinner />;

  if (error) return (
    <div style={{ minHeight:"100vh", background:"#060d1a", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <style>{GLOBAL_STYLES}</style>
      <div style={{ background:"rgba(239,68,68,0.07)", border:"1px solid rgba(239,68,68,0.2)", color:"#fca5a5", padding:"1rem 1.5rem", borderRadius:"12px", fontFamily:"'Nunito',sans-serif", fontSize:"0.875rem" }}>{error}</div>
    </div>
  );

  if (["admin","faculty"].includes(user.role)) return <AdminDashboard analytics={analytics} user={user} />;
  return <StudentDashboard analytics={analytics} user={user} myCourses={myCourses} navigate={navigate} />;
}

/* ── Student Dashboard ──────────────────────────────────────── */
function StudentDashboard({ analytics, user, myCourses, navigate }) {
  const quizzesTaken  = analytics?.totalQuizzesTaken    || 0;
  const avgScore      = analytics?.averageScore         || 0;
  const recLevel      = analytics?.recommendedLevel     || "Beginner";
  const predictedPerf = analytics?.predictedPerformance || "Medium";
  const weeklyGoal    = 75;
  const aiPredLabel   = predictedPerf === "High" ? "On Track: A+" : predictedPerf === "Low" ? "Needs Work" : "Progressing";
  const aiPredAccent  = predictedPerf === "High" ? "#5eead4" : predictedPerf === "Low" ? "#f87171" : "#818cf8";

  const QUICK_ACTIONS = [
    { icon:"📚", label:"Browse Courses",  to:"/students",             desc:"Explore all available",  accent:"#6366f1",  arrow:"→" },
    { icon:"🎓", label:"My Courses",       to:"/my-courses",           desc:"Track your progress",    accent:"#14b8a6",  arrow:"→" },
    { icon:"📊", label:"My Analytics",     to:`/analytics/${user.id}`, desc:"View performance stats", accent:"#3b82f6",  arrow:"→" },
  ];

  return (
    <div style={{ minHeight:"100vh", background:"#060d1a" }}>
      <style>{GLOBAL_STYLES}</style>
      <Navbar user={user} />

      <div style={{ display:"grid", gridTemplateColumns:"1fr 292px", gap:"1.375rem", padding:"1.625rem 1.75rem", maxWidth:"1380px", margin:"0 auto" }}>

        {/* ── LEFT COLUMN ── */}
        <div style={{ display:"flex", flexDirection:"column", gap:"1.5rem" }}>

          {/* Welcome banner */}
          <div style={{ background:"linear-gradient(120deg,rgba(20,184,166,0.09) 0%,rgba(99,102,241,0.09) 100%)", border:"1px solid rgba(94,234,212,0.13)", borderRadius:"16px", padding:"1.5rem 1.75rem", display:"flex", justifyContent:"space-between", alignItems:"center", position:"relative", overflow:"hidden", animation:"fadeSlideUp 0.5s ease both" }}>
            <div style={{ position:"absolute", right:"-24px", top:"-24px", width:"180px", height:"180px", borderRadius:"50%", background:"radial-gradient(circle,rgba(94,234,212,0.07) 0%,transparent 70%)", pointerEvents:"none" }} />
            <div style={{ position:"absolute", left:"-40px", bottom:"-40px", width:"160px", height:"160px", borderRadius:"50%", background:"radial-gradient(circle,rgba(99,102,241,0.07) 0%,transparent 70%)", pointerEvents:"none" }} />
            <div style={{ position:"relative", zIndex:1 }}>
              <p style={{ fontSize:"0.68rem", fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:700, color:"rgba(94,234,212,0.65)", letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:"0.4rem" }}>Good to see you</p>
              <h1 style={{ fontSize:"1.5rem", fontWeight:800, color:"white", fontFamily:"'Plus Jakarta Sans',sans-serif", letterSpacing:"-0.02em", marginBottom:"0.4rem", lineHeight:1.2 }}>
                Welcome back, {user.name}! 👋
              </h1>
              <p style={{ color:"rgba(148,163,184,0.6)", fontSize:"0.875rem", fontFamily:"'Nunito',sans-serif" }}>
                You've completed <span style={{ color:"#5eead4", fontWeight:700 }}>{weeklyGoal}%</span> of your weekly learning goal. Keep it up!
              </p>
            </div>
            {/* Weekly ring */}
            <div style={{ flexShrink:0, position:"relative", width:"80px", height:"80px", zIndex:1 }}>
              <svg width="80" height="80" viewBox="0 0 80 80" style={{ transform:"rotate(-90deg)" }}>
                <circle cx="40" cy="40" r="33" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6"/>
                <circle cx="40" cy="40" r="33" fill="none" stroke="url(#ringGrad)" strokeWidth="6" strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 33}`}
                  strokeDashoffset={`${2 * Math.PI * 33 * (1 - weeklyGoal / 100)}`}/>
                <defs>
                  <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#14b8a6"/><stop offset="100%" stopColor="#6366f1"/>
                  </linearGradient>
                </defs>
              </svg>
              <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
                <span style={{ fontSize:"1.0625rem", fontWeight:800, color:"white", fontFamily:"'Plus Jakarta Sans',sans-serif", lineHeight:1 }}>{weeklyGoal}%</span>
                <span style={{ fontSize:"0.52rem", color:"rgba(148,163,184,0.5)", fontFamily:"'Nunito',sans-serif", marginTop:"2px" }}>weekly</span>
              </div>
            </div>
          </div>

          {/* Dropout risk alert */}
          {analytics?.dropoutRisk === "Yes" && (
            <div style={{ display:"flex", gap:"0.875rem", background:"rgba(251,191,36,0.06)", border:"1px solid rgba(251,191,36,0.22)", borderRadius:"12px", padding:"1rem 1.125rem", color:"#fbbf24", animation:"fadeSlideUp 0.5s 0.1s ease both" }}>
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink:0, marginTop:"2px" }}><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              <div>
                <strong style={{ display:"block", marginBottom:"3px", fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:"0.875rem" }}>AI Risk Alert</strong>
                <span style={{ fontSize:"0.8rem", color:"rgba(251,191,36,0.7)", fontFamily:"'Nunito',sans-serif" }}>Our AI model detected a dropout risk based on your activity. Consider revisiting materials or seeking support.</span>
              </div>
            </div>
          )}

          {/* Stats */}
          <div>
            <SectionHeader title="Progress Overview" />
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))", gap:"0.875rem" }}>
              <StatCard icon="📝" value={quizzesTaken} label="Quizzes Taken"  trend={quizzesTaken > 10 ? "2 more than last week" : null} accentColor="#6366f1" />
              <StatCard icon="⭐" value={avgScore}     label="Average Score"  suffix="%" progressBar={avgScore} accentColor="#3b82f6" />
              <StatCard icon="🏆" value={recLevel}     label="Current Level"  isText subtext="Top 5% in category" accentColor="#fbbf24" />
              <StatCard icon="🤖" value={aiPredLabel}  label="AI Prediction"  isText subtext="Keep up the streak!" accentColor={aiPredAccent} />
            </div>
          </div>

          {/* My Courses */}
          <div>
            <SectionHeader title="My Courses" linkTo="/my-courses" />
            {myCourses.length === 0 ? (
              <div style={{ background:"rgba(255,255,255,0.02)", border:"1px dashed rgba(94,234,212,0.13)", borderRadius:"14px", padding:"2.75rem 1.5rem", textAlign:"center" }}>
                <div style={{ fontSize:"2.25rem", marginBottom:"0.75rem" }}>🎯</div>
                <p style={{ fontSize:"0.9375rem", fontWeight:700, color:"rgba(226,232,240,0.75)", fontFamily:"'Plus Jakarta Sans',sans-serif", marginBottom:"0.5rem" }}>No courses in progress</p>
                <p style={{ fontSize:"0.8375rem", color:"rgba(148,163,184,0.6)", fontFamily:"'Nunito',sans-serif", marginBottom:"1.25rem" }}>Browse and register for a level to begin your journey.</p>
                <Link to="/students" style={{ display:"inline-flex", alignItems:"center", gap:"0.5rem", padding:"0.625rem 1.25rem", background:"linear-gradient(135deg,#14b8a6,#6366f1)", color:"white", borderRadius:"10px", textDecoration:"none", fontSize:"0.875rem", fontWeight:700, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                  Browse Courses →
                </Link>
              </div>
            ) : (
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))", gap:"1rem" }}>
                {myCourses.slice(0, 4).map((course, idx) => (
                  <CourseCard key={course._id} course={course} idx={idx} onClick={() => navigate(`/courses/${course._id}`)} />
                ))}
              </div>
            )}
          </div>

          {/* AI Recommendations */}
          <div>
            <SectionHeader title="AI Recommendations" badge="🤖 Personalised" />
            <RecommendationsPanel studentId={user.id} compact />
          </div>

        </div>

        {/* ── RIGHT COLUMN ── */}
        <div style={{ display:"flex", flexDirection:"column", gap:"1rem" }}>

          {/* Date */}
          <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:"14px", padding:"1rem 1.1rem", display:"flex", alignItems:"center", gap:"0.75rem" }}>
            <div style={{ width:"38px", height:"38px", borderRadius:"10px", background:"rgba(94,234,212,0.09)", border:"1px solid rgba(94,234,212,0.18)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#5eead4" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            </div>
            <div>
              <div style={{ fontSize:"0.62rem", color:"rgba(94,234,212,0.55)", fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em" }}>Today</div>
              <div style={{ fontSize:"0.8375rem", fontWeight:700, color:"rgba(226,232,240,0.9)", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                {new Date().toLocaleDateString("en-US", { month:"long", day:"numeric", year:"numeric" })}
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:"14px", padding:"1.2rem" }}>
            <SectionHeader title="Recent Activity" />
            <div style={{ display:"flex", flexDirection:"column", gap:"0.9rem" }}>
              <ActivityItem icon="✅" accentColor="#10b981" title="Quiz Completed"       subtitle="Introduction to UI · Score: 95%"       time="2 hours ago" />
              <ActivityItem icon="▶️" accentColor="#3b82f6" title="Video Lesson"         subtitle='Watched "State Management in React"'    time="Yesterday"   />
              <ActivityItem icon="🏆" accentColor="#8b5cf6" title="Achievement Unlocked" subtitle="7-Day Study Streak"                    time="3 days ago"  />
            </div>
            <button className="history-btn" style={{ width:"100%", marginTop:"1rem", padding:"0.575rem", border:"1px solid rgba(255,255,255,0.07)", background:"rgba(255,255,255,0.02)", borderRadius:"10px", color:"rgba(148,163,184,0.6)", fontSize:"0.78rem", fontWeight:700, fontFamily:"'Plus Jakarta Sans',sans-serif", cursor:"pointer", transition:"all 0.2s" }}>
              View Full History
            </button>
          </div>

          {/* AI Insight */}
          <div style={{ background:"linear-gradient(135deg,rgba(99,102,241,0.09),rgba(20,184,166,0.07))", border:"1px solid rgba(99,102,241,0.18)", borderRadius:"14px", padding:"1.2rem" }}>
            <div style={{ display:"flex", alignItems:"center", gap:"0.5rem", marginBottom:"0.7rem" }}>
              <div style={{ width:"28px", height:"28px", borderRadius:"8px", background:"rgba(167,139,250,0.15)", border:"1px solid rgba(167,139,250,0.25)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"0.875rem" }}>🤖</div>
              <span style={{ fontSize:"0.68rem", fontWeight:700, color:"rgba(167,139,250,0.85)", fontFamily:"'Plus Jakarta Sans',sans-serif", textTransform:"uppercase", letterSpacing:"0.08em" }}>AI Insight</span>
            </div>
            <p style={{ fontSize:"0.8rem", color:"rgba(203,213,225,0.75)", fontFamily:"'Nunito',sans-serif", lineHeight:1.65, margin:0 }}>
              Based on your performance, focusing on <span style={{ color:"#5eead4", fontWeight:600 }}>data structures</span> this week could boost your score by approximately 12%.
            </p>
          </div>

          {/* Streak widget */}
          <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:"14px", padding:"1.2rem" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"0.875rem" }}>
              <span style={{ fontSize:"0.68rem", fontWeight:700, color:"rgba(148,163,184,0.55)", fontFamily:"'Plus Jakarta Sans',sans-serif", textTransform:"uppercase", letterSpacing:"0.1em" }}>This Week</span>
              <span style={{ fontSize:"0.75rem", color:"#fbbf24", fontWeight:700, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>🔥 7 day streak</span>
            </div>
            <div style={{ display:"flex", gap:"0.375rem", justifyContent:"space-between" }}>
              {["M","T","W","T","F","S","S"].map((d, i) => (
                <div key={i} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:"0.3rem" }}>
                  <div style={{ width:"28px", height:"28px", borderRadius:"8px", background: i < 5 ? "linear-gradient(135deg,#14b8a6,#6366f1)" : "rgba(255,255,255,0.05)", border: i < 5 ? "none" : "1px solid rgba(255,255,255,0.07)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                    {i < 5 && <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                  </div>
                  <span style={{ fontSize:"0.58rem", color: i < 5 ? "rgba(94,234,212,0.6)" : "rgba(148,163,184,0.3)", fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:700 }}>{d}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Quick Actions (right column, new design) ── */}
          <div style={{ background:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:"14px", overflow:"hidden" }}>
            {/* Header */}
            <div style={{ padding:"0.875rem 1.1rem", borderBottom:"1px solid rgba(255,255,255,0.05)", display:"flex", alignItems:"center", gap:"0.5rem" }}>
              <div style={{ height:"13px", width:"3px", background:"linear-gradient(180deg,#5eead4,#6366f1)", borderRadius:"999px" }} />
              <span style={{ fontSize:"0.8rem", fontWeight:800, color:"rgba(226,232,240,0.9)", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>Quick Actions</span>
            </div>
            {/* Rows */}
            <div style={{ display:"flex", flexDirection:"column" }}>
              {QUICK_ACTIONS.map((act, i) => (
                <Link key={act.to} to={act.to} style={{ textDecoration:"none" }}>
                  <div className="quick-action-row" style={{
                    display:"flex", alignItems:"center", gap:"0.75rem",
                    padding:"0.8rem 1.1rem",
                    borderBottom: i < QUICK_ACTIONS.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                    background:"transparent", border:"none",
                    borderBottom: i < QUICK_ACTIONS.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                    cursor:"pointer", transition:"all 0.18s",
                  }}>
                    {/* Icon badge */}
                    <div style={{ width:"34px", height:"34px", borderRadius:"10px", background:`${act.accent}16`, border:`1px solid ${act.accent}25`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1rem", flexShrink:0 }}>
                      {act.icon}
                    </div>
                    {/* Text */}
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:"0.8rem", fontWeight:700, color:"rgba(226,232,240,0.88)", fontFamily:"'Plus Jakarta Sans',sans-serif", lineHeight:1.2 }}>{act.label}</div>
                      <div style={{ fontSize:"0.68rem", color:"rgba(148,163,184,0.6)", fontFamily:"'Nunito',sans-serif", marginTop:"2px" }}>{act.desc}</div>
                    </div>
                    {/* Arrow */}
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={act.accent} strokeWidth="2.5" style={{ flexShrink:0, opacity:0.6 }}>
                      <polyline points="9 18 15 12 9 6"/>
                    </svg>
                  </div>
                </Link>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

/* ── Admin Dashboard ─────────────────────────────────────────── */
function AdminDashboard({ analytics, user }) {
  return (
    <div style={{ minHeight:"100vh", background:"#060d1a" }}>
      <style>{GLOBAL_STYLES}</style>
      <Navbar user={user} isAdmin />

      <div style={{ padding:"1.625rem 1.75rem", maxWidth:"1200px", margin:"0 auto" }}>
        <div style={{ marginBottom:"1.5rem", animation:"fadeSlideUp 0.5s ease both" }}>
          <div style={{ display:"flex", alignItems:"center", gap:"0.625rem", marginBottom:"0.4rem" }}>
            <div style={{ height:"15px", width:"3px", background:"linear-gradient(180deg,#a78bfa,#6366f1)", borderRadius:"999px" }} />
            <p style={{ fontSize:"0.65rem", fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:700, color:"rgba(167,139,250,0.65)", letterSpacing:"0.12em", textTransform:"uppercase", margin:0 }}>Platform Overview</p>
          </div>
          <h1 style={{ fontSize:"1.625rem", fontWeight:800, color:"white", fontFamily:"'Plus Jakarta Sans',sans-serif", letterSpacing:"-0.02em", margin:0 }}>Admin Dashboard</h1>
          <p style={{ color:"rgba(148,163,184,0.5)", fontSize:"0.875rem", fontFamily:"'Nunito',sans-serif", marginTop:"0.3rem" }}>Manage your platform and monitor student performance.</p>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(185px,1fr))", gap:"0.875rem", marginBottom:"1.75rem" }}>
          <StatCard icon="👥" value={analytics?.totalStudents    ?? 0} label="Total Students"    accentColor="#3b82f6" />
          <StatCard icon="📚" value={analytics?.totalCourses     ?? 0} label="Total Courses"     accentColor="#6366f1" />
          <StatCard icon="📝" value={analytics?.totalSubmissions ?? 0} label="Total Submissions" accentColor="#8b5cf6" />
          <StatCard icon="🎯" value={analytics?.avgPlatformScore ?? 0} label="Avg Platform Score" suffix="%" progressBar={analytics?.avgPlatformScore ?? 0} accentColor="#5eead4" />
          <StatCard icon="⚠️" value={analytics?.atRiskStudents  ?? 0} label="At-Risk Students"  accentColor="#f87171" />
        </div>

        <SectionHeader title="Admin Actions" />
        <div style={{ display:"flex", gap:"0.75rem", flexWrap:"wrap" }}>
          <Link to="/courses/create" style={{ display:"inline-flex", alignItems:"center", gap:"0.5rem", padding:"0.7rem 1.25rem", background:"linear-gradient(135deg,#14b8a6,#6366f1)", color:"white", borderRadius:"10px", textDecoration:"none", fontSize:"0.875rem", fontWeight:700, fontFamily:"'Plus Jakarta Sans',sans-serif", transition:"opacity 0.2s" }}
            onMouseEnter={e => e.currentTarget.style.opacity="0.85"} onMouseLeave={e => e.currentTarget.style.opacity="1"}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Create Course
          </Link>
          {[{ to:"/students", label:"Browse Courses" }, { to:"/analytics/admin", label:"Full Analytics →" }].map(btn => (
            <Link key={btn.to} to={btn.to} style={{ display:"inline-flex", alignItems:"center", padding:"0.7rem 1.25rem", background:"rgba(255,255,255,0.03)", color:"rgba(167,139,250,0.85)", border:"1px solid rgba(167,139,250,0.22)", borderRadius:"10px", textDecoration:"none", fontSize:"0.875rem", fontWeight:700, fontFamily:"'Plus Jakarta Sans',sans-serif", transition:"all 0.2s" }}
              onMouseEnter={e => { e.currentTarget.style.background="rgba(167,139,250,0.08)"; e.currentTarget.style.borderColor="rgba(167,139,250,0.42)"; }}
              onMouseLeave={e => { e.currentTarget.style.background="rgba(255,255,255,0.03)"; e.currentTarget.style.borderColor="rgba(167,139,250,0.22)"; }}>
              {btn.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}