const nodemailer = require("nodemailer");

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  SMTP_FROM = "no-reply@scholarlycritique.com",
  CLIENT_BASE_URL = "http://localhost:5173", // your frontend base URL
} = process.env;

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: Number(SMTP_PORT || 587),
  secure: false, // true for 465, false for 587/others
  auth: SMTP_USER && SMTP_PASS ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
});

async function sendEssayCritiquedEmail({ to, authorName, essayId, essayTitle }) {
  const url = `${CLIENT_BASE_URL}/essays/${essayId}`;
  const subject = `Your essay just got a new critique${essayTitle ? `: "${essayTitle}"` : ""}`;

  const text = [
    `Hi ${authorName || "there"},`,
    ``,
    `Good news — someone just submitted a critique on your essay${essayTitle ? ` "${essayTitle}"` : ""}.`,
    `Open it here: ${url}`,
    ``,
    `You can rate the critique to award credits back to the reviewer.`,
    ``,
    `— ScholarlyCritique`,
  ].join("\n");

  const html = `
    <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;line-height:1.5;color:#312b28;">
      <h2 style="margin:0 0 8px;color:#5a3a2f;">Your essay just got a new critique!</h2>
      <p>Hi ${authorName || "there"},</p>
      <p>
        Good news — someone just submitted a critique on your essay
        ${essayTitle ? `<strong>"${escapeHtml(essayTitle)}"</strong>` : ""}.
      </p>
      <p>
        <a href="${url}" style="display:inline-block;background:#874f3e;color:#fff;text-decoration:none;padding:10px 14px;border-radius:8px;">
          View critique
        </a>
      </p>
      <p style="color:#6f5145">You can rate the critique to award credits back to the reviewer.</p>
      <p style="color:#6f5145">— ScholarlyCritique</p>
    </div>
  `;

  return transporter.sendMail({
    from: SMTP_FROM,
    to,
    subject,
    text,
    html,
  });
}

function escapeHtml(s = "") {
  return s.replace(/[&<>"']/g, (m) => ({ "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;" }[m]));
}

module.exports = { sendEssayCritiquedEmail };