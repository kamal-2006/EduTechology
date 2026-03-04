import { useState, useEffect } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";

/* ── Inline SVG Icons ────────────────────────────────────────────────────── */
const Icon = {
  Dashboard: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
    </svg>
  ),
  Courses: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
    </svg>
  ),
  Analytics: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/>
      <line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/>
      <line x1="2" y1="20" x2="22" y2="20"/>
    </svg>
  ),
  Admin: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
  Logout: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  ),
  Menu: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="6" x2="21" y2="6"/>
      <line x1="3" y1="12" x2="21" y2="12"/>
      <line x1="3" y1="18" x2="21" y2="18"/>
    </svg>
  ),
  Close: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  Plus: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"/>
      <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  ),
  Students: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
      <path d="M6 12v5c3 3 9 3 12 0v-5"/>
    </svg>
  ),
};

/* ── Helpers ─────────────────────────────────────────────────────────────── */
function getInitials(name = "") {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "?";
}

/* ── Sidebar Component ───────────────────────────────────────────────────── */
export default function Sidebar() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const [open, setOpen] = useState(false);

  const raw  = localStorage.getItem("user");
  const user = raw ? JSON.parse(raw) : null;

  // Close sidebar when route changes (mobile)
  useEffect(() => { setOpen(false); }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  if (!user) return null;

  return (
    <>
      {/* Mobile hamburger toggle */}
      <button
        className="sidebar-toggle"
        onClick={() => setOpen((v) => !v)}
        aria-label="Toggle menu"
      >
        {open ? <Icon.Close /> : <Icon.Menu />}
      </button>

      {/* Backdrop overlay */}
      <div
        className={`sidebar-overlay${open ? " open" : ""}`}
        onClick={() => setOpen(false)}
      />

      {/* Sidebar panel */}
      <aside className={`sidebar${open ? " open" : ""}`}>

        {/* Brand */}
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">🎓</div>
          <div className="sidebar-brand-text">
            <span className="sidebar-brand-title">EduLearn AI</span>
            <span className="sidebar-brand-sub">Learning Platform</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          <span className="sidebar-section-label">Main</span>

          <NavLink to="/" end>
            <Icon.Dashboard />
            Dashboard
          </NavLink>

          {user.role === "admin" && (
            <NavLink to="/courses/create">
              <Icon.Plus />
              Create Course
            </NavLink>
          )}

          {user.role === "student" && (
            <NavLink to="/students">
              <Icon.Students />
              My Courses
            </NavLink>
          )}

          <span className="sidebar-section-label">Analytics</span>

          <NavLink to={`/analytics/${user.id}`}>
            <Icon.Analytics />
            My Analytics
          </NavLink>

          {user.role === "admin" && (
            <NavLink to="/analytics/admin">
              <Icon.Admin />
              Admin Analytics
            </NavLink>
          )}
        </nav>

        {/* Footer: user + logout */}
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">{getInitials(user.name)}</div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{user.name}</div>
              <div className="sidebar-user-role">
                <span className="sidebar-role-badge">{user.role}</span>
              </div>
            </div>
          </div>

          <button className="sidebar-logout" onClick={handleLogout}>
            <Icon.Logout />
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}
