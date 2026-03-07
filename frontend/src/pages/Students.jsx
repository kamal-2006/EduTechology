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

  const filtered = courses.filter((c) => {
    const matchDiff   = diffFilter === "All" || c.difficulty === diffFilter;
    const matchSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchDiff && matchSearch;
  });

  if (loading) return (
    <div className="spinner-wrap"><div className="spinner" /><span>Loading courses...</span></div>
  );

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">Available Courses</h1>
        <p className="page-subtitle">
          Register level by level — each level unlocks after passing the previous quiz.
        </p>
      </div>

      {/* Toolbar */}
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center", marginBottom: "1.75rem" }}>
        <div style={{ position: "relative", flex: "1 1 200px" }}>
          <svg style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }}
            width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input type="text" placeholder="Search courses..."
            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: "100%", paddingLeft: 36, paddingRight: 14, paddingTop: 9, paddingBottom: 9,
              border: "1.5px solid var(--border)", borderRadius: 10, fontSize: "0.875rem",
              background: "var(--surface)", color: "var(--text)", outline: "none" }}
            onFocus={(e) => (e.target.style.borderColor = "var(--primary)")}
            onBlur={(e)  => (e.target.style.borderColor = "var(--border)")}
          />
        </div>
        <div style={{ display: "flex", gap: "0.4rem", flexShrink: 0 }}>
          {["All", "Beginner", "Intermediate", "Advanced"].map((d) => (
            <button key={d} onClick={() => setDiffFilter(d)} style={{
              padding: "7px 14px", borderRadius: 999,
              border: `1.5px solid ${diffFilter === d ? "var(--primary)" : "var(--border)"}`,
              background: diffFilter === d ? "var(--primary)" : "transparent",
              color: diffFilter === d ? "#fff" : "var(--text-muted)",
              fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", transition: "all 0.15s",
            }}>{d}</button>
          ))}
        </div>
      </div>

      {/* Cards grid */}
      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📚</div>
          <p>No courses found. Try adjusting your search or filter.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1.25rem" }}>
          {filtered.map((course, idx) => {
            const dc          = DIFF_COLORS[course.difficulty] || DIFF_COLORS.Beginner;
            const totalLevels = course.levelStatuses?.length || 0;
            const doneLevels  = course.levelStatuses?.filter((ls) => ls.status === "completed").length || 0;
            const pct         = totalLevels > 0 ? Math.round((doneLevels / totalLevels) * 100) : 0;
            const hasProgress = doneLevels > 0;

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
                  height: 130, position: "relative", flexShrink: 0,
                  background: course.image
                    ? `linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.55)), url("${course.image}") center/cover`
                    : FALLBACK_BG[idx % FALLBACK_BG.length],
                }}>
                  {/* Difficulty badge */}
                  <span style={{
                    position: "absolute", top: 12, right: 12,
                    padding: "3px 10px", borderRadius: 999, fontSize: "0.7rem", fontWeight: 700,
                    background: dc.bg, color: dc.color,
                  }}>{course.difficulty}</span>
                  {/* Level count */}
                  <div style={{ position: "absolute", bottom: 12, left: 14, display: "flex", gap: "0.5rem", alignItems: "center" }}>
                    <span style={{ background: "rgba(255,255,255,0.18)", backdropFilter: "blur(6px)",
                      padding: "3px 10px", borderRadius: 999, fontSize: "0.72rem", color: "#fff", fontWeight: 600 }}>
                      {totalLevels} levels
                    </span>
                    {hasProgress && (
                      <span style={{ background: "rgba(16,185,129,0.85)",
                        padding: "3px 10px", borderRadius: 999, fontSize: "0.72rem", color: "#fff", fontWeight: 600 }}>
                        {doneLevels} done
                      </span>
                    )}
                  </div>
                </div>

                {/* Body */}
                <div style={{ padding: "1.1rem 1.25rem 0", flex: 1 }}>
                  <h3 style={{ margin: "0 0 0.3rem", fontSize: "0.975rem", fontWeight: 700, color: "var(--text)", lineHeight: 1.35 }}>
                    {course.title}
                  </h3>
                  {course.topics?.length > 0 && (
                    <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap", marginTop: "0.5rem" }}>
                      {course.topics.slice(0, 3).map((t) => (
                        <span key={t} style={{ padding: "2px 8px", borderRadius: 999, fontSize: "0.68rem",
                          fontWeight: 500, background: "var(--primary-light)", color: "var(--primary)" }}>
                          {t}
                        </span>
                      ))}
                      {course.topics.length > 3 && (
                        <span style={{ padding: "2px 8px", borderRadius: 999, fontSize: "0.68rem",
                          fontWeight: 500, background: "var(--bg-secondary)", color: "var(--text-muted)" }}>
                          +{course.topics.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Progress + Button */}
                <div style={{ padding: "0.9rem 1.25rem 1.25rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem",
                    color: "var(--text-muted)", fontWeight: 600, marginBottom: "0.4rem" }}>
                    <span>Progress</span>
                    <span style={{ color: pct === 100 ? "var(--success)" : "var(--primary)" }}>
                      {pct}%
                    </span>
                  </div>
                  <div style={{ height: 6, background: "var(--border)", borderRadius: 999, overflow: "hidden", marginBottom: "1rem" }}>
                    <div style={{
                      height: "100%", width: `${pct}%`, borderRadius: 999,
                      background: pct === 100 ? "var(--success)" : "linear-gradient(90deg,var(--primary),#818cf8)",
                      transition: "width 0.4s ease",
                    }} />
                  </div>
                  <button
                    className="btn btn-primary"
                    style={{ width: "100%", justifyContent: "center", gap: "0.4rem" }}
                    onClick={() => navigate(`/courses/${course._id}`)}
                  >
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