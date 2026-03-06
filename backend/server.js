require("dotenv").config();

const express = require("express");
const cors    = require("cors");
const morgan  = require("morgan");

const connectDB      = require("./config/db");
const authRoutes     = require("./routes/authRoutes");
const courseRoutes   = require("./routes/courseRoutes");
const quizRoutes     = require("./routes/quizRoutes");
const analyticsRoutes          = require("./routes/analyticsRoutes");
const enrollmentRoutes         = require("./routes/enrollmentRoutes");
const levelRegistrationRoutes  = require("./routes/levelRegistrationRoutes");
const recommendationRoutes     = require("./routes/recommendationRoutes");
const aiRoutes                 = require("./routes/aiRoutes");

// ── Connect Database ───────────────────────────────────────────────────────────
connectDB();

const app = express();

// ── Middleware ─────────────────────────────────────────────────────────────────
app.use(cors({ origin: "*" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV !== "test") app.use(morgan("dev"));

// ── Routes ─────────────────────────────────────────────────────────────────────
app.use("/api/auth",      authRoutes);
app.use("/api/courses",   courseRoutes);
app.use("/api/quiz",      quizRoutes);
app.use("/api/analytics",         analyticsRoutes);
app.use("/api/enrollments",       enrollmentRoutes);
app.use("/api/level-reg",         levelRegistrationRoutes);
app.use("/api/recommendations",   recommendationRoutes);
app.use("/api/ai",                aiRoutes);

// ── Non-blocking: build RAG embeddings index on first startup ────────────────
setTimeout(async () => {
  try {
    const { indexCoursesIfNeeded } = require("./controllers/aiController");
    await indexCoursesIfNeeded();
  } catch (err) {
    console.warn("[AI] Startup indexing skipped:", err.message);
  }
}, 8000); // wait 8s after boot so DB connection is settled

// ── Health check ───────────────────────────────────────────────────────────────
app.get("/api/health", (_, res) =>
  res.json({ status: "OK", timestamp: new Date().toISOString() })
);

// ── 404 handler ────────────────────────────────────────────────────────────────
app.use((req, res) =>
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found.` })
);

// ── Global error handler ───────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("[Global Error]", err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`[Server] Running on http://localhost:${PORT} (${process.env.NODE_ENV || "development"})`)
);
