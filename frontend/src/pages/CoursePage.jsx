import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { courseAPI, quizAPI, levelRegAPI } from "../services/api.js";

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

const STATUS_CFG = {
  locked:    { label: "Locked",      bg: "#f1f5f9", color: "#64748b", border: "#e2e8f0",  icon: "🔒" },
  available: { label: "Available",   bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe",  icon: "📖" },
  active:    { label: "In Progress", bg: "#eef2ff", color: "#4338ca", border: "#c7d2fe",  icon: "⚡" },
  completed: { label: "Completed",   bg: "#dcfce7", color: "#15803d", border: "#bbf7d0",  icon: "✓"  },
  failed:    { label: "Failed",      bg: "#fee2e2", color: "#b91c1c", border: "#fecaca",  icon: "✗"  },
};

export default function CoursePage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [course,        setCourse]        = useState(null);
  const [quizzes,       setQuizzes]       = useState([]);
  const [levelStatuses, setLevelStatuses] = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState("");
  const [registering,   setRegistering]   = useState(null);
  const [regMsg,        setRegMsg]        = useState({ text: "", type: "" });

  const raw     = localStorage.getItem("user");
  const user    = raw ? JSON.parse(raw) : {};
  const isAdmin = ["admin","faculty"].includes(user.role);

  const [courseForm,    setCourseForm]    = useState({ title: "", description: "", difficulty: "Beginner" });
  const [courseLoading, setCourseLoading] = useState(false);
  const [courseMsg,     setCourseMsg]     = useState("");

  // ── Load data ─────────────────────────────────────────────────────────────
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
      } catch {
        setError("Failed to load course.");
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [id, isAdmin]);

  // ── Level registration ────────────────────────────────────────────────────
  const handleLevelRegister = async (levelNumber) => {
    setRegistering(levelNumber);
    setRegMsg({ text: "", type: "" });
    try {
      await levelRegAPI.registerLevel(id, levelNumber);
      const res = await levelRegAPI.getCourseStatus(id);
      setLevelStatuses(res.data.data?.levelStatuses || []);
      setRegMsg({ text: `Registered for Level ${levelNumber}!`, type: "success" });
      setTimeout(() => setRegMsg({ text: "", type: "" }), 3000);
    } catch (err) {
      setRegMsg({ text: err.response?.data?.message || "Registration failed.", type: "error" });
      setTimeout(() => setRegMsg({ text: "", type: "" }), 3500);
    } finally {
      setRegistering(null);
    }
  };

  // ── Admin: create course ──────────────────────────────────────────────────
  const handleCreateCourse = async (e) => {
    e.preventDefault();
    setCourseMsg(""); setCourseLoading(true);
    try {
      await courseAPI.create(courseForm);
      setCourseMsg("success");
      setCourseForm({ title: "", description: "", difficulty: "Beginner" });
      setTimeout(() => navigate("/"), 1500);
    } catch (err) {
      setCourseMsg("error:" + (err.response?.data?.message || "Failed to create course."));
    } finally {
      setCourseLoading(false);
    }
  };

  // ── States ────────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="spinner-wrap"><div className="spinner" /><span>Loading course...</span></div>
  );

  if (id === "create" && isAdmin) return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Create New Course</h1>
        <p className="page-subtitle">Add a new course for your students.</p>
      </div>
      {courseMsg === "success" && <div className="alert alert-success">✅ Course created! Redirecting...</div>}
      {courseMsg.startsWith("error:") && <div className="alert alert-error">❌ {courseMsg.slice(6)}</div>}
      <div className="card" style={{ maxWidth: 580 }}>
        <form onSubmit={handleCreateCourse}>
          <div className="form-group">
            <label>Course Title</label>
            <input type="text" value={courseForm.title}
              onChange={(e) => setCourseForm((p) => ({ ...p, title: e.target.value }))}
              placeholder="e.g. Introduction to Python" required />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea rows={4} value={courseForm.description}
              onChange={(e) => setCourseForm((p) => ({ ...p, description: e.target.value }))}
              placeholder="What will students learn in this course?" required />
          </div>
          <div className="form-group">
            <label>Difficulty</label>
            <select value={courseForm.difficulty}
              onChange={(e) => setCourseForm((p) => ({ ...p, difficulty: e.target.value }))}>
              <option>Beginner</option>
              <option>Intermediate</option>
              <option>Advanced</option>
            </select>
          </div>
          <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
            <button className="btn btn-primary" type="submit" disabled={courseLoading}>
              {courseLoading ? "Creating..." : "Create Course"}
            </button>
            <Link to="/" className="btn btn-ghost">Cancel</Link>
          </div>
        </form>
      </div>
    </div>
  );

  if (error)   return <div className="page"><div className="alert alert-error">{error}</div></div>;
  if (!course) return <div className="page"><div className="alert alert-error">Course not found.</div></div>;

  const dc          = DIFF_COLORS[course.difficulty] || DIFF_COLORS.Beginner;
  const totalLevels = course.levels?.length   || 0;
  const totalLessons= course.lessons?.length  || 0;
  const doneLevels  = levelStatuses.filter((ls) => ls.status === "completed").length;
  const pct         = totalLevels > 0 ? Math.round((doneLevels / totalLevels) * 100) : 0;

  return (
    <div className="page">
      {/* ── Hero banner ──────────────────────────────────────────────────── */}
      <div style={{
        borderRadius: 18, overflow: "hidden", marginBottom: "2rem",
        boxShadow: "0 4px 24px rgba(0,0,0,0.1)",
        position: "relative",
        background: course.image
          ? `linear-gradient(rgba(15,15,40,0.58), rgba(15,15,40,0.72)), url(${course.image}) center/cover`
          : FALLBACK_BG[totalLevels % FALLBACK_BG.length],
        minHeight: 200,
        display: "flex", flexDirection: "column", justifyContent: "flex-end",
        padding: "2rem",
      }}>
        {/* Back button */}
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => navigate(isAdmin ? "/" : "/students")}
          style={{
            position: "absolute", top: "1rem", left: "1rem",
            background: "rgba(255,255,255,0.15)", backdropFilter: "blur(4px)",
            color: "#fff", border: "1.5px solid rgba(255,255,255,0.25)",
          }}
        >
          ← Back
        </button>

        {/* Edit Course button (admin/faculty only) */}
        {isAdmin && (
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => navigate(`/courses/edit/${id}`)}
            style={{
              position: "absolute", top: "1rem", right: "1rem",
              background: "rgba(255,255,255,0.15)", backdropFilter: "blur(4px)",
              color: "#fff", border: "1.5px solid rgba(255,255,255,0.25)",
            }}
          >
            ✏️ Edit Course
          </button>
        )}

        {/* Difficulty badge */}
        <span style={{
          position: "absolute", top: isAdmin ? "3.5rem" : "1rem", right: "1rem",
          padding: "4px 14px", borderRadius: 999, fontSize: "0.75rem", fontWeight: 700,
          background: dc.bg, color: dc.color,
        }}>{course.difficulty}</span>

        {/* Title */}
        <h1 style={{ margin: 0, fontSize: "clamp(1.4rem, 3vw, 2rem)", fontWeight: 800,
          color: "#fff", textShadow: "0 2px 8px rgba(0,0,0,0.4)", lineHeight: 1.25 }}>
          {course.title}
        </h1>

        {/* Topic chips */}
        {course.topics?.length > 0 && (
          <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginTop: "0.5rem" }}>
            {course.topics.map((t) => (
              <span key={t} style={{
                padding: "2px 10px", borderRadius: 999, fontSize: "0.72rem", fontWeight: 500,
                background: "rgba(255,255,255,0.18)", color: "#e0e7ff",
              }}>{t}</span>
            ))}
          </div>
        )}

        {/* Stats bar */}
        <div style={{ display: "flex", gap: "1.25rem", marginTop: "0.9rem", flexWrap: "wrap" }}>
          {[
            { icon: "📚", val: `${totalLevels} Level${totalLevels !== 1 ? "s" : ""}` },
            { icon: "📋", val: `${totalLessons} Lesson${totalLessons !== 1 ? "s" : ""}` },
            ...(!isAdmin && totalLevels > 0 ? [{ icon: "🎯", val: `${pct}% Complete` }] : []),
          ].map((s) => (
            <span key={s.val} style={{ fontSize: "0.82rem", fontWeight: 600,
              color: "rgba(255,255,255,0.85)", display: "flex", alignItems: "center", gap: "0.3rem" }}>
              {s.icon} {s.val}
            </span>
          ))}
        </div>

        {/* Overall progress bar (students only) */}
        {!isAdmin && totalLevels > 0 && (
          <div style={{ marginTop: "1rem" }}>
            <div style={{ height: 6, background: "rgba(255,255,255,0.2)", borderRadius: 999 }}>
              <div style={{
                height: "100%", width: `${pct}%`, borderRadius: 999, transition: "width 0.4s",
                background: pct === 100 ? "#34d399" : "#818cf8",
              }} />
            </div>
          </div>
        )}
      </div>

      {/* Description card */}
      {course.description && (
        <div style={{
          background: "var(--surface)", border: "1.5px solid var(--border)", borderRadius: 14,
          padding: "1.25rem 1.5rem", marginBottom: "2rem",
          boxShadow: "var(--shadow-xs)",
        }}>
          <p style={{ margin: 0, color: "var(--text-muted)", lineHeight: 1.7 }}>{course.description}</p>
        </div>
      )}

      {/* ── LEVELS (Student) ─────────────────────────────────────────────── */}
      {!isAdmin && totalLevels > 0 && (
        <section style={{ marginBottom: "2.5rem" }}>
          <h2 style={{
            fontSize: "1.05rem", fontWeight: 700, color: "var(--text)", margin: "0 0 1rem",
            display: "flex", alignItems: "center", gap: "0.5rem",
          }}>
            <span>📚</span> Course Levels
          </h2>

          {regMsg.text && (
            <div className={`alert alert-${regMsg.type === "success" ? "success" : "error"}`}
              style={{ marginBottom: "1rem" }}>
              {regMsg.text}
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
            {course.levels.map((lv) => {
              const ls       = levelStatuses.find((s) => s.levelNumber === lv.levelNumber);
              const status   = ls?.status || "locked";
              const sc       = STATUS_CFG[status] || STATUS_CFG.locked;
              const isBusy   = registering === lv.levelNumber;
              const attempts = ls?.attemptCount || 0;
              const scoreStr = ls?.score != null ? ` · ${ls.score}%` : "";
              const isLocked = status === "locked";

              return (
                <div key={lv.levelNumber} style={{
                  display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap",
                  background: "var(--surface)", border: `1.5px solid ${sc.border}`,
                  borderRadius: 14, padding: "1rem 1.25rem",
                  boxShadow: "var(--shadow-xs)",
                  opacity: isLocked ? 0.6 : 1,
                  transition: "box-shadow 0.2s",
                }}>
                  {/* Circle */}
                  <div style={{
                    width: 46, height: 46, borderRadius: "50%", flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontWeight: 800, fontSize: "1rem",
                    background: sc.bg, color: sc.color, border: `2px solid ${sc.border}`,
                  }}>
                    {sc.icon}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                      <span style={{ fontWeight: 700, fontSize: "0.925rem", color: "var(--text)" }}>
                        Level {lv.levelNumber}: {lv.title}
                      </span>
                      <span style={{
                        padding: "2px 9px", borderRadius: 999, fontSize: "0.68rem", fontWeight: 700,
                        background: sc.bg, color: sc.color,
                      }}>
                        {sc.label}{status !== "locked" && status !== "available" ? scoreStr : ""}
                      </span>
                    </div>
                    <div style={{ fontSize: "0.77rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
                      {attempts > 0 ? `${attempts} attempt${attempts > 1 ? "s" : ""}` : "Not started"}
                    </div>
                  </div>

                  {/* Button */}
                  <div style={{ flexShrink: 0 }}>
                    {status === "locked" && (
                      <button className="btn btn-ghost btn-sm" disabled>🔒 Locked</button>
                    )}
                    {status === "available" && (
                      <button className="btn btn-primary btn-sm" disabled={isBusy}
                        onClick={() => handleLevelRegister(lv.levelNumber)}>
                        {isBusy ? "Registering..." : "Register"}
                      </button>
                    )}
                    {status === "active" && (
                      <button className="btn btn-primary btn-sm"
                        onClick={() => navigate(`/courses/${id}/level/${lv.levelNumber}`)}>
                        ▶ Study Now
                      </button>
                    )}
                    {status === "completed" && (
                      <button className="btn btn-outline btn-sm"
                        onClick={() => navigate(`/courses/${id}/level/${lv.levelNumber}`)}>
                        Review
                      </button>
                    )}
                    {status === "failed" && (
                      <button className="btn btn-outline btn-sm" disabled={isBusy}
                        style={{ borderColor: "var(--danger)", color: "var(--danger)" }}
                        onClick={() => handleLevelRegister(lv.levelNumber)}>
                        {isBusy ? "..." : "Re-register"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── COURSE CONTENTS (Lessons) ─────────────────────────────────────── */}
      <section style={{ marginBottom: "2.5rem" }}>
        <h2 style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--text)", margin: "0 0 1rem",
          display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span>📋</span> Course Contents
        </h2>

        {(!course.lessons || course.lessons.length === 0) ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <p>No lessons have been added yet.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {course.lessons.map((lesson, idx) => (
              <div key={idx} style={{
                display: "flex", alignItems: "flex-start", gap: "0.9rem",
                background: "var(--surface)", border: "1.5px solid var(--border)",
                borderRadius: 12, padding: "0.9rem 1.1rem",
                boxShadow: "var(--shadow-xs)",
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontWeight: 700, fontSize: "0.8rem",
                  background: "var(--primary-light)", color: "var(--primary)",
                }}>
                  {lesson.order ?? idx + 1}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: "0.88rem", color: "var(--text)", marginBottom: "0.2rem" }}>
                    {lesson.title}
                  </div>
                  {lesson.content && (
                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
                      {lesson.content}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── QUIZZES (Admin) ──────────────────────────────────────────────── */}
      {isAdmin && (
        <section>
          <h2 style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--text)", margin: "0 0 1rem",
            display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span>📝</span> Quizzes
          </h2>

          {quizzes.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📝</div>
              <p>No quizzes for this course yet.</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "1rem" }}>
              {quizzes.map((quiz) => (
                <div key={quiz._id} style={{
                  background: "var(--surface)", border: "1.5px solid var(--border)",
                  borderRadius: 14, padding: "1.25rem", boxShadow: "var(--shadow-xs)",
                  display: "flex", flexDirection: "column", gap: "0.75rem",
                }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.5rem" }}>
                    <span style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--text)" }}>
                      📝 {quiz.title}
                    </span>
                    <span style={{
                      padding: "2px 9px", borderRadius: 999, fontSize: "0.68rem", fontWeight: 700,
                      background: "var(--primary-light)", color: "var(--primary)", flexShrink: 0,
                    }}>
                      L{quiz.levelNumber ?? 1}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--text-muted)" }}>
                    {quiz.questions?.length ?? 0} questions · {quiz.totalMarks} marks
                  </p>
                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                    <Link to={`/quiz/${quiz._id}?courseId=${course._id}`}
                      className="btn btn-primary btn-sm" style={{ alignSelf: "flex-start" }}>
                      Preview →
                    </Link>
                    <button className="btn btn-outline btn-sm"
                      onClick={() => navigate(`/quiz/edit/${quiz._id}`)}
                      style={{ alignSelf: "flex-start" }}>
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
  );
}