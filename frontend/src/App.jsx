import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { createContext, useState, useEffect }                   from "react";
import Sidebar        from "./components/Sidebar.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Login          from "./pages/Login.jsx";
import Register       from "./pages/Register.jsx";
import Dashboard      from "./pages/Dashboard.jsx";
import CoursePage     from "./pages/CoursePage.jsx";
import QuizPage       from "./pages/QuizPage.jsx";
import Analytics      from "./pages/Analytics.jsx";
import Students       from "./pages/Students.jsx";
import LevelPage      from "./pages/LevelPage.jsx";

/* Shared auth context so pages can read current user without prop-drilling */
export const AuthContext = createContext({ user: null, setUser: () => {} });

/* AuthProvider reads user from localStorage and provides it via context */
function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("user")); } catch { return null; }
  });
  useEffect(() => {
    const sync = () => {
      try { setUser(JSON.parse(localStorage.getItem("user"))); } catch { setUser(null); }
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);
  return <AuthContext.Provider value={{ user, setUser }}>{children}</AuthContext.Provider>;
}

/* Wrap authenticated pages with the sidebar layout */
function AppShell({ children }) {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">{children}</main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
        {/* Public – no sidebar */}
        <Route path="/login"    element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected – sidebar layout */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppShell><Dashboard /></AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/courses/:id"
          element={
            <ProtectedRoute>
              <AppShell><CoursePage /></AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/quiz/:quizId"
          element={
            <ProtectedRoute>
              <AppShell><QuizPage /></AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/analytics/:id"
          element={
            <ProtectedRoute>
              <AppShell><Analytics /></AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/students"
          element={
            <ProtectedRoute>
              <AppShell><Students /></AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/courses/:courseId/level/:levelNum"
          element={
            <ProtectedRoute>
              <AppShell><LevelPage /></AppShell>
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

