import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authAPI } from "../services/api.js";

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm]       = useState({ email: "", password: "" });
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await authAPI.login(form);
      localStorage.setItem("token", data.token);
      localStorage.setItem("user",  JSON.stringify(data.user));
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Left branding panel */}
      <div className="auth-panel-left">
        <div className="auth-left-content">
          <div className="auth-left-logo">🎓</div>
          <h1 className="auth-left-title">Learn smarter with AI-powered education</h1>
          <p className="auth-left-desc">
            Personalized learning paths, adaptive quizzes, and real-time analytics to accelerate your growth.
          </p>
          <ul className="auth-features">
            {[
              "AI-driven course recommendations",
              "Adaptive quiz engine",
              "Performance analytics & insights",
              "Dropout risk prediction",
            ].map((f) => (
              <li key={f}>
                <span className="auth-feature-check">✓</span>
                {f}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Right form panel */}
      <div className="auth-panel-right">
        <div className="auth-form-container">
          <div className="auth-form-header">
            <h2 className="auth-form-title">Welcome back</h2>
            <p className="auth-form-sub">Sign in to continue your learning journey</p>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email address</label>
              <input
                type="email"
                name="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                name="password"
                placeholder="Enter your password"
                value={form.password}
                onChange={handleChange}
                required
              />
            </div>

            <button
              className="btn btn-primary btn-block btn-lg"
              type="submit"
              disabled={loading}
              style={{ marginTop: "0.5rem" }}
            >
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>

          <div className="divider-text">or use a demo account</div>

          <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
            {[
              { label: "👤 Admin",   email: "admin@educationpsg.com", password: "admin1234" },
              { label: "📚 Student", email: "alice@test.com",          password: "student1234" },
            ].map((acc) => (
              <button
                key={acc.label}
                className="btn btn-ghost btn-sm"
                type="button"
                onClick={() => setForm({ email: acc.email, password: acc.password })}
              >
                {acc.label}
              </button>
            ))}
          </div>

          <p style={{ textAlign: "center", marginTop: "1.5rem", fontSize: "0.875rem", color: "var(--text-muted)" }}>
            Don't have an account?{" "}
            <Link to="/register" style={{ color: "var(--primary)", fontWeight: 600 }}>Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
