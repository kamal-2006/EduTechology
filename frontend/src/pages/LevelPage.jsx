import { useState, useEffect }           from "react";
import { useParams, useNavigate, Link }  from "react-router-dom";
import { courseAPI, quizAPI, levelRegAPI } from "../services/api";

const PASS_THRESHOLD = 60; // % required to pass a level

export default function LevelPage() {
  const { courseId, levelNum } = useParams();
  const levelNumber            = parseInt(levelNum, 10);
  const navigate               = useNavigate();

  // ── Data states ──────────────────────────────────────────────────────────────
  const [course,        setCourse]        = useState(null);
  const [levelStatuses, setLevelStatuses] = useState([]); // from levelRegAPI.getCourseStatus
  const [quiz,          setQuiz]          = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState(null);

  // ── Quiz interaction states ─────────────────────────────────────────────────
  const [answers,    setAnswers]    = useState({});
  const [submitted,  setSubmitted]  = useState(false);
  const [result,     setResult]     = useState(null);    // { score, correct, total, passed }
  const [submitting, setSubmitting] = useState(false);
  const [tab,        setTab]        = useState("notes"); // "notes" | "quiz"

  // ── Load data ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [cRes, csRes, qRes] = await Promise.all([
          courseAPI.getById(courseId),
          levelRegAPI.getCourseStatus(courseId),
          quizAPI.getByCourse(courseId),
        ]);

        const allQuizzes  = qRes.data.data  || [];
        const statuses    = csRes.data.data?.levelStatuses || [];
        const thisSt      = statuses.find((s) => s.levelNumber === levelNumber);

        // Must be registered (active or completed) to access this page
        if (!thisSt || (thisSt.status !== "active" && thisSt.status !== "completed")) {
          const msg =
            !thisSt || thisSt.status === "locked"
              ? "This level is locked. Complete the previous level first."
              : thisSt.status === "available"
              ? "You need to register for this level before studying. Go to Available Courses."
              : thisSt.status === "failed"
              ? "You failed this level. Re-register from Available Courses to try again."
              : "You do not have access to this level.";
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

  // ── Derived values ────────────────────────────────────────────────────────────
  const level           = course?.levels?.find((l) => l.levelNumber === levelNumber);
  const levels          = course?.levels || [];
  const thisStatus      = levelStatuses.find((s) => s.levelNumber === levelNumber);
  const isCompleted     = thisStatus?.status === "completed";
  const nextLevelInfo   = levels.find((l) => l.levelNumber === levelNumber + 1);
  const nextLevelStatus = levelStatuses.find((s) => s.levelNumber === levelNumber + 1);

  // ── Submit quiz ───────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!quiz) return;
    const unanswered = quiz.questions.filter((q) => !answers[q._id]);
    if (unanswered.length > 0) {
      alert(`Please answer all ${unanswered.length} remaining question(s).`);
      return;
    }
    setSubmitting(true);
    try {
      const res   = await levelRegAPI.submitQuiz(courseId, levelNumber, answers, 5);
      const data  = res.data.data;   // { score, passed, message }
      const score = data?.score ?? 0;
      const total = quiz.questions.length;
      const correct = Math.round((score / 100) * total);
      setResult({ score, correct, total, passed: data?.passed ?? score >= PASS_THRESHOLD });
      setSubmitted(true);
      // Refresh level statuses to reflect updated completion
      const csRes = await levelRegAPI.getCourseStatus(courseId);
      setLevelStatuses(csRes.data.data?.levelStatuses || []);
    } catch (err) {
      console.error("Submit error:", err);
      alert(err.response?.data?.message || "Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── YouTube embed helper ──────────────────────────────────────────────────────
  const getEmbedUrl = (url) => {
    if (!url) return null;
    const match = url.match(/(?:v=|youtu\.be\/)([^&?\s]+)/);
    return match ? `https://www.youtube-nocookie.com/embed/${match[1]}` : null;
  };

  // ── Loading / Error states ────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="page-loading">
        <span className="spinner" />
        <p>Loading level...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-error">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <h2>{error}</h2>
        <button className="btn btn-primary" onClick={() => navigate("/students")}>
          Back to Available Courses
        </button>
      </div>
    );
  }

  if (!level) {
    return (
      <div className="page-error">
        <h2>Level {levelNumber} not found.</h2>
        <button className="btn btn-primary" onClick={() => navigate("/students")}>Back to Courses</button>
      </div>
    );
  }

  const embedUrl = getEmbedUrl(level.videoUrl);
  const passed   = result?.passed ?? false;

  return (
    <div className="level-page">
      {/* Breadcrumb */}
      <nav className="breadcrumb">
        <Link to="/students">My Courses</Link>
        <span className="breadcrumb-sep">›</span>
        <Link to={`/courses/${courseId}`}>{course.title}</Link>
        <span className="breadcrumb-sep">›</span>
        <span>Level {levelNumber}: {level.title}</span>
      </nav>

      {/* Level Header */}
      <div className="level-header">
        <div className="level-header-left">
          <div className="level-num-badge">Level {levelNumber}</div>
          <h1 className="level-title">{level.title}</h1>
          <p className="level-course-name">{course.title}</p>
        </div>
        <div className="level-header-right">
          <div className="levels-row">
            {levels.map((lv) => {
              const st        = levelStatuses.find((s) => s.levelNumber === lv.levelNumber);
              const lDone     = st?.status === "completed";
              const lFailed   = st?.status === "failed";
              const lActive   = st?.status === "active";
              const lCanClick = lActive || lDone || lFailed;
              return (
                <button
                  key={lv.levelNumber}
                  className={`level-dot${lv.levelNumber === levelNumber ? " active" : lDone ? " done" : lFailed ? " failed" : lActive ? " unlocked" : " locked"}`}
                  title={lv.title}
                  onClick={() => lCanClick ? navigate(`/courses/${courseId}/level/${lv.levelNumber}`) : null}
                  disabled={!lCanClick && lv.levelNumber !== levelNumber}
                >
                  {lDone ? "✓" : lFailed ? "✗" : lv.levelNumber}
                </button>
              );
            })}
          </div>
          {isCompleted && <span className="level-completed-tag">✓ Completed</span>}
        </div>
      </div>

      {/* Tab bar */}
      <div className="level-tabs">
        <button
          className={`level-tab${tab === "notes" ? " active" : ""}`}
          onClick={() => setTab("notes")}
        >
          Study Notes
        </button>
        {quiz && (
          <button
            className={`level-tab${tab === "quiz" ? " active" : ""}`}
            onClick={() => setTab("quiz")}
          >
            Level Quiz
            {isCompleted && <span className="tab-badge passed">Passed</span>}
          </button>
        )}
      </div>

      {/* NOTES TAB */}
      {tab === "notes" && (
        <div className="level-content">
          {embedUrl && (
            <div className="level-video-wrap">
              <iframe
                src={embedUrl}
                title={level.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}

          <div className="study-notes-card">
            <div className="study-notes-header">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10 9 9 9 8 9"/>
              </svg>
              Study Notes
            </div>
            <div className="study-notes-body">
              {level.studyNotes
                ? level.studyNotes.split("\n").map((line, i) => <p key={i}>{line}</p>)
                : <p style={{ color: "var(--text-muted)" }}>No study notes for this level.</p>}
            </div>
          </div>

          {quiz && !isCompleted && (
            <div className="level-cta">
              <p>Ready to test your knowledge?</p>
              <button className="btn btn-primary" onClick={() => setTab("quiz")}>
                Take Level Quiz →
              </button>
            </div>
          )}
        </div>
      )}

      {/* QUIZ TAB */}
      {tab === "quiz" && quiz && (
        <div className="level-content">
          {!submitted ? (
            <div className="level-quiz">
              <div className="level-quiz-header">
                <h2>{quiz.title}</h2>
                <p>{quiz.questions.length} questions · Pass score: {PASS_THRESHOLD}%</p>
              </div>

              <div className="quiz-meta-bar">
                <span>{Object.keys(answers).length}/{quiz.questions.length} answered</span>
                <div className="mini-progress-bar">
                  <div
                    className="mini-progress-fill"
                    style={{ width: `${(Object.keys(answers).length / quiz.questions.length) * 100}%` }}
                  />
                </div>
              </div>

              {quiz.questions.map((q, qi) => (
                <div className="quiz-question" key={q._id}>
                  <div className="quiz-question-num">{qi + 1}</div>
                  <div className="quiz-question-body">
                    <p className="quiz-question-text">{q.questionText}</p>
                    <div className="quiz-options">
                      {q.options.map((opt) => (
                        <label
                          key={opt}
                          className={`quiz-option${answers[q._id] === opt ? " selected" : ""}`}
                        >
                          <input
                            type="radio"
                            name={q._id}
                            value={opt}
                            checked={answers[q._id] === opt}
                            onChange={() => setAnswers((prev) => ({ ...prev, [q._id]: opt }))}
                          />
                          {opt}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              ))}

              <div className="quiz-submit-row">
                <button
                  className="btn btn-primary btn-lg"
                  disabled={submitting || Object.keys(answers).length < quiz.questions.length}
                  onClick={handleSubmit}
                >
                  {submitting ? <><span className="spinner-xs" /> Submitting...</> : "Submit Quiz"}
                </button>
              </div>
            </div>
          ) : (
            <div className="result-box">
              <div className="result-box-header">
                {passed ? "🎉 You passed!" : "📚 Keep practising!"}
              </div>

              <div className={`result-score-circle ${passed ? "pass" : "fail"}`}>
                <span className="result-score-num">{result.score}%</span>
                <span className="result-score-label">Score</span>
              </div>

              <div className="result-rows">
                <div className="result-row">
                  <span>Correct Answers</span>
                  <strong>{result.correct} / {result.total}</strong>
                </div>
                <div className="result-row">
                  <span>Pass Threshold</span>
                  <strong>{PASS_THRESHOLD}%</strong>
                </div>
                <div className="result-row">
                  <span>Status</span>
                  <strong style={{ color: passed ? "var(--success)" : "var(--danger)" }}>
                    {passed ? "Passed ✓" : "Failed ✗"}
                  </strong>
                </div>
              </div>

              <div className="result-actions">
                {passed ? (
                  nextLevelInfo ? (
                    nextLevelStatus?.status === "active" ? (
                      <button
                        className="btn btn-primary btn-lg"
                        onClick={() => navigate(`/courses/${courseId}/level/${nextLevelInfo.levelNumber}`)}
                      >
                        Study Level {nextLevelInfo.levelNumber}: {nextLevelInfo.title} →
                      </button>
                    ) : (
                      <button
                        className="btn btn-primary btn-lg"
                        onClick={() => navigate("/students")}
                      >
                        Register Level {nextLevelInfo.levelNumber} in Available Courses →
                      </button>
                    )
                  ) : (
                    <button className="btn btn-primary btn-lg" onClick={() => navigate("/students")}>
                      🏆 Course Complete! Back to My Courses
                    </button>
                  )
                ) : (
                  <>
                    <button
                      className="btn btn-outline"
                      onClick={() => {
                        setAnswers({});
                        setSubmitted(false);
                        setResult(null);
                        setTab("notes");
                      }}
                    >
                      Review Notes
                    </button>
                    <button
                      className="btn btn-primary"
                      onClick={() => navigate("/students")}
                    >
                      Re-register in Available Courses
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
