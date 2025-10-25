const User = require("../models/User");
const { groqChatJSON } = require("../services/groqClient");

function toSentences(text) {
  const s = String(text || "").replace(/\s+/g, " ").trim();
  if (!s) return "";
  const parts = s.split(/(?<=[\.!\?])\s+/);     // rough sentence split
  return parts.slice(0, 2).join(" ").trim();    // keep max 2 sentences
}
function sanitizePrompts(payload, limit) {
  const arr = Array.isArray(payload?.prompts) ? payload.prompts : [];
  const out = [];
  const seen = new Set();
  for (let p of arr) {
    p = toSentences(p).slice(0, 280);           // keep concise
    if (!p) continue;
    const key = p.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(p);
    if (out.length >= limit) break;
  }
  return out;
}

exports.getPrompts = async (req, res) => {
  try {
    const me = await User.findById(req.user._id).lean();
    if (!me) return res.status(404).json({ message: "User not found" });

    const limit = Math.min(parseInt(req.query.limit || "3", 10), 12);

    const major = me.education?.major || null;
    const minor = me.education?.minor || null;
    const status = me.education?.status || null;        // "undergraduate" | "graduate" | "recent" | "not"
    const areasFromProfile = Array.isArray(me.preferences?.confidentAreas) ? me.preferences.confidentAreas : [];
    const areasOverride = (req.query.area || req.query.areas || "")
      .split(",").map(s => s.trim()).filter(Boolean);

    const areas = areasOverride.length ? areasOverride : areasFromProfile;

    const system = `
You generate concise essay prompts. 
Rules:
- Return STRICT JSON ONLY like: { "prompts": ["...", "..."] }
- Each prompt must be 1 sentence. No titles, no lists, no numbering.
- Fit the user's background (major/minor/interests).
- Keep prompts generic.
`.trim();

    const userMsg = `
User background:
- Status: ${status || "unknown"}
- Major: ${major || "none"}
- Minor: ${minor || "none"}
- Interests/areas: ${areas.join(", ") || "none"}

Task:
Generate ${limit} generic essay prompts (1 sentence each), that pose engaging yet focused topics suitable for a college-level paper.
Ensure that the topics are clear, specific, and open to analysis or argument. Do not create prompts that require surveys or original data collection beyond what can be researched online.
Cover a variety of disciplines (e.g., humanities, social sciences, natural sciences, literature, philosophy, technology, economics) to ensure diversity of topics.
No extra text—return JSON only: { "prompts": [...] }.
`.trim();

    const raw = await groqChatJSON({ system, user: userMsg, temperature: 0.4, max_tokens: 700 });
    const prompts = sanitizePrompts(raw, limit);

    // Fallback if the model returns nothing usable
    if (!prompts.length) {
      return res.json({
        count: 3,
        prompts: [
          "Examine a contemporary debate in your field and argue a position using at least two competing theoretical frameworks.",
          "Identify a real-world case that illustrates a principle from your coursework and evaluate its strengths and limitations.",
          "Compare how two disciplines would approach the same problem; propose a synthesis that improves on each."
        ],
        source: "fallback"
      });
    }

    return res.json({ count: prompts.length, prompts });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "AI prompt generation failed" });
  }
};