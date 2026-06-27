const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const analyzeRouter = require("./routes/analyze");
const authRouter = require("./routes/auth");

const app = express();
const PORT = process.env.PORT || 5200;

// Initialize app-level globals for in-memory fallback sessions
app.locals.inMemoryHistory = [];
app.locals.inMemoryUsers = []; // Dynamic fallback for user accounts
app.locals.useInMemory = false;

app.use(cors());
app.use(express.json());

// API Routes
app.use("/api/v1/auth", authRouter);
app.use("/api/v1", analyzeRouter);

// Serve static assets from frontend build directory
const frontendDistPath = path.join(__dirname, "../frontend/dist");
app.use(express.static(frontendDistPath));

// Catch-all route to serve the React Vite app (SPA routing)
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api")) {
    return next();
  }
  res.sendFile(path.join(frontendDistPath, "index.html"), (err) => {
    if (err) {
      res.status(200).send("Financial Goal Planner API is running successfully. Build the frontend to view the dashboard UI.");
    }
  });
});

// MongoDB Connection with timeout
const MONGO_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/financial_goal_planner";

console.log("[Server] Attempting database connection to:", MONGO_URI);

mongoose.connect(MONGO_URI, {
  serverSelectionTimeoutMS: 3000 // 3-second timeout limit to avoid blocking startup
})
.then(() => {
  console.log("[Server] Connected to MongoDB database.");
})
.catch((err) => {
  console.warn("[Server] Warning: MongoDB is offline or unavailable. Falling back to IN-MEMORY session storage.");
  console.warn(`[Server] Reason: ${err.message}`);
  app.locals.useInMemory = true;
});

app.listen(PORT, () => {
  console.log(`[Server] Financial Planning Engine & Feasibility Simulator running on port ${PORT}`);
});
