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

// ── POST /api/quiz – Admin only ───────────────────────────────────────────────
const createQuiz = async (req, res) => {
  try {
    const { courseId, title, questions, totalMarks } = req.body;
    if (!courseId || !title || !questions || questions.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "courseId, title, and questions are required." });
    }
    const quiz = await Quiz.create({ courseId, title, questions, totalMarks });
    res.status(201).json({ success: true, data: quiz });
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
  submitQuiz,
};
