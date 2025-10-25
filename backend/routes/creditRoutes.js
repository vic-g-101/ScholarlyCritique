const express = require("express");
const { protect, isAdmin } = require("../middleware/authMiddleware");
const {
  getMyCredits,
  awardCritiqueCredits,
  chargeEssay,
  adjustCredits,
} = require("../controllers/creditController");

const router = express.Router();

router.get("/me", protect, getMyCredits);
router.post("/award-critique", protect, awardCritiqueCredits);
router.post("/charge-essay", protect, chargeEssay);

// router.post("/adjust", protect, isAdmin, adjustCredits);
router.post("/adjust", protect, isAdmin, adjustCredits);

module.exports = router;