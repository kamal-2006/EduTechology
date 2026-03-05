import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authAPI, analyticsAPI, enrollmentAPI } from "../services/api";

export default function StudentDetails() {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentAnalytics, setStudentAnalytics] = useState(null);
  const [studentEnrollments, setStudentEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      const res = await authAPI.getAllStudents();
      setStudents(res.data.data || []);
      setError("");
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || "Failed to load students";
      setError(errorMsg);
      console.error("Error loading students:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStudentClick = async (student) => {
    setSelectedStudent(student);
    setDetailsLoading(true);
    setStudentAnalytics(null);
    setStudentEnrollments([]);
    
    try {
      // Load analytics
      try {
        const analyticsRes = await analyticsAPI.getStudentAnalytics(student._id);
        setStudentAnalytics(analyticsRes.data.data || null);
      } catch (analyticsErr) {
        console.error("Failed to load student analytics:", analyticsErr);
      }
      
      // Load enrollments (optional - don't fail if not available)
      try {
        const enrollmentsRes = await enrollmentAPI.getAllEnrollments();
        const studentEnrolls = (enrollmentsRes.data.data || []).filter(
          (e) => e.student?._id === student._id || e.student === student._id
        );
        setStudentEnrollments(studentEnrolls);
      } catch (enrollErr) {
        console.error("Failed to load enrollments:", enrollErr);
        setStudentEnrollments([]);
      }
    } catch (err) {
      console.error("Failed to load student details:", err);
    } finally {
      setDetailsLoading(false);
    }
  };

  const filteredStudents = students.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="spinner-wrap">
        <div className="spinner" />
        <span>Loading students...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <div className="page-header">
          <h1 className="page-title">Student Details 👥</h1>
          <p className="page-subtitle">
            View all students and their performance analytics
          </p>
        </div>
        <div className="alert alert-error" style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <div style={{ flex: 1 }}>
            <strong style={{ display: "block", marginBottom: "0.25rem" }}>Error Loading Students</strong>
            <span style={{ fontSize: "0.875rem" }}>{error}</span>
          </div>
        </div>
        <button 
          onClick={() => {
            setError("");
            setLoading(true);
            loadStudents();
          }}
          className="btn btn-primary"
          style={{ marginTop: "1rem" }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Student Details 👥</h1>
        <p className="page-subtitle">
          View all students and their performance analytics
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: selectedStudent ? "1fr 1.5fr" : "1fr", gap: "1.5rem" }}>
        {/* Left Panel: Students List */}
        <div>
          {/* Search Bar */}
          <div style={{ position: "relative", marginBottom: "1rem" }}>
            <svg
              style={{
                position: "absolute",
                left: 12,
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--text-muted)",
                pointerEvents: "none",
              }}
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search students by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                paddingLeft: 36,
                paddingRight: 14,
                paddingTop: 9,
                paddingBottom: 9,
                border: "1.5px solid var(--border)",
                borderRadius: 10,
                fontSize: "0.875rem",
                background: "var(--surface)",
                color: "var(--text)",
                outline: "none",
              }}
              onFocus={(e) => (e.target.style.borderColor = "var(--primary)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
            />
          </div>

          {/* Students Count */}
          <div style={{ marginBottom: "0.75rem", fontSize: "0.875rem", color: "var(--text-muted)", fontWeight: 600 }}>
            {filteredStudents.length} {filteredStudents.length === 1 ? "student" : "students"} found
          </div>

          {/* Students List */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {filteredStudents.length === 0 ? (
              <div className="empty-state" style={{ padding: "2rem 1rem" }}>
                <div className="empty-state-icon">🔍</div>
                <p style={{ fontWeight: 600, marginBottom: "0.25rem" }}>No students found</p>
                <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
                  Try adjusting your search
                </p>
              </div>
            ) : (
              filteredStudents.map((student) => (
                <div
                  key={student._id}
                  onClick={() => handleStudentClick(student)}
                  style={{
                    background: selectedStudent?._id === student._id ? "var(--primary-light)" : "var(--surface)",
                    border: `1.5px solid ${selectedStudent?._id === student._id ? "var(--primary)" : "var(--border)"}`,
                    borderRadius: 12,
                    padding: "1rem",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    if (selectedStudent?._id !== student._id) {
                      e.currentTarget.style.borderColor = "var(--primary)";
                      e.currentTarget.style.boxShadow = "0 2px 8px rgba(99,102,241,0.1)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedStudent?._id !== student._id) {
                      e.currentTarget.style.borderColor = "var(--border)";
                      e.currentTarget.style.boxShadow = "none";
                    }
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    {/* Avatar */}
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: "50%",
                        background: "linear-gradient(135deg, var(--primary), var(--accent))",
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "1rem",
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      {student.name.charAt(0).toUpperCase()}
                    </div>
                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--text)", marginBottom: "0.15rem" }}>
                        {student.name}
                      </div>
                      <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                        {student.email}
                      </div>
                    </div>
                    {/* Indicator */}
                    {selectedStudent?._id === student._id && (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                  {/* Join Date */}
                  <div style={{ marginTop: "0.5rem", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    Joined {new Date(student.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Panel: Student Details */}
        {selectedStudent && (
          <div>
            {detailsLoading ? (
              <div style={{ background: "var(--surface)", border: "1.5px solid var(--border)", borderRadius: 14, padding: "3rem 2rem", textAlign: "center" }}>
                <div className="spinner" style={{ margin: "0 auto 1rem" }} />
                <p style={{ color: "var(--text-muted)" }}>Loading student details...</p>
              </div>
            ) : (
              <div style={{ background: "var(--surface)", border: "1.5px solid var(--border)", borderRadius: 14, padding: "1.5rem", boxShadow: "var(--shadow-sm)" }}>
                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem", paddingBottom: "1rem", borderBottom: "1.5px solid var(--border)" }}>
                  <div
                    style={{
                      width: 60,
                      height: 60,
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, var(--primary), var(--accent))",
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "1.5rem",
                      fontWeight: 700,
                    }}
                  >
                    {selectedStudent.name.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h2 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 800, color: "var(--text)" }}>
                      {selectedStudent.name}
                    </h2>
                    <p style={{ margin: "0.25rem 0 0", fontSize: "0.875rem", color: "var(--text-muted)" }}>
                      {selectedStudent.email}
                    </p>
                  </div>
                  <span
                    style={{
                      padding: "4px 12px",
                      borderRadius: 999,
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      background: "var(--primary-light)",
                      color: "var(--primary)",
                    }}
                  >
                    {selectedStudent.role.toUpperCase()}
                  </span>
                </div>

                {/* Analytics Overview */}
                {studentAnalytics && (
                  <>
                    <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text)", marginBottom: "1rem" }}>
                      📊 Performance Analytics
                    </h3>
                    
                    {/* Dropout Risk Alert */}
                    {studentAnalytics.dropoutRisk === "Yes" && (
                      <div className="alert alert-warning" style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", marginBottom: "1rem" }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
                          <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                          <line x1="12" y1="9" x2="12" y2="13" />
                          <line x1="12" y1="17" x2="12.01" y2="17" />
                        </svg>
                        <div>
                          <strong style={{ display: "block", marginBottom: "0.2rem" }}>Dropout Risk Detected</strong>
                          <span style={{ fontSize: "0.875rem" }}>
                            This student is at risk of dropping out. Consider reaching out for support.
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Stats Grid */}
                    <div className="stats-grid" style={{ marginBottom: "1.5rem" }}>
                      <StatCard
                        icon="✅"
                        value={studentAnalytics.totalQuizzesTaken ?? 0}
                        label="Quizzes Taken"
                        color="success"
                      />
                      <StatCard
                        icon="🎯"
                        value={studentAnalytics.averageScore ?? 0}
                        label="Average Score"
                        suffix="%"
                        color="primary"
                      />
                      <StatCard
                        icon="📈"
                        value={studentAnalytics.recommendedLevel ?? "N/A"}
                        label="Recommended Level"
                        isText
                        color="accent"
                      />
                      <StatCard
                        icon="🤖"
                        value={studentAnalytics.predictedPerformance ?? "N/A"}
                        label="AI Prediction"
                        isText
                        color={
                          studentAnalytics.predictedPerformance === "High"
                            ? "success"
                            : studentAnalytics.predictedPerformance === "Low"
                            ? "danger"
                            : "info"
                        }
                      />
                    </div>
                  </>
                )}

                {/* Enrolled Courses */}
                <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text)", marginBottom: "1rem" }}>
                  📚 Enrolled Courses
                </h3>
                {studentEnrollments.length === 0 ? (
                  <div className="empty-state" style={{ padding: "1.5rem 1rem" }}>
                    <div className="empty-state-icon">📚</div>
                    <p style={{ fontWeight: 600, marginBottom: "0.25rem" }}>No enrollments yet</p>
                    <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
                      This student hasn't enrolled in any courses
                    </p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    {studentEnrollments.map((enrollment) => (
                      <div
                        key={enrollment._id}
                        style={{
                          background: "#f8fafc",
                          border: "1.5px solid var(--border)",
                          borderRadius: 10,
                          padding: "1rem",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--text)", marginBottom: "0.25rem" }}>
                              {enrollment.course?.title || "Unknown Course"}
                            </div>
                            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                              Enrolled {new Date(enrollment.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                            </div>
                          </div>
                          <span
                            style={{
                              padding: "4px 10px",
                              borderRadius: 999,
                              fontSize: "0.7rem",
                              fontWeight: 700,
                              background: enrollment.status === "completed" ? "#dcfce7" : "#fef3c7",
                              color: enrollment.status === "completed" ? "#15803d" : "#a16207",
                            }}
                          >
                            {enrollment.status?.toUpperCase() || "ACTIVE"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Recent Activity */}
                {studentAnalytics?.scoreHistory && studentAnalytics.scoreHistory.length > 0 && (
                  <>
                    <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text)", marginTop: "1.5rem", marginBottom: "1rem" }}>
                      📈 Recent Activity
                    </h3>
                    <div style={{ background: "#f8fafc", border: "1.5px solid var(--border)", borderRadius: 10, overflow: "hidden" }}>
                      {studentAnalytics.scoreHistory.slice(-5).reverse().map((item, idx) => (
                        <div
                          key={idx}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.85rem",
                            padding: "0.85rem 1rem",
                            borderBottom: idx < Math.min(4, studentAnalytics.scoreHistory.length - 1) ? "1px solid var(--border)" : "none",
                          }}
                        >
                          <div
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: "50%",
                              flexShrink: 0,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "0.95rem",
                              background: item.score >= 60 ? "#dcfce7" : "#fee2e2",
                            }}
                          >
                            {item.score >= 60 ? "✅" : "📝"}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 600, fontSize: "0.85rem", color: "var(--text)" }}>
                              {item.course || "Unknown Course"}
                            </div>
                            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                              {item.date ? new Date(item.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                            </div>
                          </div>
                          <span
                            style={{
                              padding: "3px 12px",
                              borderRadius: 999,
                              fontSize: "0.78rem",
                              fontWeight: 700,
                              background: item.score >= 60 ? "#dcfce7" : "#fee2e2",
                              color: item.score >= 60 ? "#15803d" : "#b91c1c",
                              flexShrink: 0,
                            }}
                          >
                            {item.score}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {/* View Full Analytics Button */}
                <button
                  onClick={() => navigate(`/analytics/${selectedStudent._id}`)}
                  className="btn btn-primary"
                  style={{ width: "100%", marginTop: "1.5rem" }}
                >
                  View Full Analytics →
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── StatCard ─────────────────────────────────────────────────────────────── */
function StatCard({ icon, value, label, suffix = "", isText = false, color = "primary" }) {
  const colorMap = {
    primary: "var(--primary)",
    accent: "#8b5cf6",
    success: "var(--success)",
    danger: "var(--danger)",
    info: "#0ea5e9",
  };
  return (
    <div className="stat-card">
      <div className="stat-icon">{icon}</div>
      <div className="stat-value" style={{ color: colorMap[color] || "var(--primary)" }}>
        {isText ? value : `${value}${suffix}`}
      </div>
      <div className="stat-label">{label}</div>
    </div>
  );
}
