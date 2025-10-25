// controllers/dashboardController.js
const mongoose = require("mongoose");
const User = require("../models/User");
const Essay = require("../models/Essay");
const Critique = require("../models/Critique");
const StarRating = require("../models/StarRating");
const CreditTxn = require("../models/CreditTransaction");

// Optional: only if you want to inline AI prompts in this endpoint.
// If you don’t want AI inside dashboard, you can delete this block.
let groqChatJSON = null;
try {
  ({ groqChatJSON } = require("../services/groqClient")); // your Groq helper
} catch (_) { /* AI optional */ }

// Helper for reviewer leaderboard
function leaderboardPipeline({ start = null, limit = 5, minCount = 0 }) {
  const match = {};
  if (start) match.createdAt = { $gte: start };

  return [
    { $match: match },
    { $group: { _id: "$recipient", avg: { $avg: "$value" }, count: { $sum: 1 } } },
    ...(minCount > 0 ? [{ $match: { count: { $gte: minCount } } }] : []),
    { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "user" } },
    { $unwind: "$user" },
    {
      $project: {
        userId: "$_id",
        avg: { $round: ["$avg", 2] },
        count: 1,
        firstName: "$user.firstName",
        lastName: "$user.lastName",
        school: { $ifNull: ["$user.education.university", null] },
        majorOrStatus: {
          $cond: [
            { $or: [{ $eq: ["$user.education.status", "not"] }, { $not: ["$user.education.status"] }] },
            "Not a Student",
            { $ifNull: ["$user.education.major", null] }
          ]
        }
      }
    },
    { $addFields: { name: { $concat: ["$firstName", " ", "$lastName"] } } },
    { $sort: { avg: -1, count: -1 } },
    { $limit: limit },
    { $project: { firstName: 0, lastName: 0, _id: 0 } }
  ];
}

function ceil500(n) {
  const w = Math.max(0, Number(n) || 0);
  return Math.max(1, Math.ceil(w / 500));
}

exports.getDashboardData = async (req, res) => {
  try {
    const userId = req.user._id;

    // Query params
    const feedLimit = Math.min(parseInt(req.query.feedLimit || "6", 10), 24);
    const txLimit = Math.min(parseInt(req.query.txLimit || "5", 10), 20);
    const lbLimit = Math.min(parseInt(req.query.lbLimit || "5", 10), 10);
    const lbMinCount = Math.max(parseInt(req.query.lbMinCount || "3", 10), 0);
    const lbPeriod = (req.query.lbPeriod || "month").toLowerCase();
    const includePrompts = req.query.includePrompts === "true";

    // Period window for leaderboard
    const now = new Date();
    const startMap = {
      week: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      month: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      quarter: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
    };
    const lbStart = startMap[lbPeriod] || null;

    // Load user basics + preferences (single round trip)
    const mePromise = User.findById(userId).select(
      "firstName credits ratingAvg ratingCount education preferences"
    );

    // My essays counts by status (one aggregate)
    const myEssaysAggPromise = Essay.aggregate([
      { $match: { author: new mongoose.Types.ObjectId(userId) } },
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);

    // My critiques count
    const myCritiquesCountPromise = Critique.countDocuments({ reviewer: userId });

    // Recent credit transactions
    const recentTxPromise = CreditTxn.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(txLimit)
      .select("delta type balanceAfter createdAt meta")
      .lean();

    // Suggested essays (open, not mine)
    const feedQuery = { status: "open", author: { $ne: userId } };
    // Optional: prioritize areas if your Essay has `areas: [String]` and user has preferences
    // We only filter if the field exists and there are preferred areas.
    const essaysFeedPromise = Essay.find(feedQuery)
      .sort({ createdAt: -1 })
      .limit(feedLimit)
      .select("topic summary wordCount editPreference author createdAt")
      .populate("author", "firstName lastName education.university")
      .lean();

    // Leaderboard
    const leaderboardPromise = StarRating.aggregate(
      leaderboardPipeline({ start: lbStart, limit: lbLimit, minCount: lbMinCount })
    );

    // Run in parallel
    const [me, myEssaysAgg, myCritiquesCount, recentTx, feed, leaderboard] = await Promise.all([
      mePromise,
      myEssaysAggPromise,
      myCritiquesCountPromise,
      recentTxPromise,
      essaysFeedPromise,
      leaderboardPromise
    ]);

    if (!me) return res.status(404).json({ message: "User not found" });

    // Normalize essay counts
    const essayCounts = { open: 0, in_review: 0, closed: 0 };
    for (const row of myEssaysAgg) {
      if (row?._id && typeof row.count === "number") {
        essayCounts[row._id] = row.count;
      }
    }

    // Map feed -> include estimated credits
    const suggestedEssays = feed.map(e => ({
      essayId: e._id,
      title: e.topic,                 // you called it "topic" on the model
      summary: e.summary || "",
      wordCount: e.wordCount,
      estimatedCredits: ceil500(e.wordCount),
      editPreference: e.editPreference,
      author: {
        id: e.author?._id || null,
        name: e.author ? `${e.author.firstName} ${e.author.lastName}` : "Unknown",
        school: e.author?.education?.university || null
      },
      createdAt: e.createdAt
    }));

    // Optional: inline AI prompts (kept off by default to keep dashboard snappy)
    let prompts = [];
    if (includePrompts && groqChatJSON) {
      try {
        const status = me.education?.status || null;
        const major = me.education?.major || null;
        const minor = me.education?.minor || null;
        const areas = Array.isArray(me.preferences?.confidentAreas) ? me.preferences.confidentAreas : [];
        const limit = Math.min(parseInt(req.query.promptLimit || "5", 10), 10);

        const system = `
Return STRICT JSON ONLY: { "prompts": ["...", "..."] }.
Each prompt is 1–2 sentences, specific, academically appropriate, and tailored to the user's background.
No extra prose.
`.trim();

        const userMsg = `
User:
- Status: ${status || "unknown"}
- Major: ${major || "none"}
- Minor: ${minor || "none"}
- Interests: ${areas.join(", ") || "none"}
Task: Generate ${limit} distinct essay prompts (1–2 sentences). JSON only.
`.trim();

        const raw = await groqChatJSON({ system, user: userMsg, temperature: 0.4, max_tokens: 600 });
        const arr = Array.isArray(raw?.prompts) ? raw.prompts : [];
        // keep 1–2 sentences
        prompts = arr.map(p => String(p || ""))
          .map(s => s.replace(/\s+/g, " ").trim())
          .map(s => s.split(/(?<=[.!?])\s+/).slice(0, 2).join(" ").slice(0, 280))
          .filter(Boolean)
          .slice(0, limit);
      } catch (e) {
        // fail silently; front-end can call /api/v1/ai/prompts as fallback
        prompts = [];
      }
    }

    return res.json({
      greeting: { firstName: me.firstName },
      credits: { balance: typeof me.credits === "number" ? me.credits : 2 },

      myRating: { avg: Number(me.ratingAvg || 0), count: Number(me.ratingCount || 0) },

      cta: {
        canUpload: (typeof me.credits === "number" ? me.credits : 2) >= 1,
        estimatedUploadCostPer500: 1
      },

      myStats: {
        essays: essayCounts,               // { open, in_review, closed }
        critiquesWritten: myCritiquesCount
      },

      recentTransactions: recentTx,       // last 5 by default

      suggestedEssays,                    // feed of open essays to review

      topReviewers: leaderboard,          // [{ userId, name, school, majorOrStatus, avg, count }]

      prompts                             // [] unless includePrompts=true and Groq set up
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server Error", error: err.message });
  }
};
