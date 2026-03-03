import { useEffect, useState, useRef } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { quizAPI } from "../services/api.js";

export default function QuizPage() {
  const { quizId }      = useParams();
  const [searchParams]  = useSearchParams();
  const courseId        = searchParams.get("courseId");

  const [quiz,     setQuiz]     = useState(null);
  const [answers,  setAnswers]  = useState({});
  const [loading,  setLoading]  = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result,   setResult]   = useState(null);
  const [error,    setError]    = useState("");

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
    if (result) return; // locked after submission
    setAnswers((prev) => ({ ...prev, [questionId]: option }));
  };

  const handleSubmit = async () => {
    if (!courseId) return setError("Course context missing.");
    const unanswered = quiz.questions.filter((q) => !answers[q._id]);
    if (unanswered.length > 0) {
      return setError(`Please answer all ${unanswered.length} remaining question(s).`);
    }

    const timeTakenMs = Date.now() - startTime.current;
    const timeTaken   = Math.max(1, Math.round(timeTakenMs / 60000)); // minutes

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

  if (loading) return <div className="spinner-wrap"><div className="spinner" /></div>;
  if (error && !quiz) return <div className="page"><div className="alert alert-error">{error}</div></div>;
  if (!quiz)          return <div className="page"><div className="alert alert-error">Quiz not found.</div></div>;

  return (
    <div className="page">
      <div style={{ marginBottom: "1.5rem" }}>
        <Link to={courseId ? `/courses/${courseId}` : "/"} className="btn btn-outline btn-sm">
          ← Back to Course
        </Link>
      </div>

      <h1 className="page-title">{quiz.title}</h1>
      <p style={{ color: "#4a5568", marginBottom: "2rem" }}>
        {quiz.questions.length} questions · {quiz.totalMarks} total marks
      </p>

      {error && <div className="alert alert-error">{error}</div>}

      {/* ── Questions ─────────────────────────────────────────────────────── */}
      {quiz.questions.map((q, idx) => (
        <div key={q._id} className="card quiz-question">
          <h3>Q{idx + 1}. {q.questionText}</h3>
          {q.options.map((opt) => {
            const sel       = answers[q._id] === opt;
            const isCorrect = result && opt === q.correctAnswer;
            const isWrong   = result && sel && opt !== q.correctAnswer;

            let style = {};
            if (isCorrect) style = { borderColor: "#276749", background: "#f0fff4" };
            if (isWrong)   style = { borderColor: "#c53030", background: "#fff5f5" };

            return (
              <label
                key={opt}
                className={`quiz-option${sel ? " selected" : ""}`}
                style={style}
                onClick={() => handleSelect(q._id, opt)}
              >
                <input
                  type="radio"
                  name={q._id}
                  value={opt}
                  checked={sel}
                  onChange={() => handleSelect(q._id, opt)}
                  disabled={!!result}
                  style={{ accentColor: "#2b6cb0" }}
                />
                {opt}
                {isCorrect && <span style={{ marginLeft: "auto", color: "#276749", fontWeight: 700 }}>✓ Correct</span>}
                {isWrong   && <span style={{ marginLeft: "auto", color: "#c53030", fontWeight: 700 }}>✗ Wrong</span>}
              </label>
            );
          })}
        </div>
      ))}

      {/* ── Submit ────────────────────────────────────────────────────────── */}
      {!result && (
        <button
          className="btn btn-success"
          onClick={handleSubmit}
          disabled={submitting}
          style={{ marginTop: "0.5rem" }}
        >
          {submitting ? "Submitting…" : "Submit Quiz"}
        </button>
      )}

      {/* ── Result ────────────────────────────────────────────────────────── */}
      {result && (
        <div className="result-box">
          <h2>🎉 Quiz Complete!</h2>
          <div className="result-row">
            <span>Score</span>
            <span>{result.quizScore}% ({result.correct}/{result.total} correct)</span>
          </div>
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
          <div style={{ marginTop: "1.25rem", display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <Link to="/" className="btn btn-primary btn-sm">Go to Dashboard</Link>
            {courseId && (
              <Link to={`/courses/${courseId}`} className="btn btn-outline btn-sm">Back to Course</Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
