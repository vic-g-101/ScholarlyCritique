const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { getPrompts } = require("../controllers/aiPromptController");

const router = express.Router();
router.get("/prompts", protect, getPrompts);
router.post("/prompts", protect, getPrompts);

module.exports = router;