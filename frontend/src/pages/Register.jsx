import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authAPI } from "../services/api.js";

const ROLES = [
  { value: "student", label: "Student",  icon: "🎓", desc: "I want to learn" },
  { value: "faculty", label: "Faculty",  icon: "👨‍🏫", desc: "I want to teach"  },
];

export default function Register() {
  const navigate = useNavigate();
  const [form,    setForm]    = useState({ name: "", email: "", password: "", confirmPassword: "", role: "student" });
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword)
      return setError("Passwords do not match.");
    if (form.password.length < 6)
      return setError("Password must be at least 6 characters.");

    setLoading(true);
    try {
      const { data } = await authAPI.register({
        name:     form.name,
        email:    form.email,
        password: form.password,
        role:     form.role,
      });
      localStorage.setItem("token", data.token);
      localStorage.setItem("user",  JSON.stringify(data.user));
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Please try again.");
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
          <h1 style={styles.tagline}>Start your journey<br />today.</h1>
          <p style={styles.taglineSub}>
            Personalized learning paths, AI feedback,<br />and analytics to help you excel.
          </p>
          {/* SVG Illustration */}
          <div style={{ width: "100%" }}>
            <svg viewBox="0 0 400 280" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", maxWidth: 380 }}>
              {/* bookshelf back */}
              <rect x="50" y="80" width="300" height="160" rx="10" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5"/>
              {/* shelf lines */}
              <line x1="50" y1="150" x2="350" y2="150" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5"/>
              <line x1="50" y1="195" x2="350" y2="195" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5"/>
              {/* books row 1 */}
              <rect x="66"  y="96"  width="22" height="50" rx="3" fill="rgba(99,102,241,0.7)"/>
              <rect x="92"  y="103" width="18" height="43" rx="3" fill="rgba(167,139,250,0.75)"/>
              <rect x="114" y="99"  width="25" height="47" rx="3" fill="rgba(59,130,246,0.7)"/>
              <rect x="143" y="105" width="20" height="41" rx="3" fill="rgba(16,185,129,0.65)"/>
              <rect x="167" y="96"  width="24" height="50" rx="3" fill="rgba(245,158,11,0.65)"/>
              <rect x="195" y="102" width="19" height="44" rx="3" fill="rgba(239,68,68,0.65)"/>
              <rect x="218" y="97"  width="26" height="49" rx="3" fill="rgba(99,102,241,0.5)"/>
              <rect x="248" y="104" width="21" height="42" rx="3" fill="rgba(139,92,246,0.7)"/>
              <rect x="273" y="98"  width="23" height="48" rx="3" fill="rgba(20,184,166,0.65)"/>
              <rect x="300" y="101" width="34" height="45" rx="3" fill="rgba(99,102,241,0.6)"/>
              {/* books row 2 */}
              <rect x="66"  y="158" width="30" height="33" rx="3" fill="rgba(167,139,250,0.6)"/>
              <rect x="100" y="162" width="22" height="29" rx="3" fill="rgba(99,102,241,0.65)"/>
              <rect x="126" y="156" width="28" height="35" rx="3" fill="rgba(16,185,129,0.55)"/>
              <rect x="158" y="160" width="24" height="31" rx="3" fill="rgba(59,130,246,0.6)"/>
              <rect x="186" y="157" width="20" height="34" rx="3" fill="rgba(245,158,11,0.6)"/>
              <rect x="210" y="163" width="26" height="28" rx="3" fill="rgba(239,68,68,0.55)"/>
              <rect x="240" y="159" width="22" height="32" rx="3" fill="rgba(99,102,241,0.55)"/>
              <rect x="266" y="155" width="30" height="36" rx="3" fill="rgba(167,139,250,0.65)"/>
              <rect x="300" y="161" width="34" height="30" rx="3" fill="rgba(20,184,166,0.55)"/>
              {/* floating card */}
              <rect x="270" y="40" width="100" height="36" rx="10" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5"/>
              <circle cx="288" cy="58" r="8" fill="#10b981"/>
              <text x="302" y="63" fontSize="10" fill="rgba(255,255,255,0.9)" fontFamily="Inter,sans-serif" fontWeight="600">95% Score</text>
              {/* person */}
              <circle cx="32" cy="195" r="14" fill="rgba(255,255,255,0.18)"/>
              <path d="M12 240 Q12 215 32 215 Q52 215 52 240" fill="rgba(255,255,255,0.12)"/>
              {/* sparkles */}
              <circle cx="360" cy="100" r="4" fill="rgba(255,255,255,0.3)"/>
              <circle cx="374" cy="86"  r="2.5" fill="rgba(255,255,255,0.2)"/>
              <circle cx="30"  cy="80"  r="3"   fill="rgba(255,255,255,0.2)"/>
            </svg>
          </div>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div style={styles.right}>
        <div style={styles.card}>
          <div style={{ marginBottom: "1.75rem" }}>
            <h2 style={styles.formTitle}>Create account</h2>
            <p style={styles.formSub}>Join the EduLearn AI platform</p>
          </div>

          {error && (
            <div style={styles.errorBox}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}

          {/* Role selector */}
          <div style={{ marginBottom: "1.25rem" }}>
            <label style={styles.fieldLabel}>I am a</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem" }}>
              {ROLES.map((r) => {
                const active = form.role === r.value;
                return (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, role: r.value }))}
                    style={{
                      display: "flex", flexDirection: "column", alignItems: "flex-start",
                      padding: "0.75rem 1rem", borderRadius: 10, border: `2px solid ${active ? "#6366f1" : "#e2e8f0"}`,
                      background: active ? "#eef2ff" : "#fff", cursor: "pointer",
                      transition: "all 0.15s", textAlign: "left",
                    }}
                  >
                    <span style={{ fontSize: "1.25rem", marginBottom: "0.2rem" }}>{r.icon}</span>
                    <span style={{ fontWeight: 700, fontSize: "0.835rem", color: active ? "#4338ca" : "#111827" }}>{r.label}</span>
                    <span style={{ fontSize: "0.72rem", color: active ? "#6366f1" : "#9ca3af" }}>{r.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <Field label="Full Name">
              <input
                type="text" name="name" autoComplete="name"
                placeholder="Jane Doe"
                value={form.name} onChange={handleChange} required
                style={styles.input}
                onFocus={(e) => e.target.style.borderColor = "#6366f1"}
                onBlur={(e)  => e.target.style.borderColor = "#e2e8f0"}
              />
            </Field>

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

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <Field label="Password">
                <input
                  type="password" name="password" autoComplete="new-password"
                  placeholder="Min. 6 chars"
                  value={form.password} onChange={handleChange} required
                  style={styles.input}
                  onFocus={(e) => e.target.style.borderColor = "#6366f1"}
                  onBlur={(e)  => e.target.style.borderColor = "#e2e8f0"}
                />
              </Field>
              <Field label="Confirm">
                <input
                  type="password" name="confirmPassword" autoComplete="new-password"
                  placeholder="Repeat"
                  value={form.confirmPassword} onChange={handleChange} required
                  style={styles.input}
                  onFocus={(e) => e.target.style.borderColor = "#6366f1"}
                  onBlur={(e)  => e.target.style.borderColor = "#e2e8f0"}
                />
              </Field>
            </div>

            <button
              type="submit" disabled={loading}
              style={{ ...styles.btn, opacity: loading ? 0.75 : 1 }}
              onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = "#4f46e5"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "#6366f1"; }}
            >
              {loading ? "Creating account…" : "Create Account"}
            </button>
          </form>

          <p style={styles.switchText}>
            Already have an account?{" "}
            <Link to="/login" style={styles.link}>Sign in</Link>
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
    marginBottom: "2rem",
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
    margin: "0 0 2rem",
  },
  right: {
    width: "100%",
    maxWidth: 500,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "2rem 1.5rem",
    background: "#fff",
    overflowY: "auto",
  },
  card: {
    width: "100%",
    maxWidth: 400,
  },
  fieldLabel: {
    display: "block",
    fontSize: "0.82rem",
    fontWeight: 600,
    color: "#374151",
    marginBottom: "0.5rem",
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
    marginBottom: "1rem",
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
    marginTop: "0.2rem",
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