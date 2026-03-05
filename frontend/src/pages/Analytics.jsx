import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine,
  BarChart, Bar, ResponsiveContainer, PieChart, Pie, Cell, LabelList,
} from "recharts";
import { analyticsAPI, enrollmentAPI, levelRegAPI } from "../services/api.js";

const PIE_COLORS = { High: "#10b981", Medium: "#f59e0b", Low: "#ef4444" };
const PASS_SCORE = 60;

const CHART_TOOLTIP = {
  contentStyle: {
    borderRadius: 10, border: "1px solid #e2e8f0",
    boxShadow: "0 4px 16px rgba(0,0,0,0.1)", fontSize: "0.82rem",
    padding: "8px 14px",
  },
  labelStyle: { fontWeight: 700, color: "#1e293b" },
};

export default function Analytics() {
  const { id } = useParams();
  const raw    = localStorage.getItem("user");
  const user   = raw ? JSON.parse(raw) : {};
  const isAdmin = id === "admin";

  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = isAdmin
          ? await analyticsAPI.getAdminAnalytics()
          : await analyticsAPI.getStudentAnalytics(id);
        setData(res.data.data);
      } catch {
        setError("Failed to load analytics data.");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  if (loading) return <div className="spinner-wrap"><div className="spinner" /><span>Loading analytics…</span></div>;
  if (error)   return <div className="page"><div className="alert alert-error">{error}</div></div>;
  if (!data)   return null;

  return isAdmin
    ? <AdminAnalytics data={data} />
    : <StudentAnalytics data={data} studentName={user?.name} />;
}

