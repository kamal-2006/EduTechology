const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Course title is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Course description is required"],
    },
    category: {
      type: String,
      enum: [
        "Programming",
        "Data Science",
        "Machine Learning",
        "Web Development",
        "Database",
        "Cybersecurity",
        "Cloud Computing",
        "Mobile Development",
        "Mathematics",
        "Other",
      ],
      default: "Other",
    },
    difficulty: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced"],
      default: "Beginner",
    },
    image: {
      type:    String,
      default: "",
    },
    topics: {
      type:    [String],
      default: [],
    },
    maxAttempts: {
      type:    Number,
      default: 3,
      min:     1,
    },
    levels: [
      {
        levelNumber: { type: Number, required: true },
        title:       { type: String, required: true },
        studyNotes:  { type: String, default: "" },
        videoUrl:    { type: String, default: "" },
        isPublished: { type: Boolean, default: true },
      },
    ],
    lessons: [
      {
        title: { type: String, required: true },
        content: { type: String, required: true },
        order: { type: Number, default: 0 },
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Course", courseSchema);
