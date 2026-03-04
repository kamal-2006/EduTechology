const mongoose = require("mongoose");

const enrollmentSchema = new mongoose.Schema(
  {
    studentId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "User",
      required: true,
    },
    courseId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "Course",
      required: true,
    },
    isActive: {
      type:    Boolean,
      default: true,
    },
    completedLevels: {
      type:    [Number],
      default: [],
    },
  },
  { timestamps: true }
);

// Prevent duplicate enrollments
enrollmentSchema.index({ studentId: 1, courseId: 1 }, { unique: true });

module.exports = mongoose.model("Enrollment", enrollmentSchema);
