import { useEffect, useState, useRef } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { quizAPI } from "../services/api.js";

export default function QuizPage() {
  const { quizId }      = useParams();
  const [searchParams]  = useSearchParams();
  const courseId        = searchParams.get("courseId");

  const [quiz,       setQuiz]       = useState(null);
  const [answers,    setAnswers]    = useState({});
  const [loading,    setLoading]    = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result,     setResult]     = useState(null);
  const [error,      setError]      = useState("");

  const startTime = useRef(Date.now());

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const { data } = await quizAPI.getById(quizId);
        setQuiz(data.data);
      } catch (err) {
        setError("Failed to load quiz.");
      } finally {
        setLoading(false);
      }
    };
    fetchQuiz();
  }, [quizId]);

  const handleSelect = (questionId, option) => {
    if (result) return;
    setAnswers((prev) => ({ ...prev, [questionId]: option }));
  };

  const handleSubmit = async () => {
    if (!courseId) return setError("Course context missing.");
    const unanswered = quiz.questions.filter((q) => !answers[q._id]);
    if (unanswered.length > 0)
      return setError(`Please answer all ${unanswered.length} remaining question(s).`);

    const timeTakenMs = Date.now() - startTime.current;
    const timeTaken   = Math.max(1, Math.round(timeTakenMs / 60000));

    setSubmitting(true);
    setError("");
    try {
      const { data } = await quizAPI.submit({ quizId, courseId, answers, timeTaken });
      setResult(data.data);
    } catch (err) {
      setError(err.response?.data?.message || "Submission failed.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="spinner-wrap">
      <div className="spinner" />
      <span>Loading quiz…</span>
    </div>
  );
  if (error && !quiz) return <div className="page"><div className="alert alert-error">{error}</div></div>;
  if (!quiz)          return <div className="page"><div className="alert alert-error">Quiz not found.</div></div>;

  const answeredCount = Object.keys(answers).length;
  const totalQ        = quiz.questions.length;
  const progress      = Math.round((answeredCount / totalQ) * 100);

  return (
    <div className="page">
      {/* Header */}
      <div style={{ marginBottom: "1.5rem" }}>
        <Link to={courseId ? `/courses/${courseId}` : "/"} className="btn btn-ghost btn-sm">
          ← Back to Course
        </Link>
      </div>

      <div className="page-header">
        <h1 className="page-title">{quiz.title}</h1>
        <p className="page-subtitle">{totalQ} questions &nbsp;·&nbsp; {quiz.totalMarks} total marks</p>
      </div>

      {/* Progress bar */}
      {!result && (
        <div style={{ marginBottom: "1.75rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem", fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 600 }}>
            <span>Progress</span>
            <span>{answeredCount} / {totalQ} answered</span>
          </div>
          <div style={{ height: "6px", background: "var(--border)", borderRadius: "999px", overflow: "hidden" }}>
            <div style={{
              height: "100%",
              width: `${progress}%`,
              background: "var(--primary)",
              borderRadius: "999px",
              transition: "width 0.3s ease",
            }} />
          </div>
        </div>
      )}

      {error && <div className="alert alert-error">{error}</div>}

      {/* Questions */}
      {quiz.questions.map((q, idx) => (
        <div key={q._id} className="quiz-question">
          <h3>
            <span className="quiz-question-num">{idx + 1}</span>
            {q.questionText}
          </h3>
          {q.options.map((opt) => {
            const sel       = answers[q._id] === opt;
            const isCorrect = result && opt === q.correctAnswer;
            const isWrong   = result && sel && opt !== q.correctAnswer;

            let extraStyle = {};
            if (isCorrect) extraStyle = { borderColor: "var(--success)", background: "var(--success-light)", color: "#065f46" };
            if (isWrong)   extraStyle = { borderColor: "var(--danger)",  background: "var(--danger-light)",  color: "#991b1b" };

            return (
              <label
                key={opt}
                className={`quiz-option${sel ? " selected" : ""}`}
                style={extraStyle}
                onClick={() => handleSelect(q._id, opt)}
              >
                <input
                  type="radio"
                  name={q._id}
                  value={opt}
                  checked={sel}
                  onChange={() => handleSelect(q._id, opt)}
                  disabled={!!result}
                />
                <span style={{ flex: 1 }}>{opt}</span>
                {isCorrect && <span style={{ fontWeight: 700, fontSize: "0.8rem" }}>✓ Correct</span>}
                {isWrong   && <span style={{ fontWeight: 700, fontSize: "0.8rem" }}>✗ Wrong</span>}
              </label>
            );
          })}
        </div>
      ))}

      {/* Submit */}
      {!result && (
        <button
          className="btn btn-success btn-lg"
          onClick={handleSubmit}
          disabled={submitting || answeredCount < totalQ}
          style={{ marginTop: "0.5rem" }}
        >
          {submitting ? "Submitting…" : `Submit Quiz (${answeredCount}/${totalQ})`}
        </button>
      )}

      {/* Result */}
      {result && (
        <div className="result-box">
          <div className="result-box-header">
            <div className="result-score-circle">
              <span className="result-score-num">{result.quizScore}%</span>
              <span className="result-score-pct">{result.correct}/{result.total}</span>
            </div>
            <div>
              <h2>Quiz Complete!</h2>
              <p style={{ color: "#166534", fontSize: "0.875rem", marginTop: "0.25rem" }}>
                Great job completing this quiz.
              </p>
            </div>
          </div>
          <div className="result-rows">
            <div className="result-row">
              <span>Recommended Level</span>
              <span className={`badge diff-${result.recommendedLevel}`}>{result.recommendedLevel}</span>
            </div>
            <div className="result-row">
              <span>Predicted Performance</span>
              <span className={`badge badge-${result.predictedPerformance === "High" ? "green" : result.predictedPerformance === "Medium" ? "yellow" : "red"}`}>
                {result.predictedPerformance}
              </span>
            </div>
            <div className="result-row">
              <span>Dropout Risk</span>
              <span className={`badge badge-${result.dropoutRisk === "Yes" ? "red" : "green"}`}>
                {result.dropoutRisk}
              </span>
            </div>
          </div>
          <div style={{ marginTop: "1.5rem", display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <Link to="/" className="btn btn-primary btn-sm">Go to Dashboard</Link>
            {courseId && (
              <Link to={`/courses/${courseId}`} className="btn btn-ghost btn-sm">Back to Course</Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
