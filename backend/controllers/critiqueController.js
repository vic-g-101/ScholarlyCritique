const path = require("path");
const Essay = require("../models/Essay");
const Critique = require("../models/Critique");
const User = require("../models/User");
const { sendEssayCritiquedEmail } = require("../services/mailer");


// Helper: check that there’s at least one edit or one comment (or an uploaded file)
function hasSubstantiveFeedback({ generalComment, inlineEdits, file }) {
  const hasComment = typeof generalComment === "string" && generalComment.trim().length > 0;
  const hasEdits   = Array.isArray(inlineEdits) && inlineEdits.length > 0;
  const hasFile    = !!file;
  return hasComment || hasEdits || hasFile;
}

/**
 * POST /api/v1/critiques
 * multipart/form-data allowed (for optional annotated file)
 * Fields:
 *  - essayId (required)
 *  - generalComment (optional, string)
 *  - inlineEdits (optional, JSON stringified array of {selection, suggestion, note})
 *
 * Rules:
 *  - must not critique own essay
 *  - must include at least one edit or comment(or file)
 *  - only one critique per reviewer per essay(change later)
 */
exports.submitCritique = async (req, res) => {
  try {
    const reviewerId = req.user._id;
    const { essayId } = req.body;
    if (!essayId) return res.status(400).json({ message: "essayId is required" });

    const essay = await Essay.findById(essayId).select("author status summary topic");
    if (!essay) return res.status(404).json({ message: "Essay not found" });
    if (essay.author.toString() === reviewerId.toString()) {
      return res.status(400).json({ message: "You cannot critique your own essay" });
    }
    if (essay.status === "closed") {
      return res.status(400).json({ message: "This essay is closed for reviews" });
    }

    // Parse inlineEdits if it came as stringified JSON
    let inlineEdits = req.body.inlineEdits;
    if (typeof inlineEdits === "string") {
      try { inlineEdits = JSON.parse(inlineEdits); } catch { inlineEdits = []; }
    }
    if (!Array.isArray(inlineEdits)) inlineEdits = [];

    const generalComment = req.body.generalComment || "";

    if (!hasSubstantiveFeedback({ generalComment, inlineEdits, file: req.file })) {
      return res.status(400).json({ message: "Add at least one edit or a comment before submitting" });
    }

    let fileUrl = null;
    if (req.file) {
      // uploaded annotated file
      fileUrl = `${req.protocol}://${req.get("host")}/uploads/essays/${path.basename(req.file.path)}`;
    }

    // Create critique (enforced unique by index)
    const critique = await Critique.create({
      essay: essay._id,
      reviewer: reviewerId,
      recipient: essay.author,
      generalComment,
      inlineEdits,
      fileUrl
    });
    //Award Base Credits immediately on submission
    try {
      const essayWithWords = await Essay.findById(essay._id).select("wordCount");
      const words = essayWithWords?.wordCount || 0;
      const units = require("../services/creditSystem").awardUnitsForCritique(words);

    if (units > 0) {
    await require("../services/creditSystem").applyCreditTransaction({
      userId: reviewerId,
      delta: units,
      type: "award_critique",
      meta: { essayId: essay._id, words },
    });
    }
  } catch (creditErr) {
    console.warn("Failed to award submission credits:", creditErr);
  }

    // Denormalize: bump essay.reviewCount, optionally set status to `in_review`
    await Essay.findByIdAndUpdate(essay._id, {
      $inc: { reviewCount: 1 },
      $set: { status: "in_review" }
    });

    // Email notify the author (best-effort; don't block the response on failures)
    try {
      const author = await User.findById(essay.author).select("firstName lastName email notifications");
      const canEmail = author?.email;
      if (canEmail) {
        await sendEssayCritiquedEmail({
          to: author.email,
          authorName: [author.firstName, author.lastName].filter(Boolean).join(" "),
          essayId: essay._id.toString(),
          essayTitle: essay.title,
        });
      }
    } catch (mailErr) {
      // log only; do not fail the request
      console.warn("Email notify failed:", mailErr?.message || mailErr);
    }


    return res.status(201).json({ critique });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "You already submitted a critique for this essay" });
    }
    console.error(err);
    return res.status(500).json({ message: "Server Error", error: err.message });
  }
};

/**
 * GET /api/v1/critiques/essay/:essayId
 * Essay author can see ALL critiques on their essay.
 * Reviewers can see their own critique on that essay.
 */
exports.getCritiquesForEssay = async (req, res) => {
  try {
    const { essayId } = req.params;
    const essay = await Essay.findById(essayId).select("author");
    if (!essay) return res.status(404).json({ message: "Essay not found" });

    const isAuthor = essay.author.toString() === req.user._id.toString();

    const query = { essay: essayId };
    if (!isAuthor) {
      // not the author → only return the current user's critique for this essay
      query.reviewer = req.user._id;
    }

    const critiques = await Critique.find(query)
      .populate("reviewer", "firstName lastName profileImageUrl ratingAvg ratingCount")
      .sort({ createdAt: -1 })
      .lean();

    res.json({ critiques, canViewAll: isAuthor });
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

/**
 * GET /api/v1/critiques/me
 * List critiques I have written.
 */
exports.getMyCritiques = async (req, res) => {
  try {
    const critiques = await Critique.find({ reviewer: req.user._id })
      .populate("essay", "topic wordCount author")
      .sort({ createdAt: -1 })
      .lean();
    res.json({ critiques });
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

/**
 * Mark critique as 'rated' (called from your Stars controller after a rating is saved)
 */
exports.markCritiqueRated = async (critiqueId) => {
  try {
    await Critique.findByIdAndUpdate(critiqueId, { $set: { rated: true } });
  } catch (e) {
    // swallow – not critical
  }
};