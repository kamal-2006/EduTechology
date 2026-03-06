const axios    = require("axios");
const Quiz     = require("../models/Quiz");
const Progress = require("../models/Progress");

// ── Helpers ────────────────────────────────────────────────────────────────────

/**
 * Rule-based AI recommendation level derived from quiz score.
 */
const getRecommendedLevel = (score) => {
  if (score < 40)  return "Beginner";
  if (score <= 75) return "Intermediate";
  return "Advanced";
};

/**
 * Call Flask ML microservice.
 * Returns { predictedPerformance, dropoutRisk } or falls back to defaults.
 */
const getMLPrediction = async (quizScore, attempts, timeTaken) => {
  try {
    const { data } = await axios.post(
      `${process.env.ML_SERVICE_URL}/predict`,
      { quizScore, attempts, timeTaken },
      { timeout: 5000 }
    );
    return {
      predictedPerformance: data.predictedPerformance || "Medium",
      dropoutRisk:          data.dropoutRisk          || "No",
    };
  } catch (err) {
    console.warn("[quizController] ML service unavailable – using defaults.", err.message);
    return { predictedPerformance: "Medium", dropoutRisk: "No" };
  }
};

// ── GET /api/quiz/:courseId ────────────────────────────────────────────────────
const getQuizByCourse = async (req, res) => {
  try {
    const quizzes = await Quiz.find({ courseId: req.params.courseId });
    res.status(200).json({ success: true, count: quizzes.length, data: quizzes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── GET /api/quiz/detail/:quizId ──────────────────────────────────────────────
const getQuizById = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.quizId);
    if (!quiz) {
      return res.status(404).json({ success: false, message: "Quiz not found." });
    }
    res.status(200).json({ success: true, data: quiz });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── POST /api/quiz – Admin / Faculty ─────────────────────────────────────────
const createQuiz = async (req, res) => {
  try {
    const { courseId, title, questions, totalMarks, levelNumber, timeLimit } = req.body;
    if (!courseId || !title || !questions || questions.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "courseId, title, and questions are required." });
    }
    const quiz = await Quiz.create({
      courseId,
      title,
      questions,
      totalMarks:  totalMarks  ?? 100,
      levelNumber: levelNumber != null ? Number(levelNumber) : null,
      timeLimit:   timeLimit   ? Number(timeLimit) : null,
    });
    res.status(201).json({ success: true, data: quiz });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── Helpers for file parsing ──────────────────────────────────────────────────

/** Parse a single CSV line, respecting double-quoted fields. */
function parseCSVLine(line) {
  const result = [];
  let current  = "";
  let inQuotes = false;
  for (const ch of line) {
    if (ch === '"') { inQuotes = !inQuotes; }
    else if (ch === "," && !inQuotes) { result.push(current.trim()); current = ""; }
    else { current += ch; }
  }
  result.push(current.trim());
  return result;
}

/**
 * Normalise a raw row object (from JSON, CSV, or Excel) into the question schema shape.
 * Accepts flexible column names / JSON shapes.
 */
function normalizeQuestion(q) {
  const questionText =
    (q.questionText || q.question || q.Question || q["Question Text"] || "").toString().trim();

  let options = [];
  if (Array.isArray(q.options)) {
    options = q.options.map((o) => String(o).trim()).filter(Boolean);
  } else {
    // Accept option1…option6, opt1…opt6, Option 1, A/B/C/D columns, etc.
    const optKeys = Object.keys(q)
      .filter((k) => /^(option|opt)[\s]?[1-9]/i.test(k))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    options = optKeys.map((k) => String(q[k]).trim()).filter(Boolean);
  }

  const correctAnswer = (
    q.correctAnswer || q.correct || q.answer ||
    q["Correct Answer"] || q.Answer || ""
  ).toString().trim();

  return { questionText, options, correctAnswer };
}

// ── POST /api/quiz/parse-file – Admin / Faculty ───────────────────────────────
// Route is protected: only authenticated admin/faculty can upload files here.
const parseQuizFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded." });
    }

    const originalName = req.file.originalname || "";
    const ext = originalName.slice(originalName.lastIndexOf(".")).toLowerCase();
    let questions = [];

    if (ext === ".json") {
      const raw  = req.file.buffer.toString("utf-8");
      const data = JSON.parse(raw);
      const arr  = Array.isArray(data) ? data : (data.questions || []);
      questions  = arr.map(normalizeQuestion).filter((q) => q.questionText);

    } else if (ext === ".csv") {
      const lines = req.file.buffer
        .toString("utf-8")
        .replace(/\r\n/g, "\n").replace(/\r/g, "\n")
        .trim().split("\n").filter(Boolean);
      if (lines.length < 2) {
        throw new Error("CSV must have a header row and at least one data row.");
      }
      const headers = parseCSVLine(lines[0]).map((h) => h.trim());
      for (let i = 1; i < lines.length; i++) {
        const cols = parseCSVLine(lines[i]);
        const row  = {};
        headers.forEach((h, idx) => { row[h] = cols[idx] ?? ""; });
        const q = normalizeQuestion(row);
        if (q.questionText) questions.push(q);
      }

    } else if (ext === ".xlsx" || ext === ".xls") {
      // xlsx package is access-controlled: only authenticated admin/faculty reach this branch.
      const XLSX = require("xlsx");
      const wb   = XLSX.read(req.file.buffer, { type: "buffer" });
      const ws   = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws, { defval: "" });
      questions  = rows.map(normalizeQuestion).filter((q) => q.questionText);

    } else {
      return res
        .status(400)
        .json({ success: false, message: "Unsupported file type. Use JSON, CSV, or Excel (.xlsx/.xls)." });
    }

    if (questions.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No valid questions found in the file. Check the format." });
    }

    res.status(200).json({ success: true, count: questions.length, data: questions });
  } catch (error) {
    res.status(400).json({ success: false, message: `File parsing failed: ${error.message}` });
  }
};

