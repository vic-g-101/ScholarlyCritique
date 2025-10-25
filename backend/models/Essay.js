const mongoose = require("mongoose");
const { Schema } = mongoose;

const EssaySchema = new Schema(
  {
    title: { type: String, default: "" },
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    topic: { type: String, required: true },                   // e.g., "Political Science"
    summary: { type: String, default: "" },                    // optional
    editPreference: {                                          // what edits they want
      type: String,
      enum: ["big_picture", "line_edits", "mix"],
      required: true,
    },
    fileUrl: { type: String, required: true },                 // saved upload
    wordCount: { type: Number, required: true },
    bodyText: { type: String, required: true },                // parsed text used for reviews
    status: { type: String, enum: ["open","in_review","closed"], default: "open" },
    reviewCount: { type: Number, default: 0 }
  },
  { timestamps: true }
);

EssaySchema.index({ author: 1, createdAt: -1 });
EssaySchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model("Essay", EssaySchema);