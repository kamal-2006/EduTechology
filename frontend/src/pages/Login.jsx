import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authAPI } from "../services/api.js";

export default function Login() {
  const navigate = useNavigate();
  const [form,    setForm]    = useState({ email: "", password: "" });
  const [error,   setError]   = useState("");
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
    <div style={styles.page}>
      {/* ── Left illustration panel ── */}
      <div style={styles.left}>
        <div style={styles.leftInner}>
          <div style={styles.brand}>
            <span style={styles.brandIcon}>🎓</span>
            <span style={styles.brandName}>EduLearn AI</span>
          </div>
          <h1 style={styles.tagline}>Learn smarter,<br />grow faster.</h1>
          <p style={styles.taglineSub}>
            AI-powered courses, adaptive quizzes,<br />and real‑time progress insights.
          </p>
          {/* SVG Illustration */}
          <div style={styles.illustration}>
            <svg viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", maxWidth: 380 }}>
              {/* desk */}
              <rect x="40" y="220" width="320" height="12" rx="6" fill="rgba(255,255,255,0.15)"/>
              {/* monitor base */}
              <rect x="178" y="195" width="44" height="28" rx="4" fill="rgba(255,255,255,0.18)"/>
              <rect x="155" y="218" width="90" height="6" rx="3" fill="rgba(255,255,255,0.18)"/>
              {/* monitor */}
              <rect x="110" y="90" width="180" height="112" rx="10" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.3)" strokeWidth="2"/>
              {/* screen glow */}
              <rect x="120" y="100" width="160" height="92" rx="6" fill="rgba(99,102,241,0.35)"/>
              {/* code lines on screen */}
              <rect x="134" y="116" width="68" height="6" rx="3" fill="rgba(255,255,255,0.7)"/>
              <rect x="134" y="130" width="100" height="5" rx="2.5" fill="rgba(255,255,255,0.4)"/>
              <rect x="134" y="143" width="80" height="5" rx="2.5" fill="rgba(255,255,255,0.45)"/>
              <rect x="134" y="156" width="110" height="5" rx="2.5" fill="rgba(255,255,255,0.35)"/>
              <rect x="134" y="169" width="60" height="5" rx="2.5" fill="rgba(255,255,255,0.5)"/>
              {/* chart bar */}
              <rect x="236" y="148" width="14" height="40" rx="4" fill="rgba(167,139,250,0.7)"/>
              <rect x="254" y="133" width="14" height="55" rx="4" fill="rgba(129,140,248,0.8)"/>
              <rect x="218" y="158" width="14" height="30" rx="4" fill="rgba(196,181,253,0.6)"/>
              {/* floating badge 1 */}
              <rect x="280" y="68" width="80" height="30" rx="10" fill="rgba(255,255,255,0.18)" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5"/>
              <circle cx="297" cy="83" r="7" fill="#10b981"/>
              <text x="310" y="88" fontSize="10" fill="rgba(255,255,255,0.9)" fontFamily="Inter,sans-serif" fontWeight="600">Passed!</text>
              {/* floating badge 2 */}
              <rect x="40" y="76" width="88" height="30" rx="10" fill="rgba(255,255,255,0.18)" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5"/>
              <circle cx="57" cy="91" r="7" fill="#6366f1"/>
              <text x="70" y="96" fontSize="9.5" fill="rgba(255,255,255,0.9)" fontFamily="Inter,sans-serif" fontWeight="600">AI Score 94%</text>
              {/* person silhouette */}
              <circle cx="68" cy="155" r="16" fill="rgba(255,255,255,0.18)"/>
              <path d="M44 220 Q44 185 68 185 Q92 185 92 220" fill="rgba(255,255,255,0.13)"/>
              {/* sparkles */}
              <circle cx="340" cy="130" r="4" fill="rgba(255,255,255,0.35)"/>
              <circle cx="356" cy="115" r="2.5" fill="rgba(255,255,255,0.25)"/>
              <circle cx="50" cy="200" r="3" fill="rgba(255,255,255,0.2)"/>
            </svg>
          </div>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div style={styles.right}>
        <div style={styles.card}>
          <div style={{ marginBottom: "2rem" }}>
            <h2 style={styles.formTitle}>Welcome back</h2>
            <p style={styles.formSub}>Sign in to continue your learning journey</p>
          </div>

          {error && (
            <div style={styles.errorBox}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
            <Field label="Email address">
              <input
                type="email" name="email" autoComplete="email"
                placeholder="you@example.com"
                value={form.email} onChange={handleChange} required
                style={styles.input}
                onFocus={(e) => e.target.style.borderColor = "#6366f1"}
                onBlur={(e)  => e.target.style.borderColor = "#e2e8f0"}
              />
            </Field>

            <Field label="Password">
              <input
                type="password" name="password" autoComplete="current-password"
                placeholder="••••••••"
                value={form.password} onChange={handleChange} required
                style={styles.input}
                onFocus={(e) => e.target.style.borderColor = "#6366f1"}
                onBlur={(e)  => e.target.style.borderColor = "#e2e8f0"}
              />
            </Field>

            <button
              type="submit" disabled={loading}
              style={{ ...styles.btn, opacity: loading ? 0.75 : 1 }}
              onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = "#4f46e5"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "#6366f1"; }}
            >
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>

          <p style={styles.switchText}>
            Don't have an account?{" "}
            <Link to="/register" style={styles.link}>Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#374151", marginBottom: "0.4rem" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

