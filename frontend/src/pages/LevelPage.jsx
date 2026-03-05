import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { courseAPI, quizAPI, levelRegAPI } from "../services/api";

const PASS_THRESHOLD = 60;

/* ── Status colour helper ─────────────────────────────────────────────────── */
const statusStyle = (st) => ({
  locked:    { bg: "#f1f5f9", color: "#94a3b8", border: "#e2e8f0"  },
  available: { bg: "#eff6ff", color: "#3b82f6", border: "#bfdbfe"  },
  active:    { bg: "#eef2ff", color: "#4338ca", border: "#c7d2fe"  },
  completed: { bg: "#dcfce7", color: "#15803d", border: "#bbf7d0"  },
  failed:    { bg: "#fee2e2", color: "#b91c1c", border: "#fecaca"  },
}[st] || { bg: "#f1f5f9", color: "#94a3b8", border: "#e2e8f0" });

export default function LevelPage() {
  const { courseId, levelNum } = useParams();
  const levelNumber = parseInt(levelNum, 10);
  const navigate    = useNavigate();

  const [course,        setCourse]        = useState(null);
  const [levelStatuses, setLevelStatuses] = useState([]);
  const [quiz,          setQuiz]          = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState(null);

  const [answers,    setAnswers]    = useState({});
  const [submitted,  setSubmitted]  = useState(false);
  const [result,     setResult]     = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [tab,        setTab]        = useState("notes");

  /* ── Load ─────────────────────────────────────────────────────────────── */
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [cRes, csRes, qRes] = await Promise.all([
          courseAPI.getById(courseId),
          levelRegAPI.getCourseStatus(courseId),
          quizAPI.getByCourse(courseId),
        ]);
        const allQuizzes = qRes.data.data  || [];
        const statuses   = csRes.data.data?.levelStatuses || [];
        const thisSt     = statuses.find((s) => s.levelNumber === levelNumber);

        if (!thisSt || (thisSt.status !== "active" && thisSt.status !== "completed")) {
          const msg =
            !thisSt || thisSt.status === "locked"    ? "This level is locked. Complete the previous level first."       :
            thisSt.status === "available"             ? "Register for this level before studying."                        :
            thisSt.status === "failed"                ? "You failed this level. Re-register from Available Courses."      :
                                                        "You do not have access to this level.";
          setError(msg);
          setLoading(false);
          return;
        }

        const levelQuiz = allQuizzes.find((q) => q.levelNumber === levelNumber)
          || (levelNumber === 1 && allQuizzes[0])
          || null;

        setCourse(cRes.data.data);
        setLevelStatuses(statuses);
        setQuiz(levelQuiz);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load level.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [courseId, levelNum]);

  /* ── Derived ───────────────────────────────────────────────────────────── */
  const level           = course?.levels?.find((l) => l.levelNumber === levelNumber);
  const levels          = course?.levels || [];
  const thisStatus      = levelStatuses.find((s) => s.levelNumber === levelNumber);
  const isCompleted     = thisStatus?.status === "completed";
  const nextLevelInfo   = levels.find((l) => l.levelNumber === levelNumber + 1);
  const nextLevelStatus = levelStatuses.find((s) => s.levelNumber === levelNumber + 1);

  /* ── Submit quiz ──────────────────────────────────────────────────────── */
  const handleSubmit = async () => {
    if (!quiz) return;
    const unanswered = quiz.questions.filter((q) => !answers[q._id]);
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
    } catch (err) {
      alert(err.response?.data?.message || "Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  /* ── YouTube embed ─────────────────────────────────────────────────────── */
  const getEmbedUrl = (url) => {
    if (!url) return null;
    const match = url.match(/(?:v=|youtu\.be\/)([^&?\s]+)/);
    return match ? `https://www.youtube-nocookie.com/embed/${match[1]}?rel=0&modestbranding=1` : null;
  };

  /* ── Loading / Error ───────────────────────────────────────────────────── */
  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", flexDirection: "column", gap: "1rem" }}>
      <div className="spinner" />
      <span style={{ color: "var(--text-muted)" }}>Loading level…</span>
    </div>
  );

  if (error) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "60vh", gap: "1.25rem", textAlign: "center", padding: "2rem" }}>
      <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#b91c1c" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
      </div>
      <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text)", margin: 0 }}>{error}</h2>
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", justifyContent: "center" }}>
        <button className="btn btn-primary" onClick={() => navigate("/students")}>Browse Courses</button>
        <button className="btn btn-ghost"   onClick={() => navigate(-1)}>Go Back</button>
      </div>
    </div>
  );

  if (!level) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "60vh", gap: "1rem" }}>
      <h2 style={{ color: "var(--text)" }}>Level {levelNumber} not found.</h2>
      <button className="btn btn-primary" onClick={() => navigate("/students")}>Back to Courses</button>
    </div>
  );

  const embedUrl = getEmbedUrl(level.videoUrl);
  const passed   = result?.passed ?? false;

  return (
    <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 1.5rem 3rem" }}>

      {/* ── Breadcrumb ──────────────────────────────────────────────────── */}
      <nav style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "1.25rem 0 1rem", flexWrap: "wrap" }}>
        <Link to="/my-courses" style={{ color: "var(--text-muted)", fontSize: "0.82rem", textDecoration: "none", fontWeight: 500 }}
          onMouseEnter={(e) => e.currentTarget.style.color = "var(--primary)"}
          onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-muted)"}>
          My Courses
        </Link>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
        <Link to={`/courses/${courseId}`} style={{ color: "var(--text-muted)", fontSize: "0.82rem", textDecoration: "none", fontWeight: 500, maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
          onMouseEnter={(e) => e.currentTarget.style.color = "var(--primary)"}
          onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-muted)"}>
          {course.title}
        </Link>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
        <span style={{ color: "var(--text)", fontSize: "0.82rem", fontWeight: 600 }}>
          Level {levelNumber}: {level.title}
        </span>
      </nav>

      {/* ── Main layout: content + sidebar ──────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "1.5rem", alignItems: "start" }}>

        {/* ════════════════ CONTENT COLUMN ════════════════ */}
        <div>
          {/* Level title card */}
          <div style={{ background: "var(--surface)", border: "1.5px solid var(--border)", borderRadius: 16, padding: "1.25rem 1.5rem", marginBottom: "1.25rem", boxShadow: "var(--shadow-xs)", display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.25rem", flexWrap: "wrap" }}>
                <span style={{ fontWeight: 800, fontSize: "0.75rem", color: "var(--primary)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Level {levelNumber}
                </span>
                {isCompleted && (
                  <span style={{ padding: "2px 10px", borderRadius: 999, fontSize: "0.7rem", fontWeight: 700, background: "#dcfce7", color: "#15803d" }}>
                    ✓ Completed
                  </span>
                )}
              </div>
              <h1 style={{ margin: 0, fontSize: "clamp(1.1rem, 2.5vw, 1.35rem)", fontWeight: 800, color: "var(--text)", lineHeight: 1.3 }}>
                {level.title}
              </h1>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: "0.25rem", marginBottom: "1.25rem", background: "var(--bg-secondary)", padding: "4px", borderRadius: 12, width: "fit-content" }}>
            <TabBtn active={tab === "notes"} onClick={() => setTab("notes")}>Study Notes</TabBtn>
            {quiz && (
              <TabBtn active={tab === "quiz"} onClick={() => setTab("quiz")}>
                Level Quiz {isCompleted && <span style={{ marginLeft: "0.35rem", padding: "1px 7px", borderRadius: 999, fontSize: "0.65rem", background: "#dcfce7", color: "#15803d", fontWeight: 700 }}>Passed</span>}
              </TabBtn>
            )}
          </div>

          {/* ─── NOTES TAB ──────────────────────────────────────────────── */}
          {tab === "notes" && (
            <div>
              {/* Video Player */}
              {embedUrl ? (
                <div style={{ borderRadius: 16, overflow: "hidden", marginBottom: "1.25rem", boxShadow: "0 4px 24px rgba(0,0,0,0.12)", background: "#000", position: "relative", paddingTop: "56.25%" }}>
                  <iframe
                    src={embedUrl}
                    title={level.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none" }}
                  />
                </div>
              ) : (
                <div style={{
                  borderRadius: 16, marginBottom: "1.25rem", padding: "2.5rem",
                  background: "linear-gradient(135deg,#f8fafc,#f1f5f9)", border: "2px dashed var(--border)",
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "0.75rem", textAlign: "center",
                }}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5">
                    <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                  </svg>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", fontWeight: 500, margin: 0 }}>No video available for this level.</p>
                </div>
              )}

              {/* Study Notes Card */}
              <div style={{ background: "var(--surface)", border: "1.5px solid var(--border)", borderRadius: 16, boxShadow: "var(--shadow-xs)", overflow: "hidden", marginBottom: "1.25rem" }}>
                <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "0.6rem", background: "var(--bg-secondary)" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                  </svg>
                  <span style={{ fontWeight: 700, fontSize: "0.875rem", color: "var(--text)" }}>Study Notes</span>
                </div>
                <div style={{ padding: "1.5rem", lineHeight: 1.75, color: "var(--text)", fontSize: "0.9rem" }}>
                  {level.studyNotes
                    ? level.studyNotes.split("\n").map((line, i) => (
                        line.trim() ? <p key={i} style={{ margin: "0 0 0.85rem" }}>{line}</p> : <br key={i} />
                      ))
                    : <p style={{ color: "var(--text-muted)", margin: 0 }}>No study notes available for this level.</p>
                  }
                </div>
              </div>

              {/* CTA to quiz */}
              {quiz && !isCompleted && (
                <div style={{ background: "linear-gradient(135deg,var(--primary) 0%,#6366f1 100%)", borderRadius: 16, padding: "1.5rem", textAlign: "center" }}>
                  <p style={{ color: "#e0e7ff", margin: "0 0 1rem", fontSize: "0.9rem" }}>
                    Ready to test your knowledge?
                  </p>
                  <button className="btn" style={{ background: "#fff", color: "var(--primary)", fontWeight: 700, border: "none" }}
                    onClick={() => setTab("quiz")}>
                    Take Level Quiz →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ─── QUIZ TAB ───────────────────────────────────────────────── */}
          {tab === "quiz" && quiz && (
            <div>
              {!submitted ? (
                <div>
                  {/* Quiz header */}
                  <div style={{ background: "var(--surface)", border: "1.5px solid var(--border)", borderRadius: 16, padding: "1.25rem 1.5rem", marginBottom: "1.25rem", boxShadow: "var(--shadow-xs)" }}>
                    <h2 style={{ margin: "0 0 0.25rem", fontSize: "1rem", fontWeight: 700, color: "var(--text)" }}>{quiz.title}</h2>
                    <div style={{ display: "flex", gap: "1.25rem", alignItems: "center", flexWrap: "wrap" }}>
                      <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{quiz.questions.length} questions</span>
                      <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Pass: {PASS_THRESHOLD}%</span>
                      <div style={{ flex: 1, minWidth: 120 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>
                          <span>Answered</span>
                          <span style={{ color: "var(--primary)", fontWeight: 600 }}>{Object.keys(answers).length} / {quiz.questions.length}</span>
                        </div>
                        <div style={{ height: 4, background: "var(--border)", borderRadius: 999 }}>
                          <div style={{ height: "100%", width: `${(Object.keys(answers).length / quiz.questions.length) * 100}%`, background: "var(--primary)", borderRadius: 999, transition: "width 0.3s" }} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Questions */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "1.5rem" }}>
                    {quiz.questions.map((q, qi) => (
                      <div key={q._id} style={{ background: "var(--surface)", border: `1.5px solid ${answers[q._id] ? "var(--primary)" : "var(--border)"}`, borderRadius: 16, padding: "1.25rem 1.5rem", boxShadow: "var(--shadow-xs)" }}>
                        <div style={{ display: "flex", gap: "0.85rem", marginBottom: "1rem" }}>
                          <div style={{ width: 28, height: 28, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "0.8rem", background: answers[q._id] ? "var(--primary)" : "var(--bg-secondary)", color: answers[q._id] ? "#fff" : "var(--text-muted)" }}>
                            {qi + 1}
                          </div>
                          <p style={{ margin: 0, fontWeight: 600, fontSize: "0.9rem", color: "var(--text)", lineHeight: 1.5, flex: 1 }}>{q.questionText}</p>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                          {q.options.map((opt) => {
                            const sel = answers[q._id] === opt;
                            return (
                              <label key={opt} style={{
                                display: "flex", alignItems: "center", gap: "0.75rem",
                                padding: "0.75rem 1rem", borderRadius: 10, cursor: "pointer",
                                border: `1.5px solid ${sel ? "var(--primary)" : "var(--border)"}`,
                                background: sel ? "var(--primary-light)" : "transparent",
                                transition: "all 0.15s",
                              }}>
                                <div style={{
                                  width: 18, height: 18, borderRadius: "50%", flexShrink: 0,
                                  border: `2px solid ${sel ? "var(--primary)" : "var(--border)"}`,
                                  background: sel ? "var(--primary)" : "transparent",
                                  display: "flex", alignItems: "center", justifyContent: "center",
                                }}>
                                  {sel && <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#fff" }} />}
                                </div>
                                <input type="radio" name={q._id} value={opt} checked={sel}
                                  onChange={() => setAnswers((prev) => ({ ...prev, [q._id]: opt }))}
                                  style={{ display: "none" }} />
                                <span style={{ fontSize: "0.875rem", color: sel ? "var(--primary)" : "var(--text)", fontWeight: sel ? 600 : 400 }}>{opt}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    className="btn btn-primary"
                    style={{ width: "100%", justifyContent: "center", padding: "0.875rem", fontSize: "0.95rem" }}
                    disabled={submitting || Object.keys(answers).length < quiz.questions.length}
                    onClick={handleSubmit}
                  >
                    {submitting ? <><span className="spinner-xs" style={{ marginRight: "0.5rem" }} />Submitting…</> : `Submit Quiz (${Object.keys(answers).length}/${quiz.questions.length} answered)`}
                  </button>
                </div>
              ) : (
                /* ── Result ─────────────────────────────────────────────── */
                <div style={{ background: "var(--surface)", border: "1.5px solid var(--border)", borderRadius: 20, padding: "2.5rem 2rem", boxShadow: "var(--shadow-xs)", textAlign: "center" }}>
                  <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>{passed ? "🎉" : "📚"}</div>
                  <h2 style={{ margin: "0 0 0.25rem", fontSize: "1.3rem", fontWeight: 800, color: "var(--text)" }}>
                    {passed ? "You passed!" : "Keep practising!"}
                  </h2>
                  <p style={{ color: "var(--text-muted)", margin: "0 0 2rem", fontSize: "0.875rem" }}>
                    {passed ? "Great work completing this level." : "Review the notes and try again."}
                  </p>

                  {/* Score circle */}
                  <div style={{ display: "flex", justifyContent: "center", marginBottom: "2rem" }}>
                    <div style={{
                      width: 110, height: 110, borderRadius: "50%",
                      border: `6px solid ${passed ? "var(--success)" : "var(--danger)"}`,
                      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                      background: passed ? "#f0fdf4" : "#fff5f5",
                    }}>
                      <span style={{ fontSize: "1.75rem", fontWeight: 800, color: passed ? "var(--success)" : "var(--danger)", lineHeight: 1 }}>{result.score}%</span>
                      <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 600 }}>Score</span>
                    </div>
                  </div>

                  {/* Stats */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem", marginBottom: "2rem" }}>
                    {[
                      { label: "Correct", value: `${result.correct} / ${result.total}` },
                      { label: "Pass Mark", value: `${PASS_THRESHOLD}%` },
                      { label: "Status", value: passed ? "Passed ✓" : "Failed ✗", color: passed ? "var(--success)" : "var(--danger)" },
                    ].map((s) => (
                      <div key={s.label} style={{ background: "var(--bg-secondary)", borderRadius: 12, padding: "0.9rem 0.5rem", border: "1px solid var(--border)" }}>
                        <div style={{ fontSize: "1rem", fontWeight: 800, color: s.color || "var(--text)" }}>{s.value}</div>
                        <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>{s.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", justifyContent: "center" }}>
                    {passed ? (
                      nextLevelInfo ? (
                        nextLevelStatus?.status === "active" ? (
                          <button className="btn btn-primary" onClick={() => navigate(`/courses/${courseId}/level/${nextLevelInfo.levelNumber}`)}>
                            Study Level {nextLevelInfo.levelNumber} →
                          </button>
                        ) : (
                          <button className="btn btn-primary" onClick={() => navigate("/students")}>
                            Register Level {nextLevelInfo.levelNumber} →
                          </button>
                        )
                      ) : (
                        <button className="btn btn-primary" onClick={() => navigate("/my-courses")}>🏆 Course Complete — My Courses</button>
                      )
                    ) : (
                      <>
                        <button className="btn btn-outline" onClick={() => { setAnswers({}); setSubmitted(false); setResult(null); setTab("notes"); }}>
                          Review Notes
                        </button>
                        <button className="btn btn-primary" onClick={() => navigate("/students")}>Re-register in Available Courses</button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ════════════════ SIDEBAR ════════════════ */}
        <aside style={{ position: "sticky", top: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>

          {/* Course info */}
          <div style={{ background: "var(--surface)", border: "1.5px solid var(--border)", borderRadius: 16, overflow: "hidden", boxShadow: "var(--shadow-xs)" }}>
            <div style={{ padding: "0.9rem 1.1rem", borderBottom: "1px solid var(--border)", background: "var(--bg-secondary)" }}>
              <p style={{ margin: 0, fontSize: "0.7rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Course</p>
              <p style={{ margin: "0.2rem 0 0", fontWeight: 700, fontSize: "0.875rem", color: "var(--text)", lineHeight: 1.35 }}>{course.title}</p>
            </div>

            {/* Level list */}
            <div style={{ padding: "0.75rem 0" }}>
              <p style={{ margin: "0 0 0.5rem", padding: "0 1.1rem", fontSize: "0.7rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Levels</p>
              {levels.map((lv) => {
                const st       = levelStatuses.find((s) => s.levelNumber === lv.levelNumber);
                const status   = st?.status || "locked";
                const isCur    = lv.levelNumber === levelNumber;
                const canClick = status === "active" || status === "completed" || status === "failed";
                const sc       = statusStyle(status);

                return (
                  <button
                    key={lv.levelNumber}
                    disabled={!canClick && !isCur}
                    onClick={() => canClick && !isCur && navigate(`/courses/${courseId}/level/${lv.levelNumber}`)}
                    style={{
                      display: "flex", alignItems: "center", gap: "0.65rem", width: "100%",
                      padding: "0.62rem 1.1rem", textAlign: "left",
                      background: isCur ? "var(--primary-light)" : "transparent",
                      border: "none", borderLeft: isCur ? "3px solid var(--primary)" : "3px solid transparent",
                      cursor: (canClick && !isCur) ? "pointer" : isCur ? "default" : "not-allowed",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) => { if (canClick && !isCur) e.currentTarget.style.background = "var(--bg-secondary)"; }}
                    onMouseLeave={(e) => { if (!isCur) e.currentTarget.style.background = "transparent"; }}
                  >
                    <div style={{ width: 26, height: 26, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "0.72rem", background: isCur ? "var(--primary)" : sc.bg, color: isCur ? "#fff" : sc.color, border: `1.5px solid ${isCur ? "var(--primary)" : sc.border}` }}>
                      {status === "completed" ? "✓" : status === "failed" ? "✗" : status === "locked" ? "🔒" : lv.levelNumber}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "0.8rem", fontWeight: isCur ? 700 : 500, color: isCur ? "var(--primary)" : "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {lv.title}
                      </div>
                      {st?.score != null && (
                        <div style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>{st.score}%</div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick links */}
          <div style={{ background: "var(--surface)", border: "1.5px solid var(--border)", borderRadius: 16, padding: "1rem 1.1rem", boxShadow: "var(--shadow-xs)" }}>
            <p style={{ margin: "0 0 0.65rem", fontSize: "0.7rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Quick Links</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              <Link to={`/courses/${courseId}`} style={{ fontSize: "0.82rem", color: "var(--text)", textDecoration: "none", display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.45rem 0.5rem", borderRadius: 8, fontWeight: 500 }}
                onMouseEnter={(e) => { e.currentTarget.style.color = "var(--primary)"; e.currentTarget.style.background = "var(--primary-light)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text)"; e.currentTarget.style.background = "transparent"; }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>
                Course Details
              </Link>
              <Link to="/my-courses" style={{ fontSize: "0.82rem", color: "var(--text)", textDecoration: "none", display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.45rem 0.5rem", borderRadius: 8, fontWeight: 500 }}
                onMouseEnter={(e) => { e.currentTarget.style.color = "var(--primary)"; e.currentTarget.style.background = "var(--primary-light)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text)"; e.currentTarget.style.background = "transparent"; }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>
                My Courses
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

/* ── Tab button helper ───────────────────────────────────────────────────── */
function TabBtn({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "0.5rem 1.1rem", borderRadius: 9, border: "none", cursor: "pointer",
        fontWeight: 600, fontSize: "0.855rem", transition: "all 0.15s",
        background: active ? "var(--surface)" : "transparent",
        color: active ? "var(--primary)" : "var(--text-muted)",
        boxShadow: active ? "0 1px 6px rgba(0,0,0,0.08)" : "none",
      }}
    >
      {children}
    </button>
  );
}