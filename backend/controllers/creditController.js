const User = require("../models/User");
const CreditTxn = require("../models/CreditTransaction");
const {
  awardUnitsForCritique,
  costUnitsForEssay,
  applyCreditTransaction,
} = require("../services/creditSystem");

/** GET /api/v1/credits/me  -> current balance + recent txns */
exports.getMyCredits = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("credits");
    const credits = typeof user?.credits === "number" ? user.credits : 2;

    // lazily backfill if missing
    if (user && typeof user.credits !== "number") {
      user.credits = 2;
      await user.save();
    }

    const txns = await CreditTxn.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    res.json({ credits, transactions: txns });
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

/** POST /api/v1/credits/award-critique
 * body: { recipientUserId, words, stars, critiqueId? , note? }
 * applies +credits (whole number, star-gated)
 */
exports.awardCritiqueCredits = async (req, res) => {
  try {
    const { recipientUserId, words, stars, critiqueId = null, note = "" } = req.body;

    if (!recipientUserId || words == null || stars == null) {
      return res.status(400).json({ message: "recipientUserId, words, and stars are required" });
    }

    // no self-award even if called directly
    if (recipientUserId.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: "Cannot award credits to yourself" });
    }

    const units = awardUnitsForCritique(words, stars);
    if (units <= 0) {
      return res.status(400).json({ message: "Computed award is zero; check inputs" });
    }

    const { user, txn } = await applyCreditTransaction({
      userId: recipientUserId,
      delta: units, // add
      type: "award_critique",
      meta: { words, stars, critiqueId, note },
    });

    res.json({ credits: user.credits, transaction: txn });
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

/** POST /api/v1/credits/charge-essay
 * body: { words, essayId?, note? }
 * charges the current user (requires sufficient balance)
 */
exports.chargeEssay = async (req, res) => {
  try {
    const { words, essayId = null, note = "" } = req.body;
    if (words == null) return res.status(400).json({ message: "words is required" });

    const cost = costUnitsForEssay(words);
    const me = await User.findById(req.user._id).select("credits");
    const balance = typeof me?.credits === "number" ? me.credits : 2;

    if (balance < cost) {
      return res.status(402).json({ message: "Insufficient credits", required: cost, available: balance });
    }

    const { user, txn } = await applyCreditTransaction({
      userId: req.user._id,
      delta: -cost, // subtract
      type: "charge_essay",
      meta: { words, essayId, note },
    });

    res.json({ credits: user.credits, transaction: txn });
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

/** 
 * Just in case admin needs to make adjustment to someones points
 *  POST /api/v1/credits/adjust
 * body: { userId, delta, note? } -> admin/manual adjustments
 */
exports.adjustCredits = async (req, res) => {
  try {
    const { userId, delta, note = "" } = req.body;
    if (!userId || typeof delta !== "number")
      return res.status(400).json({ message: "userId and numeric delta are required" });

    const { user, txn } = await applyCreditTransaction({
      userId,
      delta: Math.trunc(delta), // ensure whole number
      type: "adjustment",
      meta: { note },
    });

    res.json({ credits: user.credits, transaction: txn });
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};