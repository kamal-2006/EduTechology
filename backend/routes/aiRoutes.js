const express = require("express");
const router  = express.Router();
const { protect, authorise } = require("../middleware/authMiddleware");
const { chat, reindex }      = require("../controllers/aiController");

// POST /api/ai/chat   — all logged-in users
router.post("/chat", protect, chat);

// POST /api/ai/reindex — admin/faculty only (rebuild RAG index after bulk changes)
router.post("/reindex", protect, authorise("admin", "faculty"), reindex);

module.exports = router;
