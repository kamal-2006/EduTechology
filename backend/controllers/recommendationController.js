const AttemptHistory  = require("../models/AttemptHistory");
const LevelRegistration = require("../models/LevelRegistration");
const Recommendation  = require("../models/Recommendation");

/* ── Rule thresholds ──────────────────────────────────────────────────────── */
const THRESHOLD_LOW        = 50;  // below this → revise + rewatch
const THRESHOLD_MID        = 75;  // 50–75 → extra practice; >75 → advance
const MULTI_FAIL_THRESHOLD = 2;   // ≥ this many failed attempts → revisit level

/* ── Priority sort weight ─────────────────────────────────────────────────── */
const PRIORITY_WEIGHT = { high: 0, medium: 1, low: 2 };

/**
 * Core engine — builds and upserts the recommendation document for a student.
 * Safe to call from other controllers (e.g. after quiz submission).
 *
 * @param {ObjectId|string} studentId
 * @returns {Promise<Recommendation>}
 */
const buildRecommendations = async (studentId) => {
  // ── 1. All attempt history for this student ─────────────────────────────
  const attempts = await AttemptHistory.find({ studentId })
    .populate("courseId", "title topics levels")
    .lean();

  if (attempts.length === 0) {
    return Recommendation.findOneAndUpdate(
      { studentId },
      { studentId, generatedAt: new Date(), overallStatus: "on_track", recommendations: [] },
      { upsert: true, new: true }
    );
  }

  // ── 2. All level registrations (for status context) ─────────────────────
  const regs = await LevelRegistration.find({ studentId }).lean();
  const regMap = {};
  regs.forEach((r) => {
    regMap[`${r.courseId}_${r.levelNumber}`] = r;
  });

  // ── 3. Group attempts by course → by level number ───────────────────────
  const courseMap = {};
  for (const attempt of attempts) {
    if (!attempt.courseId) continue;
    const cid = attempt.courseId._id.toString();
    if (!courseMap[cid]) courseMap[cid] = { course: attempt.courseId, levels: {} };
    const lvl = attempt.levelNumber;
    if (!courseMap[cid].levels[lvl]) courseMap[cid].levels[lvl] = [];
    courseMap[cid].levels[lvl].push(attempt);
  }

  // ── 4. Generate rule-based recommendation items ─────────────────────────
  const items = [];
  let atRiskCount = 0;
  let needsImprovementCount = 0;

  for (const cid of Object.keys(courseMap)) {
    const { course, levels } = courseMap[cid];
    const courseTitle  = course.title || "Unknown Course";
    const courseLevels = course.levels || [];

    for (const [lvlStr, lvlAttempts] of Object.entries(levels)) {
      const levelNumber  = parseInt(lvlStr, 10);
      const levelDoc     = courseLevels.find((l) => l.levelNumber === levelNumber);
      const levelTitle   = levelDoc?.title   || `Level ${levelNumber}`;
      const videoUrl     = levelDoc?.videoUrl || "";

      const scores         = lvlAttempts.map((a) => a.score);
      const latestScore    = lvlAttempts[lvlAttempts.length - 1]?.score ?? 0;
      const bestScore      = Math.max(...scores);
      const attemptCount   = lvlAttempts.length;
      const failedAttempts = lvlAttempts.filter((a) => !a.passed).length;

      const reg           = regMap[`${cid}_${levelNumber}`];
      const currentStatus = reg?.status || null;

      // ── Rule A: multiple failures → revisit level ──────────────────────
      if (failedAttempts >= MULTI_FAIL_THRESHOLD && currentStatus !== "completed") {
        atRiskCount++;
        items.push({
          courseId:    course._id,
          courseTitle,
          levelNumber,
          levelTitle,
          type:     "revisit_level",
          priority: "high",
          message:  `You have failed "${levelTitle}" in "${courseTitle}" ${failedAttempts} time${failedAttempts > 1 ? "s" : ""}. Revisit the study materials from the beginning before retrying.`,
          videoUrl: "",
          topic:    levelTitle,
        });
        if (videoUrl) {
          items.push({
            courseId:    course._id,
            courseTitle,
            levelNumber,
            levelTitle,
            type:     "rewatch_video",
            priority: "high",
            message:  `Rewatch the tutorial video for "${levelTitle}" in "${courseTitle}" to reinforce the concepts you're struggling with.`,
            videoUrl,
            topic:    levelTitle,
          });
        }
        continue;
      }

      // Skip completed levels (only emit "next level" below)
      if (currentStatus === "completed") {
        const nextLevelDoc = courseLevels.find((l) => l.levelNumber === levelNumber + 1);
        if (nextLevelDoc) {
          items.push({
            courseId:    course._id,
            courseTitle,
            levelNumber: nextLevelDoc.levelNumber,
            levelTitle:  nextLevelDoc.title,
            type:     "next_level",
            priority: "low",
            message:  `You passed "${levelTitle}" with a best score of ${bestScore}%. You're ready for Level ${nextLevelDoc.levelNumber}: "${nextLevelDoc.title}" in "${courseTitle}".`,
            videoUrl: nextLevelDoc.videoUrl || "",
            topic:    "",
          });
        } else {
          items.push({
            courseId:    course._id,
            courseTitle,
            levelNumber,
            levelTitle,
            type:     "next_level",
            priority: "low",
            message:  `Excellent! You've completed all levels in "${courseTitle}". Consider exploring advanced or related courses to continue growing.`,
            videoUrl: "",
            topic:    "",
          });
        }
        continue;
      }

      // ── Rule B: low score < 50% → revise topic + rewatch ──────────────
      if (latestScore < THRESHOLD_LOW) {
        needsImprovementCount++;
        items.push({
          courseId:    course._id,
          courseTitle,
          levelNumber,
          levelTitle,
          type:     "revise_topic",
          priority: "high",
          message:  `Your score of ${latestScore}% in "${levelTitle}" (${courseTitle}) is below 50%. Thoroughly review the study notes and key concepts for this level before attempting again.`,
          videoUrl: "",
          topic:    levelTitle,
        });
        if (videoUrl) {
          items.push({
            courseId:    course._id,
            courseTitle,
            levelNumber,
            levelTitle,
            type:     "rewatch_video",
            priority: "high",
            message:  `Rewatch the "${levelTitle}" tutorial video in "${courseTitle}" to build a stronger foundation before your next attempt.`,
            videoUrl,
            topic:    levelTitle,
          });
        }
        continue;
      }

      // ── Rule C: mid score 50–75% → extra practice ────────────────────
      if (latestScore <= THRESHOLD_MID) {
        needsImprovementCount++;
        items.push({
          courseId:    course._id,
          courseTitle,
          levelNumber,
          levelTitle,
          type:     "practice_quiz",
          priority: "medium",
          message:  `You scored ${latestScore}% in "${levelTitle}" (${courseTitle}). Practice ${attemptCount === 1 ? "additional" : "more"} quiz questions to close knowledge gaps before advancing.`,
          videoUrl: "",
          topic:    levelTitle,
        });
        continue;
      }

      // ── Rule D: high score > 75%, status active → advance ─────────────
      if (latestScore > THRESHOLD_MID) {
        const nextLevelDoc = courseLevels.find((l) => l.levelNumber === levelNumber + 1);
        if (nextLevelDoc) {
          items.push({
            courseId:    course._id,
            courseTitle,
            levelNumber: nextLevelDoc.levelNumber,
            levelTitle:  nextLevelDoc.title,
            type:     "next_level",
            priority: "low",
            message:  `Great work on "${levelTitle}" in "${courseTitle}" with ${latestScore}%! You're ready to move on to Level ${nextLevelDoc.levelNumber}: "${nextLevelDoc.title}".`,
            videoUrl: nextLevelDoc.videoUrl || "",
            topic:    "",
          });
        } else {
          items.push({
            courseId:    course._id,
            courseTitle,
            levelNumber,
            levelTitle,
            type:     "next_level",
            priority: "low",
            message:  `Outstanding! You've mastered "${levelTitle}" in "${courseTitle}" with ${latestScore}%. You've completed this course — explore more advanced content next.`,
            videoUrl: "",
            topic:    "",
          });
        }
      }
    }
  }

  // ── 5. Determine overall health status ──────────────────────────────────
  let overallStatus = "on_track";
  if (atRiskCount > 0)             overallStatus = "at_risk";
  else if (needsImprovementCount > 0) overallStatus = "needs_improvement";

  // Sort: high → medium → low, then by courseTitle for stable ordering
  items.sort((a, b) => {
    const pw = PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority];
    if (pw !== 0) return pw;
    return a.courseTitle.localeCompare(b.courseTitle);
  });

  // ── 6. Upsert one document per student ──────────────────────────────────
  const doc = await Recommendation.findOneAndUpdate(
    { studentId },
    { studentId, generatedAt: new Date(), overallStatus, recommendations: items },
    { upsert: true, new: true }
  );
  return doc;
};

