const User     = require("../models/User");
const Progress = require("../models/Progress");
const Course   = require("../models/Course");

// ── GET /api/analytics/student/:id ────────────────────────────────────────────
const getStudentAnalytics = async (req, res) => {
  try {
    const studentId = req.params.id;

    // Students may only view their own analytics
    if (req.user.role === "student" && req.user._id.toString() !== studentId) {
      return res
        .status(403)
        .json({ success: false, message: "Access denied." });
    }

    const records = await Progress.find({ studentId })
      .populate("courseId", "title difficulty")
      .sort("createdAt");

    if (records.length === 0) {
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

    const totalQuizzesTaken = records.length;
    const averageScore      = Math.round(
      records.reduce((sum, r) => sum + r.quizScore, 0) / totalQuizzesTaken
    );

    // Latest record for current recommendation
    const latest = records[records.length - 1];

    // Score history for line chart
    const scoreHistory = records.map((r) => ({
      date:    r.createdAt,
      score:   r.quizScore,
      course:  r.courseId?.title || "N/A",
    }));

    // Per-course breakdown
    const courseMap = {};
    records.forEach((r) => {
      const cid = r.courseId?._id?.toString() || "unknown";
      if (!courseMap[cid]) {
        courseMap[cid] = {
          courseTitle: r.courseId?.title || "N/A",
          scores: [],
        };
      }
      courseMap[cid].scores.push(r.quizScore);
    });
    const courseBreakdown = Object.values(courseMap).map((c) => ({
      courseTitle:  c.courseTitle,
      averageScore: Math.round(c.scores.reduce((a, b) => a + b, 0) / c.scores.length),
      attempts:     c.scores.length,
    }));

    res.status(200).json({
      success: true,
      data: {
        totalQuizzesTaken,
        averageScore,
        recommendedLevel:     latest.recommendedLevel,
        predictedPerformance: latest.predictedPerformance,
        dropoutRisk:          latest.dropoutRisk,
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
    const [totalUsers, allProgress, courses] = await Promise.all([
      User.countDocuments({ role: "student" }),
      Progress.find().populate("courseId", "title"),
      Course.find().select("title"),
    ]);

    const totalSubmissions = allProgress.length;
    const avgPlatformScore =
      totalSubmissions === 0
        ? 0
        : Math.round(
            allProgress.reduce((s, p) => s + p.quizScore, 0) / totalSubmissions
          );

    const atRiskStudents = [
      ...new Set(
        allProgress
          .filter((p) => p.dropoutRisk === "Yes")
          .map((p) => p.studentId.toString())
      ),
    ].length;

    // Course-wise average score
    const courseMap = {};
    allProgress.forEach((p) => {
      const cid = p.courseId?._id?.toString() || "unknown";
      if (!courseMap[cid]) {
        courseMap[cid] = { title: p.courseId?.title || "N/A", scores: [] };
      }
      courseMap[cid].scores.push(p.quizScore);
    });
    const coursePerformance = Object.values(courseMap).map((c) => ({
      courseTitle:  c.title,
      averageScore: Math.round(c.scores.reduce((a, b) => a + b, 0) / c.scores.length),
      totalAttempts: c.scores.length,
    }));

    // Performance distribution
    const performanceDist = {
      High:   allProgress.filter((p) => p.predictedPerformance === "High").length,
      Medium: allProgress.filter((p) => p.predictedPerformance === "Medium").length,
      Low:    allProgress.filter((p) => p.predictedPerformance === "Low").length,
    };

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
