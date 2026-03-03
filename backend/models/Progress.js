const mongoose = require("mongoose");

const progressSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quiz",
    },
    quizScore: { type: Number, required: true, min: 0, max: 100 },
    attempts: { type: Number, default: 1 },
    timeTaken: { type: Number, default: 0 }, // in minutes

    // AI Recommendation (rule-based, backend)
    recommendedLevel: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced"],
      default: "Beginner",
    },

    // ML Prediction (from Flask microservice)
    predictedPerformance: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium",
    },
    dropoutRisk: {
      type: String,
      enum: ["Yes", "No"],
      default: "No",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Progress", progressSchema);
