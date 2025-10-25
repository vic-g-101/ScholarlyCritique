const mongoose = require("mongoose");
const {Schema} = mongoose

// This will be used when credits are exchanged for critiquing and submitting paper to be proofread

const CreditTransactionSchema = new Schema(
 {
    user:  { type: Schema.Types.ObjectId, ref: "User", required: true },
    delta: { type: Number, required: true }, // + or - whole number
    type:  { 
      type: String, 
      enum: ["award_critique", "charge_essay", "adjustment"], 
      required: true 
    },
    balanceAfter: { type: Number, required: true }, // snapshot after applying
    meta: {
      critiqueId: { type: Schema.Types.ObjectId, ref: "Critique", default: null },
      stars: { type: Number, min: 1, max: 5, default: null },
      words: { type: Number, default: null },
      note:  { type: String, default: "" },
    },
  },
  { timestamps: true }
);

CreditTransactionSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model("CreditTransaction", CreditTransactionSchema);
