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

  // Admin create-course state
  const raw  = localStorage.getItem("user");
  const user = raw ? JSON.parse(raw) : {};
  const isAdmin = user.role === "admin";

  // New lesson form
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [courseForm, setCourseForm] = useState({
    title: "", description: "", difficulty: "Beginner",
  });
  const [courseLoading, setCourseLoading] = useState(false);
  const [courseMsg, setCourseMsg] = useState("");

  useEffect(() => {
    if (id === "create") {
      setLoading(false);
      return;
    }
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

  // ── Create course ─────────────────────────────────────────────────────────
  const handleCreateCourse = async (e) => {
    e.preventDefault();
    setCourseMsg("");
    setCourseLoading(true);
    try {
      await courseAPI.create(courseForm);
      setCourseMsg("✅ Course created successfully!");
      setCourseForm({ title: "", description: "", difficulty: "Beginner" });
      setTimeout(() => navigate("/"), 1500);
    } catch (err) {
      setCourseMsg("❌ " + (err.response?.data?.message || "Failed to create course."));
    } finally {
      setCourseLoading(false);
    }
  };

  if (loading) return <div className="spinner-wrap"><div className="spinner" /></div>;

  // ── Admin: create course page ─────────────────────────────────────────────
  if (id === "create" && isAdmin) {
    return (
      <div className="page">
        <h1 className="page-title">Create New Course</h1>
        {courseMsg && (
          <div className={`alert ${courseMsg.startsWith("✅") ? "alert-success" : "alert-error"}`}>
            {courseMsg}
          </div>
        )}
        <div className="card" style={{ maxWidth: "600px" }}>
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
                placeholder="What will students learn?"
                required
                style={{ padding: "0.65rem 0.9rem", width: "100%", border: "1.5px solid #e2e8f0", borderRadius: "7px", fontSize: "0.9rem", resize: "vertical" }}
              />
            </div>
            <div className="form-group">
              <label>Difficulty</label>
              <select
                value={courseForm.difficulty}
                onChange={(e) => setCourseForm((p) => ({ ...p, difficulty: e.target.value }))}
              >
                <option>Beginner</option>
                <option>Intermediate</option>
                <option>Advanced</option>
              </select>
            </div>
            <div style={{ display: "flex", gap: "1rem" }}>
              <button className="btn btn-primary" type="submit" disabled={courseLoading}>
                {courseLoading ? "Creating…" : "Create Course"}
              </button>
              <Link to="/" className="btn btn-outline">Cancel</Link>
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
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        <Link to="/" className="btn btn-outline btn-sm">← Back</Link>
        <span className={`badge diff-${course.difficulty}`} style={{ alignSelf: "center" }}>
          {course.difficulty}
        </span>
      </div>

      <h1 className="page-title">{course.title}</h1>
      <p style={{ color: "#4a5568", marginBottom: "2rem" }}>{course.description}</p>

      {/* ── Lessons ──────────────────────────────────────────────────────── */}
      <h2 className="section-title">Lessons ({course.lessons?.length ?? 0})</h2>
      {course.lessons?.length === 0 ? (
        <p style={{ color: "#718096" }}>No lessons added yet.</p>
      ) : (
        course.lessons.map((lesson, idx) => (
          <div key={idx} className="card" style={{ borderLeft: "4px solid #2b6cb0" }}>
            <h2>
              <span style={{ color: "#2b6cb0", marginRight: "0.5rem" }}>#{lesson.order ?? idx + 1}</span>
              {lesson.title}
            </h2>
            <p>{lesson.content}</p>
          </div>
        ))
      )}

      {/* ── Quizzes ───────────────────────────────────────────────────────── */}
      <h2 className="section-title">Quizzes ({quizzes.length})</h2>
      {quizzes.length === 0 ? (
        <p style={{ color: "#718096" }}>No quizzes available for this course.</p>
      ) : (
        <div className="card-grid">
          {quizzes.map((quiz) => (
            <div key={quiz._id} className="card">
              <h2>{quiz.title}</h2>
              <p>{quiz.questions?.length ?? 0} questions · {quiz.totalMarks} marks</p>
              <div style={{ marginTop: "1rem" }}>
                <Link
                  to={`/quiz/${quiz._id}?courseId=${course._id}`}
                  className="btn btn-primary btn-sm"
                >
                  Take Quiz →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
