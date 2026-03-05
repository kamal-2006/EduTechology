const express = require("express");
const {
  getStudentAnalytics,
  getAdminAnalytics,
} = require("../controllers/analyticsController");
const { protect, authorise } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/student/:id", protect, getStudentAnalytics);
router.get("/admin",       protect, authorise("admin", "faculty"), getAdminAnalytics);

module.exports = router;
