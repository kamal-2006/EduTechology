import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  BarChart, Bar, ResponsiveContainer, PieChart, Pie, Cell, LabelList,
} from "recharts";
import { analyticsAPI } from "../services/api.js";

const PIE_COLORS = { High: "#276749", Medium: "#975a16", Low: "#c53030" };

export default function Analytics() {
  const { id }      = useParams(); // "admin" or student id
  const navigate    = useNavigate();

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

  if (loading) return <div className="spinner-wrap"><div className="spinner" /></div>;
  if (error)   return <div className="page"><div className="alert alert-error">{error}</div></div>;
  if (!data)   return null;

  return isAdmin
    ? <AdminAnalytics data={data} />
    : <StudentAnalytics data={data} studentName={user?.name} />;
}

// ── Student Analytics ─────────────────────────────────────────────────────────
function StudentAnalytics({ data, studentName }) {
  const scoreHistory = (data.scoreHistory || []).map((s, i) => ({
    name:  `#${i + 1}`,
    score: s.score,
    course: s.course,
  }));

  const pieData = data.courseBreakdown?.map((c) => ({
    name:  c.courseTitle,
    value: c.averageScore,
  })) || [];

  return (
    <div className="page">
      <h1 className="page-title">My Analytics {studentName ? `– ${studentName}` : ""}</h1>

      {data.dropoutRisk === "Yes" && (
        <div className="alert alert-error" style={{ marginBottom: "1.5rem" }}>
          ⚠️ <strong>Dropout Risk Detected.</strong> Consider reviewing course materials and reaching out for support.
        </div>
      )}

      {/* Stats */}
      <div className="stats-grid">
        <StatCard value={data.totalQuizzesTaken} label="Quizzes Taken" />
        <StatCard value={`${data.averageScore}%`} label="Average Score" />
        <StatCard value={data.recommendedLevel}     label="Recommended Level" />
        <StatCard value={data.predictedPerformance} label="Predicted Performance"
          color={data.predictedPerformance === "High" ? "#276749" : data.predictedPerformance === "Low" ? "#c53030" : undefined} />
        <StatCard
          value={data.dropoutRisk}
          label="Dropout Risk"
          color={data.dropoutRisk === "Yes" ? "#c53030" : "#276749"}
        />
      </div>

      {/* Score History Line Chart */}
      {scoreHistory.length > 0 && (
        <>
          <h2 className="section-title">Score History</h2>
          <div className="card">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={scoreHistory} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} unit="%" />
                <Tooltip formatter={(v) => `${v}%`} />
                <Legend />
                <Line type="monotone" dataKey="score" stroke="#2b6cb0" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 7 }} name="Quiz Score" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {/* Course Breakdown Bar Chart */}
      {data.courseBreakdown?.length > 0 && (
        <>
          <h2 className="section-title">Course Breakdown</h2>
          <div className="card">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.courseBreakdown} margin={{ top: 5, right: 20, left: 0, bottom: 30 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="courseTitle" tick={{ fontSize: 11 }} angle={-20} textAnchor="end" />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} unit="%" />
                <Tooltip formatter={(v) => `${v}%`} />
                <Bar dataKey="averageScore" fill="#2b6cb0" name="Avg Score" radius={[4, 4, 0, 0]}>
                  <LabelList dataKey="averageScore" position="top" formatter={(v) => `${v}%`} style={{ fontSize: 11 }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}

// ── Admin Analytics ───────────────────────────────────────────────────────────
function AdminAnalytics({ data }) {
  const pieData = Object.entries(data.performanceDist || {}).map(([k, v]) => ({
    name: k, value: v,
  }));

  return (
    <div className="page">
      <h1 className="page-title">Admin Analytics Dashboard</h1>

      <div className="stats-grid">
        <StatCard value={data.totalStudents}    label="Total Students" />
        <StatCard value={data.totalCourses}     label="Total Courses" />
        <StatCard value={data.totalSubmissions} label="Total Submissions" />
        <StatCard value={`${data.avgPlatformScore}%`} label="Avg Platform Score" />
        <StatCard value={data.atRiskStudents}   label="At-Risk Students" color="#c53030" />
      </div>

      {/* Course Performance Bar Chart */}
      {data.coursePerformance?.length > 0 && (
        <>
          <h2 className="section-title">Course-wise Average Score</h2>
          <div className="card">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data.coursePerformance} margin={{ top: 5, right: 20, left: 0, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="courseTitle" tick={{ fontSize: 11 }} angle={-20} textAnchor="end" />
                <YAxis domain={[0, 100]} unit="%" tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v, n) => n === "averageScore" ? `${v}%` : v} />
                <Legend />
                <Bar dataKey="averageScore" fill="#2b6cb0" name="Avg Score" radius={[4, 4, 0, 0]}>
                  <LabelList dataKey="averageScore" position="top" formatter={(v) => `${v}%`} style={{ fontSize: 11 }} />
                </Bar>
                <Bar dataKey="totalAttempts" fill="#68d391" name="Attempts" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {/* Performance Distribution Pie Chart */}
      {pieData.length > 0 && (
        <>
          <h2 className="section-title">Performance Distribution</h2>
          <div className="card" style={{ display: "flex", justifyContent: "center" }}>
            <PieChart width={380} height={280}>
              <Pie
                data={pieData}
                cx={190}
                cy={130}
                outerRadius={110}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
                labelLine={{ stroke: "#718096" }}
              >
                {pieData.map((entry) => (
                  <Cell key={entry.name} fill={PIE_COLORS[entry.name] || "#a0aec0"} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ value, label, color }) {
  return (
    <div className="stat-card">
      <div className="stat-value" style={color ? { color } : {}}>{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}
