const mongoose = require("mongoose");
const StarRating = require("../models/StarRating");
const User = require("../models/User");
const Critique = require("../models/Critique");
const Essay = require("../models/Essay");
const { awardUnitsForCritique, applyCreditTransaction } = require("../services/creditSystem");
const { markCritiqueRated } = require("./critiqueController");

// Recompute avg+count for a recipient and cache on User
async function recomputeUserRating(recipientId) {
  const result = await StarRating.aggregate([
    { $match: { recipient: new mongoose.Types.ObjectId(recipientId) } },
    { $group: { _id: "$recipient", avg: { $avg: "$value" }, count: { $sum: 1 } } },
  ]);
  const avg = result[0]?.avg || 0;
  const count = result[0]?.count || 0;
  await User.findByIdAndUpdate(recipientId, { ratingAvg: avg, ratingCount: count });
  return { avg, count };
}

/**
 * POST /api/v1/star
 * Body: { recipientUserId?, critiqueId?, value (1..5), comment? }
 * - If critiqueId is present: only the essay author can rate. Recipient is forced to the critique's reviewer.
 * - If critiqueId is absent: general user→user rating (no credits involved).
 */
exports.rateCritique = async (req, res) => {
  try {
    const raterId = req.user._id.toString();
    let { recipientUserId, critiqueId = null, value, comment = "" } = req.body;

    value = Number(value);
    if (!value) return res.status(400).json({ message: "value is required" });
    if (value < 1 || value > 5) {
      return res.status(400).json({ message: "value must be between 1 and 5" });
    }

    // --- Case A: rating a CRITIQUE (credits awarded on first rating) ---
    if (critiqueId) {
      // Load critique + related docs
      const critique = await Critique.findById(critiqueId)
        .populate("essay", "wordCount author")
        .populate("reviewer", "_id")
        .populate("recipient", "_id"); // essay author

      if (!critique) return res.status(404).json({ message: "Critique not found" });

      // Only the essay author can rate this critique
      if (critique.recipient._id.toString() !== raterId) {
        return res.status(403).json({ message: "Only the essay author can rate this critique" });
      }

      // Force the rating recipient to the REVIEWER (ignore any spoofed recipientUserId)
      recipientUserId = critique.reviewer._id.toString();

      // Self-protection (shouldn’t happen given above check)
      if (recipientUserId === raterId) {
        return res.status(400).json({ message: "You cannot rate yourself" });
      }

      // Upsert rating (one per rater+recipient+critique)
      const rating = await StarRating.findOneAndUpdate(
        { rater: raterId, recipient: recipientUserId, critique: critiqueId },
        { $set: { value, comment } },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );

      // Recompute the reviewer's summary
      const summary = await recomputeUserRating(recipientUserId);

      // Award credits ONLY THE FIRST TIME the critique is rated
      let award = { creditsAwarded: 0 };
      if (!critique.rated) {
        const words = critique.essay.wordCount || 0;
        const units = awardUnitsForCritique(words, value); // full if >=3, half (floored) if <3

        if (units > 0) {
          await applyCreditTransaction({
            userId: recipientUserId, // pay the reviewer
            delta: units,
            type: "award_critique",
            meta: { words, critiqueId, stars: value },
          });
          const reviewer = await User.findById(recipientUserId).select("credits");
          award = { creditsAwarded: units, reviewerBalance: reviewer.credits };
        }

        // Mark as rated so we never double-pay
        await markCritiqueRated(critiqueId);
      }

      return res.status(200).json({ rating, summary, ...award });
    }

    // --- Case B: general user→user rating (no critique, no credits) ---
    if (!recipientUserId) {
      return res.status(400).json({ message: "recipientUserId is required when critiqueId is not provided" });
    }
    if (recipientUserId === raterId) {
      return res.status(400).json({ message: "You cannot rate yourself" });
    }

    const recipient = await User.findById(recipientUserId).select("_id");
    if (!recipient) return res.status(404).json({ message: "Recipient not found" });

    const rating = await StarRating.findOneAndUpdate(
      { rater: raterId, recipient: recipientUserId, critique: null },
      { $set: { value, comment } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    const summary = await recomputeUserRating(recipientUserId);
    return res.status(200).json({ rating, summary });
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(409).json({ message: "Duplicate rating", error: err.message });
    }
    console.error(err);
    return res.status(500).json({ message: "Server Error", error: err.message });
  }
};

/**
 * GET /api/v1/star/critique/:critiqueId
 */
exports.getStarsForCritique = async (req, res) => {
  try {
    const { critiqueId } = req.params;
    const ratings = await StarRating.find({ critique: critiqueId })
      .populate("rater", "firstName lastName profileImageUrl")
      .sort({ createdAt: -1 })
      .lean();
    return res.json({ ratings });
  } catch (err) {
    return res.status(500).json({ message: "Server Error", error: err.message });
  }
};

/**
 * GET /api/v1/star/user/:userId/received
 */
exports.getUserReceivedRatings = async (req, res) => {
  try {
    const { userId } = req.params;
    const ratings = await StarRating.find({ recipient: userId })
      .populate("rater", "firstName lastName profileImageUrl")
      .sort({ createdAt: -1 })
      .lean();
    return res.json({ ratings });
  } catch (err) {
    return res.status(500).json({ message: "Server Error", error: err.message });
  }
};

/**
 * GET /api/v1/star/me/given
 */
exports.getMyGivenRatings = async (req, res) => {
  try {
    const raterId = req.user._id;
    const ratings = await StarRating.find({ rater: raterId })
      .populate("recipient", "firstName lastName profileImageUrl ratingAvg ratingCount")
      .sort({ createdAt: -1 })
      .lean();
    return res.json({ ratings });
  } catch (err) {
    return res.status(500).json({ message: "Server Error", error: err.message });
  }
};

/**
 * GET /api/v1/star/user/:userId/summary
 */
exports.getUserStarSummary = async (req, res) => {
  try {
    const { userId } = req.params;
    const summary = await recomputeUserRating(userId);
    const user = await User.findById(userId).select("ratingAvg ratingCount");
    return res.json({ summary, user });
  } catch (err) {
    return res.status(500).json({ message: "Server Error", error: err.message });
  }
};

/**
 * PUT /api/v1/star/:ratingId
 */
exports.updateRating = async (req, res) => {
  try {
    const { ratingId } = req.params;
    const { value, comment } = req.body;
    const rating = await StarRating.findById(ratingId);
    if (!rating) return res.status(404).json({ message: "Rating not found" });
    if (rating.rater.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not allowed to edit this rating" });
    }
    if (value !== undefined) {
      const v = Number(value);
      if (v < 1 || v > 5) return res.status(400).json({ message: "value must be 1..5" });
      rating.value = v;
    }
    if (comment !== undefined) rating.comment = comment;
    await rating.save();
    const summary = await recomputeUserRating(rating.recipient);
    return res.json({ rating, summary });
  } catch (err) {
    return res.status(500).json({ message: "Server Error", error: err.message });
  }
};

/**
 * DELETE /api/v1/star/:ratingId
 */
exports.deleteRating = async (req, res) => {
  try {
    const { ratingId } = req.params;
    const rating = await StarRating.findById(ratingId);
    if (!rating) return res.status(404).json({ message: "Rating not found" });
    if (rating.rater.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not allowed to delete this rating" });
    }
    const recipientId = rating.recipient.toString();
    await rating.deleteOne();
    const summary = await recomputeUserRating(recipientId);
    return res.json({ message: "Deleted", summary });
  } catch (err) {
    return res.status(500).json({ message: "Server Error", error: err.message });
  }
};
