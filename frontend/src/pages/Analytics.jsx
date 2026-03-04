import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  BarChart, Bar, ResponsiveContainer, PieChart, Pie, Cell, LabelList,
} from "recharts";
import { analyticsAPI, enrollmentAPI } from "../services/api.js";

const PIE_COLORS = { High: "#10b981", Medium: "#f59e0b", Low: "#ef4444" };

export default function Analytics() {
  const { id }   = useParams();
  const navigate = useNavigate();

  const raw  = localStorage.getItem("user");
  const user = raw ? JSON.parse(raw) : {};

  const isAdmin = id === "admin";

  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = isAdmin
          ? await analyticsAPI.getAdminAnalytics()
          : await analyticsAPI.getStudentAnalytics(id);
        setData(res.data.data);
      } catch (err) {
        setError("Failed to load analytics data.");
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [id]);

  if (loading) return (
    <div className="spinner-wrap">
      <div className="spinner" />
      <span>Loading analytics…</span>
    </div>
  );
  if (error) return <div className="page"><div className="alert alert-error">{error}</div></div>;
  if (!data) return null;

  return isAdmin
    ? <AdminAnalytics data={data} />
    : <StudentAnalytics data={data} studentName={user?.name} />;
}

/* ── Shared chart config ──────────────────────────────────────────────────── */
const chartTooltipStyle = {
  contentStyle: {
    borderRadius: "8px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
    fontSize: "0.85rem",
  },
};

