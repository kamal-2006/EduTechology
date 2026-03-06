const express = require("express");
const router  = express.Router();

const { protect, authorise } = require("../middleware/authMiddleware");
const {
  getRecommendations,
  refreshRecommendations,
} = require("../controllers/recommendationController");

// GET /api/recommendations/:studentId
// Students: own only. Admin/Faculty: any student.
router.get(
  "/:studentId",
  protect,
  getRecommendations
);

// POST /api/recommendations/refresh
// Regenerates recommendations on demand.
router.post(
  "/refresh",
  protect,
  refreshRecommendations
);

module.exports = router;
