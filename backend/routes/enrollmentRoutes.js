const express    = require("express");
const router     = express.Router();
const { protect, authorise } = require("../middleware/authMiddleware");
const {
  enrollCourse,
  getMyEnrollments,
  checkEnrollment,
  unenroll,
  completeLevel,
  getAllEnrollments,
} = require("../controllers/enrollmentController");

// Student routes
router.post("/",                                protect, enrollCourse);
router.get("/my",                               protect, getMyEnrollments);
router.get("/check/:courseId",                  protect, checkEnrollment);
router.delete("/:courseId",                     protect, unenroll);
router.patch("/:courseId/complete-level",       protect, completeLevel);

// Admin / Faculty route
router.get("/admin",  protect, authorise("admin", "faculty"), getAllEnrollments);

module.exports = router;
