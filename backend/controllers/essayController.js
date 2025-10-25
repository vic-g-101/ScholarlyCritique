const path = require("path");
const Essay = require("../models/Essay");
const User = require("../models/User");
const { parseFileToText, countWords } = require("../services/docParser");
const { costUnitsForEssay, applyCreditTransaction } = require("../services/creditSystem");

// POST /api/v1/essays
// fields: topic (required), summary (optional), editPreference (big_picture|line_edits|mix)
// file field name: "document"
exports.submitEssay = async (req, res) => {
  try {
    const userId = req.user._id;
    const { topic, summary = "", editPreference, title = "" } = req.body;
    const file = req.file;

    if (!file) return res.status(400).json({ message: "No document uploaded" });
    if (!topic) return res.status(400).json({ message: "topic is required" });
    if (!["big_picture","line_edits","mix"].includes(editPreference))
      return res.status(400).json({ message: "editPreference must be big_picture or line_edits or mix" });

    // Parse to text
    const text = await parseFileToText(file.path, file.mimetype);
    const words = countWords(text);
    if (words <= 0) return res.status(400).json({ message: "Could not extract text/words from file" });

    // Compute cost (1 credit per 500 words, rounded up; min 1)
    const cost = costUnitsForEssay(words);

    // Check balance
    const me = await User.findById(userId).select("credits");
    const balance = typeof me?.credits === "number" ? me.credits : 2;
    if (balance < cost) {
      return res.status(402).json({
        message: "Insufficient credits to submit essay",
        required: cost,
        available: balance
      });
    }

      // Persist essay
    const fileUrl = `${req.protocol}://${req.get("host")}/uploads/essays/${path.basename(file.path)}`;
    const essay = await Essay.create({
      author: userId,
      topic,
      summary,
      editPreference,
      title,
      fileUrl,
      wordCount: words,
      bodyText: text,
      status: "open"
    });

    // Charge credits atomically + log transaction
    await applyCreditTransaction({
      userId,
      delta: -cost,
      type: "charge_essay",
      meta: { words, essayId: essay._id }
    });

    const updated = await User.findById(userId).select("credits");

    return res.status(201).json({
      essay,
      charges: { cost },
      credits: { balance: updated.credits }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server Error", error: err.message });
  }
};

// GET /api/v1/essays/me?status=open|in_review|closed
exports.getMyEssays = async (req, res) => {
  try {
    const { status } = req.query;
    const query = { author: req.user._id };
    if (status) query.status = status;
    const essays = await Essay.find(query).sort({ createdAt: -1 }).lean();
    return res.json({ essays });
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

// GET /api/v1/essays/:id
exports.getEssayById = async (req, res) => {
  try {
    const essay = await Essay.findById(req.params.id)
    .populate("author", "firstName lastName")
    .lean();
    if (!essay) return res.status(404).json({ message: "Essay not found" });
    res.json({ essay });
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

// GET /api/v1/essays/feed?limit=10&excludeMine=true
// Essays open for review 
exports.getFeed = async (req, res) => {
  try {

    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
const pageSize = Math.min(Math.max(parseInt(req.query.pageSize || "10", 10), 1), 50);
    const excludeMine = req.query.excludeMine === "true";
    const topic = req.query.topic;

    const q = { status: "open" };
    if (excludeMine) q.author = { $ne: req.user._id };
    if (topic && topic !== "all") q.topic = topic;

    const total = await Essay.countDocuments(q);

    const items = await Essay.find(q)
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .select(
        "topic summary wordCount editPreference author createdAt fileUrl reviewCount ratingAvg title"
      )
      .populate("author", "firstName lastName")
      .lean();

    // Add estimated credits for UI display (ceil(words/500), min 1)
    const mapped = items.map((e) => ({
      ...e,
      estimatedCredits: Math.max(1, Math.ceil((e.wordCount || 0) / 500)),
    }));

    return res.json({ items: mapped, total });
  } catch (err) {
    return res.status(500).json({ message: "Server Error", error: err.message });
  }
};