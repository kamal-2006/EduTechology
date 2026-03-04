/**
 * LevelRegistration – one record per student × course × levelNumber.
 * Status transitions:  active → completed
 *                      active → failed   → active (re-register)
 */
const mongoose = require("mongoose");

const levelRegistrationSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref:  "User",
      required: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref:  "Course",
      required: true,
    },
    levelNumber: {
      type:     Number,
      required: true,
    },
    status: {
      type:    String,
      enum:    ["active", "completed", "failed"],
      default: "active",
    },
    score:        { type: Number, default: null },   // score from latest attempt
    attemptCount: { type: Number, default: 0 },      // total quiz attempts for this level
    completedAt:  { type: Date,   default: null },
  },
  { timestamps: true }
);

// One active registration per student × course × level at a time
levelRegistrationSchema.index(
  { studentId: 1, courseId: 1, levelNumber: 1 },
  { unique: true }
);

module.exports = mongoose.model("LevelRegistration", levelRegistrationSchema);
