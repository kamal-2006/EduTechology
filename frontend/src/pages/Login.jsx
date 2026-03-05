import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authAPI } from "../services/api.js";

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState("student");
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await authAPI.login(form);
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Please try again.");
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

      {/* Right Section: Login Card */}
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
            <h2 style={styles.title}>Welcome Back</h2>
            <p style={styles.subtitle}>Sign in to continue your learning journey.</p>
          </div>

          {/* Role Selector Tabs */}
          <div style={styles.tabsContainer}>
            <button
              type="button"
              onClick={() => setRole("student")}
              style={role === "student" ? styles.tabActive : styles.tabInactive}
              onMouseEnter={(e) => {
                if (role !== "student") e.currentTarget.style.color = "#334155";
              }}
              onMouseLeave={(e) => {
                if (role !== "student") e.currentTarget.style.color = "#64748b";
              }}
            >
              Student
            </button>
            <button
              type="button"
              onClick={() => setRole("admin")}
              style={role === "admin" ? styles.tabActive : styles.tabInactive}
              onMouseEnter={(e) => {
                if (role !== "admin") e.currentTarget.style.color = "#334155";
              }}
              onMouseLeave={(e) => {
                if (role !== "admin") e.currentTarget.style.color = "#64748b";
              }}
            >
              Admin
            </button>
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

          {/* Login Form */}
          <form onSubmit={handleSubmit} style={styles.form}>
            {/* Email Field */}
            <div style={styles.fieldContainer}>
              <label style={styles.label}>Email or Username</label>
              <div style={styles.inputWrapper}>
                <span style={styles.icon}>✉</span>
                <input
                  type="email"
                  name="email"
                  autoComplete="email"
                  placeholder="Enter your email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  style={styles.input}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#6366f1";
                    e.target.style.boxShadow = "0 0 0 3px rgba(99, 102, 241, 0.1)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#e2e8f0";
                    e.target.style.boxShadow = "none";
                  }}
                />
              </div>
            </div>

            {/* Password Field */}
            <div style={styles.fieldContainer}>
              <div style={styles.labelRow}>
                <label style={styles.label}>Password</label>
                <a href="#" style={styles.forgotLink}>Forgot Password?</a>
              </div>
              <div style={styles.inputWrapper}>
                <span style={styles.icon}>🔒</span>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  style={styles.input}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#6366f1";
                    e.target.style.boxShadow = "0 0 0 3px rgba(99, 102, 241, 0.1)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#e2e8f0";
                    e.target.style.boxShadow = "none";
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                >
                  {showPassword ? "👁️" : "👁️‍🗨️"}
                </button>
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
                if (!loading) e.currentTarget.style.background = "#5558e3";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#6366f1";
              }}
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          {/* Create Account Link */}
          <p style={styles.signupText}>
            Don't have an account?{" "}
            <Link to="/register" style={styles.signupLink}>
              Create an account
            </Link>
          </p>

          {/* Footer Links */}
          <div style={styles.footer}>
            <a
              href="#"
              style={styles.footerLink}
              onMouseEnter={(e) => e.currentTarget.style.color = "#6366f1"}
              onMouseLeave={(e) => e.currentTarget.style.color = "#94a3b8"}
            >
              Privacy Policy
            </a>
            <a
              href="#"
              style={styles.footerLink}
              onMouseEnter={(e) => e.currentTarget.style.color = "#6366f1"}
              onMouseLeave={(e) => e.currentTarget.style.color = "#94a3b8"}
            >
              Terms of Service
            </a>
            <a
              href="#"
              style={styles.footerLink}
              onMouseEnter={(e) => e.currentTarget.style.color = "#6366f1"}
              onMouseLeave={(e) => e.currentTarget.style.color = "#94a3b8"}
            >
              Help Center
            </a>
          </div>
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
    background: "#f8fafc",
    overflow: "auto",
  },
  formContainer: {
    width: "100%",
    maxWidth: "420px",
  },
  mobileLogoContainer: {
    display: "none",
    alignItems: "center",
    gap: "0.5rem",
    marginBottom: "1.5rem",
  },
  mobileLogoSvg: {
    width: "1.25rem",
    height: "1.25rem",
    color: "#6366f1",
  },
  mobileLogoText: {
    color: "#0f172a",
    fontSize: "1.125rem",
    fontWeight: 700,
  },
  header: {
    marginBottom: "1.25rem",
  },
  title: {
    fontSize: "1.875rem",
    fontWeight: 800,
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
  // Role Tabs
  tabsContainer: {
    display: "flex",
    background: "rgba(226, 232, 240, 0.5)",
    padding: "0.25rem",
    borderRadius: "0.625rem",
    marginBottom: "1.5rem",
    border: "1px solid rgba(226, 232, 240, 0.6)",
  },
  tabActive: {
    flex: 1,
    padding: "0.5rem",
    fontSize: "0.8125rem",
    fontWeight: 700,
    borderRadius: "0.375rem",
    border: "none",
    background: "#6366f1",
    color: "white",
    cursor: "pointer",
    transition: "all 0.2s",
    boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
  },
  tabInactive: {
    flex: 1,
    padding: "0.5rem",
    fontSize: "0.8125rem",
    fontWeight: 600,
    borderRadius: "0.375rem",
    border: "none",
    background: "transparent",
    color: "#64748b",
    cursor: "pointer",
    transition: "all 0.2s",
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
    gap: "1rem",
  },
  fieldContainer: {
    display: "flex",
    flexDirection: "column",
  },
  label: {
    display: "block",
    fontSize: "0.8125rem",
    fontWeight: 600,
    color: "#334155",
    marginBottom: "0.375rem",
  },
  labelRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "0.375rem",
  },
  forgotLink: {
    fontSize: "0.8125rem",
    fontWeight: 600,
    color: "#6366f1",
    textDecoration: "none",
  },
  inputWrapper: {
    position: "relative",
    display: "flex",
    alignItems: "center",
  },
  icon: {
    position: "absolute",
    left: "0.875rem",
    fontSize: "1.125rem",
    color: "#94a3b8",
    pointerEvents: "none",
  },
  input: {
    width: "100%",
    padding: "0.75rem 0.875rem 0.75rem 2.5rem",
    borderRadius: "0.625rem",
    border: "1.5px solid #e2e8f0",
    background: "white",
    color: "#0f172a",
    fontSize: "0.875rem",
    outline: "none",
    transition: "all 0.2s",
    fontFamily: "inherit",
    boxSizing: "border-box",
  },
  eyeButton: {
    position: "absolute",
    right: "0.875rem",
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: "1.125rem",
    color: "#94a3b8",
    padding: 0,
  },
  submitButton: {
    width: "100%",
    padding: "0.75rem",
    borderRadius: "0.625rem",
    border: "none",
    background: "#6366f1",
    color: "white",
    fontSize: "0.9375rem",
    fontWeight: 700,
    cursor: "pointer",
    transition: "all 0.2s",
    boxShadow: "0 4px 6px -1px rgba(99, 102, 241, 0.15)",
    marginTop: "0.25rem",
  },
  signupText: {
    textAlign: "center",
    marginTop: "1.5rem",
    color: "#475569",
    fontWeight: 500,
    fontSize: "0.875rem",
  },
  signupLink: {
    fontSize: "0.875rem",
    fontWeight: 700,
    color: "#6366f1",
    textDecoration: "none",
  },
  footer: {
    marginTop: "1.5rem",
    display: "flex",
    justifyContent: "center",
    gap: "1.25rem",
  },
  footerLink: {
    fontSize: "0.6875rem",
    color: "#94a3b8",
    textDecoration: "none",
    transition: "color 0.2s",
  },
};