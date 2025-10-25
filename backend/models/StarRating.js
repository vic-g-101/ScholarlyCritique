const mongoose = require("mongoose");
const {Schema} = mongoose

const StarRatingSchema = new Schema(
  {
    rater:     { type: Schema.Types.ObjectId, ref: "User", required: true },      // who gives the rating
    recipient: { type: Schema.Types.ObjectId, ref: "User", required: true },      // who receives the rating
    critique:  { type: Schema.Types.ObjectId, ref: "Critique", default: null },   // optional: the critique being rated
    value:     { type: Number, required: true, min: 1, max: 5 },                  // 1..5
    comment:   { type: String, maxlength: 500, default: "" },                     // optional note
  },
  { timestamps: true }
);

// Uniqueness: one rating per rater per critique.
// If you don’t have a Critique model yet, we still ensure uniqueness across (rater, recipient, critique)
// by allowing critique to be null and including it in the unique index.
StarRatingSchema.index({ rater: 1, recipient: 1, critique: 1 }, { unique: true });

// Helpful read patterns
StarRatingSchema.index({ recipient: 1, createdAt: -1 });
StarRatingSchema.index({ critique: 1, createdAt: -1 });

module.exports = mongoose.model("StarRating", StarRatingSchema);