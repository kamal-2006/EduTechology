import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { courseAPI, analyticsAPI } from "../services/api.js";

export default function Dashboard() {
  const raw  = localStorage.getItem("user");
  const user = raw ? JSON.parse(raw) : {};

  const [courses,   setCourses]   = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cRes, aRes] = await Promise.all([
          courseAPI.getAll(),
          user.role === "admin"
            ? analyticsAPI.getAdminAnalytics()
            : analyticsAPI.getStudentAnalytics(user.id),
        ]);
        setCourses(cRes.data.data);
        setAnalytics(aRes.data.data);
      } catch (err) {
        setError("Failed to load dashboard data.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="spinner-wrap"><div className="spinner" /></div>;
  if (error)   return <div className="page"><div className="alert alert-error">{error}</div></div>;

  return (
    <div className="page">
      <h1 className="page-title">
        {user.role === "admin"
          ? "Admin Dashboard"
          : `Welcome back, ${user.name} 👋`}
      </h1>

      {/* ── Stats Row ─────────────────────────────────────────────────────── */}
      <div className="stats-grid">
        {user.role === "admin" ? (
          <>
            <StatCard value={analytics?.totalStudents   ?? 0} label="Total Students" />
            <StatCard value={analytics?.totalCourses    ?? 0} label="Total Courses" />
            <StatCard value={analytics?.avgPlatformScore ?? 0} label="Avg Platform Score" suffix="%" />
            <StatCard value={analytics?.atRiskStudents  ?? 0} label="At-Risk Students" color="#c53030" />
          </>
        ) : (
          <>
            <StatCard value={analytics?.totalQuizzesTaken ?? 0} label="Quizzes Taken" />
            <StatCard value={analytics?.averageScore      ?? 0} label="Average Score" suffix="%" />
            <StatCard value={analytics?.recommendedLevel  ?? "N/A"} label="Recommended Level" isText />
            <StatCard value={analytics?.predictedPerformance ?? "N/A"} label="Predicted Performance" isText />
          </>
        )}
      </div>

      {/* ── Dropout Risk Warning (student) ────────────────────────────────── */}
      {user.role === "student" && analytics?.dropoutRisk === "Yes" && (
        <div className="alert alert-error" style={{ marginBottom: "1.5rem" }}>
          ⚠️ <strong>At-Risk Alert:</strong> Our ML model has detected a dropout risk based on your recent performance. Please reach out to your instructor or try revisiting the material.
        </div>
      )}

      {/* ── Courses ───────────────────────────────────────────────────────── */}
      <h2 className="section-title">Available Courses</h2>
      <div className="card-grid">
        {courses.map((course) => (
          <CourseCard key={course._id} course={course} />
        ))}
      </div>

      {/* ── Quick links for admin ─────────────────────────────────────────── */}
      {user.role === "admin" && (
        <>
          <h2 className="section-title">Admin Actions</h2>
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            <Link to="/courses/create" className="btn btn-primary">+ Create Course</Link>
            <Link to="/analytics/admin" className="btn btn-outline">Full Analytics →</Link>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ value, label, suffix = "", color, isText = false }) {
  return (
    <div className="stat-card">
      <div className="stat-value" style={color ? { color } : {}}>
        {isText ? value : `${value}${suffix}`}
      </div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

function CourseCard({ course }) {
  return (
    <div className="card" style={{ display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
        <h2 style={{ flex: 1 }}>{course.title}</h2>
        <span className={`badge diff-${course.difficulty}`} style={{ marginLeft: "0.5rem", whiteSpace: "nowrap" }}>
          {course.difficulty}
        </span>
      </div>
      <p style={{ flex: 1, marginBottom: "1rem" }}>{course.description}</p>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "0.78rem", color: "#718096" }}>
          {course.lessons?.length ?? 0} lessons
        </span>
        <Link to={`/courses/${course._id}`} className="btn btn-outline btn-sm">
          View Course →
        </Link>
      </div>
    </div>
  );
}
