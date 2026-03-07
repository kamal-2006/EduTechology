import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { analyticsAPI, levelRegAPI } from "../services/api.js";

const FALLBACK_BG = [
  "linear-gradient(135deg,#667eea 0%,#764ba2 100%)",
  "linear-gradient(135deg,#f093fb 0%,#f5576c 100%)",
  "linear-gradient(135deg,#4facfe 0%,#00f2fe 100%)",
  "linear-gradient(135deg,#43e97b 0%,#38f9d7 100%)",
];

const DIFF_COLORS = {
  Beginner:     { bg: "#dcfce7", color: "#15803d", badge: "#dcfce7" },
  Intermediate: { bg: "#fef3c7", color: "#a16207", badge: "#fef3c7" },
  Advanced:     { bg: "#fee2e2", color: "#b91c1c", badge: "#fce7f3" },
};

export default function Dashboard() {
  const raw  = localStorage.getItem("user");
  const user = raw ? JSON.parse(raw) : {};
  const navigate = useNavigate();

  const [myCourses, setMyCourses] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (["admin","faculty"].includes(user.role)) {
          const aRes = await analyticsAPI.getAdminAnalytics();
          setAnalytics(aRes.data.data);
        } else {
          const [csRes, aRes] = await Promise.all([
            levelRegAPI.getAllCoursesStatus(),
            analyticsAPI.getStudentAnalytics(user.id),
          ]);
          const engaged = (csRes.data.data || []).filter((c) =>
            c.levelStatuses?.some((ls) => ["active", "failed", "completed"].includes(ls.status))
          );
          setMyCourses(engaged);
          setAnalytics(aRes.data.data);
        }
      } catch {
        setError("Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return (
    <div style={styles.spinnerWrap}>
      <div style={styles.spinner} />
      <span style={styles.spinnerText}>Loading your dashboard…</span>
    </div>
  );
  
  if (error) return (
    <div style={styles.errorContainer}>
      <div style={styles.errorBox}>{error}</div>
    </div>
  );
  
  if (["admin","faculty"].includes(user.role)) return <AdminDashboard analytics={analytics} user={user} />;

  // Student Dashboard
  const quizzesTaken = analytics?.totalQuizzesTaken || 0;
  const avgScore = analytics?.averageScore || 0;
  const recommendedLevel = analytics?.recommendedLevel || "Beginner";
  const predictedPerf = analytics?.predictedPerformance || "Medium";
  const weeklyGoal = 75; // Can be made dynamic from backend
  const recentActivity = (analytics?.scoreHistory || []).slice(-5).reverse();

  // Calculate trend
  const quizTrend = quizzesTaken > 10 ? 2 : 0;

  return (
    <div style={styles.dashboardContainer}>
      {/* Top Header with Search & Profile */}
      <div style={styles.topHeader}>
        <div style={styles.searchContainer}>
          <svg style={styles.searchIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
          <input 
            type="text" 
            placeholder="Search courses, lessons..." 
            style={styles.searchInput}
          />
        </div>
        
        <div style={styles.headerRight}>
          <button style={styles.iconButton} title="Notifications">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={styles.iconSvg}>
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            <span style={styles.notifBadge}>3</span>
          </button>
          
          <button style={styles.iconButton} title="Messages">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={styles.iconSvg}>
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </button>
          
          <div style={styles.userProfile}>
            <div style={styles.userInfo}>
              <div style={styles.userName}>{user.name || "Alex Johnson"}</div>
              <div style={styles.userRole}>Premium Member</div>
            </div>
            <div style={styles.userAvatar}>
              {(user.name || "A").charAt(0).toUpperCase()}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div style={styles.mainGrid}>
        {/* Left: Main Content */}
        <div style={styles.leftColumn}>
          {/* Welcome Section */}
          <div style={styles.welcomeSection}>
            <div>
              <h1 style={styles.welcomeTitle}>Welcome back, {user.name}! 👋</h1>
              <p style={styles.welcomeSubtitle}>
                You've completed <strong>{weeklyGoal}%</strong> of your weekly learning goal.
              </p>
            </div>
            <div style={styles.dateBox}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={styles.calendarIcon}>
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              <span style={styles.dateText}>
                {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
              </span>
            </div>
          </div>

          {/* Dropout Risk Alert */}
          {analytics?.dropoutRisk === "Yes" && (
            <div style={styles.alertBox}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              <div>
                <strong style={{ display: "block", marginBottom: "4px" }}>AI Risk Alert</strong>
                <span style={{ fontSize: "13px" }}>Our AI detected a dropout risk. Consider reviewing materials or seeking support.</span>
              </div>
            </div>
          )}

          {/* Stats Cards */}
          <div style={styles.statsGrid}>
            <StatCardNew 
              icon="📝" 
              value={`${quizzesTaken}/15`}
              label="QUIZZES"
              trend={quizTrend > 0 ? `${quizTrend} more than last week` : null}
              color="#e0e7ff"
              iconBg="#6366f1"
            />
            <StatCardNew 
              icon="⭐" 
              value={`${avgScore}%`}
              label="AVG. SCORE"
              progressBar={avgScore}
              color="#dbeafe"
              iconBg="#3b82f6"
            />
            <StatCardNew 
              icon="🏆" 
              value={recommendedLevel}
              label="LEVEL"
              subtext="Top 5% in category"
              color="#fef3c7"
              iconBg="#f59e0b"
            />
            <StatCardNew 
              icon="🤖" 
              value={predictedPerf === "High" ? "On Track: A+" : predictedPerf === "Low" ? "Needs Work" : "Progressing"}
              label="AI PREDICTION"
              subtext="Keep up the streak!"
              color="#e0f2fe"
              iconBg="#06b6d4"
            />
          </div>

          {/* My Courses */}
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>My Courses</h2>
            <Link to="/my-courses" style={styles.viewAllLink}>View All</Link>
          </div>

          {myCourses.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>🎯</div>
              <p style={styles.emptyTitle}>No courses started yet</p>
              <p style={styles.emptyText}>Browse and register for a level to begin your journey.</p>
              <Link to="/students" style={styles.emptyButton}>Browse Available Courses →</Link>
            </div>
          ) : (
            <div style={styles.coursesGrid}>
              {myCourses.slice(0, 2).map((course, idx) => {
                const totalLevels = course.levelStatuses?.length || 0;
                const doneLevels  = course.levelStatuses?.filter((ls) => ls.status === "completed").length || 0;
                const pct         = totalLevels > 0 ? Math.round((doneLevels / totalLevels) * 100) : 0;
                const dc          = DIFF_COLORS[course.difficulty] || DIFF_COLORS.Beginner;

                return (
                  <div
                    key={course._id}
                    onClick={() => navigate(`/courses/${course._id}`)}
                    style={styles.courseCard}
                  >
                    <div style={{
                      ...styles.courseImage,
                      background: course.image
                        ? `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.5)), url("${course.image}") center/cover`
                        : FALLBACK_BG[idx % FALLBACK_BG.length],
                    }}>
                      <span style={{
                        ...styles.courseBadge,
                        background: dc.badge,
                        color: dc.color,
                      }}>
                        {course.difficulty?.toUpperCase() || "DEVELOPMENT"}
                      </span>
                    </div>
                    <div style={styles.courseContent}>
                      <h3 style={styles.courseTitle}>{course.title}</h3>
                      <p style={styles.courseInstructor}>
                        Instructor: {course.instructor || "Sarah Chen"}
                      </p>
                      <div style={styles.progressSection}>
                        <span style={styles.progressLabel}>Progress</span>
                        <span style={styles.progressValue}>{pct}%</span>
                      </div>
                      <div style={styles.progressBar}>
                        <div style={{
                          ...styles.progressFill,
                          width: `${pct}%`,
                          background: pct === 100 ? "#10b981" : "#6366f1"
                        }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Quick Actions */}
          <h2 style={styles.sectionTitle}>Quick Actions</h2>
          <div style={styles.quickActionsGrid}>
            {[
              { icon: "📝", label: "New Quiz", color: "#e0e7ff", iconColor: "#6366f1" },
              { icon: "💬", label: "Community", color: "#dbeafe", iconColor: "#3b82f6" },
              { icon: "📚", label: "Study Guide", color: "#ddd6fe", iconColor: "#8b5cf6" },
              { icon: "❓", label: "Get Support", color: "#fce7f3", iconColor: "#ec4899" },
            ].map((action) => (
              <button key={action.label} style={{
                ...styles.quickActionCard,
                background: action.color
              }}>
                <div style={{
                  ...styles.quickActionIcon,
                  background: action.iconColor
                }}>
                  <span style={{ fontSize: "18px" }}>{action.icon}</span>
                </div>
                <span style={styles.quickActionLabel}>{action.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Right: Recent Activity Sidebar */}
        <div style={styles.rightColumn}>
          <h3 style={styles.activityTitle}>Recent Activity</h3>
          
          <div style={styles.activityList}>
            <ActivityItem 
              icon="✅"
              iconBg="#10b981"
              title="Quiz Completed"
              subtitle="Introduction to UI: Score: 95%"
              time="2 hours ago"
            />
            <ActivityItem 
              icon="▶️"
              iconBg="#3b82f6"
              title="Video Lesson"
              subtitle='Watched "State Management in React"'
              time="YESTERDAY"
            />
            <ActivityItem 
              icon="🏆"
              iconBg="#8b5cf6"
              title="Achievement Unlocked"
              subtitle="7-Day Study Streak"
              time="3 DAYS AGO"
            />
          </div>

          <button style={styles.fullHistoryButton}>
            View Full History
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Activity Item Component ──────────────────────────────────────────────── */
function ActivityItem({ icon, iconBg, title, subtitle, time }) {
  return (
    <div style={styles.activityItem}>
      <div style={{ ...styles.activityIcon, background: iconBg }}>
        {icon}
      </div>
      <div style={styles.activityContent}>
        <div style={styles.activityItemTitle}>{title}</div>
        <div style={styles.activitySubtitle}>{subtitle}</div>
        <div style={styles.activityTime}>{time}</div>
      </div>
    </div>
  );
}

/* ── Stat Card Component ───────────────────────────────────────────────────── */
function StatCardNew({ icon, value, label, trend, subtext, progressBar, color, iconBg }) {
  return (
    <div style={{ ...styles.statCard, background: color }}>
      <div style={styles.statHeader}>
        <span style={styles.statLabel}>{label}</span>
        <div style={{ ...styles.statIconBox, background: iconBg }}>
          <span style={{ fontSize: "20px" }}>{icon}</span>
        </div>
      </div>
      <div style={styles.statValue}>{value}</div>
      {trend && <div style={styles.statTrend}>↗ {trend}</div>}
      {subtext && <div style={styles.statSubtext}>{subtext}</div>}
      {progressBar !== undefined && (
        <div style={styles.statProgressBar}>
          <div style={{ ...styles.statProgressFill, width: `${progressBar}%` }} />
        </div>
      )}
    </div>
  );
}

/* ── Admin Dashboard ────────────────────────────────────────────────────────── */
function AdminDashboard({ analytics, user }) {
  return (
    <div style={styles.dashboardContainer}>
      <div style={styles.topHeader}>
        <h1 style={{ fontSize: "18px", fontWeight: 800, color: "#0f172a" }}>Admin Dashboard</h1>
        <div style={styles.userProfile}>
          <div style={styles.userInfo}>
            <div style={styles.userName}>{user.name}</div>
            <div style={styles.userRole}>{user.role}</div>
          </div>
          <div style={styles.userAvatar}>
            {(user.name || "A").charAt(0).toUpperCase()}
          </div>
        </div>
      </div>

      <div style={styles.statsGrid}>
        <StatCardNew icon="👥" value={analytics?.totalStudents ?? 0} label="TOTAL STUDENTS" color="#dbeafe" iconBg="#3b82f6" />
        <StatCardNew icon="📚" value={analytics?.totalCourses ?? 0} label="TOTAL COURSES" color="#e0e7ff" iconBg="#6366f1" />
        <StatCardNew icon="📝" value={analytics?.totalSubmissions ?? 0} label="SUBMISSIONS" color="#ddd6fe" iconBg="#8b5cf6" />
        <StatCardNew icon="🎯" value={`${analytics?.avgPlatformScore ?? 0}%`} label="AVG SCORE" color="#dcfce7" iconBg="#10b981" />
        <StatCardNew icon="⚠️" value={analytics?.atRiskStudents ?? 0} label="AT-RISK STUDENTS" color="#fee2e2" iconBg="#ef4444" />
      </div>

      <div style={{ marginTop: "24px", display: "flex", gap: "12px", flexWrap: "wrap" }}>
        <Link to="/courses/create" style={styles.adminButton}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Create Course
        </Link>
        <Link to="/students" style={styles.adminButtonOutline}>Browse Courses</Link>
        <Link to="/analytics/admin" style={styles.adminButtonOutline}>Full Analytics →</Link>
      </div>
    </div>
  );
}

/* ── Styles ─────────────────────────────────────────────────────────────────── */
const styles = {
  dashboardContainer: {
    minHeight: "100vh",
    background: "#f6f6f8",
    padding: "24px",
  },
  topHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "24px",
    background: "white",
    padding: "16px 20px",
    borderRadius: "12px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
  },
  searchContainer: {
    position: "relative",
    flex: 1,
    maxWidth: "400px",
  },
  searchIcon: {
    position: "absolute",
    left: "14px",
    top: "50%",
    transform: "translateY(-50%)",
    width: "18px",
    height: "18px",
    color: "#94a3b8",
  },
  searchInput: {
    width: "100%",
    padding: "10px 14px 10px 42px",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    fontSize: "14px",
    outline: "none",
    transition: "all 0.2s",
  },
  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  iconButton: {
    position: "relative",
    width: "40px",
    height: "40px",
    border: "none",
    background: "#f8fafc",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  iconSvg: {
    width: "20px",
    height: "20px",
    color: "#64748b",
  },
  notifBadge: {
    position: "absolute",
    top: "4px",
    right: "4px",
    background: "#ef4444",
    color: "white",
    fontSize: "10px",
    fontWeight: 700,
    width: "16px",
    height: "16px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  userProfile: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  userInfo: {
    textAlign: "right",
  },
  userName: {
    fontSize: "14px",
    fontWeight: 700,
    color: "#0f172a",
  },
  userRole: {
    fontSize: "12px",
    color: "#64748b",
  },
  userAvatar: {
    width: "42px",
    height: "42px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "16px",
    fontWeight: 700,
  },
  mainGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 340px",
    gap: "24px",
  },
  leftColumn: {
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  },
  rightColumn: {
    background: "white",
    borderRadius: "12px",
    padding: "20px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
    height: "fit-content",
  },
  welcomeSection: {
    background: "white",
    padding: "20px",
    borderRadius: "12px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  welcomeTitle: {
    fontSize: "20px",
    fontWeight: 800,
    color: "#0f172a",
    marginBottom: "6px",
  },
  welcomeSubtitle: {
    fontSize: "13px",
    color: "#64748b",
  },
  dateBox: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    background: "#f8fafc",
    padding: "10px 16px",
    borderRadius: "8px",
  },
  calendarIcon: {
    width: "18px",
    height: "18px",
    color: "#6366f1",
  },
  dateText: {
    fontSize: "13px",
    fontWeight: 600,
    color: "#0f172a",
  },
  alertBox: {
    display: "flex",
    gap: "12px",
    background: "#fffbeb",
    border: "1px solid #fef3c7",
    borderRadius: "12px",
    padding: "16px",
    color: "#92400e",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
    gap: "12px",
  },
  statCard: {
    padding: "18px 20px",
    borderRadius: "12px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
  },
  statHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "10px",
  },
  statLabel: {
    fontSize: "10px",
    fontWeight: 700,
    color: "#64748b",
    letterSpacing: "0.4px",
  },
  statIconBox: {
    width: "30px",
    height: "30px",
    borderRadius: "7px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: {
    fontSize: "22px",
    fontWeight: 800,
    color: "#0f172a",
    marginBottom: "3px",
  },
  statTrend: {
    fontSize: "11px",
    color: "#10b981",
    fontWeight: 600,
  },
  statSubtext: {
    fontSize: "11px",
    color: "#64748b",
    marginTop: "3px",
  },
  statProgressBar: {
    height: "6px",
    background: "rgba(0,0,0,0.08)",
    borderRadius: "999px",
    marginTop: "12px",
    overflow: "hidden",
  },
  statProgressFill: {
    height: "100%",
    background: "#6366f1",
    borderRadius: "999px",
    transition: "width 0.3s",
  },
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: "16px",
    fontWeight: 700,
    color: "#0f172a",
  },
  viewAllLink: {
    fontSize: "14px",
    fontWeight: 600,
    color: "#6366f1",
    textDecoration: "none",
  },
  coursesGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
    gap: "16px",
  },
  courseCard: {
    background: "white",
    borderRadius: "12px",
    overflow: "hidden",
    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  courseImage: {
    height: "110px",
    position: "relative",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "flex-end",
    padding: "10px",
  },
  courseBadge: {
    padding: "4px 10px",
    borderRadius: "6px",
    fontSize: "10px",
    fontWeight: 700,
    letterSpacing: "0.5px",
  },
  courseContent: {
    padding: "16px 18px",
  },
  courseTitle: {
    fontSize: "13px",
    fontWeight: 700,
    color: "#0f172a",
    marginBottom: "3px",
  },
  courseInstructor: {
    fontSize: "11px",
    color: "#64748b",
    marginBottom: "10px",
  },
  progressSection: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "12px",
    fontWeight: 600,
    marginBottom: "6px",
  },
  progressLabel: {
    color: "#64748b",
  },
  progressValue: {
    color: "#6366f1",
  },
  progressBar: {
    height: "6px",
    background: "#e2e8f0",
    borderRadius: "999px",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: "999px",
    transition: "width 0.3s",
  },
  quickActionsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
    gap: "12px",
  },
  quickActionCard: {
    padding: "20px",
    borderRadius: "12px",
    border: "none",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "12px",
    transition: "all 0.2s",
  },
  quickActionIcon: {
    width: "48px",
    height: "48px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  quickActionLabel: {
    fontSize: "11px",
    fontWeight: 700,
    color: "#0f172a",
  },
  activityTitle: {
    fontSize: "15px",
    fontWeight: 800,
    color: "#0f172a",
    marginBottom: "16px",
  },
  activityList: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  activityItem: {
    display: "flex",
    gap: "12px",
  },
  activityIcon: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px",
    flexShrink: 0,
  },
  activityContent: {
    flex: 1,
  },
  activityItemTitle: {
    fontSize: "14px",
    fontWeight: 700,
    color: "#0f172a",
    marginBottom: "2px",
  },
  activitySubtitle: {
    fontSize: "12px",
    color: "#64748b",
    marginBottom: "4px",
  },
  activityTime: {
    fontSize: "11px",
    color: "#94a3b8",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  fullHistoryButton: {
    width: "100%",
    padding: "12px",
    marginTop: "16px",
    border: "1px solid #e2e8f0",
    background: "white",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: 600,
    color: "#0f172a",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  emptyState: {
    background: "white",
    borderRadius: "12px",
    padding: "48px 24px",
    textAlign: "center",
    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
  },
  emptyIcon: {
    fontSize: "48px",
    marginBottom: "16px",
  },
  emptyTitle: {
    fontSize: "16px",
    fontWeight: 700,
    color: "#0f172a",
    marginBottom: "8px",
  },
  emptyText: {
    fontSize: "14px",
    color: "#64748b",
    marginBottom: "20px",
  },
  emptyButton: {
    display: "inline-block",
    padding: "10px 20px",
    background: "#6366f1",
    color: "white",
    borderRadius: "8px",
    textDecoration: "none",
    fontSize: "14px",
    fontWeight: 600,
  },
  adminButton: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 20px",
    background: "#6366f1",
    color: "white",
    borderRadius: "8px",
    textDecoration: "none",
    fontSize: "14px",
    fontWeight: 600,
  },
  adminButtonOutline: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 20px",
    background: "white",
    color: "#6366f1",
    border: "1.5px solid #6366f1",
    borderRadius: "8px",
    textDecoration: "none",
    fontSize: "14px",
    fontWeight: 600,
  },
  spinnerWrap: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    gap: "16px",
  },
  spinner: {
    width: "40px",
    height: "40px",
    border: "4px solid #e2e8f0",
    borderTopColor: "#6366f1",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  spinnerText: {
    fontSize: "14px",
    color: "#64748b",
  },
  errorContainer: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
  },
  errorBox: {
    background: "#fee2e2",
    color: "#991b1b",
    padding: "16px 24px",
    borderRadius: "8px",
    fontSize: "14px",
  },
};
