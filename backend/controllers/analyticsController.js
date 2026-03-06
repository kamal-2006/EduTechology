const User              = require("../models/User");
const Progress          = require("../models/Progress");
const Course            = require("../models/Course");
const AttemptHistory    = require("../models/AttemptHistory");
const LevelRegistration = require("../models/LevelRegistration");

// ── GET /api/analytics/student/:id ────────────────────────────────────────────
const getStudentAnalytics = async (req, res) => {
  try {
    const studentId = req.params.id;

    // Students may only view their own analytics
    if (req.user.role === "student" && req.user._id.toString() !== studentId) {
      return res.status(403).json({ success: false, message: "Access denied." });
    }

    // Primary data source: AttemptHistory (written on every quiz submission)
    const [attempts, registrations, latestProgress] = await Promise.all([
      AttemptHistory.find({ studentId })
        .populate("courseId", "title difficulty")
        .sort("createdAt"),
      LevelRegistration.find({ studentId }),
      Progress.findOne({ studentId }).sort({ createdAt: -1 }),
    ]);

    if (attempts.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          totalQuizzesTaken:    0,
          averageScore:         0,
          recommendedLevel:     "Beginner",
          predictedPerformance: "Medium",
          dropoutRisk:          "No",
          scoreHistory:         [],
          courseBreakdown:      [],
        },
      });
    }

    const totalQuizzesTaken = attempts.length;
    const averageScore      = Math.round(
      attempts.reduce((sum, a) => sum + a.score, 0) / totalQuizzesTaken
    );

    // Score history for line chart
    const scoreHistory = attempts.map((a) => ({
      date:   a.createdAt,
      score:  a.score,
      course: a.courseId?.title || "N/A",
    }));

    // Per-course breakdown
    const courseMap = {};
    attempts.forEach((a) => {
      const cid = a.courseId?._id?.toString() || "unknown";
      if (!courseMap[cid]) {
        courseMap[cid] = { courseTitle: a.courseId?.title || "N/A", scores: [] };
      }
      courseMap[cid].scores.push(a.score);
    });
    const courseBreakdown = Object.values(courseMap).map((c) => ({
      courseTitle:  c.courseTitle,
      averageScore: Math.round(c.scores.reduce((a, b) => a + b, 0) / c.scores.length),
      attempts:     c.scores.length,
    }));

    // Recommended level derived from completed registrations
    const completedCount = registrations.filter((r) => r.status === "completed").length;
    const recommendedLevel =
      completedCount >= 4 ? "Advanced" :
      completedCount >= 2 ? "Intermediate" : "Beginner";

    // Predicted performance and dropout risk: use ML model result if available, else derive
    const predictedPerformance =
      latestProgress?.predictedPerformance ||
      (averageScore >= 75 ? "High" : averageScore >= 50 ? "Medium" : "Low");

    const dropoutRisk =
      latestProgress?.dropoutRisk ||
      (averageScore < 50 ? "Yes" : "No");

    res.status(200).json({
      success: true,
      data: {
        totalQuizzesTaken,
        averageScore,
        recommendedLevel,
        predictedPerformance,
        dropoutRisk,
        scoreHistory,
        courseBreakdown,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── GET /api/analytics/admin ───────────────────────────────────────────────────
const getAdminAnalytics = async (req, res) => {
  try {
    const [totalUsers, allAttempts, courses] = await Promise.all([
      User.countDocuments({ role: "student" }),
      AttemptHistory.find().populate("courseId", "title"),
      Course.find().select("title"),
    ]);

    const totalSubmissions = allAttempts.length;
    const avgPlatformScore =
      totalSubmissions === 0
        ? 0
        : Math.round(
            allAttempts.reduce((s, a) => s + a.score, 0) / totalSubmissions
          );

    // At-risk: students whose average score < 50%
    const studentScoreMap = {};
    allAttempts.forEach((a) => {
      const sid = a.studentId.toString();
      if (!studentScoreMap[sid]) studentScoreMap[sid] = [];
      studentScoreMap[sid].push(a.score);
    });
    const atRiskStudents = Object.values(studentScoreMap).filter(
      (scores) => scores.reduce((s, x) => s + x, 0) / scores.length < 50
    ).length;

    // Course-wise average score
    const courseMap = {};
    allAttempts.forEach((a) => {
      const cid = a.courseId?._id?.toString() || "unknown";
      if (!courseMap[cid]) {
        courseMap[cid] = { title: a.courseId?.title || "N/A", scores: [] };
      }
      courseMap[cid].scores.push(a.score);
    });
    const coursePerformance = Object.values(courseMap).map((c) => ({
      courseTitle:   c.title,
      averageScore:  Math.round(c.scores.reduce((a, b) => a + b, 0) / c.scores.length),
      totalAttempts: c.scores.length,
    }));

    // Performance distribution derived from per-student averages
    const performanceDist = { High: 0, Medium: 0, Low: 0 };
    Object.values(studentScoreMap).forEach((scores) => {
      const avg = scores.reduce((s, x) => s + x, 0) / scores.length;
      if (avg >= 75) performanceDist.High++;
      else if (avg >= 50) performanceDist.Medium++;
      else performanceDist.Low++;
    });

    res.status(200).json({
      success: true,
      data: {
        totalStudents:    totalUsers,
        totalCourses:     courses.length,
        totalSubmissions,
        avgPlatformScore,
        atRiskStudents,
        coursePerformance,
        performanceDist,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getStudentAnalytics, getAdminAnalytics };
