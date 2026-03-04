/**
 * AttemptHistory – every quiz attempt a student makes on a level.
 * Multiple records per student × course × levelNumber are allowed.
 */
const mongoose = require("mongoose");

const attemptHistorySchema = new mongoose.Schema(
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
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref:  "Quiz",
      required: true,
    },
    score:         { type: Number, required: true },        // 0-100
    passed:        { type: Boolean, required: true },
    attemptNumber: { type: Number, required: true },        // which attempt this was (1, 2, 3 …)
    timeTaken:     { type: Number, default: 0 },            // minutes
    answers:       { type: mongoose.Schema.Types.Mixed },   // snapshot of submitted answers
  },
  { timestamps: true }
);

module.exports = mongoose.model("AttemptHistory", attemptHistorySchema);
