const Enrollment = require("../models/Enrollment");
const Course     = require("../models/Course");

// ── POST /api/enrollments ─────────────────────────────────────────────────────
// Enroll the authenticated student in a course
const enrollCourse = async (req, res) => {
  try {
    const { courseId } = req.body;
    const studentId    = req.user._id;

    if (!courseId) {
      return res.status(400).json({ success: false, message: "courseId is required." });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found." });
    }

    // Check for existing enrollment
    const existing = await Enrollment.findOne({ studentId, courseId });
    if (existing) {
      if (existing.isActive) {
        return res.status(409).json({ success: false, message: "Already enrolled in this course." });
      }
      // Re-activate if previously unenrolled
      existing.isActive = true;
      await existing.save();
      return res.status(200).json({ success: true, data: existing, message: "Re-enrolled successfully." });
    }

    const enrollment = await Enrollment.create({ studentId, courseId });
    res.status(201).json({ success: true, data: enrollment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── GET /api/enrollments/my ───────────────────────────────────────────────────
// Get all active enrollments for the logged-in student (with course data)
const getMyEnrollments = async (req, res) => {
  try {
    const enrollments = await Enrollment.find({
      studentId: req.user._id,
      isActive:  true,
    }).populate("courseId", "title description difficulty image topics levels lessons");

    res.status(200).json({ success: true, count: enrollments.length, data: enrollments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── GET /api/enrollments/check/:courseId ──────────────────────────────────────
// Check whether the current user is enrolled in a specific course
const checkEnrollment = async (req, res) => {
  try {
    const enrollment = await Enrollment.findOne({
      studentId: req.user._id,
      courseId:  req.params.courseId,
      isActive:  true,
    });
    res.status(200).json({ success: true, enrolled: !!enrollment, data: enrollment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── DELETE /api/enrollments/:courseId ─────────────────────────────────────────
// Unenroll (soft-delete) the student from a course
const unenroll = async (req, res) => {
  try {
    const enrollment = await Enrollment.findOne({
      studentId: req.user._id,
      courseId:  req.params.courseId,
      isActive:  true,
    });

    if (!enrollment) {
      return res.status(404).json({ success: false, message: "Enrollment not found." });
    }

    enrollment.isActive = false;
    await enrollment.save();
    res.status(200).json({ success: true, message: "Unenrolled successfully." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── PATCH /api/enrollments/:courseId/complete-level ───────────────────────────
// Mark a level as completed for a student
const completeLevel = async (req, res) => {
  try {
    const { levelNumber } = req.body;
    if (levelNumber === undefined) {
      return res.status(400).json({ success: false, message: "levelNumber is required." });
    }

    const enrollment = await Enrollment.findOne({
      studentId: req.user._id,
      courseId:  req.params.courseId,
      isActive:  true,
    });

    if (!enrollment) {
      return res.status(404).json({ success: false, message: "Enrollment not found." });
    }

    if (!enrollment.completedLevels.includes(levelNumber)) {
      enrollment.completedLevels.push(levelNumber);
      await enrollment.save();
    }

    res.status(200).json({ success: true, data: enrollment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── GET /api/enrollments/admin ────────────────────────────────────────────────
// (Admin) View all enrollments across all students
const getAllEnrollments = async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ isActive: true })
      .populate("studentId", "name email")
      .populate("courseId", "title difficulty")
      .sort("-createdAt");

    res.status(200).json({ success: true, count: enrollments.length, data: enrollments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  enrollCourse,
  getMyEnrollments,
  checkEnrollment,
  unenroll,
  completeLevel,
  getAllEnrollments,
};