/* ── Styles ─────────────────────────────────────────────────────────────── */
const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    fontFamily: "Inter, -apple-system, sans-serif",
  },
  left: {
    flex: 1,
    background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 45%, #6366f1 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "3rem 2rem",
    position: "relative",
    overflow: "hidden",
  },
  leftInner: {
    position: "relative",
    zIndex: 1,
    maxWidth: 400,
    width: "100%",
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: "0.6rem",
    marginBottom: "2.25rem",
  },
  brandIcon: { fontSize: "1.5rem" },
  brandName: {
    fontWeight: 800,
    fontSize: "1.15rem",
    color: "#fff",
    letterSpacing: "0.01em",
  },
  tagline: {
    fontSize: "clamp(1.6rem, 3vw, 2.2rem)",
    fontWeight: 800,
    color: "#fff",
    lineHeight: 1.18,
    letterSpacing: "-0.5px",
    margin: "0 0 0.85rem",
  },
  taglineSub: {
    fontSize: "0.92rem",
    color: "rgba(255,255,255,0.7)",
    lineHeight: 1.65,
    margin: "0 0 2.25rem",
  },
  illustration: { width: "100%" },
  right: {
    width: "100%",
    maxWidth: 480,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "2rem 1.5rem",
    background: "#fff",
  },
  card: {
    width: "100%",
    maxWidth: 380,
  },
  formTitle: {
    fontSize: "1.65rem",
    fontWeight: 800,
    color: "#111827",
    letterSpacing: "-0.5px",
    margin: 0,
  },
  formSub: {
    fontSize: "0.875rem",
    color: "#6b7280",
    marginTop: "0.35rem",
  },
  errorBox: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.75rem 1rem",
    borderRadius: 10,
    background: "#fef2f2",
    border: "1px solid #fecaca",
    color: "#b91c1c",
    fontSize: "0.85rem",
    fontWeight: 500,
    marginBottom: "1.1rem",
  },
  input: {
    width: "100%",
    padding: "0.72rem 0.95rem",
    border: "1.5px solid #e2e8f0",
    borderRadius: 10,
    fontSize: "0.925rem",
    color: "#111827",
    background: "#fff",
    fontFamily: "inherit",
    transition: "border-color 0.15s",
    outline: "none",
    boxSizing: "border-box",
  },
  btn: {
    width: "100%",
    padding: "0.78rem",
    borderRadius: 10,
    border: "none",
    background: "#6366f1",
    color: "#fff",
    fontWeight: 700,
    fontSize: "0.95rem",
    cursor: "pointer",
    transition: "background 0.15s",
    marginTop: "0.35rem",
  },
  switchText: {
    textAlign: "center",
    marginTop: "1.5rem",
    fontSize: "0.875rem",
    color: "#6b7280",
  },
  link: {
    color: "#6366f1",
    fontWeight: 600,
    textDecoration: "none",
  },
};