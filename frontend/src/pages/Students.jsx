import { useState, useEffect, useCallback } from "react";
import { useNavigate }                      from "react-router-dom";
import { levelRegAPI }                      from "../services/api";

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
//  Helpers
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const DIFF_STYLE = {
  Beginner:     { bg: "#dcfce7", color: "#15803d", border: "#bbf7d0" },
  Intermediate: { bg: "#fef9c3", color: "#a16207", border: "#fde68a" },
  Advanced:     { bg: "#fee2e2", color: "#b91c1c", border: "#fecaca" },
};

const FALLBACK_GRADIENT = [
  "linear-gradient(135deg,#6366f1 0%,#4338ca 100%)",
  "linear-gradient(135deg,#0ea5e9 0%,#0369a1 100%)",
  "linear-gradient(135deg,#10b981 0%,#065f46 100%)",
];

function StatusBadge({ status, score }) {
  const cfg = {
    locked:    { label: "Locked",      bg: "#f1f5f9", color: "#64748b", icon: "ðŸ”’" },
    available: { label: "Available",   bg: "#eff6ff", color: "#1d4ed8", icon: "ðŸ“–" },
    active:    { label: "In Progress", bg: "#eef2ff", color: "#4338ca", icon: "âš¡" },
    completed: { label: score != null ? `Passed Â· ${score}%` : "Completed", bg: "#dcfce7", color: "#15803d", icon: "âœ“" },
    failed:    { label: score != null ? `Failed Â· ${score}%` : "Failed",    bg: "#fee2e2", color: "#b91c1c", icon: "âœ—" },
  };
  const c = cfg[status] || cfg.locked;
  return (
    <span className="sp-status-badge" style={{ background: c.bg, color: c.color }}>
      {c.icon} {c.label}
    </span>
  );
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
//  Main Page
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function Students() {
  const navigate = useNavigate();
  const [activeTab,      setActiveTab]      = useState("available");
  const [courses,        setCourses]        = useState([]);
  const [myLevels,       setMyLevels]       = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [toast,          setToast]          = useState(null);
  const [registering,    setRegistering]    = useState(null);
  const [expandedCourse, setExpandedCourse] = useState(null);
  const [searchQuery,    setSearchQuery]    = useState("");
  const [diffFilter,     setDiffFilter]     = useState("All");

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // â”€â”€ Data load â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const loadData = useCallback(async () => {
    try {
      const [cRes, mRes] = await Promise.all([
        levelRegAPI.getAllCoursesStatus(),
        levelRegAPI.getMyActiveLevels(),
      ]);
      setCourses(cRes.data.data);
      setMyLevels(mRes.data.data);
    } catch (err) {
      console.error("Failed to load students page:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // â”€â”€ Register for a level â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleRegister = async (courseId, levelNumber) => {
    const key = `${courseId}-${levelNumber}`;
    setRegistering(key);
    try {
      await levelRegAPI.registerLevel(courseId, levelNumber);
      showToast(`Registered for Level ${levelNumber}! Open "My Courses" to start studying.`);
      await loadData();
    } catch (err) {
      showToast(err.response?.data?.message || "Registration failed.", "error");
    } finally {
      setRegistering(null);
    }
  };

  // â”€â”€ Filtering â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const filteredCourses = courses.filter((c) => {
    const matchDiff   = diffFilter === "All" || c.difficulty === diffFilter;
    const matchSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchDiff && matchSearch;
  });

  const myCoursesMap = {};
  myLevels.forEach((reg) => {
    const cid = reg.courseId?._id;
    if (!cid) return;
    if (!myCoursesMap[cid]) myCoursesMap[cid] = { course: reg.courseId, levels: [] };
    myCoursesMap[cid].levels.push(reg);
  });
  const myCoursesGroups = Object.values(myCoursesMap).filter((g) => {
    const matchDiff   = diffFilter === "All" || g.course.difficulty === diffFilter;
    const matchSearch = g.course.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchDiff && matchSearch;
  });

  if (loading) return (
    <div className="sp-loading"><div className="sp-spinner" /><p>Loadingâ€¦</p></div>
  );

  return (
    <div className="sp-root">
      {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          PAGE SIDEBAR
      â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <aside className="sp-sidebar">
        <div className="sp-sidebar-header">
          <div className="sp-sidebar-icon">ðŸŽ“</div>
          <div>
            <div className="sp-sidebar-title">Student Hub</div>
            <div className="sp-sidebar-sub">Your learning journey</div>
          </div>
        </div>

        <nav className="sp-sidebar-nav">
          <button
            className={`sp-sidebar-item${activeTab === "available" ? " active" : ""}`}
            onClick={() => setActiveTab("available")}
          >
            <span className="sp-sidebar-item-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="3" width="20" height="14" rx="2"/>
                <line x1="8" y1="21" x2="16" y2="21"/>
                <line x1="12" y1="17" x2="12" y2="21"/>
              </svg>
            </span>
            <span>Available Courses</span>
            <span className="sp-sidebar-count">{courses.length}</span>
          </button>

          <button
            className={`sp-sidebar-item${activeTab === "my" ? " active" : ""}`}
            onClick={() => setActiveTab("my")}
          >
            <span className="sp-sidebar-item-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                <path d="M6 12v5c3 3 9 3 12 0v-5"/>
              </svg>
            </span>
            <span>My Courses</span>
            <span
              className="sp-sidebar-count"
              style={myLevels.length > 0 ? { background: "var(--primary)", color: "#fff" } : {}}
            >
              {myLevels.length}
            </span>
          </button>
        </nav>

        {/* Stats summary */}
        <div className="sp-sidebar-summary">
          <div className="sp-summary-row">
            <span>Active Levels</span>
            <strong style={{ color: "var(--primary)" }}>
              {myLevels.filter((l) => l.status === "active").length}
            </strong>
          </div>
          <div className="sp-summary-row">
            <span>Needs Retry</span>
            <strong style={{ color: "var(--danger)" }}>
              {myLevels.filter((l) => l.status === "failed").length}
            </strong>
          </div>
          <div className="sp-summary-row">
            <span>Completed</span>
            <strong style={{ color: "var(--success)" }}>
              {courses.reduce((acc, c) =>
                acc + (c.levelStatuses?.filter((ls) => ls.status === "completed").length || 0), 0)}
            </strong>
          </div>
        </div>
      </aside>

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          MAIN CONTENT
      â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <div className="sp-main">
        {/* Toolbar */}
        <div className="sp-toolbar">
          <div className="sp-search-wrap">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              className="sp-search"
              type="text"
              placeholder="Search coursesâ€¦"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="sp-filters">
            {["All", "Beginner", "Intermediate", "Advanced"].map((d) => (
              <button
                key={d}
                className={`sp-filter-btn${diffFilter === d ? " active" : ""}`}
                onClick={() => setDiffFilter(d)}
              >{d}</button>
            ))}
          </div>
        </div>

        {/* â”€â”€ AVAILABLE COURSES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        {activeTab === "available" && (
          <section className="sp-section">
            <div className="sp-section-header">
              <h2 className="sp-section-title">Available Courses</h2>
              <p className="sp-section-sub">
                Register level by level. Each level unlocks after passing the previous quiz.
              </p>
            </div>

            {filteredCourses.length === 0 ? (
              <div className="sp-empty">
                <div className="sp-empty-icon">ðŸ“š</div>
                <h3>No courses found</h3>
                <p>Try adjusting your search or filter.</p>
              </div>
            ) : (
              <div className="sp-course-grid">
                {filteredCourses.map((course, idx) => {
                  const ds          = DIFF_STYLE[course.difficulty] || DIFF_STYLE.Beginner;
                  const isExpanded  = expandedCourse === course._id;
                  const totalLevels = course.levels?.length || 0;
                  const doneLevels  = course.levelStatuses?.filter((ls) => ls.status === "completed").length || 0;

                  return (
                    <div className="sp-course-card" key={course._id}>
                      {/* Thumbnail */}
                      <div
                        className="sp-course-thumb"
                        style={{
                          backgroundImage: course.image ? `url(${course.image})` : "none",
                          background: !course.image ? FALLBACK_GRADIENT[idx % FALLBACK_GRADIENT.length] : undefined,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                        }}
                      >
                        <div className="sp-course-thumb-overlay" />
                        <span className="sp-diff-badge" style={{ background: ds.bg, color: ds.color, border: `1px solid ${ds.border}` }}>
                          {course.difficulty}
                        </span>
                        {totalLevels > 0 && (
                          <div className="sp-mini-progress-wrap">
                            <div className="sp-mini-progress" style={{ width: `${(doneLevels / totalLevels) * 100}%` }} />
                          </div>
                        )}
                      </div>

                      {/* Body */}
                      <div className="sp-course-body">
                        <h3 className="sp-course-title">{course.title}</h3>
                        <p className="sp-course-desc">{course.description}</p>

                        {course.topics?.length > 0 && (
                          <div className="sp-topics">
                            {course.topics.slice(0, 4).map((t) => (
                              <span className="sp-topic-chip" key={t}>{t}</span>
                            ))}
                            {course.topics.length > 4 && (
                              <span className="sp-topic-chip sp-topic-more">+{course.topics.length - 4}</span>
                            )}
                          </div>
                        )}

                        <div className="sp-course-meta">
                          <span className="sp-meta-item">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                              <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
                            </svg>
                            {totalLevels} Levels
                          </span>
                          <span className="sp-meta-item" style={{ color: "var(--success)" }}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="20 6 9 17 4 12"/>
                            </svg>
                            {doneLevels} Completed
                          </span>
                        </div>

                        <button
                          className="sp-levels-toggle"
                          onClick={() => setExpandedCourse(isExpanded ? null : course._id)}
                        >
                          {isExpanded ? "Hide Levels â–²" : "View Levels â–¼"}
                        </button>

                        {/* Levels panel */}
                        {isExpanded && (
                          <div className="sp-levels-panel">
                            {course.levelStatuses?.map((ls) => {
                              const regKey  = `${course._id}-${ls.levelNumber}`;
                              const isBusy  = registering === regKey;
                              const lvTitle = course.levels?.find((l) => l.levelNumber === ls.levelNumber)?.title || "";

                              return (
                                <div className="sp-level-row" key={ls.levelNumber}>
                                  <div className="sp-level-row-left">
                                    <div className={`sp-level-num sp-level-num-${ls.status}`}>
                                      {ls.status === "completed" ? "âœ“" :
                                       ls.status === "failed"    ? "âœ—" :
                                       ls.status === "locked"    ? "ðŸ”’" : ls.levelNumber}
                                    </div>
                                    <div className="sp-level-info">
                                      <div className="sp-level-name">
                                        Level {ls.levelNumber}{lvTitle ? `: ${lvTitle}` : ""}
                                      </div>
                                      <div className="sp-level-badges">
                                        <StatusBadge status={ls.status} score={ls.score} />
                                        {ls.attemptCount > 0 && (
                                          <span className="sp-attempt-tag">
                                            {ls.attemptCount} attempt{ls.attemptCount > 1 ? "s" : ""}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="sp-level-row-right">
                                    {ls.status === "locked" && (
                                      <button className="sp-lvl-btn sp-lvl-locked" disabled>ðŸ”’ Locked</button>
                                    )}
                                    {ls.status === "available" && (
                                      <button
                                        className="sp-lvl-btn sp-lvl-register"
                                        disabled={isBusy}
                                        onClick={() => handleRegister(course._id, ls.levelNumber)}
                                      >
                                        {isBusy ? <><span className="sp-spinner-xs" /> Registeringâ€¦</> : "Register Level"}
                                      </button>
                                    )}
                                    {ls.status === "active" && (
                                      <button
                                        className="sp-lvl-btn sp-lvl-continue"
                                        onClick={() => navigate(`/courses/${course._id}/level/${ls.levelNumber}`)}
                                      >
                                        Study Now â†’
                                      </button>
                                    )}
                                    {ls.status === "completed" && (
                                      <button
                                        className="sp-lvl-btn sp-lvl-review"
                                        onClick={() => navigate(`/courses/${course._id}/level/${ls.levelNumber}`)}
                                      >
                                        Review
                                      </button>
                                    )}
                                    {ls.status === "failed" && (
                                      <button
                                        className="sp-lvl-btn sp-lvl-retry"
                                        disabled={isBusy}
                                        onClick={() => handleRegister(course._id, ls.levelNumber)}
                                      >
                                        {isBusy ? <><span className="sp-spinner-xs" /> Registeringâ€¦</> : "Re-register"}
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* â”€â”€ MY COURSES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        {activeTab === "my" && (
          <section className="sp-section">
            <div className="sp-section-header">
              <h2 className="sp-section-title">My Courses</h2>
              <p className="sp-section-sub">
                Active and failed levels. Completed levels disappear automatically â€” register the next to continue.
              </p>
            </div>

            {myCoursesGroups.length === 0 ? (
              <div className="sp-empty">
                <div className="sp-empty-icon">ðŸŽ¯</div>
                <h3>No active levels yet</h3>
                <p>Go to "Available Courses" and register for a level to begin learning.</p>
                <button className="sp-empty-btn" onClick={() => setActiveTab("available")}>
                  Browse Available Courses â†’
                </button>
              </div>
            ) : (
              <div className="sp-my-grid">
                {myCoursesGroups.map(({ course, levels }, gIdx) => {
                  const ds          = DIFF_STYLE[course.difficulty] || DIFF_STYLE.Beginner;
                  const totalLevels = course.levels?.length || 0;
                  const doneLevels  = courses
                    .find((c) => c._id === course._id)
                    ?.levelStatuses?.filter((ls) => ls.status === "completed").length || 0;
                  const pct = totalLevels > 0 ? Math.round((doneLevels / totalLevels) * 100) : 0;

                  return (
                    <div className="sp-my-card" key={course._id}>
                      {/* Header banner */}
                      <div
                        className="sp-my-card-header"
                        style={{
                          backgroundImage: course.image ? `url(${course.image})` : "none",
                          background: !course.image ? FALLBACK_GRADIENT[gIdx % FALLBACK_GRADIENT.length] : undefined,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                        }}
                      >
                        <div className="sp-my-card-overlay" />
                        <div className="sp-my-card-header-content">
                          <h3 className="sp-my-course-title">{course.title}</h3>
                          <span className="sp-diff-badge" style={{ background: ds.bg, color: ds.color, border: `1px solid ${ds.border}` }}>
                            {course.difficulty}
                          </span>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="sp-my-progress-section">
                        <div className="sp-my-progress-row">
                          <span>Overall Progress</span>
                          <span>{doneLevels}/{totalLevels} levels Â· {pct}%</span>
                        </div>
                        <div className="sp-my-progress-bar">
                          <div className="sp-my-progress-fill" style={{ width: `${pct}%` }} />
                        </div>
                      </div>

                      {/* Active / failed level items */}
                      <div className="sp-my-levels-list">
                        {levels.map((reg) => {
                          const lvInfo  = course.levels?.find((l) => l.levelNumber === reg.levelNumber);
                          const isBusy  = registering === `${course._id}-${reg.levelNumber}`;

                          return (
                            <div className={`sp-my-level-item sp-my-lvl-${reg.status}`} key={reg._id || reg.levelNumber}>
                              <div className="sp-my-level-left">
                                <div className={`sp-my-level-badge sp-my-badge-${reg.status}`}>
                                  {reg.status === "active" ? reg.levelNumber : reg.status === "failed" ? "âœ—" : "âœ“"}
                                </div>
                                <div className="sp-my-level-text">
                                  <div className="sp-my-level-name">
                                    Level {reg.levelNumber}{lvInfo ? `: ${lvInfo.title}` : ""}
                                  </div>
                                  <div className="sp-my-level-meta">
                                    {reg.status === "active" && (
                                      <span className="sp-pill sp-pill-active">âš¡ In Progress</span>
                                    )}
                                    {reg.status === "failed" && (
                                      <span className="sp-pill sp-pill-failed">
                                        âœ— Failed{reg.score != null ? ` Â· ${reg.score}%` : ""}
                                        {reg.attemptCount ? ` Â· ${reg.attemptCount} attempt${reg.attemptCount > 1 ? "s" : ""}` : ""}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="sp-my-level-actions">
                                {reg.status === "active" && (
                                  <button
                                    className="sp-lvl-btn sp-lvl-continue"
                                    onClick={() => navigate(`/courses/${course._id}/level/${reg.levelNumber}`)}
                                  >
                                    Study Now â†’
                                  </button>
                                )}
                                {reg.status === "failed" && (
                                  <button
                                    className="sp-lvl-btn sp-lvl-retry"
                                    disabled={isBusy}
                                    onClick={() => handleRegister(course._id, reg.levelNumber)}
                                  >
                                    {isBusy ? <><span className="sp-spinner-xs" /> Registeringâ€¦</> : "Re-register"}
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Topics */}
                      {course.topics?.length > 0 && (
                        <div className="sp-my-topics">
                          {course.topics.slice(0, 4).map((t) => (
                            <span className="sp-topic-chip" key={t}>{t}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

