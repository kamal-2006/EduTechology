import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authAPI } from "../services/api.js";

const ROLES = [
  { value: "student", label: "Student", icon: "🎓", desc: "I want to learn" },
  { value: "faculty", label: "Faculty", icon: "👨‍🏫", desc: "I want to teach" },
];

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "", role: "student" });
  const [error, setError] = useState("");
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
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
      });
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        html, body, #root {
          margin: 0;
          padding: 0;
          height: 100vh;
          overflow: hidden;
        }
        .hero-section {
          display: flex;
        }
        .mobile-logo {
          display: none;
        }
        @media (max-width: 1024px) {
          .hero-section {
            display: none !important;
          }
          .mobile-logo {
            display: flex !important;
          }
        }
      `}</style>
      <div style={styles.container}>
        {/* Left Section: Hero */}
        <div style={styles.leftSection} className="hero-section">
        {/* Abstract background elements */}
        <div style={styles.bgOverlay}>
          <div style={styles.bgCircle1}></div>
          <div style={styles.bgCircle2}></div>
        </div>

        <div style={styles.heroContent}>
          {/* Logo */}
          <div style={styles.logoContainer}>
            <div style={styles.logoBox}>
              <svg style={styles.logoSvg} fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 42.4379C4 42.4379 14.0962 36.0744 24 41.1692C35.0664 46.8624 44 42.2078 44 42.2078L44 7.01134C44 7.01134 35.068 11.6577 24.0031 5.96913C14.0971 0.876274 4 7.27094 4 7.27094L4 42.4379Z" fill="currentColor"></path>
              </svg>
            </div>
            <span style={styles.logoText}>EduAI</span>
          </div>

          {/* Hero Text */}
          <h1 style={styles.heroTitle}>
            AI-Powered Personalized Learning for Everyone.
          </h1>
          <p style={styles.heroSubtitle}>
            Unlock your potential with AI-driven education. Join thousands of students achieving their learning goals.
          </p>

          {/* Image Container */}
          <div style={styles.imageContainer}>
            <div style={{
              ...styles.image,
              backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCAgRPiFVjVMPM4ext6TfdcQ9DQYTbq9cQoUO9knUEFK7L4IvD9hv9oAuHd6PQg5mBYQhDpnBtlHULJkHf_YSFDvjJ1EaTuwODwXsW0qsVr0dziM1ZS3en1qJms7FlxO9jpgUBuR7pS576gOBvok5nxmqCTmknbi1AtpLae3g3VOEIcVTVvuCK0L65pa2rG_JeCRXg5etqc5GV95b6SgLzFDVDpFddPL0oMm3MCQN2wTiMLLAOpwibmQ04wJnu8EO9kWrPYqcu7Fow')"
            }}></div>
          </div>
        </div>
      </div>

        {/* Right Section: Registration Form */}
        <div style={styles.rightSection}>
          <div style={styles.formContainer}>
            {/* Mobile Logo */}
            <div style={styles.mobileLogoContainer} className="mobile-logo">
              <svg style={styles.mobileLogoSvg} fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 42.4379C4 42.4379 14.0962 36.0744 24 41.1692C35.0664 46.8624 44 42.2078 44 42.2078L44 7.01134C44 7.01134 35.068 11.6577 24.0031 5.96913C14.0971 0.876274 4 7.27094 4 7.27094L4 42.4379Z" fill="currentColor"></path>
              </svg>
              <span style={styles.mobileLogoText}>EduAI</span>
            </div>

            {/* Header */}
            <div style={styles.header}>
              <h2 style={styles.title}>Create account</h2>
              <p style={styles.subtitle}>Join the EduAI platform</p>
            </div>

            {/* Error Message */}
            {error && (
              <div style={styles.errorBox}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {error}
              </div>
            )}

            {/* Role Selection */}
            <div style={styles.roleSection}>
              <label style={styles.label}>I am a</label>
              <div style={styles.roleGrid}>
                {ROLES.map((r) => {
                  const active = form.role === r.value;
                  return (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, role: r.value }))}
                      style={{
                        ...styles.roleCard,
                        borderColor: active ? "#1a1ad5" : "#e2e8f0",
                        background: active ? "#f0f0ff" : "white",
                      }}
                    >
                      <span style={styles.roleIcon}>{r.icon}</span>
                      <div style={styles.roleInfo}>
                        <p style={{ ...styles.roleLabel, color: active ? "#1a1ad5" : "#0f172a" }}>
                          {r.label}
                        </p>
                        <p style={{ ...styles.roleDesc, color: active ? "#1a1ad5" : "#64748b" }}>
                          {r.desc}
                        </p>
                      </div>
                      {active && (
                        <span style={styles.checkIcon}>✓</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Registration Form */}
            <form onSubmit={handleSubmit} style={styles.form}>
              {/* Full Name */}
              <div style={styles.fieldContainer}>
                <label style={styles.label} htmlFor="full_name">Full Name</label>
                <div style={styles.inputWrapper}>
                  <span style={styles.inputIcon}>👤</span>
                  <input
                    type="text"
                    name="name"
                    id="full_name"
                    autoComplete="name"
                    placeholder="John Doe"
                    value={form.name}
                    onChange={handleChange}
                    required
                    style={styles.input}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#1a1ad5";
                      e.target.style.boxShadow = "0 0 0 3px rgba(26, 26, 213, 0.1)";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "#e2e8f0";
                      e.target.style.boxShadow = "none";
                    }}
                  />
                </div>
              </div>

              {/* Email */}
              <div style={styles.fieldContainer}>
                <label style={styles.label} htmlFor="email">Email address</label>
                <div style={styles.inputWrapper}>
                  <span style={styles.inputIcon}>✉</span>
                  <input
                    type="email"
                    name="email"
                    id="email"
                    autoComplete="email"
                    placeholder="john@example.com"
                    value={form.email}
                    onChange={handleChange}
                    required
                    style={styles.input}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#1a1ad5";
                      e.target.style.boxShadow = "0 0 0 3px rgba(26, 26, 213, 0.1)";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "#e2e8f0";
                      e.target.style.boxShadow = "none";
                    }}
                  />
                </div>
              </div>

              {/* Password Row */}
              <div style={styles.passwordRow}>
                <div style={styles.fieldContainer}>
                  <label style={styles.label} htmlFor="password">Password</label>
                  <div style={styles.inputWrapper}>
                    <span style={styles.inputIcon}>🔒</span>
                    <input
                      type="password"
                      name="password"
                      id="password"
                      autoComplete="new-password"
                      placeholder="••••••••"
                      value={form.password}
                      onChange={handleChange}
                      required
                      style={styles.input}
                      onFocus={(e) => {
                        e.target.style.borderColor = "#1a1ad5";
                        e.target.style.boxShadow = "0 0 0 3px rgba(26, 26, 213, 0.1)";
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = "#e2e8f0";
                        e.target.style.boxShadow = "none";
                      }}
                    />
                  </div>
                </div>

                <div style={styles.fieldContainer}>
                  <label style={styles.label} htmlFor="confirm_password">Confirm Password</label>
                  <div style={styles.inputWrapper}>
                    <span style={styles.inputIcon}>🔑</span>
                    <input
                      type="password"
                      name="confirmPassword"
                      id="confirm_password"
                      autoComplete="new-password"
                      placeholder="••••••••"
                      value={form.confirmPassword}
                      onChange={handleChange}
                      required
                      style={styles.input}
                      onFocus={(e) => {
                        e.target.style.borderColor = "#1a1ad5";
                        e.target.style.boxShadow = "0 0 0 3px rgba(26, 26, 213, 0.1)";
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = "#e2e8f0";
                        e.target.style.boxShadow = "none";
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  ...styles.submitButton,
                  opacity: loading ? 0.75 : 1,
                  cursor: loading ? "not-allowed" : "pointer"
                }}
                onMouseEnter={(e) => {
                  if (!loading) e.currentTarget.style.background = "#1515b8";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#1a1ad5";
                }}
              >
                <span>{loading ? "Creating account..." : "Create Account"}</span>
                <span style={styles.arrowIcon}>→</span>
              </button>
            </form>

            {/* Footer Link */}
            <p style={styles.signupText}>
              Already have an account?{" "}
              <Link to="/login" style={styles.signupLink}>
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

/* ── Styles ──────────────────────────────────────────────── */
const styles = {
  container: {
    display: "flex",
    width: "100%",
    height: "100vh",
    fontFamily: "'Inter', sans-serif",
    overflow: "hidden",
  },
  // Left Hero Section
  leftSection: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    padding: "2rem",
    overflow: "hidden",
    background: "#0f172a",
    position: "relative",
  },
  bgOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    opacity: 0.15,
  },
  bgCircle1: {
    position: "absolute",
    top: "-10%",
    left: "-10%",
    width: "50%",
    height: "50%",
    borderRadius: "50%",
    background: "#2dd4bf",
    filter: "blur(100px)",
  },
  bgCircle2: {
    position: "absolute",
    bottom: "-10%",
    right: "-10%",
    width: "60%",
    height: "60%",
    borderRadius: "50%",
    background: "white",
    filter: "blur(120px)",
  },
  heroContent: {
    position: "relative",
    zIndex: 1,
    maxWidth: "500px",
    width: "100%",
    textAlign: "left",
  },
  logoContainer: {
    display: "flex",
    alignItems: "center",
    gap: "0.625rem",
    marginBottom: "1.5rem",
  },
  logoBox: {
    background: "white",
    padding: "0.4rem",
    borderRadius: "0.4rem",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
  },
  logoSvg: {
    width: "1.5rem",
    height: "1.5rem",
    color: "#0f172a",
  },
  logoText: {
    color: "white",
    fontSize: "1.5rem",
    fontWeight: 800,
    letterSpacing: "-0.025em",
  },
  heroTitle: {
    color: "white",
    fontSize: "2rem",
    fontWeight: 800,
    lineHeight: 1.2,
    marginBottom: "0.875rem",
    letterSpacing: "-0.025em",
  },
  heroSubtitle: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: "0.9375rem",
    lineHeight: 1.6,
    marginBottom: "1.5rem",
    maxWidth: "26rem",
  },
  imageContainer: {
    width: "100%",
    height: "240px",
    borderRadius: "0.75rem",
    background: "rgba(255, 255, 255, 0.08)",
    backdropFilter: "blur(10px)",
    padding: "0.75rem",
    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 0 20px rgba(45, 212, 191, 0.2)",
    overflow: "hidden",
    border: "1px solid rgba(255, 255, 255, 0.15)",
  },
  image: {
    width: "100%",
    height: "100%",
    borderRadius: "0.5rem",
    backgroundPosition: "center",
    backgroundSize: "cover",
  },
  // Right Form Section
  rightSection: {
    width: "100%",
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "1.5rem",
    background: "#f6f6f8",
    overflow: "auto",
  },
  formContainer: {
    width: "100%",
    maxWidth: "480px",
  },
  mobileLogoContainer: {
    display: "none",
    alignItems: "center",
    gap: "0.5rem",
    marginBottom: "1.5rem",
  },
  mobileLogoSvg: {
    width: "1.875rem",
    height: "1.875rem",
    color: "#2dd4bf",
  },
  mobileLogoText: {
    color: "#0a0a2e",
    fontSize: "1.125rem",
    fontWeight: 700,
  },
  header: {
    marginBottom: "1.25rem",
  },
  title: {
    fontSize: "1.875rem",
    fontWeight: 900,
    color: "#0f172a",
    letterSpacing: "-0.025em",
    marginBottom: "0.375rem",
    lineHeight: 1.2,
  },
  subtitle: {
    color: "#64748b",
    fontSize: "0.875rem",
    lineHeight: 1.5,
  },
  // Role Selection
  roleSection: {
    marginBottom: "1rem",
  },
  label: {
    display: "block",
    fontSize: "0.8125rem",
    fontWeight: 600,
    color: "#0f172a",
    marginBottom: "0.5rem",
  },
  roleGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "0.75rem",
  },
  roleCard: {
    position: "relative",
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: "0.375rem",
    padding: "0.75rem",
    border: "2px solid",
    borderRadius: "0.75rem",
    background: "white",
    cursor: "pointer",
    transition: "all 0.2s",
    textAlign: "left",
  },
  roleIcon: {
    fontSize: "1.25rem",
  },
  roleInfo: {
    display: "flex",
    flexDirection: "column",
  },
  roleLabel: {
    fontSize: "0.8125rem",
    fontWeight: 700,
    margin: 0,
  },
  roleDesc: {
    fontSize: "0.6875rem",
    margin: 0,
  },
  checkIcon: {
    position: "absolute",
    top: "0.5rem",
    right: "0.5rem",
    fontSize: "0.875rem",
    color: "#1a1ad5",
  },
  // Error
  errorBox: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.75rem 0.875rem",
    borderRadius: "0.625rem",
    background: "#fef2f2",
    border: "1px solid #fecaca",
    color: "#dc2626",
    fontSize: "0.8125rem",
    fontWeight: 500,
    marginBottom: "1rem",
  },
  // Form
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "0.875rem",
  },
  fieldContainer: {
    display: "flex",
    flexDirection: "column",
  },
  inputWrapper: {
    position: "relative",
    display: "flex",
    alignItems: "center",
  },
  inputIcon: {
    position: "absolute",
    left: "0.75rem",
    fontSize: "1.125rem",
    pointerEvents: "none",
  },
  input: {
    width: "100%",
    padding: "0.75rem 0.875rem 0.75rem 2.5rem",
    borderRadius: "0.5rem",
    border: "1px solid #e2e8f0",
    background: "white",
    color: "#0f172a",
    fontSize: "0.875rem",
    outline: "none",
    transition: "all 0.2s",
    fontFamily: "inherit",
    boxSizing: "border-box",
  },
  passwordRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "0.75rem",
  },
  submitButton: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
    padding: "0.875rem",
    borderRadius: "0.5rem",
    border: "none",
    background: "#1a1ad5",
    color: "white",
    fontSize: "0.9375rem",
    fontWeight: 700,
    cursor: "pointer",
    transition: "all 0.2s",
    boxShadow: "0 10px 15px -3px rgba(26, 26, 213, 0.2)",
    marginTop: "0.25rem",
  },
  arrowIcon: {
    fontSize: "1.125rem",
  },
  signupText: {
    textAlign: "center",
    marginTop: "1.25rem",
    color: "#64748b",
    fontSize: "0.8125rem",
  },
  signupLink: {
    color: "#1a1ad5",
    fontWeight: 700,
    textDecoration: "none",
  },
};