const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { getTopReviewers } = require("../controllers/leaderboardController");

const router = express.Router();

// You can remove `protect` if you want this public.
router.get("/reviewers", protect, getTopReviewers);

module.exports = router;