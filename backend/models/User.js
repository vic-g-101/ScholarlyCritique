const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const USERNAME_REGEX = /^[A-Za-z0-9_]{6,30}$/;
const UserSchema = new mongoose.Schema({
    //Basic Info
    firstName: {type: String, required: true},
    lastName: {type: String, required: true},
    

    // Username (case-insensitive unique via userNameLower)
    userName: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: v => USERNAME_REGEX.test(v),
        message: "Username must be 6–30 chars, letters/numbers/underscores only."
      }
    },
    // internal, used for case-insensitive uniqueness
    userNameLower: { type: String, unique: true, index: true, select: false },

    email: { type: String, required: true, unique: true},
    password: {type: String, required:true},
    profileImageUrl: { type: String, default: null},

    //Rating and Credits
    ratingAvg:   { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    credits: { type: Number, default: 2 },
    role: { type: String, enum: ["user", "admin"], default: "user" },

    //signup data from signup pages
    // SignUp_2
   education: {
      status: {                             
        type: String,
        enum: ["undergraduate","graduate","recent","not"],
        default: null
      },
      // SignUp_3
      year: {                               
        type: String,
        enum: ["freshman","sophomore","junior","senior", null],
        default: null
      },
      major:      { type: String, default: null },  // SignUp_4
      minor:      { type: String, default: null },  // SignUp_5 
      university: { type: String, default: null }   // SignUp_6
    },

    preferences: {
      // SignUp_7 — multi-select; keep as array
      confidentAreas: {
        type: [String],
        enum: [
          "humanities",
          "social_sciences",
          "argumentative_rhetorical",
          "media_writing",
          "creative_writing",
          "business_law",
          "stem",
          "interdisciplinary",
        ],
        default: []
      },
      // SignUp_8
      feedbackType: {
        type: String,
        enum: ["big_picture","line_edits","mix", null],
        default: null
      }
    },

    // Track onboarding
    onboarding: {
      step:        { type: Number, default: 1 },   // 1..7
      completed:   { type: Boolean, default: false },
      completedAt: { type: Date, default: null }
    }
  },
  { timestamps: true }
);

// Ensure userNameLower is synced (on create & update)
UserSchema.pre("save", function (next) {
  if (this.isModified("userName")) {
    this.userNameLower = this.userName.toLowerCase();
  }
  next();
});

// If using findOneAndUpdate to change username later:
UserSchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate() || {};
  if (update.userName) {
    update.userNameLower = String(update.userName).toLowerCase();
    this.setUpdate(update);
  }
  next();
});

//Hash Passwords before save
UserSchema.pre('save', async function (next){
    if(!this.isModified('password')){
        return next();
    }
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

//Compare oasswirds
UserSchema.methods.comparePassword = async function(candidatePassword){
    return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("User", UserSchema);