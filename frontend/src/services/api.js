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
  getAllStudents: () => api.get("/auth/students"),
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
  submit:      (data)     => api.post("/quiz/submit", data),  // FormData upload; let axios set multipart/form-data + boundary automatically
  parseFile:   (formData) => api.post("/quiz/parse-file", formData, {
    headers: { "Content-Type": undefined },
  }),};

// ── Analytics ─────────────────────────────────────────────────────────────────
export const analyticsAPI = {
  getStudentAnalytics: (id) => api.get(`/analytics/student/${id}`),
  getAdminAnalytics:   ()   => api.get("/analytics/admin"),
};

// ── Enrollments ───────────────────────────────────────────────────────────────
export const enrollmentAPI = {
  enroll:           (courseId)               => api.post("/enrollments", { courseId }),
  getMyEnrollments: ()                       => api.get("/enrollments/my"),
  checkEnrollment:  (courseId)               => api.get(`/enrollments/check/${courseId}`),
  unenroll:         (courseId)               => api.delete(`/enrollments/${courseId}`),
  completeLevel:    (courseId, levelNumber)  => api.patch(`/enrollments/${courseId}/complete-level`, { levelNumber }),
  getAllEnrollments: ()                       => api.get("/enrollments/admin"),
};

// ── Level Registration ────────────────────────────────────────────────────────
export const levelRegAPI = {
  registerLevel:       (courseId, levelNumber)                   => api.post("/level-reg/register", { courseId, levelNumber }),
  getMyActiveLevels:   ()                                        => api.get("/level-reg/my-levels"),
  getAllCoursesStatus:  ()                                        => api.get("/level-reg/all-courses-status"),
  getCourseStatus:     (courseId)                                => api.get(`/level-reg/course-status/${courseId}`),
  submitQuiz:          (courseId, levelNumber, answers, timeTaken) => api.post("/level-reg/submit-quiz", { courseId, levelNumber, answers, timeTaken }),
  getAttemptHistory:   (courseId, levelNumber)                   => api.get(`/level-reg/attempts/${courseId}/${levelNumber}`),
  getAllRegistrations:  ()                                        => api.get("/level-reg/admin/all"),
};

export default api;
