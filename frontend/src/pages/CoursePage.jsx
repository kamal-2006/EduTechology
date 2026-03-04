import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { courseAPI, quizAPI } from "../services/api.js";

export default function CoursePage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [course,  setCourse]  = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  const raw  = localStorage.getItem("user");
  const user = raw ? JSON.parse(raw) : {};
  const isAdmin = user.role === "admin";

  const [courseForm, setCourseForm] = useState({ title: "", description: "", difficulty: "Beginner" });
  const [courseLoading, setCourseLoading] = useState(false);
  const [courseMsg, setCourseMsg] = useState("");

  useEffect(() => {
    if (id === "create") { setLoading(false); return; }
    const fetchCourse = async () => {
      try {
        const [cRes, qRes] = await Promise.all([
          courseAPI.getById(id),
          quizAPI.getByCourse(id),
        ]);
        setCourse(cRes.data.data);
        setQuizzes(qRes.data.data);
      } catch (err) {
        setError("Failed to load course.");
      } finally {
        setLoading(false);
      }
    };
    fetchCourse();
  }, [id]);

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    setCourseMsg("");
    setCourseLoading(true);
    try {
      await courseAPI.create(courseForm);
      setCourseMsg("success");
      setCourseForm({ title: "", description: "", difficulty: "Beginner" });
      setTimeout(() => navigate("/"), 1500);
    } catch (err) {
      setCourseMsg("error:" + (err.response?.data?.message || "Failed to create course."));
    } finally {
      setCourseLoading(false);
    }
  };

  if (loading) return (
    <div className="spinner-wrap">
      <div className="spinner" />
      <span>Loading course…</span>
    </div>
  );

  /* ── Admin: create course ─────────────────────────────────── */
  if (id === "create" && isAdmin) {
    return (
      <div className="page">
        <div className="page-header">
          <h1 className="page-title">Create New Course</h1>
          <p className="page-subtitle">Add a new course for your students.</p>
        </div>

        {courseMsg === "success" && (
          <div className="alert alert-success">✅ Course created successfully! Redirecting…</div>
        )}
        {courseMsg.startsWith("error:") && (
          <div className="alert alert-error">❌ {courseMsg.slice(6)}</div>
        )}

        <div className="card" style={{ maxWidth: 580 }}>
          <form onSubmit={handleCreateCourse}>
            <div className="form-group">
              <label>Course Title</label>
              <input
                type="text"
                value={courseForm.title}
                onChange={(e) => setCourseForm((p) => ({ ...p, title: e.target.value }))}
                placeholder="e.g. Introduction to Python"
                required
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                rows={4}
                value={courseForm.description}
                onChange={(e) => setCourseForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="What will students learn in this course?"
                required
              />
            </div>
            <div className="form-group">
              <label>Difficulty Level</label>
              <select
                value={courseForm.difficulty}
                onChange={(e) => setCourseForm((p) => ({ ...p, difficulty: e.target.value }))}
              >
                <option>Beginner</option>
                <option>Intermediate</option>
                <option>Advanced</option>
              </select>
            </div>
            <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
              <button className="btn btn-primary" type="submit" disabled={courseLoading}>
                {courseLoading ? "Creating…" : "Create Course"}
              </button>
              <Link to="/" className="btn btn-ghost">Cancel</Link>
            </div>
          </form>
        </div>
      </div>
    );
  }

  if (error)   return <div className="page"><div className="alert alert-error">{error}</div></div>;
  if (!course) return <div className="page"><div className="alert alert-error">Course not found.</div></div>;

  return (
    <div className="page">
      {/* Breadcrumb + badge */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        <Link to="/" className="btn btn-ghost btn-sm">← Back</Link>
        <span className={`badge diff-${course.difficulty}`}>{course.difficulty}</span>
        <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
          📖 {course.lessons?.length ?? 0} lessons &nbsp;·&nbsp; 📝 {quizzes.length} quizzes
        </span>
      </div>

      <div className="page-header">
        <h1 className="page-title">{course.title}</h1>
        <p className="page-subtitle">{course.description}</p>
      </div>

      {/* Lessons */}
      <h2 className="section-title">Lessons</h2>
      {(!course.lessons || course.lessons.length === 0) ? (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <p>No lessons have been added yet.</p>
        </div>
      ) : (
        course.lessons.map((lesson, idx) => (
          <div key={idx} className="lesson-card">
            <div style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
              <span className="lesson-num">{lesson.order ?? idx + 1}</span>
              <div>
                <div className="lesson-title">{lesson.title}</div>
                <div className="lesson-content">{lesson.content}</div>
              </div>
            </div>
          </div>
        ))
      )}

      {/* Quizzes */}
      <h2 className="section-title">Quizzes</h2>
      {quizzes.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📝</div>
          <p>No quizzes available for this course yet.</p>
        </div>
      ) : (
        <div className="card-grid">
          {quizzes.map((quiz) => (
            <div key={quiz._id} className="course-card">
              <div className="course-card-top">
                <h2 className="course-card-title">📝 {quiz.title}</h2>
              </div>
              <p className="course-card-desc">
                {quiz.questions?.length ?? 0} questions &nbsp;·&nbsp; {quiz.totalMarks} total marks
              </p>
              <div className="course-card-footer">
                <span className="course-card-meta">⏱ Timed quiz</span>
                <Link
                  to={`/quiz/${quiz._id}?courseId=${course._id}`}
                  className="btn btn-primary btn-sm"
                >
                  Start →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
