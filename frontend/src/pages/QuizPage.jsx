import { useEffect, useState, useRef } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { quizAPI } from "../services/api.js";

/* ── Global Styles ──────────────────────────────────────────── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Nunito:wght@300;400;500;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #060d1a; font-family: 'Nunito', sans-serif; }
  @keyframes spin         { to { transform: rotate(360deg); } }
  @keyframes fadeSlideUp  { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fadeIn       { from{opacity:0} to{opacity:1} }
  @keyframes glowPulse    { 0%,100%{box-shadow:0 0 14px rgba(94,234,212,0.2)} 50%{box-shadow:0 0 28px rgba(94,234,212,0.45)} }
  @keyframes scoreReveal  { from{stroke-dashoffset:var(--full)} to{stroke-dashoffset:var(--offset)} }
  @keyframes popIn        { 0%{transform:scale(0.85);opacity:0} 60%{transform:scale(1.04)} 100%{transform:scale(1);opacity:1} }
  @keyframes shimmer      { 0%{background-position:-200% center} 100%{background-position:200% center} }
  ::-webkit-scrollbar       { width: 5px; }
  ::-webkit-scrollbar-track { background: rgba(255,255,255,0.02); }
  ::-webkit-scrollbar-thumb { background: rgba(94,234,212,0.18); border-radius: 999px; }

  .quiz-option {
    display: flex; align-items: center; gap: 0.875rem;
    padding: 0.9rem 1.125rem; border-radius: 12px; cursor: pointer;
    background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08);
    color: rgba(203,213,225,0.75); font-family: 'Nunito', sans-serif; font-size: 0.9rem;
    transition: all 0.2s; position: relative; overflow: hidden; user-select: none;
  }
  .quiz-option:hover:not(.locked) {
    border-color: rgba(94,234,212,0.3) !important;
    background: rgba(94,234,212,0.05) !important;
    color: rgba(226,232,240,0.9) !important;
  }
  .quiz-option.selected {
    border-color: rgba(99,102,241,0.5) !important;
    background: rgba(99,102,241,0.1) !important;
    color: #c7d2fe !important;
  }
  .quiz-option.correct {
    border-color: rgba(16,185,129,0.5) !important;
    background: rgba(16,185,129,0.1) !important;
    color: #6ee7b7 !important;
  }
  .quiz-option.wrong {
    border-color: rgba(248,113,113,0.45) !important;
    background: rgba(248,113,113,0.08) !important;
    color: #fca5a5 !important;
  }
  .quiz-option.locked { cursor: default; }
  .submit-btn { transition: all 0.22s; }
  .submit-btn:hover:not(:disabled) { opacity: 0.88; transform: translateY(-2px); box-shadow: 0 8px 24px rgba(20,184,166,0.32) !important; }
  .back-link:hover { border-color: rgba(94,234,212,0.3) !important; color: #5eead4 !important; }
  .result-action:hover { opacity: 0.85; transform: translateY(-1px); }
`;

/* ── Navbar ─────────────────────────────────────────────────── */
function Navbar() {
  return (
    <div style={{ background:"rgba(6,16,31,0.96)", borderBottom:"1px solid rgba(94,234,212,0.07)", padding:"0 1.75rem", display:"flex", alignItems:"center", height:"60px", position:"sticky", top:0, zIndex:50, backdropFilter:"blur(14px)" }}>
      <div style={{ display:"flex", alignItems:"center", gap:"0.625rem" }}>
        <div style={{ width:"30px", height:"30px", borderRadius:"8px", background:"linear-gradient(135deg,#14b8a6,#6366f1)", display:"flex", alignItems:"center", justifyContent:"center", animation:"glowPulse 3s ease-in-out infinite" }}>
          <svg width="17" height="17" fill="none" viewBox="0 0 48 48"><path d="M4 42.4379C4 42.4379 14.0962 36.0744 24 41.1692C35.0664 46.8624 44 42.2078 44 42.2078L44 7.01134C44 7.01134 35.068 11.6577 24.0031 5.96913C14.0971 0.876274 4 7.27094 4 7.27094L4 42.4379Z" fill="white"/></svg>
        </div>
        <span style={{ color:"white", fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:800, fontSize:"1.0625rem", letterSpacing:"-0.02em" }}>EduAI</span>
      </div>
    </div>
  );
}

