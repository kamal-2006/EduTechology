const Course = require("../models/Course");

// ── GET /api/courses ───────────────────────────────────────────────────────────
const getCourses = async (req, res) => {
  try {
    const courses = await Course.find()
      .populate("createdBy", "name email")
      .sort("-createdAt");
    res.status(200).json({ success: true, count: courses.length, data: courses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── GET /api/courses/:id ───────────────────────────────────────────────────────
const getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id).populate(
      "createdBy",
      "name email"
    );
    if (!course) {
      return res
        .status(404)
        .json({ success: false, message: "Course not found." });
    }
    res.status(200).json({ success: true, data: course });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── POST /api/courses – Admin / Faculty ──────────────────────────────────────
const createCourse = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      difficulty,
      image,
      topics,
      maxAttempts,
      levels,
      lessons,
    } = req.body;

    if (!title || !description) {
      return res
        .status(400)
        .json({ success: false, message: "Title and description are required." });
    }

    const course = await Course.create({
      title,
      description,
      category:    category    || "Other",
      difficulty:  difficulty  || "Beginner",
      image:       image       || "",
      topics:      Array.isArray(topics)  ? topics  : [],
      maxAttempts: maxAttempts || 3,
      levels:      Array.isArray(levels)  ? levels  : [],
      lessons:     Array.isArray(lessons) ? lessons : [],
      createdBy:   req.user._id,
    });

    res.status(201).json({ success: true, data: course });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── PUT /api/courses/:id – Admin only ────────────────────────────────────────
const updateCourse = async (req, res) => {
  try {
    const course = await Course.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!course) {
      return res
        .status(404)
        .json({ success: false, message: "Course not found." });
    }
    res.status(200).json({ success: true, data: course });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── DELETE /api/courses/:id – Admin only ─────────────────────────────────────
const deleteCourse = async (req, res) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);
    if (!course) {
      return res
        .status(404)
        .json({ success: false, message: "Course not found." });
    }
    res.status(200).json({ success: true, message: "Course deleted." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
};
