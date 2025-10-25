// node scripts/grantCredits.js you@example.com friend@example.com 100 "welcome bonus"
require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");
const { applyCreditTransaction } = require("../services/creditSystem");

(async () => {
  try {
    const [,, emailA, emailB, deltaArg, ...noteParts] = process.argv;
    if (!emailA || !emailB || !deltaArg) {
      console.error("Usage: node scripts/grantCredits.js <emailA> <emailB> <delta> [note...]");
      process.exit(1);
    }
    const delta = Math.trunc(Number(deltaArg));
    if (!delta) throw new Error("Delta must be a non-zero integer");
    const note = noteParts.join(" ") || "manual grant";

    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is not set in environment (.env)");
    }

    await mongoose.connect(process.env.MONGO_URI);

    const [uA, uB] = await Promise.all([
      User.findOne({ email: emailA }),
      User.findOne({ email: emailB }),
    ]);

    if (!uA) throw new Error(`User not found: ${emailA}`);
    if (!uB) throw new Error(`User not found: ${emailB}`);

    for (const u of [uA, uB]) {
      const { user, txn } = await applyCreditTransaction({
        userId: u._id,
        delta,
        type: "adjustment",
        meta: { note },
      });
      console.log(`Granted ${delta} credits to ${u.email} -> new balance ${user.credits} (txn ${txn._id})`);
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
