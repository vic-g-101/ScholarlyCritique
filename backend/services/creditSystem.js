const mongoose = require("mongoose");
const User = require("../models/User");
const CreditTxn = require("../models/CreditTransaction");

// Function that will round up to each 500 words, minimum 1 unit
//Check for potential bug what happens if essay has low amount of words
function unitsFromWords(words) {
  const n = Math.max(0, Number(words) || 0);
  return Math.max(1, Math.ceil(n / 500));
}


function awardUnitsForCritique(words) {
  return unitsFromWords(words);
}

// Charge logic: cost = unitsFromWords(words) 
function costUnitsForEssay(words) {
  return unitsFromWords(words);
}

//Apply a credit delta and log a transaction

async function applyCreditTransaction({ userId, delta, type, meta = {} }) {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      // Ensure user exists
      const user = await User.findById(userId).session(session);
      if (!user) throw new Error("User not found");

      // Initialize missing credits lazily
      if (typeof user.credits !== "number") user.credits = 2;

      const nextBalance = user.credits + delta;
      user.credits = nextBalance;
      await user.save({ session });

      const txn = await CreditTxn.create([{
        user: user._id,
        delta,
        type,
        balanceAfter: nextBalance,
        meta,
      }], { session });

      result = { user, txn: txn[0] };
    });
    return result;
  } finally {
    session.endSession();
  }
}

module.exports = {
  unitsFromWords,
  awardUnitsForCritique,
  costUnitsForEssay,
  applyCreditTransaction,
};