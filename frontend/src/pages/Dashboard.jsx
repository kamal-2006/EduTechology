import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { analyticsAPI, levelRegAPI } from "../services/api.js";

const FALLBACK_BG = [
  "linear-gradient(135deg,#6366f1 0%,#4338ca 100%)",
  "linear-gradient(135deg,#0ea5e9 0%,#0369a1 100%)",
  "linear-gradient(135deg,#10b981 0%,#065f46 100%)",
  "linear-gradient(135deg,#f59e0b 0%,#b45309 100%)",
];

const DIFF_COLORS = {
  Beginner:     { bg: "#dcfce7", color: "#15803d" },
  Intermediate: { bg: "#fef9c3", color: "#a16207" },
  Advanced:     { bg: "#fee2e2", color: "#b91c1c" },
};

export default function Dashboard() {
  const raw  = localStorage.getItem("user");
  const user = raw ? JSON.parse(raw) : {};
  const navigate = useNavigate();

  const [myCourses, setMyCourses] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState("");

  useEffect(() => {
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
          const engaged = (csRes.data.data || []).filter((c) =>
            c.levelStatuses?.some((ls) => ["active", "failed", "completed"].includes(ls.status))
          );
          setMyCourses(engaged);
          setAnalytics(aRes.data.data);
        }
      } catch {
        setError("Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return (
    <div className="spinner-wrap"><div className="spinner" /><span>Loading your dashboard…</span></div>
  );
  if (error) return (
    <div className="page"><div className="alert alert-error">{error}</div></div>
  );
  if (["admin","faculty"].includes(user.role)) return <AdminDashboard analytics={analytics} />;

  const recentActivity = (analytics?.scoreHistory || []).slice(-5).reverse();
  const perfColor = analytics?.predictedPerformance === "High"
    ? "success" : analytics?.predictedPerformance === "Low" ? "danger" : "info";

  return (
    <div className="page">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="page-header">
        <h1 className="page-title">Welcome back, {user.name} 👋</h1>
        <p className="page-subtitle">Track your progress and continue your learning journey.</p>
      </div>

      {/* ── Dropout Risk Alert ─────────────────────────────────────────── */}
      {analytics?.dropoutRisk === "Yes" && (
        <div className="alert alert-warning" style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <div>
            <strong style={{ display: "block", marginBottom: "0.2rem" }}>AI Risk Alert</strong>
            <span style={{ fontSize: "0.875rem" }}>Our AI model detected a dropout risk based on your activity. Consider revisiting course materials or seeking support.</span>
          </div>
        </div>
      )}

      {/* ── Progress Overview ──────────────────────────────────────────── */}
      <h2 className="section-title">Progress Overview</h2>
      <div className="stats-grid">
        <StatCard icon="✅" value={analytics?.totalQuizzesTaken ?? 0} label="Quizzes Taken"      color="success" />
        <StatCard icon="🎯" value={analytics?.averageScore      ?? 0} label="Average Score"      suffix="%" color="primary" />
        <StatCard icon="📈" value={analytics?.recommendedLevel  ?? "N/A"} label="Recommended Level" isText color="accent" />
        <StatCard icon="🤖" value={analytics?.predictedPerformance ?? "N/A"} label="AI Prediction" isText color={perfColor} />
      </div>

      {/* ── My Courses ─────────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "2rem 0 1rem" }}>
        <h2 className="section-title" style={{ margin: 0 }}>My Courses</h2>
        <Link to="/my-courses" style={{ fontSize: "0.85rem", color: "var(--primary)", fontWeight: 600, textDecoration: "none" }}>
          View All →
        </Link>
      </div>

      {myCourses.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🎯</div>
          <p style={{ marginBottom: "0.5rem", fontWeight: 600 }}>No courses started yet</p>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>Browse and register for a level to begin your journey.</p>
          <Link to="/students" className="btn btn-primary" style={{ marginTop: "1.25rem" }}>Browse Available Courses →</Link>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "1rem" }}>
          {myCourses.slice(0, 4).map((course, idx) => {
            const totalLevels = course.levelStatuses?.length || 0;
            const doneLevels  = course.levelStatuses?.filter((ls) => ls.status === "completed").length || 0;
            const pct         = totalLevels > 0 ? Math.round((doneLevels / totalLevels) * 100) : 0;
            const dc          = DIFF_COLORS[course.difficulty] || DIFF_COLORS.Beginner;
            const activeLvl   = course.levelStatuses?.find((ls) => ls.status === "active");

            return (
              <div
                key={course._id}
                onClick={() => navigate(`/courses/${course._id}`)}
                style={{
                  background: "var(--surface)", border: "1.5px solid var(--border)",
                  borderRadius: 14, overflow: "hidden", cursor: "pointer",
                  boxShadow: "var(--shadow-xs)", transition: "all 0.2s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 4px 16px rgba(99,102,241,0.14)"; e.currentTarget.style.borderColor = "var(--primary)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "var(--shadow-xs)"; e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.transform = "translateY(0)"; }}
              >
                <div style={{
                  height: 72,
                  background: course.image
                    ? `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.55)), url(${course.image}) center/cover`
                    : FALLBACK_BG[idx % FALLBACK_BG.length],
                  position: "relative",
                }}>
                  <span style={{
                    position: "absolute", top: 8, right: 8,
                    padding: "2px 8px", borderRadius: 999, fontSize: "0.65rem", fontWeight: 700,
                    background: dc.bg, color: dc.color,
                  }}>{course.difficulty}</span>
                  {activeLvl && (
                    <span style={{
                      position: "absolute", bottom: 8, left: 8,
                      fontSize: "0.65rem", fontWeight: 700,
                      background: "var(--primary)", color: "#fff",
                      padding: "2px 8px", borderRadius: 999,
                    }}>⚡ Level {activeLvl.levelNumber} active</span>
                  )}
                </div>
                <div style={{ padding: "0.85rem 1rem 1rem" }}>
                  <h3 style={{ margin: "0 0 0.55rem", fontSize: "0.875rem", fontWeight: 700, color: "var(--text)", lineHeight: 1.35 }}>
                    {course.title}
                  </h3>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 600, marginBottom: "0.3rem" }}>
                    <span>Progress</span>
                    <span style={{ color: pct === 100 ? "var(--success)" : "var(--primary)" }}>{doneLevels}/{totalLevels} · {pct}%</span>
                  </div>
                  <div style={{ height: 5, background: "var(--border)", borderRadius: 999, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pct}%`, borderRadius: 999, background: pct === 100 ? "var(--success)" : "linear-gradient(90deg,var(--primary),#818cf8)", transition: "width 0.4s" }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Recent Activity ────────────────────────────────────────────── */}
      {recentActivity.length > 0 && (
        <section style={{ marginTop: "2rem" }}>
          <h2 className="section-title">Recent Activity</h2>
          <div style={{ background: "var(--surface)", border: "1.5px solid var(--border)", borderRadius: 14, overflow: "hidden", boxShadow: "var(--shadow-xs)" }}>
            {recentActivity.map((item, idx) => (
              <div key={idx} style={{
                display: "flex", alignItems: "center", gap: "0.85rem",
                padding: "0.85rem 1.25rem",
                borderBottom: idx < recentActivity.length - 1 ? "1px solid var(--border)" : "none",
              }}>
                <div style={{
                  width: 38, height: 38, borderRadius: "50%", flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem",
                  background: item.score >= 60 ? "#dcfce7" : "#fee2e2",
                }}>
                  {item.score >= 60 ? "✅" : "📝"}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: "0.85rem", color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {item.course || "Unknown Course"}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    {item.date ? new Date(item.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                  </div>
                </div>
                <span style={{
                  padding: "3px 12px", borderRadius: 999, fontSize: "0.78rem", fontWeight: 700,
                  background: item.score >= 60 ? "#dcfce7" : "#fee2e2",
                  color: item.score >= 60 ? "#15803d" : "#b91c1c",
                  flexShrink: 0,
                }}>{item.score}%</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Quick Actions ──────────────────────────────────────────────── */}
      <section style={{ marginTop: "2rem" }}>
        <h2 className="section-title">Quick Actions</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(175px, 1fr))", gap: "0.85rem" }}>
          {[
            { icon: "📚", label: "Browse Courses",  to: "/students",            desc: "Explore all available courses" },
            { icon: "🎓", label: "My Courses",       to: "/my-courses",          desc: "Track your learning progress" },
            { icon: "📊", label: "My Analytics",     to: `/analytics/${user.id}`, desc: "View your performance stats"  },
          ].map((act) => (
            <Link key={act.to} to={act.to} style={{ textDecoration: "none" }}>
              <div
                style={{
                  background: "var(--surface)", border: "1.5px solid var(--border)", borderRadius: 14,
                  padding: "1.1rem", boxShadow: "var(--shadow-xs)", transition: "all 0.2s",
                  display: "flex", flexDirection: "column", gap: "0.35rem", height: "100%",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--primary)"; e.currentTarget.style.boxShadow = "0 4px 12px rgba(99,102,241,0.12)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.boxShadow = "var(--shadow-xs)"; e.currentTarget.style.transform = "translateY(0)"; }}
              >
                <span style={{ fontSize: "1.6rem" }}>{act.icon}</span>
                <span style={{ fontWeight: 700, fontSize: "0.875rem", color: "var(--text)" }}>{act.label}</span>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", lineHeight: 1.4 }}>{act.desc}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

/* ── Admin Dashboard ──────────────────────────────────────────────────────── */
function AdminDashboard({ analytics }) {
  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Admin Dashboard</h1>
        <p className="page-subtitle">Manage your platform and monitor student performance.</p>
      </div>

      <div className="stats-grid">
        <StatCard icon="👥" value={analytics?.totalStudents    ?? 0} label="Total Students"    color="primary" />
        <StatCard icon="📚" value={analytics?.totalCourses     ?? 0} label="Total Courses"     color="accent"  />
        <StatCard icon="📝" value={analytics?.totalSubmissions ?? 0} label="Total Submissions" color="info"    />
        <StatCard icon="🎯" value={analytics?.avgPlatformScore ?? 0} label="Avg Platform Score" suffix="%" color="success" />
        <StatCard icon="⚠️" value={analytics?.atRiskStudents  ?? 0} label="At-Risk Students"  color="danger" />
      </div>

      <h2 className="section-title" style={{ marginTop: "2rem" }}>Admin Actions</h2>
      <div style={{ display: "flex", gap: "0.85rem", flexWrap: "wrap" }}>
        <Link to="/courses/create" className="btn btn-primary">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Create Course
        </Link>
        <Link to="/students" className="btn btn-outline">Browse Courses</Link>
        <Link to="/analytics/admin" className="btn btn-outline">Full Analytics →</Link>
      </div>
    </div>
  );
}

/* ── StatCard ─────────────────────────────────────────────────────────────── */
function StatCard({ icon, value, label, suffix = "", isText = false, color = "primary" }) {
  const colorMap = {
    primary: "var(--primary)",
    accent:  "#8b5cf6",
    success: "var(--success)",
    danger:  "var(--danger)",
    info:    "#0ea5e9",
  };
  return (
    <div className="stat-card">
      <div className="stat-icon">{icon}</div>
      <div className="stat-value" style={{ color: colorMap[color] || "var(--primary)" }}>
        {isText ? value : `${value}${suffix}`}
      </div>
      <div className="stat-label">{label}</div>
    </div>
  );
}