/**
 * CourseEmbedding – stores vector embeddings for course content chunks.
 * Used by the AI chatbot for Retrieval-Augmented Generation (RAG).
 * One document per content chunk (course overview, level notes, lesson text).
 */
const mongoose = require("mongoose");

const courseEmbeddingSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["course", "level", "lesson"],
      required: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    courseTitle: { type: String },
    content:     { type: String, required: true },   // raw text chunk
    embedding:   { type: [Number], required: true }, // 768-dim vector (Google embedding-001)
    metadata:    { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CourseEmbedding", courseEmbeddingSchema);
