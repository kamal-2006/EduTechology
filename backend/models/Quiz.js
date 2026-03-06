const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  questionText: { type: String, required: true },
  options: {
    type: [String],
    validate: {
      validator: (v) => v.length >= 2,
      message: "A question must have at least 2 options.",
    },
  },
  correctAnswer: { type: String, required: true },
});

const quizSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    title: { type: String, required: true, trim: true },
    questions: {
      type: [questionSchema],
      validate: {
        validator: (v) => v.length >= 1,
        message: "A quiz must have at least one question.",
      },
    },
    totalMarks:   { type: Number, default: 100 },
    levelNumber:  { type: Number, default: null },   // null = general course quiz
    timeLimit:    { type: Number, default: null },   // minutes; null = no limit
  },
  { timestamps: true }
);

module.exports = mongoose.model("Quiz", quizSchema);
