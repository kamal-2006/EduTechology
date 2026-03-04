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

  if (loading) return (
    <div className="spinner-wrap">
      <div className="spinner" />
      <span>Loading dashboard…</span>
    </div>
  );
  if (error) return (
    <div className="page">
      <div className="alert alert-error">{error}</div>
    </div>
  );

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">
          {user.role === "admin" ? "Admin Dashboard" : `Welcome back, ${user.name} 👋`}
        </h1>
        <p className="page-subtitle">
          {user.role === "admin"
            ? "Manage your platform and monitor student performance."
            : "Track your progress and continue learning."}
        </p>
      </div>

      {/* Dropout Risk Warning (student) */}
      {user.role === "student" && analytics?.dropoutRisk === "Yes" && (
        <div className="alert alert-error">
          ⚠️ <strong>At-Risk Alert:</strong> Our ML model detected a dropout risk based on your recent activity. Consider revisiting course materials or reaching out for support.
        </div>
      )}

      {/* Stats Row */}
      <div className="stats-grid">
        {user.role === "admin" ? (
          <>
            <StatCard icon="👥" value={analytics?.totalStudents   ?? 0} label="Total Students" />
            <StatCard icon="📚" value={analytics?.totalCourses    ?? 0} label="Total Courses" />
            <StatCard icon="📊" value={analytics?.avgPlatformScore ?? 0} label="Avg Platform Score" suffix="%" />
            <StatCard icon="⚠️" value={analytics?.atRiskStudents  ?? 0} label="At-Risk Students" danger />
          </>
        ) : (
          <>
            <StatCard icon="✅" value={analytics?.totalQuizzesTaken ?? 0} label="Quizzes Taken" />
            <StatCard icon="🎯" value={analytics?.averageScore      ?? 0} label="Average Score" suffix="%" />
            <StatCard icon="📈" value={analytics?.recommendedLevel  ?? "N/A"} label="Recommended Level" isText />
            <StatCard icon="🤖" value={analytics?.predictedPerformance ?? "N/A"} label="AI Prediction" isText />
          </>
        )}
      </div>

      {/* Courses */}
      <h2 className="section-title">Available Courses</h2>
      {courses.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📭</div>
          <p>No courses available yet.</p>
        </div>
      ) : (
        <div className="card-grid">
          {courses.map((course) => (
            <CourseCard key={course._id} course={course} />
          ))}
        </div>
      )}

      {/* Admin Actions */}
      {user.role === "admin" && (
        <>
          <h2 className="section-title">Admin Actions</h2>
          <div style={{ display: "flex", gap: "0.85rem", flexWrap: "wrap" }}>
            <Link to="/courses/create" className="btn btn-primary">
              + Create Course
            </Link>
            <Link to="/analytics/admin" className="btn btn-outline">
              Full Analytics →
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ icon, value, label, suffix = "", danger = false, isText = false }) {
  return (
    <div className="stat-card">
      <div className="stat-icon">{icon}</div>
      <div
        className="stat-value"
        style={danger ? { color: "var(--danger)" } : undefined}
      >
        {isText ? value : `${value}${suffix}`}
      </div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

function CourseCard({ course }) {
  return (
    <div className="course-card">
      <div className="course-card-top">
        <h2 className="course-card-title">{course.title}</h2>
        <span className={`badge diff-${course.difficulty}`}>{course.difficulty}</span>
      </div>
      <p className="course-card-desc">{course.description}</p>
      <div className="course-card-footer">
        <span className="course-card-meta">
          📖 {course.lessons?.length ?? 0} lessons
        </span>
        <Link to={`/courses/${course._id}`} className="btn btn-outline btn-sm">
          View →
        </Link>
      </div>
    </div>
  );
}
