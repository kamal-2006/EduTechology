const express = require("express");
const {
  getQuizByCourse,
  getQuizById,
  createQuiz,
  submitQuiz,
} = require("../controllers/quizController");
const { protect, authorise } = require("../middleware/authMiddleware");

const router = express.Router();

// Student + Admin
router.get("/:courseId",          protect, getQuizByCourse);
router.get("/detail/:quizId",     protect, getQuizById);
router.post("/submit",            protect, submitQuiz);

// Admin only
router.post("/",                  protect, authorise("admin"), createQuiz);

module.exports = router;
