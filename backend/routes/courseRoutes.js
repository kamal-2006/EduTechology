const express = require("express");
const {
  getCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
} = require("../controllers/courseController");
const { protect, authorise } = require("../middleware/authMiddleware");

const router = express.Router();

router
  .route("/")
  .get(protect, getCourses)
  .post(protect, authorise("admin", "faculty"), createCourse);

router
  .route("/:id")
  .get(protect, getCourseById)
  .put(protect,    authorise("admin", "faculty"), updateCourse)
  .delete(protect, authorise("admin", "faculty"), deleteCourse);

module.exports = router;