/* ── Option radio dot ───────────────────────────────────────── */
function RadioDot({ selected, correct, wrong }) {
  const color = correct ? "#10b981" : wrong ? "#f87171" : selected ? "#818cf8" : "rgba(148,163,184,0.25)";
  const bg    = correct ? "rgba(16,185,129,0.2)" : wrong ? "rgba(248,113,113,0.15)" : selected ? "rgba(129,140,248,0.2)" : "transparent";
  return (
    <div style={{ width:"18px", height:"18px", borderRadius:"50%", border:`2px solid ${color}`, background:bg, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", transition:"all 0.18s" }}>
      {(selected || correct) && <div style={{ width:"7px", height:"7px", borderRadius:"50%", background:color }} />}
    </div>
  );
}

/* ── Main ───────────────────────────────────────────────────── */
export default function QuizPage() {
  const { quizId }     = useParams();
  const [searchParams] = useSearchParams();
  const courseId       = searchParams.get("courseId");

  const [quiz,       setQuiz]       = useState(null);
  const [answers,    setAnswers]    = useState({});
  const [loading,    setLoading]    = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result,     setResult]     = useState(null);
  const [error,      setError]      = useState("");
  const startTime = useRef(Date.now());

  useEffect(() => {
    quizAPI.getById(quizId)
      .then(({ data }) => setQuiz(data.data))
      .catch(() => setError("Failed to load quiz."))
      .finally(() => setLoading(false));
  }, [quizId]);

  const handleSelect = (questionId, option) => {
    if (result) return;
    setAnswers(prev => ({ ...prev, [questionId]: option }));
  };

  const handleSubmit = async () => {
    if (!courseId) return setError("Course context missing.");
    const unanswered = quiz.questions.filter(q => !answers[q._id]);
    if (unanswered.length > 0) return setError(`Please answer all ${unanswered.length} remaining question(s).`);
    const timeTaken = Math.max(1, Math.round((Date.now() - startTime.current) / 60000));
    setSubmitting(true); setError("");
    try {
      const { data } = await quizAPI.submit({ quizId, courseId, answers, timeTaken });
      setResult(data.data);
    } catch (err) {
      setError(err.response?.data?.message || "Submission failed.");
    } finally { setSubmitting(false); }
  };

  /* ── Loading ──────────────────────────────────────────────── */
  if (loading) return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"100vh", background:"#060d1a", gap:"1rem" }}>
      <style>{STYLES}</style>
      <div style={{ width:"40px", height:"40px", border:"3px solid rgba(94,234,212,0.1)", borderTopColor:"#5eead4", borderRadius:"50%", animation:"spin 0.8s linear infinite" }} />
      <span style={{ color:"rgba(148,163,184,0.5)", fontSize:"0.875rem", fontFamily:"'Nunito',sans-serif" }}>Loading quiz…</span>
    </div>
  );

  /* ── Error / not found ────────────────────────────────────── */
  if (error && !quiz) return (
    <div style={{ minHeight:"100vh", background:"#060d1a" }}>
      <style>{STYLES}</style>
      <Navbar />
      <div style={{ maxWidth:"520px", margin:"4rem auto", padding:"0 1.5rem", textAlign:"center" }}>
        <div style={{ fontSize:"3rem", marginBottom:"1rem" }}>⚠️</div>
        <p style={{ color:"#fca5a5", fontFamily:"'Nunito',sans-serif", fontSize:"0.9rem" }}>{error || "Quiz not found."}</p>
      </div>
    </div>
  );

  const answeredCount = Object.keys(answers).length;
  const totalQ        = quiz.questions.length;
  const progress      = Math.round((answeredCount / totalQ) * 100);

  return (
    <div style={{ minHeight:"100vh", background:"#060d1a" }}>
      <style>{STYLES}</style>
      <Navbar />

      <div style={{ maxWidth:"760px", margin:"0 auto", padding:"1.75rem 1.5rem 5rem", animation:"fadeSlideUp 0.45s ease both" }}>

        {/* Back link */}
        <Link to={courseId ? `/courses/${courseId}` : "/"} className="back-link" style={{ display:"inline-flex", alignItems:"center", gap:"0.4rem", padding:"0.45rem 0.875rem", background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:"9px", color:"rgba(148,163,184,0.55)", fontSize:"0.78rem", fontWeight:700, textDecoration:"none", fontFamily:"'Plus Jakarta Sans',sans-serif", marginBottom:"1.5rem", transition:"all 0.2s" }}>
          ← Back to Course
        </Link>

        {/* Quiz header */}
        <div style={{ marginBottom:"1.75rem" }}>
          <div style={{ display:"flex", alignItems:"center", gap:"0.5rem", marginBottom:"0.4rem" }}>
            <div style={{ height:"14px", width:"3px", background:"linear-gradient(180deg,#5eead4,#6366f1)", borderRadius:"999px" }} />
            <p style={{ fontSize:"0.65rem", fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:700, color:"rgba(94,234,212,0.65)", letterSpacing:"0.12em", textTransform:"uppercase", margin:0 }}>Quiz</p>
          </div>
          <h1 style={{ fontSize:"1.5rem", fontWeight:800, color:"white", fontFamily:"'Plus Jakarta Sans',sans-serif", letterSpacing:"-0.02em", marginBottom:"0.35rem" }}>{quiz.title}</h1>
          <div style={{ display:"flex", gap:"0.75rem", alignItems:"center" }}>
            <span style={{ fontSize:"0.8rem", color:"rgba(148,163,184,0.5)", fontFamily:"'Nunito',sans-serif" }}>{totalQ} questions</span>
            <span style={{ width:"3px", height:"3px", borderRadius:"50%", background:"rgba(148,163,184,0.25)" }} />
            <span style={{ fontSize:"0.8rem", color:"rgba(148,163,184,0.5)", fontFamily:"'Nunito',sans-serif" }}>{quiz.totalMarks} total marks</span>
          </div>
        </div>

        {/* Progress bar */}
        {!result && (
          <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:"14px", padding:"1rem 1.25rem", marginBottom:"1.75rem" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"0.625rem" }}>
              <span style={{ fontSize:"0.72rem", fontWeight:700, color:"rgba(148,163,184,0.5)", fontFamily:"'Plus Jakarta Sans',sans-serif", textTransform:"uppercase", letterSpacing:"0.08em" }}>Progress</span>
              <div style={{ display:"flex", alignItems:"center", gap:"0.5rem" }}>
                <span style={{ fontSize:"0.8rem", fontWeight:700, color: answeredCount === totalQ ? "#5eead4" : "rgba(148,163,184,0.55)", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                  {answeredCount} / {totalQ} answered
                </span>
                {answeredCount === totalQ && <span style={{ fontSize:"0.7rem", color:"#5eead4" }}>✓ Ready to submit</span>}
              </div>
            </div>
            <div style={{ height:"5px", background:"rgba(255,255,255,0.06)", borderRadius:"999px", overflow:"hidden" }}>
              <div style={{ height:"100%", width:`${progress}%`, background: progress === 100 ? "linear-gradient(90deg,#14b8a6,#5eead4)" : "linear-gradient(90deg,#6366f1,#818cf8)", borderRadius:"999px", transition:"width 0.35s ease" }} />
            </div>
            {/* Dot track */}
            <div style={{ display:"flex", gap:"4px", marginTop:"0.5rem" }}>
              {quiz.questions.map((q, i) => (
                <div key={i} style={{ flex:1, height:"3px", borderRadius:"999px", background: answers[q._id] ? "rgba(94,234,212,0.5)" : "rgba(255,255,255,0.06)", transition:"background 0.2s" }} />
              ))}
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ display:"flex", gap:"0.5rem", alignItems:"center", padding:"0.75rem 1rem", background:"rgba(239,68,68,0.07)", border:"1px solid rgba(239,68,68,0.2)", borderRadius:"10px", color:"#fca5a5", fontSize:"0.875rem", fontFamily:"'Nunito',sans-serif", marginBottom:"1.25rem" }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink:0 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            {error}
          </div>
        )}

        {/* Questions */}
        <div style={{ display:"flex", flexDirection:"column", gap:"1.25rem" }}>
          {quiz.questions.map((q, idx) => (
            <div key={q._id} style={{ background:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:"16px", padding:"1.375rem 1.5rem", animation:`fadeSlideUp 0.4s ${idx * 0.05}s ease both` }}>
              {/* Question text */}
              <div style={{ display:"flex", gap:"0.875rem", marginBottom:"1rem", alignItems:"flex-start" }}>
                <div style={{ width:"28px", height:"28px", borderRadius:"8px", background:"rgba(99,102,241,0.15)", border:"1px solid rgba(99,102,241,0.25)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginTop:"1px" }}>
                  <span style={{ fontSize:"0.72rem", fontWeight:800, color:"#818cf8", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{idx + 1}</span>
                </div>
                <h3 style={{ fontSize:"0.9375rem", fontWeight:700, color:"rgba(226,232,240,0.9)", fontFamily:"'Plus Jakarta Sans',sans-serif", lineHeight:1.55, margin:0 }}>{q.questionText}</h3>
              </div>

              {/* Options */}
              <div style={{ display:"flex", flexDirection:"column", gap:"0.5rem", paddingLeft:"2.625rem" }}>
                {q.options.map(opt => {
                  const sel       = answers[q._id] === opt;
                  const isCorrect = !!result && opt === q.correctAnswer;
                  const isWrong   = !!result && sel && opt !== q.correctAnswer;

                  return (
                    <label key={opt}
                      className={`quiz-option${sel ? " selected" : ""}${isCorrect ? " correct" : ""}${isWrong ? " wrong" : ""}${result ? " locked" : ""}`}
                      onClick={() => handleSelect(q._id, opt)}>
                      <input type="radio" name={q._id} value={opt} checked={sel} onChange={() => handleSelect(q._id, opt)} disabled={!!result} style={{ display:"none" }} />
                      <RadioDot selected={sel} correct={isCorrect} wrong={isWrong} />
                      <span style={{ flex:1, lineHeight:1.5 }}>{opt}</span>
                      {isCorrect && (
                        <span style={{ fontSize:"0.7rem", fontWeight:700, fontFamily:"'Plus Jakarta Sans',sans-serif", color:"#10b981", background:"rgba(16,185,129,0.12)", border:"1px solid rgba(16,185,129,0.25)", borderRadius:"999px", padding:"0.1rem 0.5rem", flexShrink:0 }}>✓ Correct</span>
                      )}
                      {isWrong && (
                        <span style={{ fontSize:"0.7rem", fontWeight:700, fontFamily:"'Plus Jakarta Sans',sans-serif", color:"#f87171", background:"rgba(248,113,113,0.1)", border:"1px solid rgba(248,113,113,0.22)", borderRadius:"999px", padding:"0.1rem 0.5rem", flexShrink:0 }}>✗ Wrong</span>
                      )}
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Submit */}
        {!result && (
          <div style={{ marginTop:"1.75rem" }}>
            <button className="submit-btn" onClick={handleSubmit} disabled={submitting || answeredCount < totalQ} style={{ width:"100%", padding:"0.9rem", background: answeredCount === totalQ ? "linear-gradient(135deg,#14b8a6,#6366f1)" : "rgba(255,255,255,0.05)", border: answeredCount === totalQ ? "none" : "1px solid rgba(255,255,255,0.08)", borderRadius:"12px", color: answeredCount === totalQ ? "white" : "rgba(148,163,184,0.35)", fontSize:"0.9375rem", fontWeight:700, cursor: answeredCount === totalQ ? "pointer" : "not-allowed", fontFamily:"'Plus Jakarta Sans',sans-serif", boxShadow: answeredCount === totalQ ? "0 4px 18px rgba(20,184,166,0.25)" : "none" }}>
              {submitting ? (
                <span style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:"0.625rem" }}>
                  <span style={{ width:"16px", height:"16px", border:"2px solid rgba(255,255,255,0.3)", borderTopColor:"white", borderRadius:"50%", animation:"spin 0.7s linear infinite", display:"inline-block" }} />
                  Submitting…
                </span>
              ) : `Submit Quiz (${answeredCount}/${totalQ})`}
            </button>
            {answeredCount < totalQ && (
              <p style={{ textAlign:"center", fontSize:"0.75rem", color:"rgba(148,163,184,0.38)", fontFamily:"'Nunito',sans-serif", marginTop:"0.625rem" }}>
                Answer all {totalQ - answeredCount} remaining question{totalQ - answeredCount !== 1 ? "s" : ""} to submit
              </p>
            )}
          </div>
        )}

        {/* Result card */}
        {result && <ResultCard result={result} courseId={courseId} totalQ={totalQ} />}
      </div>
    </div>
  );
}

/* ── Result Card ────────────────────────────────────────────── */
function ResultCard({ result, courseId, totalQ }) {
  const score    = result.quizScore || 0;
  const passed   = score >= 60;
  const radius   = 52;
  const circ     = 2 * Math.PI * radius;
  const offset   = circ * (1 - score / 100);

  const perfColor = result.predictedPerformance === "High" ? { c:"#10b981", bg:"rgba(16,185,129,0.12)", b:"rgba(16,185,129,0.28)" }
                  : result.predictedPerformance === "Low"  ? { c:"#f87171", bg:"rgba(248,113,113,0.1)", b:"rgba(248,113,113,0.25)" }
                  :                                          { c:"#818cf8", bg:"rgba(129,140,248,0.12)", b:"rgba(129,140,248,0.25)" };

  return (
    <div style={{ marginTop:"2rem", animation:"popIn 0.55s ease both" }}>
      {/* Score header */}
      <div style={{ background: passed ? "linear-gradient(135deg,rgba(16,185,129,0.09),rgba(20,184,166,0.07))" : "linear-gradient(135deg,rgba(248,113,113,0.09),rgba(239,68,68,0.06))", border:`1px solid ${passed ? "rgba(16,185,129,0.22)" : "rgba(248,113,113,0.2)"}`, borderRadius:"18px", padding:"1.875rem 2rem", display:"flex", gap:"1.75rem", alignItems:"center", marginBottom:"1rem", flexWrap:"wrap" }}>
        {/* Ring */}
        <div style={{ position:"relative", width:"120px", height:"120px", flexShrink:0 }}>
          <svg width="120" height="120" viewBox="0 0 120 120" style={{ transform:"rotate(-90deg)" }}>
            <circle cx="60" cy="60" r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8"/>
            <circle cx="60" cy="60" r={radius} fill="none"
              stroke={passed ? "url(#passGrad)" : "#f87171"}
              strokeWidth="8" strokeLinecap="round"
              strokeDasharray={circ}
              strokeDashoffset={offset}
              style={{ transition:"stroke-dashoffset 1.2s ease" }}
            />
            <defs>
              <linearGradient id="passGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#14b8a6"/><stop offset="100%" stopColor="#10b981"/>
              </linearGradient>
            </defs>
          </svg>
          <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
            <span style={{ fontSize:"1.625rem", fontWeight:800, color:"white", fontFamily:"'Plus Jakarta Sans',sans-serif", lineHeight:1 }}>{score}%</span>
            <span style={{ fontSize:"0.62rem", color:"rgba(148,163,184,0.5)", fontFamily:"'Nunito',sans-serif", marginTop:"3px" }}>{result.correct}/{result.total}</span>
          </div>
        </div>

        {/* Text */}
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:"0.5rem", marginBottom:"0.5rem" }}>
            <span style={{ fontSize:"1.5rem" }}>{passed ? "🎉" : "📝"}</span>
            <h2 style={{ fontSize:"1.375rem", fontWeight:800, color:"white", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
              {passed ? "Quiz Complete!" : "Keep Practising!"}
            </h2>
          </div>
          <p style={{ fontSize:"0.875rem", color: passed ? "rgba(52,211,153,0.75)" : "rgba(252,165,165,0.7)", fontFamily:"'Nunito',sans-serif", lineHeight:1.6 }}>
            {passed ? `You scored ${score}% — great work!` : `You scored ${score}%. You need 60% to advance.`}
          </p>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"0.625rem", marginBottom:"1rem" }}>
        {/* Recommended Level */}
        <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:"12px", padding:"0.875rem 1rem" }}>
          <div style={{ fontSize:"0.6rem", fontWeight:700, color:"rgba(148,163,184,0.45)", fontFamily:"'Plus Jakarta Sans',sans-serif", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:"0.4rem" }}>Rec. Level</div>
          <div style={{ fontSize:"0.9375rem", fontWeight:800, color:"#fbbf24", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{result.recommendedLevel || "—"}</div>
        </div>

        {/* Predicted Performance */}
        <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:"12px", padding:"0.875rem 1rem" }}>
          <div style={{ fontSize:"0.6rem", fontWeight:700, color:"rgba(148,163,184,0.45)", fontFamily:"'Plus Jakarta Sans',sans-serif", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:"0.4rem" }}>Performance</div>
          <span style={{ fontSize:"0.875rem", fontWeight:700, fontFamily:"'Plus Jakarta Sans',sans-serif", color:perfColor.c, background:perfColor.bg, border:`1px solid ${perfColor.b}`, borderRadius:"999px", padding:"0.15rem 0.625rem" }}>{result.predictedPerformance || "—"}</span>
        </div>

        {/* Dropout Risk */}
        <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:"12px", padding:"0.875rem 1rem" }}>
          <div style={{ fontSize:"0.6rem", fontWeight:700, color:"rgba(148,163,184,0.45)", fontFamily:"'Plus Jakarta Sans',sans-serif", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:"0.4rem" }}>Dropout Risk</div>
          <span style={{ fontSize:"0.875rem", fontWeight:700, fontFamily:"'Plus Jakarta Sans',sans-serif", color: result.dropoutRisk === "Yes" ? "#f87171" : "#5eead4", background: result.dropoutRisk === "Yes" ? "rgba(248,113,113,0.1)" : "rgba(94,234,212,0.1)", border:`1px solid ${result.dropoutRisk === "Yes" ? "rgba(248,113,113,0.25)" : "rgba(94,234,212,0.22)"}`, borderRadius:"999px", padding:"0.15rem 0.625rem" }}>{result.dropoutRisk || "—"}</span>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display:"flex", gap:"0.75rem", flexWrap:"wrap" }}>
        <Link to="/" className="result-action" style={{ display:"inline-flex", alignItems:"center", padding:"0.7rem 1.25rem", background:"linear-gradient(135deg,#14b8a6,#6366f1)", color:"white", borderRadius:"10px", textDecoration:"none", fontSize:"0.875rem", fontWeight:700, fontFamily:"'Plus Jakarta Sans',sans-serif", transition:"all 0.22s", boxShadow:"0 4px 14px rgba(20,184,166,0.2)" }}>
          Go to Dashboard
        </Link>
        {courseId && (
          <Link to={`/courses/${courseId}`} className="result-action" style={{ display:"inline-flex", alignItems:"center", padding:"0.7rem 1.25rem", background:"rgba(255,255,255,0.04)", color:"rgba(148,163,184,0.7)", border:"1px solid rgba(255,255,255,0.09)", borderRadius:"10px", textDecoration:"none", fontSize:"0.875rem", fontWeight:700, fontFamily:"'Plus Jakarta Sans',sans-serif", transition:"all 0.22s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor="rgba(94,234,212,0.3)"; e.currentTarget.style.color="#5eead4"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor="rgba(255,255,255,0.09)"; e.currentTarget.style.color="rgba(148,163,184,0.7)"; }}>
            Back to Course
          </Link>
        )}
      </div>
    </div>
  );
}