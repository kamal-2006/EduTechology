import { Navigate } from "react-router-dom";

/**
 * Wraps a route that requires authentication.
 * Optionally restricts access to a specific role.
 * Usage: <ProtectedRoute role="admin"><AdminPage /></ProtectedRoute>
 */
export default function ProtectedRoute({ children, role }) {
  const token = localStorage.getItem("token");
  const raw   = localStorage.getItem("user");
  const user  = raw ? JSON.parse(raw) : null;

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (role && user.role !== role) {
    return <Navigate to="/" replace />;
  }

  return children;
}
