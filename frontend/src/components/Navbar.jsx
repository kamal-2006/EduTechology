import { Link, useNavigate } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();
  const raw  = localStorage.getItem("user");
  const user = raw ? JSON.parse(raw) : null;

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        🎓 AI Learning Platform
      </Link>

      <div className="navbar-links">
        {user ? (
          <>
            <Link to="/">Dashboard</Link>
            <Link to="/courses">Courses</Link>
            <Link to={`/analytics/${user.id}`}>Analytics</Link>
            {user.role === "admin" && (
              <Link to="/analytics/admin">Admin</Link>
            )}
            <span className="navbar-role-badge">{user.role}</span>
            <button onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}
