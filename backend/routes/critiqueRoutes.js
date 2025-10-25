const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const uploadDoc = require("../middleware/uploadDocMiddleware");
const {
  submitCritique,
  getCritiquesForEssay,
  getMyCritiques,
} = require("../controllers/critiqueController");

const router = express.Router();

// Submit a critique (requires at least one edit/comment; optional annotated file)
router.post("/", protect, uploadDoc.single("document"), submitCritique);

// Lists
router.get("/essay/:essayId", protect, getCritiquesForEssay);
router.get("/me", protect, getMyCritiques);

module.exports = router;