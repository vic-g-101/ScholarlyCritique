const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
  rateCritique,
  getStarsForCritique,
  getUserReceivedRatings,
  getMyGivenRatings,
  getUserStarSummary,
  updateRating,
  deleteRating,
} = require("../controllers/starController");

const router = express.Router();

// Create or update a rating for a critique (or recipient if critiqueId omitted)
router.post("/", protect, rateCritique);

// Lists
router.get("/critique/:critiqueId", protect, getStarsForCritique);
router.get("/user/:userId/received", protect, getUserReceivedRatings);
router.get("/me/given", protect, getMyGivenRatings);

// Summary for a user (avg + count)
router.get("/user/:userId/summary", protect, getUserStarSummary);

// Manage a specific rating
router.put("/:ratingId", protect, updateRating);
router.delete("/:ratingId", protect, deleteRating);

module.exports = router;