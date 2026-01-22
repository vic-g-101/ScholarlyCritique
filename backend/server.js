require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const starRoutes = require("./routes/starRoutes")
const creditRoutes = require("./routes/creditRoutes")
const dashboardRoutes = require("./routes/dashboardRoutes");
const essayRoutes = require("./routes/essayRoutes");
const critiqueRoutes = require("./routes/critiqueRoutes");
const leaderboardRoutes = require("./routes/leaderboardRoutes");
const aiRoutes = require("./routes/aiRoutes");

const app = express();

app.use(
  cors({
    origin: (origin, callback) => {
      if (
        !origin ||
        origin.startsWith("http://localhost") ||
        origin.endsWith(".vercel.app")
      ) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

connectDB();

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/star", starRoutes);
app.use("/api/v1/credits", creditRoutes);
app.use("/api/v1/essays", essayRoutes);
app.use("/api/v1/critiques", critiqueRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);
app.use("/api/v1/leaderboard", leaderboardRoutes);
app.use("/api/v1/ai", aiRoutes);

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const PORT = process.env.PORT || 8000;
app.listen(PORT, ()=> console.log(`Server running on port ${PORT}`));