/* ── Student Analytics ────────────────────────────────────────────────────── */
function StudentAnalytics({ data, studentName }) {
  const scoreHistory = (data.scoreHistory || []).map((s, i) => ({
    name:  `Quiz #${i + 1}`,
    score: s.score,
  }));

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">My Analytics{studentName ? ` — ${studentName}` : ""}</h1>
        <p className="page-subtitle">AI-powered insights into your learning performance.</p>
      </div>

      {data.dropoutRisk === "Yes" && (
        <div className="alert alert-error">
          ⚠️ <strong>Dropout Risk Detected.</strong> Consider reviewing course materials and reaching out for support.
        </div>
      )}

      {/* Stats */}
      <div className="stats-grid">
        <StatCard icon="✅" value={data.totalQuizzesTaken} label="Quizzes Taken" />
        <StatCard icon="🎯" value={`${data.averageScore}%`} label="Average Score" />
        <StatCard icon="📈" value={data.recommendedLevel}  label="Recommended Level" />
        <StatCard
          icon="🤖"
          value={data.predictedPerformance}
          label="AI Prediction"
          color={data.predictedPerformance === "High" ? "var(--success)" : data.predictedPerformance === "Low" ? "var(--danger)" : undefined}
        />
        <StatCard
          icon="⚠️"
          value={data.dropoutRisk}
          label="Dropout Risk"
          color={data.dropoutRisk === "Yes" ? "var(--danger)" : "var(--success)"}
        />
      </div>

      {/* Score History */}
      {scoreHistory.length > 0 && (
        <>
          <h2 className="section-title">Score History</h2>
          <div className="card">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={scoreHistory} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#64748b" }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: "#64748b" }} unit="%" />
                <Tooltip {...chartTooltipStyle} formatter={(v) => `${v}%`} />
                <Legend wrapperStyle={{ fontSize: "0.85rem" }} />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#4f46e5"
                  strokeWidth={2.5}
                  dot={{ r: 5, fill: "#4f46e5", strokeWidth: 2, stroke: "#fff" }}
                  activeDot={{ r: 8 }}
                  name="Quiz Score"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {/* Course Breakdown */}
      {data.courseBreakdown?.length > 0 && (
        <>
          <h2 className="section-title">Course Breakdown</h2>
          <div className="card">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data.courseBreakdown} margin={{ top: 10, right: 20, left: 0, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="courseTitle" tick={{ fontSize: 11, fill: "#64748b" }} angle={-20} textAnchor="end" />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: "#64748b" }} unit="%" />
                <Tooltip {...chartTooltipStyle} formatter={(v) => `${v}%`} />
                <Bar dataKey="averageScore" fill="#4f46e5" name="Avg Score" radius={[6, 6, 0, 0]}>
                  <LabelList dataKey="averageScore" position="top" formatter={(v) => `${v}%`} style={{ fontSize: 11, fill: "#64748b" }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}

/* ── Admin Analytics ──────────────────────────────────────────────────────── */
function AdminAnalytics({ data }) {
  const pieData = Object.entries(data.performanceDist || {}).map(([k, v]) => ({
    name: k, value: v,
  }));

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

      <div className="stats-grid">
        <StatCard icon="👥" value={data.totalStudents}    label="Total Students" />
        <StatCard icon="📚" value={data.totalCourses}     label="Total Courses" />
        <StatCard icon="📝" value={data.totalSubmissions} label="Total Submissions" />
        <StatCard icon="🎯" value={`${data.avgPlatformScore}%`} label="Avg Platform Score" />
        <StatCard icon="⚠️" value={data.atRiskStudents}   label="At-Risk Students" color="var(--danger)" />
      </div>

      {/* Course Performance */}
      {data.coursePerformance?.length > 0 && (
        <>
          <h2 className="section-title">Course-wise Average Score</h2>
          <div className="card">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.coursePerformance} margin={{ top: 10, right: 20, left: 0, bottom: 48 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="courseTitle" tick={{ fontSize: 11, fill: "#64748b" }} angle={-20} textAnchor="end" />
                <YAxis domain={[0, 100]} unit="%" tick={{ fontSize: 12, fill: "#64748b" }} />
                <Tooltip {...chartTooltipStyle} formatter={(v, n) => n === "averageScore" ? `${v}%` : v} />
                <Legend wrapperStyle={{ fontSize: "0.85rem" }} />
                <Bar dataKey="averageScore" fill="#4f46e5" name="Avg Score" radius={[6, 6, 0, 0]}>
                  <LabelList dataKey="averageScore" position="top" formatter={(v) => `${v}%`} style={{ fontSize: 11, fill: "#64748b" }} />
                </Bar>
                <Bar dataKey="totalAttempts" fill="#10b981" name="Attempts" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {/* Performance Distribution Pie */}
      {pieData.length > 0 && (
        <>
          <h2 className="section-title">Performance Distribution</h2>
          <div className="card" style={{ display: "flex", justifyContent: "center", alignItems: "center", flexWrap: "wrap", gap: "2rem" }}>
            <PieChart width={320} height={260}>
              <Pie
                data={pieData}
                cx={155}
                cy={120}
                outerRadius={100}
                innerRadius={40}
                dataKey="value"
                paddingAngle={3}
              >
                {pieData.map((entry) => (
                  <Cell key={entry.name} fill={PIE_COLORS[entry.name] || "#94a3b8"} />
                ))}
              </Pie>
              <Tooltip {...chartTooltipStyle} />
            </PieChart>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              {pieData.map((entry) => (
                <div key={entry.name} style={{ display: "flex", alignItems: "center", gap: "0.6rem", fontSize: "0.875rem" }}>
                  <div style={{ width: 12, height: 12, borderRadius: "50%", background: PIE_COLORS[entry.name] || "#94a3b8", flexShrink: 0 }} />
                  <span style={{ color: "var(--text-muted)" }}>{entry.name}</span>
                  <strong style={{ marginLeft: "auto", paddingLeft: "1rem" }}>{entry.value}</strong>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
      {/* Enrollments Table */}
      {enrollments.length > 0 && (
        <>
          <h2 className="section-title">Recent Enrollments</h2>
          <div className="card" style={{ overflowX: "auto" }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Email</th>
                  <th>Course</th>
                  <th>Difficulty</th>
                  <th>Enrolled</th>
                  <th>Levels Done</th>
                </tr>
              </thead>
              <tbody>
                {enrollments.map((e) => (
                  <tr key={e._id}>
                    <td>{e.studentId?.name || "—"}</td>
                    <td style={{ color: "var(--text-muted)", fontSize: "0.83rem" }}>{e.studentId?.email || "—"}</td>
                    <td><strong>{e.courseId?.title || "—"}</strong></td>
                    <td>
                      <span className="diff-badge" style={diffStyle(e.courseId?.difficulty)}>
                        {e.courseId?.difficulty || "—"}
                      </span>
                    </td>
                    <td style={{ color: "var(--text-muted)", fontSize: "0.83rem" }}>
                      {new Date(e.createdAt).toLocaleDateString()}
                    </td>
                    <td>{e.completedLevels?.length ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function diffStyle(d) {
  if (d === "Beginner")     return { background: "#dcfce7", color: "#166534" };
  if (d === "Intermediate") return { background: "#fef9c3", color: "#854d0e" };
  if (d === "Advanced")     return { background: "#fee2e2", color: "#991b1b" };
  return {};
}

function StatCard({ icon, value, label, color }) {
  return (
    <div className="stat-card">
      <div className="stat-icon">{icon}</div>
      <div className="stat-value" style={color ? { color } : {}}>{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}
