const fs = require("fs");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");

function countWords(text) {
  if (!text) return 0;
  return (text.trim().match(/\b[\w’'-]+\b/g) || []).length;
}

async function parsePdfToText(filePath) {
  const buffer = fs.readFileSync(filePath);
  const data = await pdfParse(buffer);
  return data.text || "";
}

async function parseDocxToText(filePath) {
  const result = await mammoth.extractRawText({ path: filePath });
  return result.value || "";
}

async function parseFileToText(filePath, mimetype) {
  if (mimetype === "application/pdf") return parsePdfToText(filePath);
  if (mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
    return parseDocxToText(filePath);
  throw new Error("Unsupported file type");
}

module.exports = { parseFileToText, countWords };