import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { levelRegAPI } from "../services/api";

const DIFF_COLORS = {
  Beginner:     { bg: "#dcfce7", color: "#15803d", border: "#bbf7d0" },
  Intermediate: { bg: "#fef9c3", color: "#a16207", border: "#fde68a" },
  Advanced:     { bg: "#fee2e2", color: "#b91c1c", border: "#fecaca" },
};

const FALLBACK_BG = [
  "linear-gradient(135deg,#6366f1 0%,#4338ca 100%)",
  "linear-gradient(135deg,#0ea5e9 0%,#0369a1 100%)",
  "linear-gradient(135deg,#10b981 0%,#065f46 100%)",
];

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
      // Only show courses that have at least one active or failed level
      // (i.e. genuinely in progress). Fully-completed courses go back to Available Courses.
      const inProgress = (res.data.data || []).filter((c) =>
        c.levelStatuses?.some((ls) => ["active", "failed"].includes(ls.status))
      );
      setCourses(inProgress);
    } catch (err) {
      console.error("Failed to load my courses:", err);
    } finally {
      setLoading(false);
    }
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
    } finally {
      setRegistering(null);
    }
  };

  if (loading) return (
    <div className="spinner-wrap"><div className="spinner" /><span>Loading your courses...</span></div>
  );

  return (
    <div className="page">
      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", bottom: "2rem", right: "2rem", zIndex: 9999,
          padding: "0.8rem 1.25rem", borderRadius: 12, fontWeight: 600, fontSize: "0.875rem",
          background: toast.type === "success" ? "#10b981" : "#ef4444", color: "#fff",
          boxShadow: "0 8px 24px rgba(0,0,0,0.18)", animation: "fadeIn 0.2s ease",
        }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">My Courses</h1>
        <p className="page-subtitle">Courses you are actively working on. Completed courses appear in Available Courses.</p>
      </div>

      {courses.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🎯</div>
          <p style={{ fontWeight: 700, fontSize: "1rem", marginBottom: "0.5rem" }}>No courses started yet</p>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
            Browse available courses and register for a level to begin learning.
          </p>
          <button className="btn btn-primary" style={{ marginTop: "1.25rem" }}
            onClick={() => navigate("/students")}>
            Browse Available Courses →
          </button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1.25rem" }}>
          {courses.map((course, idx) => {
            const dc          = DIFF_COLORS[course.difficulty] || DIFF_COLORS.Beginner;
            const totalLevels = course.levelStatuses?.length || 0;
            const doneLevels  = course.levelStatuses?.filter((ls) => ls.status === "completed").length || 0;
            const pct         = totalLevels > 0 ? Math.round((doneLevels / totalLevels) * 100) : 0;
            const activeLevels = course.levelStatuses?.filter((ls) => ls.status === "active")  || [];
            const failedLevels = course.levelStatuses?.filter((ls) => ls.status === "failed")  || [];

            // Find first actionable level for the main CTA
            const primaryLevel = activeLevels[0] || failedLevels[0];

            return (
              <div key={course._id} style={{
                background: "var(--surface)", borderRadius: 16, overflow: "hidden",
                border: "1.5px solid var(--border)", boxShadow: "var(--shadow-sm)",
                display: "flex", flexDirection: "column", transition: "all 0.2s",
              }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = "0 8px 24px rgba(99,102,241,0.14)";
                  e.currentTarget.style.borderColor = "var(--primary)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "var(--shadow-sm)";
                  e.currentTarget.style.borderColor = "var(--border)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                {/* Banner */}
                <div style={{
                  height: 120, position: "relative", flexShrink: 0,
                  background: course.image
                    ? `linear-gradient(rgba(0,0,0,0.38), rgba(0,0,0,0.6)), url("${course.image}") center/cover`
                    : FALLBACK_BG[idx % FALLBACK_BG.length],
                }}>
                  <span style={{
                    position: "absolute", top: 12, right: 12,
                    padding: "3px 10px", borderRadius: 999, fontSize: "0.7rem", fontWeight: 700,
                    background: dc.bg, color: dc.color,
                  }}>{course.difficulty}</span>
                  {/* Active badge */}
                  {activeLevels.length > 0 && (
                    <span style={{
                      position: "absolute", top: 12, left: 12,
                      display: "flex", alignItems: "center", gap: 5,
                      padding: "3px 10px", borderRadius: 999, fontSize: "0.7rem", fontWeight: 700,
                      background: "var(--primary)", color: "#fff",
                    }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#a5f3fc", display: "inline-block" }} />
                      In Progress
                    </span>
                  )}
                  {pct === 100 && (
                    <span style={{
                      position: "absolute", top: 12, left: 12,
                      padding: "3px 10px", borderRadius: 999, fontSize: "0.7rem", fontWeight: 700,
                      background: "var(--success)", color: "#fff",
                    }}>✓ Completed</span>
                  )}
                </div>

                {/* Body */}
                <div style={{ padding: "1.1rem 1.25rem 0", flex: 1 }}>
                  <h3 style={{ margin: "0 0 0.75rem", fontSize: "0.975rem", fontWeight: 700,
                    color: "var(--text)", lineHeight: 1.35 }}>
                    {course.title}
                  </h3>

                  {/* Progress */}
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem",
                    color: "var(--text-muted)", fontWeight: 600, marginBottom: "0.4rem" }}>
                    <span>Progress</span>
                    <span style={{ color: pct === 100 ? "var(--success)" : "var(--primary)" }}>
                      {doneLevels}/{totalLevels} levels · {pct}%
                    </span>
                  </div>
                  <div style={{ height: 6, background: "var(--border)", borderRadius: 999, overflow: "hidden", marginBottom: "0.9rem" }}>
                    <div style={{
                      height: "100%", width: `${pct}%`, borderRadius: 999,
                      background: pct === 100 ? "var(--success)" : "linear-gradient(90deg,var(--primary),#818cf8)",
                      transition: "width 0.4s ease",
                    }} />
                  </div>

                  {/* Active / Failed mini list */}
                  {[...activeLevels, ...failedLevels].map((ls) => {
                    const lvInfo = course.levels?.find((l) => l.levelNumber === ls.levelNumber);
                    const isActive = ls.status === "active";
                    const regKey = `${course._id}-${ls.levelNumber}`;
                    const isBusy = registering === regKey;

                    return (
                      <div key={ls.levelNumber} style={{
                        display: "flex", alignItems: "center", gap: "0.6rem",
                        padding: "0.5rem 0.75rem", borderRadius: 8, marginBottom: "0.4rem",
                        background: isActive ? "var(--primary-light)" : "var(--danger-lighter)",
                        border: `1px solid ${isActive ? "#c7d2fe" : "#fecdd3"}`,
                      }}>
                        <div style={{
                          width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontWeight: 800, fontSize: "0.75rem",
                          background: isActive ? "var(--primary)" : "var(--danger)", color: "#fff",
                        }}>
                          {isActive ? ls.levelNumber : "✗"}
                        </div>
                        <span style={{ flex: 1, fontSize: "0.8rem", fontWeight: 600, color: "var(--text)" }}>
                          Level {ls.levelNumber}{lvInfo ? `: ${lvInfo.title}` : ""}
                          {!isActive && ls.score != null && (
                            <span style={{ color: "var(--danger)", fontWeight: 700 }}> · {ls.score}%</span>
                          )}
                        </span>
                        {!isActive && (
                          <button style={{
                            padding: "3px 10px", borderRadius: 999, fontSize: "0.7rem", fontWeight: 700,
                            border: "1.5px solid var(--danger)", color: "var(--danger)",
                            background: "transparent", cursor: isBusy ? "not-allowed" : "pointer",
                          }}
                            disabled={isBusy}
                            onClick={() => handleRegister(course._id, ls.levelNumber)}
                          >
                            {isBusy ? "..." : "Re-register"}
                          </button>
                        )}
                      </div>
                    );
                  })}
                  {pct === 100 && activeLevels.length === 0 && failedLevels.length === 0 && (
                    <p style={{ textAlign: "center", color: "var(--success)", fontWeight: 700,
                      fontSize: "0.85rem", padding: "0.5rem 0" }}>
                      🎉 All levels completed!
                    </p>
                  )}
                </div>

                {/* Footer CTA */}
                <div style={{ padding: "0.9rem 1.25rem 1.25rem" }}>
                  <button className="btn btn-primary"
                    style={{ width: "100%", justifyContent: "center", gap: "0.4rem" }}
                    onClick={() => navigate(`/courses/${course._id}`)}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polygon points="5 3 19 12 5 21 5 3"/>
                    </svg>
                    Study Now
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}