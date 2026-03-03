import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// Attach JWT on every request if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Global response error handling
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

// ── Auth ───────────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post("/auth/register", data),
  login:    (data) => api.post("/auth/login",    data),
  getMe:    ()     => api.get("/auth/me"),
};

// ── Courses ────────────────────────────────────────────────────────────────────
export const courseAPI = {
  getAll:  ()       => api.get("/courses"),
  getById: (id)     => api.get(`/courses/${id}`),
  create:  (data)   => api.post("/courses", data),
  update:  (id, data) => api.put(`/courses/${id}`, data),
  remove:  (id)     => api.delete(`/courses/${id}`),
};

// ── Quiz ───────────────────────────────────────────────────────────────────────
export const quizAPI = {
  getByCourse: (courseId) => api.get(`/quiz/${courseId}`),
  getById:     (quizId)   => api.get(`/quiz/detail/${quizId}`),
  create:      (data)     => api.post("/quiz", data),
  submit:      (data)     => api.post("/quiz/submit", data),
};

// ── Analytics ─────────────────────────────────────────────────────────────────
export const analyticsAPI = {
  getStudentAnalytics: (id) => api.get(`/analytics/student/${id}`),
  getAdminAnalytics:   ()   => api.get("/analytics/admin"),
};

export default api;
