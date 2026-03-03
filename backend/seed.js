/**
 * seed.js – Populates MongoDB with dummy data for testing.
 * Run: node seed.js
 */
require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt   = require("bcryptjs");

const User     = require("./models/User");
const Course   = require("./models/Course");
const Quiz     = require("./models/Quiz");
const Progress = require("./models/Progress");

const connectDB = require("./config/db");

const seed = async () => {
  await connectDB();

  // Clear existing data
  await Promise.all([
    User.deleteMany(),
    Course.deleteMany(),
    Quiz.deleteMany(),
    Progress.deleteMany(),
  ]);
  console.log("[Seed] Cleared existing data.");

  // ── Users ──────────────────────────────────────────────────────────────────
  const adminUser = await User.create({
    name:     "Admin User",
    email:    "admin@educationpsg.com",
    password: "admin1234",
    role:     "admin",
  });

  const students = await User.create([
    { name: "Alice Johnson", email: "alice@test.com", password: "student1234", role: "student" },
    { name: "Bob Smith",     email: "bob@test.com",   password: "student1234", role: "student" },
    { name: "Carol White",   email: "carol@test.com", password: "student1234", role: "student" },
  ]);

  console.log("[Seed] Created users.");

  // ── Courses ────────────────────────────────────────────────────────────────
  const courses = await Course.create([
    {
      title:       "Introduction to Python",
      description: "Learn Python programming from scratch. Covers syntax, data structures, and basic algorithms.",
      difficulty:  "Beginner",
      createdBy:   adminUser._id,
      lessons: [
        { title: "Python Basics",       content: "Variables, data types, and operators.",               order: 1 },
        { title: "Control Flow",        content: "If statements, loops, and functions.",                order: 2 },
        { title: "Data Structures",     content: "Lists, dictionaries, sets, and tuples.",              order: 3 },
      ],
    },
    {
      title:       "Machine Learning Fundamentals",
      description: "Understand supervised/unsupervised learning, model evaluation, and Scikit-learn.",
      difficulty:  "Intermediate",
      createdBy:   adminUser._id,
      lessons: [
        { title: "What is ML?",         content: "Types of ML and key terminology.",                    order: 1 },
        { title: "Linear Regression",   content: "Understanding the linear model and cost function.",   order: 2 },
        { title: "Decision Trees",      content: "Building and evaluating tree-based models.",          order: 3 },
      ],
    },
    {
      title:       "Deep Learning with PyTorch",
      description: "Advanced neural network architectures, backpropagation, and model deployment.",
      difficulty:  "Advanced",
      createdBy:   adminUser._id,
      lessons: [
        { title: "Neural Networks",     content: "Perceptrons, activation functions, and layers.",      order: 1 },
        { title: "CNNs",                content: "Convolutional networks for image recognition.",       order: 2 },
        { title: "Model Deployment",    content: "Exporting and serving PyTorch models.",               order: 3 },
      ],
    },
  ]);

  console.log("[Seed] Created courses.");

  // ── Quizzes ────────────────────────────────────────────────────────────────
  const quizzes = await Quiz.create([
    {
      courseId:   courses[0]._id,
      title:      "Python Basics Quiz",
      totalMarks: 100,
      questions: [
        {
          questionText:  "Which keyword defines a function in Python?",
          options:       ["function", "def", "func", "define"],
          correctAnswer: "def",
        },
        {
          questionText:  "What is the output of print(type(3.14))?",
          options:       ["<class 'int'>", "<class 'float'>", "<class 'str'>", "<class 'double'>"],
          correctAnswer: "<class 'float'>",
        },
        {
          questionText:  "Which data structure uses key-value pairs?",
          options:       ["List", "Tuple", "Set", "Dictionary"],
          correctAnswer: "Dictionary",
        },
        {
          questionText:  "What does len([1,2,3]) return?",
          options:       ["2", "3", "4", "Error"],
          correctAnswer: "3",
        },
      ],
    },
    {
      courseId:   courses[1]._id,
      title:      "ML Fundamentals Quiz",
      totalMarks: 100,
      questions: [
        {
          questionText:  "What type of ML uses labeled training data?",
          options:       ["Unsupervised", "Reinforcement", "Supervised", "Semi-supervised"],
          correctAnswer: "Supervised",
        },
        {
          questionText:  "Which metric measures classification model accuracy?",
          options:       ["MSE", "R-squared", "F1-Score", "MAE"],
          correctAnswer: "F1-Score",
        },
        {
          questionText:  "What does overfitting mean?",
          options:       [
            "Model performs well on training only",
            "Model performs well on test only",
            "Model is too simple",
            "Model has low bias",
          ],
          correctAnswer: "Model performs well on training only",
        },
        {
          questionText:  "Which algorithm is a tree-based model?",
          options:       ["Linear Regression", "Decision Tree", "KNN", "SVM"],
          correctAnswer: "Decision Tree",
        },
      ],
    },
  ]);

  console.log("[Seed] Created quizzes.");

  // ── Progress records ───────────────────────────────────────────────────────
  const progressData = [
    // Alice – improving student
    { studentId: students[0]._id, courseId: courses[0]._id, quizId: quizzes[0]._id, quizScore: 35,  attempts: 1, timeTaken: 20, recommendedLevel: "Beginner",      predictedPerformance: "Low",    dropoutRisk: "No"  },
    { studentId: students[0]._id, courseId: courses[0]._id, quizId: quizzes[0]._id, quizScore: 60,  attempts: 2, timeTaken: 18, recommendedLevel: "Intermediate",   predictedPerformance: "Medium", dropoutRisk: "No"  },
    { studentId: students[0]._id, courseId: courses[1]._id, quizId: quizzes[1]._id, quizScore: 80,  attempts: 1, timeTaken: 25, recommendedLevel: "Advanced",        predictedPerformance: "High",   dropoutRisk: "No"  },
    // Bob – struggling student
    { studentId: students[1]._id, courseId: courses[0]._id, quizId: quizzes[0]._id, quizScore: 30,  attempts: 1, timeTaken: 45, recommendedLevel: "Beginner",        predictedPerformance: "Low",    dropoutRisk: "No"  },
    { studentId: students[1]._id, courseId: courses[0]._id, quizId: quizzes[0]._id, quizScore: 25,  attempts: 2, timeTaken: 70, recommendedLevel: "Beginner",        predictedPerformance: "Low",    dropoutRisk: "Yes" },
    { studentId: students[1]._id, courseId: courses[0]._id, quizId: quizzes[0]._id, quizScore: 20,  attempts: 3, timeTaken: 90, recommendedLevel: "Beginner",        predictedPerformance: "Low",    dropoutRisk: "Yes" },
    // Carol – advanced student
    { studentId: students[2]._id, courseId: courses[0]._id, quizId: quizzes[0]._id, quizScore: 90,  attempts: 1, timeTaken: 10, recommendedLevel: "Advanced",        predictedPerformance: "High",   dropoutRisk: "No"  },
    { studentId: students[2]._id, courseId: courses[1]._id, quizId: quizzes[1]._id, quizScore: 88,  attempts: 1, timeTaken: 15, recommendedLevel: "Advanced",        predictedPerformance: "High",   dropoutRisk: "No"  },
  ];

  await Progress.create(progressData);
  console.log("[Seed] Created progress records.");

  console.log("\n✅  Seeding complete!");
  console.log("--------------------------------------------");
  console.log("Admin      → admin@educationpsg.com   / admin1234");
  console.log("Student 1  → alice@test.com           / student1234");
  console.log("Student 2  → bob@test.com             / student1234");
  console.log("Student 3  → carol@test.com           / student1234");
  console.log("--------------------------------------------\n");

  mongoose.connection.close();
};

seed().catch((err) => {
  console.error("[Seed] Error:", err);
  mongoose.connection.close();
  process.exit(1);
});
