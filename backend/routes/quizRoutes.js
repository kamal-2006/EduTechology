const express = require("express");
const path    = require("path");
const multer  = require("multer");
const {
  getQuizByCourse,
  getQuizById,
  createQuiz,
  parseQuizFile,
  submitQuiz,
  updateQuiz,
} = require("../controllers/quizController");
const { protect, authorise } = require("../middleware/authMiddleware");

const router = express.Router();

// Multer: memory storage, 5 MB limit, restricted to JSON/CSV/Excel only
const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if ([".json", ".csv", ".xlsx", ".xls"].includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Unsupported file type. Allowed: JSON, CSV, Excel (.xlsx/.xls)."));
    }
  },
});

// Student + Admin / Faculty
router.get("/:courseId",          protect, getQuizByCourse);
router.get("/detail/:quizId",     protect, getQuizById);
router.post("/submit",            protect, submitQuiz);

// Admin / Faculty only
router.post("/",                  protect, authorise("admin", "faculty"), createQuiz);
router.put("/:quizId",            protect, authorise("admin", "faculty"), updateQuiz);
router.post(
  "/parse-file",
  protect,
  authorise("admin", "faculty"),
  upload.single("file"),
  parseQuizFile
);

module.exports = router;
