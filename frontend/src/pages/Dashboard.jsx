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
      <span>Loading your dashboard…</span>
    </div>
  );
  if (error) return (
    <div className="page">
      <div className="alert alert-error">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <span>{error}</span>
      </div>
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
            : "Track your progress and continue your learning journey."}
        </p>
      </div>

      {/* Dropout Risk Warning (student) */}
      {user.role === "student" && analytics?.dropoutRisk === "Yes" && (
        <div className="alert alert-warning" style={{ display: "flex", alignItems: "flex-start" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <div>
            <strong style={{ display: "block", marginBottom: "0.25rem" }}>At-Risk Alert</strong>
            <span>Our AI model detected a dropout risk based on your recent activity. Consider revisiting course materials or reaching out for support.</span>
          </div>
        </div>
      )}

      {/* Stats Row */}
      <div className="stats-grid">
        {user.role === "admin" ? (
          <>
            <StatCard 
              icon="👥" 
              value={analytics?.totalStudents ?? 0} 
              label="Total Students" 
              color="primary"
            />
            <StatCard 
              icon="📚" 
              value={analytics?.totalCourses ?? 0} 
              label="Total Courses" 
              color="accent"
            />
            <StatCard 
              icon="📊" 
              value={analytics?.avgPlatformScore ?? 0} 
              label="Avg Platform Score" 
              suffix="%" 
              color="success"
            />
            <StatCard 
              icon="⚠️" 
              value={analytics?.atRiskStudents ?? 0} 
              label="At-Risk Students" 
              danger 
              color="danger"
            />
          </>
        ) : (
          <>
            <StatCard 
              icon="✅" 
              value={analytics?.totalQuizzesTaken ?? 0} 
              label="Quizzes Taken" 
              color="success"
            />
            <StatCard 
              icon="🎯" 
              value={analytics?.averageScore ?? 0} 
              label="Average Score" 
              suffix="%" 
              color="primary"
            />
            <StatCard 
              icon="📈" 
              value={analytics?.recommendedLevel ?? "N/A"} 
              label="Recommended Level" 
              isText 
              color="accent"
            />
            <StatCard 
              icon="🤖" 
              value={analytics?.predictedPerformance ?? "N/A"} 
              label="AI Prediction" 
              isText 
              color="info"
            />
          </>
        )}
      </div>

      {/* Courses */}
      <h2 className="section-title">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
        </svg>
        Available Courses
      </h2>
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
          <h2 className="section-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            Admin Actions
          </h2>
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            <Link to="/courses/create" className="btn btn-primary">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Create Course
            </Link>
            <Link to="/analytics/admin" className="btn btn-outline">
              Full Analytics
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
              </svg>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ icon, value, label, suffix = "", danger = false, isText = false, color = "primary" }) {
  const colorMap = {
    primary: "var(--primary)",
    accent: "var(--accent)",
    success: "var(--success)",
    danger: "var(--danger)",
    info: "var(--info)"
  };
  
  return (
    <div className="stat-card">
      <div className="stat-icon">{icon}</div>
      <div
        className="stat-value"
        style={danger ? { 
          background: "linear-gradient(135deg, var(--danger) 0%, var(--danger-dark) 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text"
        } : undefined}
      >
        {isText ? value : `${value}${suffix}`}
      </div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

function CourseCard({ course }) {
  return (
    <Link to={`/courses/${course._id}`} style={{ textDecoration: "none" }}>
      <div className="course-card">
        <div className="course-card-top">
          <h2 className="course-card-title">{course.title}</h2>
          <span className={`badge diff-${course.difficulty}`}>{course.difficulty}</span>
        </div>
        <p className="course-card-desc">{course.description}</p>
        <div className="course-card-footer">
          <span className="course-card-meta">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
            </svg>
            {course.lessons?.length ?? 0} lessons
          </span>
          <span className="btn btn-outline btn-sm">
            View Course
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
            </svg>
          </span>
        </div>
      </div>
    </Link>
  );
}