// ── GET /api/recommendations/:studentId ──────────────────────────────────────
const getRecommendations = async (req, res) => {
  try {
    const { studentId } = req.params;

    // Access control: students can only fetch their own recommendations
    if (req.user.role === "student" && req.user._id.toString() !== studentId) {
      return res.status(403).json({ success: false, message: "Access denied." });
    }

    let doc = await Recommendation.findOne({ studentId });

    // Auto-refresh if missing or older than 1 hour
    const ONE_HOUR = 60 * 60 * 1000;
    const stale = !doc || Date.now() - new Date(doc.generatedAt).getTime() > ONE_HOUR;
    if (stale) {
      doc = await buildRecommendations(studentId);
    }

    res.status(200).json({ success: true, data: doc });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── POST /api/recommendations/refresh ────────────────────────────────────────
// Force-regenerate recommendations for the logged-in student (or any student
// for admin/faculty).
const refreshRecommendations = async (req, res) => {
  try {
    // Students refresh their own; admin/faculty can supply a studentId
    const studentId =
      req.user.role === "student"
        ? req.user._id
        : req.body.studentId || req.user._id;

    const doc = await buildRecommendations(studentId);
    res.status(200).json({ success: true, data: doc });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getRecommendations, refreshRecommendations, buildRecommendations };
