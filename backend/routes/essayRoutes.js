const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const uploadDoc = require("../middleware/uploadDocMiddleware");
const {
  submitEssay,
  getMyEssays,
  getEssayById,
  getFeed,
} = require("../controllers/essayController");

const router = express.Router();

router.post("/", protect, uploadDoc.single("document"), submitEssay);
router.get("/me", protect, getMyEssays);
router.get("/feed", protect, getFeed);
router.get("/:id", protect, getEssayById);

module.exports = router;