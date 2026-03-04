/**
 * seed.js – Populates MongoDB with dummy data for testing.
 * Run: node seed.js
 */
require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt   = require("bcryptjs");

const User              = require("./models/User");
const Course            = require("./models/Course");
const Quiz              = require("./models/Quiz");
const Progress          = require("./models/Progress");
const Enrollment        = require("./models/Enrollment");
const LevelRegistration = require("./models/LevelRegistration");
const AttemptHistory    = require("./models/AttemptHistory");

const connectDB = require("./config/db");

const seed = async () => {
  await connectDB();

  // Clear existing data
  await Promise.all([
    User.deleteMany(),
    Course.deleteMany(),
    Quiz.deleteMany(),
    Progress.deleteMany(),
    Enrollment.deleteMany(),
    LevelRegistration.deleteMany(),
    AttemptHistory.deleteMany(),
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
      image:       "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=600&q=80",
      topics:      ["Variables", "Control Flow", "Data Structures", "Functions", "OOP"],
      createdBy:   adminUser._id,
      levels: [
        { levelNumber: 1, title: "Python Basics",      studyNotes: "Learn variables, data types, and basic operators in Python. Python is dynamically typed — you don't need to declare variable types. Use `print()` to output values and `type()` to check types.", videoUrl: "https://www.youtube.com/watch?v=rfscVS0vtbw" },
        { levelNumber: 2, title: "Control Flow",       studyNotes: "Master if/elif/else statements, for and while loops. Python uses indentation to define blocks — no curly braces needed. The `range()` function is your friend for iteration.", videoUrl: "https://www.youtube.com/watch?v=DZwmZ8Usvnk" },
        { levelNumber: 3, title: "Data Structures",    studyNotes: "Lists are ordered and mutable. Tuples are ordered but immutable. Dictionaries use key-value pairs. Sets contain unique unordered elements. Each has its own set of methods for manipulation.", videoUrl: "https://www.youtube.com/watch?v=W8KRzm-HUcc" },
      ],
      lessons: [
        { title: "Python Basics",   content: "Variables, data types, and operators.",    order: 1 },
        { title: "Control Flow",    content: "If statements, loops, and functions.",      order: 2 },
        { title: "Data Structures", content: "Lists, dictionaries, sets, and tuples.",   order: 3 },
      ],
    },
    {
      title:       "Machine Learning Fundamentals",
      description: "Understand supervised/unsupervised learning, model evaluation, and Scikit-learn.",
      difficulty:  "Intermediate",
      image:       "https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=600&q=80",
      topics:      ["Supervised Learning", "Unsupervised Learning", "Model Evaluation", "Scikit-learn"],
      createdBy:   adminUser._id,
      levels: [
        { levelNumber: 1, title: "What is ML?",       studyNotes: "Machine Learning is a subset of AI where systems learn from data. Supervised learning uses labeled examples; unsupervised learning finds patterns in unlabeled data. Key terms: feature, label, model, training, inference.", videoUrl: "https://www.youtube.com/watch?v=ukzFI9rgwfU" },
        { levelNumber: 2, title: "Linear Regression", studyNotes: "Linear regression predicts a continuous output by fitting a line y = mx + b. The cost function (Mean Squared Error) measures prediction error. Gradient descent minimises the cost function iteratively.", videoUrl: "https://www.youtube.com/watch?v=NUXdtN1W1FE" },
        { levelNumber: 3, title: "Decision Trees",    studyNotes: "Decision Trees split data at nodes based on feature thresholds to minimise impurity (Gini / Entropy). They are interpretable but prone to overfitting. Use Random Forests to reduce variance via bagging.", videoUrl: "https://www.youtube.com/watch?v=7VeUPuFGJHk" },
      ],
      lessons: [
        { title: "What is ML?",       content: "Types of ML and key terminology.",                   order: 1 },
        { title: "Linear Regression", content: "Understanding the linear model and cost function.",   order: 2 },
        { title: "Decision Trees",    content: "Building and evaluating tree-based models.",          order: 3 },
      ],
    },
    {
      title:       "Deep Learning with PyTorch",
      description: "Advanced neural network architectures, backpropagation, and model deployment.",
      difficulty:  "Advanced",
      image:       "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=600&q=80",
      topics:      ["Neural Networks", "CNNs", "Backpropagation", "PyTorch", "Deployment"],
      createdBy:   adminUser._id,
      levels: [
        { levelNumber: 1, title: "Neural Networks",  studyNotes: "A neural network consists of an input layer, hidden layers, and an output layer. Each neuron applies a weighted sum followed by an activation function (ReLU, Sigmoid, Tanh). Backpropagation computes gradients via the chain rule.", videoUrl: "https://www.youtube.com/watch?v=aircAruvnKk" },
        { levelNumber: 2, title: "CNNs",             studyNotes: "Convolutional Neural Networks use filters to extract spatial features from images. A conv layer slides a kernel over the input to produce feature maps. Pooling layers reduce spatial dimensions and add translation invariance.", videoUrl: "https://www.youtube.com/watch?v=YRhxdVk_sIs" },
        { levelNumber: 3, title: "Model Deployment", studyNotes: "Export a PyTorch model with `torch.save()` or TorchScript. Serve it via a Flask REST API or FastAPI endpoint. Use ONNX for cross-framework compatibility and TorchServe for production-grade hosting.", videoUrl: "https://www.youtube.com/watch?v=vY9pQPpjp4Q" },
      ],
      lessons: [
        { title: "Neural Networks",  content: "Perceptrons, activation functions, and layers.",  order: 1 },
        { title: "CNNs",             content: "Convolutional networks for image recognition.",     order: 2 },
        { title: "Model Deployment", content: "Exporting and serving PyTorch models.",             order: 3 },
      ],
    },
  ]);

  console.log("[Seed] Created courses.");

  // ── Quizzes ────────────────────────────────────────────────────────────────
  const quizzes = await Quiz.create([
    {
      courseId:    courses[0]._id,
      title:       "Python Basics Quiz  –  Level 1",
      levelNumber: 1,
      totalMarks:  100,
      questions: [
        { questionText: "Which keyword defines a function in Python?",     options: ["function","def","func","define"],           correctAnswer: "def" },
        { questionText: "What is the output of print(type(3.14))?",        options: ["<class 'int'>","<class 'float'>","<class 'str'>","<class 'double'>"], correctAnswer: "<class 'float'>" },
        { questionText: "Which data structure uses key-value pairs?",      options: ["List","Tuple","Set","Dictionary"],          correctAnswer: "Dictionary" },
        { questionText: "What does len([1,2,3]) return?",                  options: ["2","3","4","Error"],                        correctAnswer: "3" },
      ],
    },
    {
      courseId:    courses[0]._id,
      title:       "Control Flow Quiz  –  Level 2",
      levelNumber: 2,
      totalMarks:  100,
      questions: [
        { questionText: "Which loop iterates over a sequence?",            options: ["while","for","do-while","loop"],            correctAnswer: "for" },
        { questionText: "What keyword exits a loop immediately?",          options: ["stop","end","break","exit"],               correctAnswer: "break" },
        { questionText: "What does `range(3)` produce?",                  options: ["[1,2,3]","[0,1,2]","[0,1,2,3]","[1,2]"],  correctAnswer: "[0,1,2]" },
        { questionText: "Which keyword skips to the next loop iteration?",options: ["pass","skip","next","continue"],            correctAnswer: "continue" },
      ],
    },
    {
      courseId:    courses[0]._id,
      title:       "Data Structures Quiz  –  Level 3",
      levelNumber: 3,
      totalMarks:  100,
      questions: [
        { questionText: "Which collection type is immutable?",            options: ["list","dict","tuple","set"],               correctAnswer: "tuple" },
        { questionText: "How do you add an item to a Python list?",       options: [".add()",".push()",".append()",".insert_last()"], correctAnswer: ".append()" },
        { questionText: "Which data structure has unique elements only?", options: ["list","tuple","dict","set"],               correctAnswer: "set" },
        { questionText: "What operator merges two dictionaries (Py 3.9+)?" , options: ["&","|","+","^"],                         correctAnswer: "|" },
      ],
    },
    {
      courseId:    courses[1]._id,
      title:       "What is ML? Quiz  –  Level 1",
      levelNumber: 1,
      totalMarks:  100,
      questions: [
        { questionText: "What type of ML uses labeled training data?",     options: ["Unsupervised","Reinforcement","Supervised","Semi-supervised"], correctAnswer: "Supervised" },
        { questionText: "Which metric measures classification accuracy?",  options: ["MSE","R-squared","F1-Score","MAE"],         correctAnswer: "F1-Score" },
        { questionText: "What does overfitting mean?",                    options: ["Good on train only","Good on test only","Too simple","Low bias"], correctAnswer: "Good on train only" },
        { questionText: "Which is a tree-based model?",                   options: ["Linear Regression","Decision Tree","KNN","SVM"], correctAnswer: "Decision Tree" },
      ],
    },
    {
      courseId:    courses[1]._id,
      title:       "Linear Regression Quiz  –  Level 2",
      levelNumber: 2,
      totalMarks:  100,
      questions: [
        { questionText: "What does MSE stand for?",                       options: ["Mean Squared Error","Max Sum Error","Mean Slide Estimate","Min Sum Error"], correctAnswer: "Mean Squared Error" },
        { questionText: "Linear regression predicts a ___ output.",       options: ["categorical","binary","continuous","discrete"],  correctAnswer: "continuous" },
        { questionText: "Gradient descent minimises the ___.",            options: ["accuracy","cost function","parameters","features"], correctAnswer: "cost function" },
        { questionText: "What is the equation of a linear model?",        options: ["y=mx²+b","y=mx+b","y=m/x+b","y=m+bx²"],    correctAnswer: "y=mx+b" },
      ],
    },
    {
      courseId:    courses[2]._id,
      title:       "Neural Networks Quiz  –  Level 1",
      levelNumber: 1,
      totalMarks:  100,
      questions: [
        { questionText: "Which activation introduces non-linearity?",      options: ["ReLU","Linear","Identity","None"],          correctAnswer: "ReLU" },
        { questionText: "Backpropagation uses which mathematical concept?",options: ["Matrix inversion","Chain rule","Fourier transform","Taylor series"], correctAnswer: "Chain rule" },
        { questionText: "A perceptron is the basic unit of a ___.",        options: ["database","neural network","loop","tree"],   correctAnswer: "neural network" },
        { questionText: "What is the output layer of a classifier?",       options: ["ReLU","Sigmoid or Softmax","Tanh","Linear"],correctAnswer: "Sigmoid or Softmax" },
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

  // ── Enrollments ────────────────────────────────────────────────────────────
  await Enrollment.create([
    // Alice enrolled in Python (levels 1+2 done) and ML (level 1 done)
    { studentId: students[0]._id, courseId: courses[0]._id, completedLevels: [1, 2] },
    { studentId: students[0]._id, courseId: courses[1]._id, completedLevels: [1] },
    // Bob enrolled in Python only (no levels completed)
    { studentId: students[1]._id, courseId: courses[0]._id, completedLevels: [] },
    // Carol enrolled in all three courses (all levels done)
    { studentId: students[2]._id, courseId: courses[0]._id, completedLevels: [1, 2, 3] },
    { studentId: students[2]._id, courseId: courses[1]._id, completedLevels: [1, 2, 3] },
    { studentId: students[2]._id, courseId: courses[2]._id, completedLevels: [1, 2] },
  ]);
  console.log("[Seed] Created enrollments.");

  // ── Level Registrations (─────────────────────────────────────────────────────
  await LevelRegistration.create([
    // Alice: Python L1 completed, L2 active; ML L1 completed
    { studentId: students[0]._id, courseId: courses[0]._id, levelNumber: 1, status: "completed", score: 75, attemptCount: 2, completedAt: new Date() },
    { studentId: students[0]._id, courseId: courses[0]._id, levelNumber: 2, status: "active",    score: null, attemptCount: 0 },
    { studentId: students[0]._id, courseId: courses[1]._id, levelNumber: 1, status: "completed", score: 80, attemptCount: 1, completedAt: new Date() },
    // Bob: Python L1 failed
    { studentId: students[1]._id, courseId: courses[0]._id, levelNumber: 1, status: "failed", score: 25, attemptCount: 3 },
    // Carol: Python all completed, ML L1 + L2 completed, ML L3 active, DL L1 + L2 completed
    { studentId: students[2]._id, courseId: courses[0]._id, levelNumber: 1, status: "completed", score: 90, attemptCount: 1, completedAt: new Date() },
    { studentId: students[2]._id, courseId: courses[0]._id, levelNumber: 2, status: "completed", score: 85, attemptCount: 1, completedAt: new Date() },
    { studentId: students[2]._id, courseId: courses[0]._id, levelNumber: 3, status: "completed", score: 88, attemptCount: 1, completedAt: new Date() },
    { studentId: students[2]._id, courseId: courses[1]._id, levelNumber: 1, status: "completed", score: 92, attemptCount: 1, completedAt: new Date() },
    { studentId: students[2]._id, courseId: courses[1]._id, levelNumber: 2, status: "completed", score: 78, attemptCount: 2, completedAt: new Date() },
    { studentId: students[2]._id, courseId: courses[1]._id, levelNumber: 3, status: "active",    score: null, attemptCount: 0 },
    { studentId: students[2]._id, courseId: courses[2]._id, levelNumber: 1, status: "completed", score: 95, attemptCount: 1, completedAt: new Date() },
    { studentId: students[2]._id, courseId: courses[2]._id, levelNumber: 2, status: "completed", score: 82, attemptCount: 1, completedAt: new Date() },
  ]);
  console.log("[Seed] Created level registrations.");

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
