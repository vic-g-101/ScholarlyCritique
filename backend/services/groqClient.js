const Groq = require("groq-sdk");

const client = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

async function groqChatJSON({ system, user, model = process.env.LLM_MODEL || "llama-3.1-8b-instant", temperature = 0.6, max_tokens = 900 }) {
  const completion = await client.chat.completions.create({
    model,
    temperature,
    max_tokens,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  });

  const content = completion?.choices?.[0]?.message?.content?.trim() || "";
  // Expect STRICT JSON; try to parse, else throw a friendly error
  try {
    return JSON.parse(content);
  } catch (e) {
    // Attempt to salvage JSON if the model wrapped it
    const m = content.match(/\{[\s\S]*\}$/);
    if (m) {
      return JSON.parse(m[0]);
    }
    throw new Error("Model did not return valid JSON");
  }
}

module.exports = { groqChatJSON };