const express = require("express");
const { register, login, getMe, getAllStudents } = require("../controllers/authController");
const { protect, authorise } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", register);
router.post("/login",    login);
router.get("/me",        protect, getMe);
router.get("/students",  protect, authorise("admin", "faculty"), getAllStudents);

module.exports = router;
