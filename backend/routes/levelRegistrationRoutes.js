const express = require("express");
const router  = express.Router();
const { protect, authorise } = require("../middleware/authMiddleware");
const {
  registerLevel,
  getMyActiveLevels,
  getCourseStatus,
  submitLevelQuiz,
  getAttemptHistory,
  getAllCoursesStatus,
  getAllRegistrations,
} = require("../controllers/levelRegistrationController");

// Student routes
router.post("/register",                              protect, registerLevel);
router.get("/my-levels",                              protect, getMyActiveLevels);
router.get("/all-courses-status",                     protect, getAllCoursesStatus);
router.get("/course-status/:courseId",                protect, getCourseStatus);
router.post("/submit-quiz",                           protect, submitLevelQuiz);
router.get("/attempts/:courseId/:levelNumber",        protect, getAttemptHistory);

// Admin / Faculty route
router.get("/admin/all", protect, authorise("admin", "faculty"), getAllRegistrations);

module.exports = router;
