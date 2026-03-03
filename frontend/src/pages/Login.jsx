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
    <div className="auth-wrapper">
      <div className="auth-card">
        <h1>Welcome back</h1>
        <p className="subtitle">Sign in to your learning account</p>

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
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>

          <button className="btn btn-primary btn-block" type="submit" disabled={loading}>
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: "1.25rem", fontSize: "0.875rem", color: "#718096" }}>
          Don't have an account?{" "}
          <Link to="/register" style={{ color: "#2b6cb0", fontWeight: 600 }}>
            Register
          </Link>
        </p>

        {/* Quick-fill demo accounts */}
        <div style={{ marginTop: "1.25rem", padding: "1rem", background: "#f7fafc", borderRadius: "8px" }}>
          <p style={{ fontSize: "0.78rem", color: "#718096", marginBottom: "0.5rem", fontWeight: 600 }}>
            DEMO ACCOUNTS
          </p>
          {[
            { label: "Admin",     email: "admin@educationpsg.com", password: "admin1234" },
            { label: "Student",   email: "alice@test.com",          password: "student1234" },
          ].map((acc) => (
            <button
              key={acc.label}
              className="btn btn-outline btn-sm"
              style={{ marginRight: "0.5rem", marginBottom: "0.4rem" }}
              type="button"
              onClick={() => setForm({ email: acc.email, password: acc.password })}
            >
              {acc.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
