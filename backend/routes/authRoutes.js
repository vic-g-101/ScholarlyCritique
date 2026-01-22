const express = require("express");
const {protect} = require("../middleware/authMiddleware");


const{
    registerUser,
    loginUser,
    getUserInfo,
    updateProfile,
} = require("../controllers/authController");
const upload = require("../middleware/uploadMiddleware");
const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/getUser", protect,getUserInfo);

router.put("/profile", protect, updateProfile);

router.post("/upload-image", upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  const baseUrl =
    process.env.API_BASE_URL ||
    `${req.protocol}://${req.get("host")}`;

  const imageUrl = `${baseUrl}/uploads/${req.file.filename}`;

  return res.status(200).json({ imageUrl });
});

module.exports = router;