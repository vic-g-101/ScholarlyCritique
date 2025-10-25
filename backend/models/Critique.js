const mongoose = require("mongoose");
const { Schema } = mongoose;

const InlineEditSchema = new Schema(
  {
    // Optional structure for “made at least one edit”
    selection: { type: String, default: "" },   // snippet the reviewer commented on
    suggestion: { type: String, default: "" },  // suggested rewrite
    note: { type: String, default: "" },        // explanation
  },
  { _id: false }
);

const CritiqueSchema = new Schema(
  {
    essay:     { type: Schema.Types.ObjectId, ref: "Essay", required: true },
    reviewer:  { type: Schema.Types.ObjectId, ref: "User", required: true },
    recipient: { type: Schema.Types.ObjectId, ref: "User", required: true }, // essay author

    generalComment: { type: String, default: "" },               // freeform feedback
    inlineEdits:    { type: [InlineEditSchema], default: [] },   // at least one OR comment must exist
    fileUrl:        { type: String, default: null },             // optional annotated upload

    // Keep track if it’s been rated by the author (for UI)
    rated:     { type: Boolean, default: false },
  },
  { timestamps: true }
);

// One critique per reviewer per essay
CritiqueSchema.index({ essay: 1, reviewer: 1 }, { unique: true });
// For listing
CritiqueSchema.index({ essay: 1, createdAt: -1 });
CritiqueSchema.index({ reviewer: 1, createdAt: -1 });

module.exports = mongoose.model("Critique", CritiqueSchema);
