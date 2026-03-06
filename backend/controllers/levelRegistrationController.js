const Course            = require("../models/Course");
const Quiz              = require("../models/Quiz");
const LevelRegistration = require("../models/LevelRegistration");
const AttemptHistory    = require("../models/AttemptHistory");
const { buildRecommendations } = require("./recommendationController");

const PASS_THRESHOLD = 60; // %

// ── POST /api/level-reg/register ─────────────────────────────────────────────
// Register a student for a specific level of a course.
// Gate: level N requires level N-1 to be 'completed'.
const registerLevel = async (req, res) => {
  try {
    const { courseId, levelNumber } = req.body;
    const studentId = req.user._id;

    if (!courseId || levelNumber === undefined) {
      return res.status(400).json({ success: false, message: "courseId and levelNumber are required." });
    }

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ success: false, message: "Course not found." });

    const levelExists = course.levels.some((l) => l.levelNumber === parseInt(levelNumber));
    if (!levelExists) {
      return res.status(404).json({ success: false, message: `Level ${levelNumber} not found in this course.` });
    }

    // ── Gate check: previous level must be completed ──────────────────────────
    if (parseInt(levelNumber) > 1) {
      const prev = await LevelRegistration.findOne({
        studentId,
        courseId,
        levelNumber: parseInt(levelNumber) - 1,
        status: "completed",
      });
      if (!prev) {
        return res.status(403).json({
          success: false,
          message: `You must complete Level ${parseInt(levelNumber) - 1} before registering for Level ${levelNumber}.`,
        });
      }
    }

    // ── Duplicate active check ────────────────────────────────────────────────
    const existing = await LevelRegistration.findOne({ studentId, courseId, levelNumber: parseInt(levelNumber) });
    if (existing) {
      if (existing.status === "active") {
        return res.status(409).json({ success: false, message: "You already have an active registration for this level." });
      }
      if (existing.status === "completed") {
        return res.status(409).json({ success: false, message: "You have already completed this level." });
      }
      // failed → allow re-registration by resetting to active
      existing.status      = "active";
      existing.score       = null;
      existing.completedAt = null;
      await existing.save();
      return res.status(200).json({ success: true, data: existing, message: "Re-registered for level successfully." });
    }

    const reg = await LevelRegistration.create({
      studentId,
      courseId,
      levelNumber: parseInt(levelNumber),
    });

    res.status(201).json({ success: true, data: reg });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── GET /api/level-reg/my-levels ─────────────────────────────────────────────
