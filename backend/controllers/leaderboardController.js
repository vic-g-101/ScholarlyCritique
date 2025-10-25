const mongoose = require("mongoose");
const StarRating = require("../models/StarRating");

// helper: compute start date from ?period
function startFrom(period = "month") {
  const now = new Date();
  switch ((period || "").toLowerCase()) {
    case "week":     return new Date(now.getTime() - 7  * 24 * 60 * 60 * 1000);
    case "month":    return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case "quarter":  return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    case "all":
    default:         return null; // no time filter
  }
}

/**
 * GET /api/v1/leaderboard/reviewers?period=month|week|quarter|all&limit=5&minCount=3
 * Ranks reviewers (people who RECEIVE ratings) by avg stars within the period.
 * Sort: avg desc, count desc.
 * Returns: { userId, name, school, majorOrStatus, avg, count }
 */
exports.getTopReviewers = async (req, res) => {
  try {
    const period    = (req.query.period || "month").toLowerCase();
    const limit     = Math.min(parseInt(req.query.limit || "5", 10), 50);
    const minCount  = Math.max(parseInt(req.query.minCount || "0", 10), 0);

    const match = {};
    const start = startFrom(period);
    if (start) match.createdAt = { $gte: start };

    const pipeline = [
      { $match: match },                          // filter by time
      { $group: {                                 // group by recipient (the reviewer)
          _id: "$recipient",
          avg: { $avg: "$value" },
          count: { $sum: 1 },
        }
      },
      ...(minCount > 0 ? [{ $match: { count: { $gte: minCount } } }] : []),
      // join user info
      { $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user"
        }
      },
      { $unwind: "$user" },
      // project formatted fields
      { $project: {
          userId: "$_id",
          avg: { $round: ["$avg", 2] },
          count: 1,
          firstName: "$user.firstName",
          lastName:  "$user.lastName",
          school:    { $ifNull: ["$user.education.university", null] },
          // if education.status === "not" or missing -> "Not a Student" else major (or null)
          majorOrStatus: {
            $cond: [
              { $or: [
                  { $eq: ["$user.education.status", "not"] },
                  { $not: ["$user.education.status"] }
                ] },
              "Not a Student",
              { $ifNull: ["$user.education.major", null] }
            ]
          }
        }
      },
      { $addFields: {
          name: { $concat: ["$firstName", " ", "$lastName"] }
        }
      },
      { $sort: { avg: -1, count: -1 } },
      { $limit: limit },
      { $project: { firstName: 0, lastName: 0, _id: 0 } }
    ];

    const rows = await StarRating.aggregate(pipeline);

    return res.json({
      period,
      limit,
      minCount,
      results: rows
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server Error", error: err.message });
  }
};