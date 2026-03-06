/**
 * Recommendation – one document per student, upserted whenever recommendations
 * are regenerated (after quiz submission or on-demand via the API).
 */
const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema(
  {
    courseId:    { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
    courseTitle: { type: String, default: "" },
    levelNumber: { type: Number, default: null },
    levelTitle:  { type: String, default: "" },
    type: {
      type: String,
      enum: ["next_level", "revise_topic", "rewatch_video", "practice_quiz", "revisit_level"],
      required: true,
    },
    priority: { type: String, enum: ["high", "medium", "low"], default: "medium" },
    message:  { type: String, default: "" },
    videoUrl: { type: String, default: "" },
    topic:    { type: String, default: "" },
  },
  { _id: false }
);

const recommendationSchema = new mongoose.Schema(
  {
    studentId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "User",
      required: true,
      unique:   true,
    },
    generatedAt: { type: Date, default: Date.now },
    overallStatus: {
      type:    String,
      enum:    ["on_track", "needs_improvement", "at_risk"],
      default: "on_track",
    },
    recommendations: { type: [itemSchema], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Recommendation", recommendationSchema);