// All level registrations for the logged-in student (active + failed, not completed).
const getMyActiveLevels = async (req, res) => {
  try {
    const regs = await LevelRegistration.find({
      studentId: req.user._id,
      status:    { $in: ["active", "failed"] },
    }).populate("courseId", "title description difficulty image topics levels");

    res.status(200).json({ success: true, count: regs.length, data: regs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── GET /api/level-reg/course-status/:courseId ───────────────────────────────
// Return every level of a course with its status for the current student.
const getCourseStatus = async (req, res) => {
  try {
    const { courseId } = req.params;
    const studentId   = req.user._id;

    const [course, registrations] = await Promise.all([
      Course.findById(courseId).select("title levels image difficulty topics"),
      LevelRegistration.find({ studentId, courseId }),
    ]);

    if (!course) return res.status(404).json({ success: false, message: "Course not found." });

    const regMap = {};
    registrations.forEach((r) => { regMap[r.levelNumber] = r; });

    const levelStatuses = course.levels.map((lv) => {
      const reg = regMap[lv.levelNumber];
      let status = "locked";

      if (reg) {
        status = reg.status; // active | completed | failed
      } else {
        // Not yet registered — can register if level 1 OR previous completed
        if (lv.levelNumber === 1) {
          status = "available";
        } else {
          const prev = regMap[lv.levelNumber - 1];
          if (prev && prev.status === "completed") status = "available";
        }
      }

      return {
        levelNumber: lv.levelNumber,
        title:       lv.title,
        status,
        score:        reg?.score       ?? null,
        attemptCount: reg?.attemptCount ?? 0,
        completedAt:  reg?.completedAt  ?? null,
        registrationId: reg?._id       ?? null,
      };
    });

    res.status(200).json({ success: true, data: { course, levelStatuses } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── POST /api/level-reg/submit-quiz ──────────────────────────────────────────
// Grade a level quiz, record the attempt, and update the registration status.
const submitLevelQuiz = async (req, res) => {
  try {
    const { courseId, levelNumber, answers, timeTaken = 0 } = req.body;
    const studentId = req.user._id;

    if (!courseId || levelNumber === undefined || !answers) {
      return res.status(400).json({ success: false, message: "courseId, levelNumber and answers are required." });
    }

    // ── Find active registration ───────────────────────────────────────────────
    const reg = await LevelRegistration.findOne({
      studentId,
      courseId,
      levelNumber: parseInt(levelNumber),
      status:      "active",
    });
    if (!reg) {
      return res.status(404).json({ success: false, message: "No active registration found for this level." });
    }

    // ── Find quiz for this level ───────────────────────────────────────────────
    const quiz = await Quiz.findOne({ courseId, levelNumber: parseInt(levelNumber) })
      || await Quiz.findOne({ courseId }); // fallback: first quiz of course
    if (!quiz) {
      return res.status(404).json({ success: false, message: "No quiz found for this level." });
    }

    // ── Grade ──────────────────────────────────────────────────────────────────
    let correct = 0;
    quiz.questions.forEach((q) => {
      const submitted = answers[q._id.toString()];
      if (submitted && submitted === q.correctAnswer) correct++;
    });
    const score  = Math.round((correct / quiz.questions.length) * 100);
    const passed = score >= PASS_THRESHOLD;

    // ── Record attempt ────────────────────────────────────────────────────────
    reg.attemptCount += 1;
    const attempt = await AttemptHistory.create({
      studentId,
      courseId,
      levelNumber:   parseInt(levelNumber),
      quizId:        quiz._id,
      score,
      passed,
      attemptNumber: reg.attemptCount,
      timeTaken,
      answers,
    });

    // ── Update registration ───────────────────────────────────────────────────
    reg.score  = score;
    reg.status = passed ? "completed" : "failed";
    if (passed) reg.completedAt = new Date();
    await reg.save();

    // ── Async: regenerate AI recommendations (non-blocking) ────────────────
    buildRecommendations(studentId).catch((err) =>
      console.warn("[recommendationEngine] Failed to update recommendations:", err.message)
    );

    res.status(200).json({
      success: true,
      data: {
        score,
        passed,
        correct,
        total:       quiz.questions.length,
        attemptNumber: reg.attemptCount,
        registration: reg,
        attemptId:    attempt._id,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── GET /api/level-reg/attempts/:courseId/:levelNumber ───────────────────────
// Attempt history for a student on a specific level.
const getAttemptHistory = async (req, res) => {
  try {
    const { courseId, levelNumber } = req.params;
    const studentId = req.user._id;

    const attempts = await AttemptHistory.find({
      studentId,
      courseId,
      levelNumber: parseInt(levelNumber),
    }).sort("createdAt");

    res.status(200).json({ success: true, count: attempts.length, data: attempts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── GET /api/level-reg/all-courses-status ────────────────────────────────────
// All courses with level statuses for the logged-in student (for Available Courses view).
const getAllCoursesStatus = async (req, res) => {
  try {
    const studentId = req.user._id;
    const [courses, registrations] = await Promise.all([
      Course.find().select("title description difficulty image topics levels"),
      LevelRegistration.find({ studentId }),
    ]);

    // Build a lookup: courseId → { levelNumber → registration }
    const regMap = {};
    registrations.forEach((r) => {
      const cid = r.courseId.toString();
      if (!regMap[cid]) regMap[cid] = {};
      regMap[cid][r.levelNumber] = r;
    });

    const result = courses.map((course) => {
      const cid     = course._id.toString();
      const courseRegs = regMap[cid] || {};

      const levelStatuses = course.levels.map((lv) => {
        const reg = courseRegs[lv.levelNumber];
        let status = "locked";
        if (reg) {
          status = reg.status;
        } else {
          if (lv.levelNumber === 1) {
            status = "available";
          } else {
            const prev = courseRegs[lv.levelNumber - 1];
            if (prev && prev.status === "completed") status = "available";
          }
        }
        return {
          levelNumber:   lv.levelNumber,
          title:         lv.title,
          status,
          score:         reg?.score       ?? null,
          attemptCount:  reg?.attemptCount ?? 0,
        };
      });

      return { ...course.toObject(), levelStatuses };
    });

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── GET /api/level-reg/admin/all ─────────────────────────────────────────────
// Admin: all registrations across all students.
const getAllRegistrations = async (req, res) => {
  try {
    const regs = await LevelRegistration.find()
      .populate("studentId", "name email")
      .populate("courseId",  "title difficulty")
      .sort("-createdAt");
    res.status(200).json({ success: true, count: regs.length, data: regs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  registerLevel,
  getMyActiveLevels,
  getCourseStatus,
  submitLevelQuiz,
  getAttemptHistory,
  getAllCoursesStatus,
  getAllRegistrations,
};
