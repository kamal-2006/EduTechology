import { Navigate } from "react-router-dom";

/**
 * Wraps a route that requires authentication.
 * Optionally restricts access to specific roles.
 * Usage (single):  <ProtectedRoute role="admin"><Page /></ProtectedRoute>
 * Usage (multiple): <ProtectedRoute roles={["admin","faculty"]}><Page /></ProtectedRoute>
 */
export default function ProtectedRoute({ children, role, roles }) {
  const token = localStorage.getItem("token");
  const raw   = localStorage.getItem("user");
  const user  = raw ? JSON.parse(raw) : null;

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  const allowed = roles || (role ? [role] : null);
  if (allowed && !allowed.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