// ── PUT /api/quiz/:quizId – Admin / Faculty ───────────────────────────────────
const updateQuiz = async (req, res) => {
  try {
    const { title, questions, totalMarks, levelNumber, timeLimit } = req.body;
    const quiz = await Quiz.findById(req.params.quizId);
    if (!quiz) return res.status(404).json({ success: false, message: "Quiz not found." });

    if (title       !== undefined) quiz.title       = title;
    if (totalMarks  !== undefined) quiz.totalMarks  = Number(totalMarks);
    if (levelNumber !== undefined) quiz.levelNumber = levelNumber != null ? Number(levelNumber) : null;
    if (timeLimit   !== undefined) quiz.timeLimit   = timeLimit ? Number(timeLimit) : null;
    if (Array.isArray(questions) && questions.length > 0) quiz.questions = questions;

    await quiz.save();
    res.status(200).json({ success: true, data: quiz });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── POST /api/quiz/submit ─────────────────────────────────────────────────────
const submitQuiz = async (req, res) => {
  try {
    const { quizId, courseId, answers, timeTaken } = req.body;
    const studentId = req.user._id;

    if (!quizId || !courseId || !answers) {
      return res
        .status(400)
        .json({ success: false, message: "quizId, courseId and answers are required." });
    }

    // ── 1. Fetch quiz & grade answers ─────────────────────────────────────────
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ success: false, message: "Quiz not found." });
    }

    let correct = 0;
    quiz.questions.forEach((q) => {
      const submitted = answers[q._id.toString()];
      if (submitted && submitted === q.correctAnswer) correct++;
    });

    const quizScore = Math.round((correct / quiz.questions.length) * 100);

    // ── 2. Count prior attempts ───────────────────────────────────────────────
    const priorAttempts = await Progress.countDocuments({ studentId, quizId });
    const attempts = priorAttempts + 1;

    // ── 3. AI rule-based recommendation ──────────────────────────────────────
    const recommendedLevel = getRecommendedLevel(quizScore);

    // ── 4. ML prediction via Flask microservice ───────────────────────────────
    const { predictedPerformance, dropoutRisk } = await getMLPrediction(
      quizScore,
      attempts,
      timeTaken || 10
    );

    // ── 5. Persist progress ───────────────────────────────────────────────────
    const progress = await Progress.create({
      studentId,
      courseId,
      quizId,
      quizScore,
      attempts,
      timeTaken:            timeTaken || 10,
      recommendedLevel,
      predictedPerformance,
      dropoutRisk,
    });

    res.status(201).json({
      success: true,
      data: {
        quizScore,
        correct,
        total:                quiz.questions.length,
        recommendedLevel,
        predictedPerformance,
        dropoutRisk,
        progressId:           progress._id,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getQuizByCourse,
  getQuizById,
  createQuiz,
  parseQuizFile,
  submitQuiz,
  updateQuiz,
};