/* ──────────────────────── STUDENT ANALYTICS ─────────────────────────────── */
function StudentAnalytics({ data, studentName }) {
  const scoreHistory = (data.scoreHistory || []).map((s, i) => ({
    name:  `#${i + 1}`,
    score: s.score,
    course: s.course,
    date:  s.date,
  }));

  const performanceColor =
    data.predictedPerformance === "High"   ? "var(--success)" :
    data.predictedPerformance === "Medium" ? "#f59e0b"        : "var(--danger)";

  const riskColor = data.dropoutRisk === "Yes" ? "var(--danger)" : "var(--success)";

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
          <h1 className="page-title" style={{ margin: 0 }}>My Analytics</h1>
          <span style={{ padding: "3px 12px", borderRadius: 999, fontSize: "0.72rem", fontWeight: 700,
            background: "var(--primary-light)", color: "var(--primary)", border: "1px solid #c7d2fe" }}>
            🤖 AI-Powered
          </span>
        </div>
        <p className="page-subtitle" style={{ marginTop: "0.4rem" }}>
          {studentName ? `Performance insights for ${studentName}` : "Your learning performance insights"}
        </p>
      </div>

      {/* Risk Alert */}
      {data.dropoutRisk === "Yes" && (
        <div className="alert alert-warning" style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <div>
            <strong style={{ display: "block", marginBottom: "0.2rem" }}>Dropout Risk Detected</strong>
            <span style={{ fontSize: "0.875rem" }}>Our AI model flagged a risk based on your recent performance. Consider revisiting course materials or seeking support early.</span>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="stats-grid" style={{ marginBottom: "2rem" }}>
        <AStatCard icon="✅" label="Quizzes Taken"      value={data.totalQuizzesTaken} color="var(--success)" />
        <AStatCard icon="🎯" label="Average Score"      value={`${data.averageScore}%`} color="var(--primary)" />
        <AStatCard icon="📈" label="Recommended Level"  value={data.recommendedLevel}  color="#8b5cf6" />
        <AStatCard icon="🤖" label="AI Prediction"      value={data.predictedPerformance} color={performanceColor} />
        <AStatCard icon="⚠️" label="Dropout Risk"       value={data.dropoutRisk}       color={riskColor} />
      </div>

      {scoreHistory.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📊</div>
          <p style={{ fontWeight: 600, marginBottom: "0.4rem" }}>No quiz data yet</p>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>Complete a quiz to see your analytics here.</p>
        </div>
      ) : (
        <>
          {/* Score History Chart */}
          <section style={{ marginBottom: "2rem" }}>
            <SectionTitle>Score History</SectionTitle>
            <div style={{ background: "var(--surface)", border: "1.5px solid var(--border)", borderRadius: 16, padding: "1.5rem", boxShadow: "var(--shadow-xs)" }}>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={scoreHistory} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#64748b" }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: "#64748b" }} unit="%" />
                  <Tooltip
                    {...CHART_TOOLTIP}
                    formatter={(v) => [`${v}%`, "Score"]}
                    labelFormatter={(label, payload) => payload?.[0]?.payload?.course || label}
                  />
                  <Legend wrapperStyle={{ fontSize: "0.82rem", paddingTop: "0.5rem" }} />
                  <ReferenceLine y={PASS_SCORE} stroke="#f59e0b" strokeDasharray="5 4" label={{ value: "Pass (60%)", fontSize: 11, fill: "#a16207", position: "insideTopRight" }} />
                  <Line
                    type="monotone" dataKey="score" name="Quiz Score" stroke="#4f46e5" strokeWidth={2.5}
                    dot={{ r: 5, fill: "#4f46e5", stroke: "#fff", strokeWidth: 2 }}
                    activeDot={{ r: 8, fill: "#4f46e5" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* Course Breakdown */}
          {data.courseBreakdown?.length > 0 && (
            <section style={{ marginBottom: "2rem" }}>
              <SectionTitle>Performance by Course</SectionTitle>
              <div style={{ background: "var(--surface)", border: "1.5px solid var(--border)", borderRadius: 16, padding: "1.5rem", boxShadow: "var(--shadow-xs)" }}>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.courseBreakdown} margin={{ top: 10, right: 20, left: 0, bottom: 50 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="courseTitle" tick={{ fontSize: 11, fill: "#64748b" }} angle={-25} textAnchor="end" interval={0} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: "#64748b" }} unit="%" />
                    <Tooltip {...CHART_TOOLTIP} formatter={(v, n) => n === "averageScore" ? [`${v}%`, "Avg Score"] : [v, "Attempts"]} />
                    <Legend wrapperStyle={{ fontSize: "0.82rem", paddingTop: "0.5rem" }} />
                    <Bar dataKey="averageScore" name="Avg Score" fill="#4f46e5" radius={[6, 6, 0, 0]}>
                      <LabelList dataKey="averageScore" position="top" formatter={(v) => `${v}%`} style={{ fontSize: 11, fill: "#64748b" }} />
                    </Bar>
                    <Bar dataKey="attempts" name="Attempts" fill="#c7d2fe" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>
          )}

          {/* Attempt History Table */}
          <section>
            <SectionTitle>Attempt History</SectionTitle>
            <div style={{ background: "var(--surface)", border: "1.5px solid var(--border)", borderRadius: 16, overflow: "hidden", boxShadow: "var(--shadow-xs)" }}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                  <thead>
                    <tr style={{ background: "var(--bg-secondary)" }}>
                      {["#", "Course", "Score", "Result", "Date"].map((h) => (
                        <th key={h} style={{ padding: "0.85rem 1.1rem", textAlign: "left", fontWeight: 700,
                          color: "var(--text-muted)", fontSize: "0.78rem", textTransform: "uppercase",
                          letterSpacing: "0.04em", borderBottom: "1.5px solid var(--border)" }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[...scoreHistory].reverse().map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: idx < scoreHistory.length - 1 ? "1px solid var(--border)" : "none" }}
                        onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-secondary)"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                        <td style={{ padding: "0.8rem 1.1rem", color: "var(--text-muted)", fontWeight: 600, width: 48 }}>
                          {scoreHistory.length - idx}
                        </td>
                        <td style={{ padding: "0.8rem 1.1rem", fontWeight: 600, color: "var(--text)" }}>
                          {item.course || "—"}
                        </td>
                        <td style={{ padding: "0.8rem 1.1rem" }}>
                          <span style={{
                            fontWeight: 700, fontSize: "0.9rem",
                            color: item.score >= PASS_SCORE ? "var(--success)" : "var(--danger)",
                          }}>{item.score}%</span>
                        </td>
                        <td style={{ padding: "0.8rem 1.1rem" }}>
                          <span style={{
                            padding: "2px 10px", borderRadius: 999, fontSize: "0.72rem", fontWeight: 700,
                            background: item.score >= PASS_SCORE ? "#dcfce7" : "#fee2e2",
                            color:      item.score >= PASS_SCORE ? "#15803d" : "#b91c1c",
                          }}>
                            {item.score >= PASS_SCORE ? "✓ Passed" : "✗ Failed"}
                          </span>
                        </td>
                        <td style={{ padding: "0.8rem 1.1rem", color: "var(--text-muted)", fontSize: "0.8rem" }}>
                          {item.date ? new Date(item.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

/* ──────────────────────── ADMIN ANALYTICS ───────────────────────────────── */
function AdminAnalytics({ data }) {
  const pieData = Object.entries(data.performanceDist || {}).map(([k, v]) => ({ name: k, value: v }));
  const [enrollments, setEnrollments] = useState([]);

  useEffect(() => {
    enrollmentAPI.getAllEnrollments()
      .then((r) => setEnrollments(r.data.data))
      .catch(() => {});
  }, []);

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Admin Analytics</h1>
        <p className="page-subtitle">Platform-wide performance metrics and insights.</p>
      </div>

      <div className="stats-grid" style={{ marginBottom: "2rem" }}>
        <AStatCard icon="👥" label="Total Students"    value={data.totalStudents}    color="var(--primary)" />
        <AStatCard icon="📚" label="Total Courses"     value={data.totalCourses}     color="#8b5cf6" />
        <AStatCard icon="📝" label="Total Submissions" value={data.totalSubmissions} color="#0ea5e9" />
        <AStatCard icon="🎯" label="Avg Platform Score" value={`${data.avgPlatformScore}%`} color="var(--success)" />
        <AStatCard icon="⚠️" label="At-Risk Students"  value={data.atRiskStudents}  color="var(--danger)" />
      </div>

      {/* Course Performance */}
      {data.coursePerformance?.length > 0 && (
        <section style={{ marginBottom: "2rem" }}>
          <SectionTitle>Course-wise Performance</SectionTitle>
          <div style={{ background: "var(--surface)", border: "1.5px solid var(--border)", borderRadius: 16, padding: "1.5rem", boxShadow: "var(--shadow-xs)" }}>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={data.coursePerformance} margin={{ top: 10, right: 20, left: 0, bottom: 56 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="courseTitle" tick={{ fontSize: 11, fill: "#64748b" }} angle={-25} textAnchor="end" interval={0} />
                <YAxis domain={[0, 100]} unit="%" tick={{ fontSize: 12, fill: "#64748b" }} />
                <Tooltip {...CHART_TOOLTIP} formatter={(v, n) => n === "averageScore" ? [`${v}%`, "Avg Score"] : [v, n]} />
                <Legend wrapperStyle={{ fontSize: "0.82rem", paddingTop: "0.5rem" }} />
                <Bar dataKey="averageScore" name="Avg Score" fill="#4f46e5" radius={[6, 6, 0, 0]}>
                  <LabelList dataKey="averageScore" position="top" formatter={(v) => `${v}%`} style={{ fontSize: 11, fill: "#64748b" }} />
                </Bar>
                <Bar dataKey="totalAttempts" name="Attempts" fill="#c7d2fe" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {/* Performance Distribution */}
      {pieData.length > 0 && (
        <section style={{ marginBottom: "2rem" }}>
          <SectionTitle>Performance Distribution</SectionTitle>
          <div style={{ background: "var(--surface)", border: "1.5px solid var(--border)", borderRadius: 16, padding: "1.5rem", boxShadow: "var(--shadow-xs)", display: "flex", alignItems: "center", justifyContent: "center", flexWrap: "wrap", gap: "2rem" }}>
            <PieChart width={280} height={240}>
              <Pie data={pieData} cx={135} cy={115} outerRadius={95} innerRadius={45} dataKey="value" paddingAngle={3}>
                {pieData.map((entry) => (
                  <Cell key={entry.name} fill={PIE_COLORS[entry.name] || "#94a3b8"} />
                ))}
              </Pie>
              <Tooltip {...CHART_TOOLTIP} />
            </PieChart>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", minWidth: 160 }}>
              {pieData.map((entry) => (
                <div key={entry.name} style={{ display: "flex", alignItems: "center", gap: "0.6rem", fontSize: "0.875rem" }}>
                  <div style={{ width: 12, height: 12, borderRadius: "50%", background: PIE_COLORS[entry.name] || "#94a3b8", flexShrink: 0 }} />
                  <span style={{ color: "var(--text-muted)", flex: 1 }}>{entry.name}</span>
                  <strong>{entry.value}</strong>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Enrollments Table */}
      {enrollments.length > 0 && (
        <section>
          <SectionTitle>Recent Enrollments</SectionTitle>
          <div style={{ background: "var(--surface)", border: "1.5px solid var(--border)", borderRadius: 16, overflow: "hidden", boxShadow: "var(--shadow-xs)" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                <thead>
                  <tr style={{ background: "var(--bg-secondary)" }}>
                    {["Student", "Email", "Course", "Difficulty", "Enrolled", "Levels Done"].map((h) => (
                      <th key={h} style={{ padding: "0.85rem 1.1rem", textAlign: "left", fontWeight: 700,
                        color: "var(--text-muted)", fontSize: "0.78rem", textTransform: "uppercase",
                        letterSpacing: "0.04em", borderBottom: "1.5px solid var(--border)", whiteSpace: "nowrap" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {enrollments.map((e, idx) => (
                    <tr key={e._id} style={{ borderBottom: idx < enrollments.length - 1 ? "1px solid var(--border)" : "none" }}
                      onMouseEnter={(ev) => ev.currentTarget.style.background = "var(--bg-secondary)"}
                      onMouseLeave={(ev) => ev.currentTarget.style.background = "transparent"}>
                      <td style={{ padding: "0.8rem 1.1rem", fontWeight: 600, color: "var(--text)" }}>{e.studentId?.name || "—"}</td>
                      <td style={{ padding: "0.8rem 1.1rem", color: "var(--text-muted)", fontSize: "0.8rem" }}>{e.studentId?.email || "—"}</td>
                      <td style={{ padding: "0.8rem 1.1rem", fontWeight: 600, color: "var(--text)" }}>{e.courseId?.title || "—"}</td>
                      <td style={{ padding: "0.8rem 1.1rem" }}>
                        {e.courseId?.difficulty && (
                          <span style={{
                            padding: "2px 9px", borderRadius: 999, fontSize: "0.72rem", fontWeight: 700,
                            ...diffStyle(e.courseId.difficulty),
                          }}>{e.courseId.difficulty}</span>
                        )}
                      </td>
                      <td style={{ padding: "0.8rem 1.1rem", color: "var(--text-muted)", fontSize: "0.8rem" }}>
                        {new Date(e.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                      <td style={{ padding: "0.8rem 1.1rem", fontWeight: 700, color: "var(--primary)" }}>
                        {e.completedLevels?.length ?? 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

/* ── Helpers ──────────────────────────────────────────────────────────────── */
function SectionTitle({ children }) {
  return (
    <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text)", margin: "0 0 1rem",
      display: "flex", alignItems: "center", gap: "0.5rem" }}>
      {children}
    </h2>
  );
}

function AStatCard({ icon, label, value, color }) {
  return (
    <div className="stat-card">
      <div className="stat-icon">{icon}</div>
      <div className="stat-value" style={{ color }}>{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

function diffStyle(d) {
  if (d === "Beginner")     return { background: "#dcfce7", color: "#15803d" };
  if (d === "Intermediate") return { background: "#fef9c3", color: "#a16207" };
  if (d === "Advanced")     return { background: "#fee2e2", color: "#b91c1c" };
  return {};
}