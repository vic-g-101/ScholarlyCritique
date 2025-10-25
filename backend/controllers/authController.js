const User = require("../models/User")
const jwt = require("jsonwebtoken");

//Generate a JWT Token
const generateToken = (id) =>{
    return jwt.sign({ id }, process.env.JWT_SECRET, {expiresIn: "1h"});
};

//Signup/Register user
exports.registerUser = async (req, res) => {
    const { firstName, lastName, userName, email, password, profileImageUrl} = req.body;

    if (!firstName || !lastName || !userName || !email || !password){
        return res.status(400).json({message:"All fields are required"});
    }

  const emailClean = String(email).trim().toLowerCase();
  const userNameClean = String(userName).trim();

  // Same regex used in model
  const USERNAME_REGEX = /^[A-Za-z0-9_]{6,30}$/;
  if (!USERNAME_REGEX.test(userNameClean)) {
    return res.status(400).json({
      message: "Username must be 6–30 chars and contain only letters, numbers, or underscores.",
    });
  }

try {
    // Check duplicates (email and username)
    const [existingEmail, existingUserName] = await Promise.all([
      User.findOne({ email: emailClean }).select("_id"),
      User.findOne({ userNameLower: userNameClean.toLowerCase() }).select("_id"),
    ]);

    if (existingEmail) {
      return res.status(400).json({ message: "Email already in use" });
    }
    if (existingUserName) {
      return res.status(400).json({ message: "Username already taken" });
    }

    // Create user
    const user = await User.create({
      firstName,
      lastName,
      userName: userNameClean,
      email: emailClean,
      password,
      profileImageUrl: profileImageUrl || null,
    });

    res.status(201).json({
      id: user._id,
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        userName: user.userName,
        email: user.email,
        profileImageUrl: user.profileImageUrl,
        ratingAvg: user.ratingAvg,
        ratingCount: user.ratingCount,
        credits: user.credits,
        onboarding: user.onboarding,
      },
      token: generateToken(user._id),
    });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Error registering user", error: err.message });
  }
};

//Login User
exports.loginUser = async (req, res) => {
    const {email, password} = req.body;
    if(!email || !password){
        return res.status(400).json({message: "All fields are required"});
    }
    try{
        const user = await User.findOne({email});
        if(!user || !(await user.comparePassword(password))){
            return res.status(400).json({message:"Invalid credentials"});
        }

        res.status(200).json({
            id:user._id,
            user,
            token: generateToken(user._id),
        });
    } catch(err){
        res
        .status(500)
        .json({message: "Error registering user", error: err.message});
    }
};

//Check that user exists
exports.getUserInfo = async (req, res) => {
    try{
        const user = await User.findById(req.user.id).select("-password");

        if(!user){
            return res.status(404).json({message: "User not found"});
        }

        res.status(200).json(user);
    }catch(err){
        res
        .status(500)
        .json({message: "Error registering user", error: err.message});
    }
};

// Update profile (education, preferences, onboarding, profileImageUrl, etc.)
exports.updateProfile = async (req, res) => {
  try {
    const body = req.body;

    // Whitelist allowed nested fields
    const allowed = {
      education: ["status", "year", "major", "minor", "university"],
      preferences: ["confidentAreas", "feedbackType"],
      onboarding: ["step", "completed", "completedAt"],
      profileImageUrl: true, // top-level
    };

    // Normalize single vs array for confidentAreas
    const VALID_AREAS = [
      "humanities",
      "social_sciences",
      "argumentative_rhetorical",
      "media_writing",
      "creative_writing",
      "business_law",
      "stem",
      "interdisciplinary",
    ];

    const set = {};

    // education.*
    if (body.education && typeof body.education === "object") {
      for (const k of allowed.education) {
        if (k in body.education) set[`education.${k}`] = body.education[k] ?? null;
      }
    }

    // preferences.*
    if (body.preferences && typeof body.preferences === "object") {
      if ("confidentAreas" in body.preferences) {
        const incoming = body.preferences.confidentAreas;
        const arr = Array.isArray(incoming) ? incoming : (incoming ? [incoming] : []);
        // filter invalid values and ensure unique
        const filtered = [...new Set(arr.filter(v => VALID_AREAS.includes(v)))];
        set["preferences.confidentAreas"] = filtered;
      }
      if ("feedbackType" in body.preferences) set["preferences.feedbackType"] = body.preferences.feedbackType ?? null;
    }

    // onboarding.*
    if (body.onboarding && typeof body.onboarding === "object") {
      for (const k of allowed.onboarding) {
        if (k in body.onboarding) set[`onboarding.${k}`] = body.onboarding[k];
      }
      // Auto-set completedAt if marking completed true and no timestamp supplied
      if (body.onboarding.completed === true && !("completedAt" in body.onboarding)) {
        set["onboarding.completedAt"] = new Date();
      }
    }

    // top-level profileImageUrl (optional)
    if ("profileImageUrl" in body && allowed.profileImageUrl) {
      set["profileImageUrl"] = body.profileImageUrl || null;
    }

    // Block changes to sensitive fields here (email, password, credits, rating*, etc.)
    // Use dedicated endpoints for those if needed.

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: set },
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) return res.status(404).json({ message: "User not found" });
    return res.json(user);
  } catch (err) {
    return res.status(500).json({ message: "Error updating profile", error: err.message });
  }
};