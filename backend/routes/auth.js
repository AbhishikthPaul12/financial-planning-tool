const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = require("../models/User");
const { JWT_SECRET } = require("../middleware/auth");

// Helper to check if MongoDB is active
function isDatabaseConnected(app) {
  return mongoose.connection.readyState === 1 && !app.locals.useInMemory;
}

// Generate JWT Helper
function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

// POST /api/v1/auth/register
router.post("/register", async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password || username.trim().length < 3 || password.length < 5) {
      return res.status(400).json({ error: "Username must be at least 3 characters and password at least 5 characters long." });
    }
    
    const trimmedUsername = username.trim();
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Check if user already exists
    if (isDatabaseConnected(req.app)) {
      const existingUser = await User.findOne({ username: { $regex: new RegExp(`^${trimmedUsername}$`, 'i') } });
      if (existingUser) {
        return res.status(400).json({ error: "Username is already taken." });
      }
      
      const newUser = new User({ username: trimmedUsername, password: hashedPassword });
      await newUser.save();
      
      const token = generateToken({ id: newUser._id, username: newUser.username });
      return res.status(201).json({ success: true, token, username: newUser.username });
    } else {
      // In-memory fallback
      const inMemoryUsers = req.app.locals.inMemoryUsers;
      const userExists = inMemoryUsers.some(u => u.username.toLowerCase() === trimmedUsername.toLowerCase());
      if (userExists) {
        return res.status(400).json({ error: "Username is already taken." });
      }
      
      const mockId = new mongoose.Types.ObjectId().toString();
      const newUser = {
        _id: mockId,
        username: trimmedUsername,
        password: hashedPassword,
        createdAt: new Date()
      };
      inMemoryUsers.push(newUser);
      
      const token = generateToken({ id: mockId, username: trimmedUsername });
      return res.status(201).json({ success: true, token, username: trimmedUsername });
    }
  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).json({ error: "Internal server error during user registration." });
  }
});

// POST /api/v1/auth/login
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required." });
    }
    
    const trimmedUsername = username.trim();
    let user;
    
    if (isDatabaseConnected(req.app)) {
      user = await User.findOne({ username: { $regex: new RegExp(`^${trimmedUsername}$`, 'i') } });
    } else {
      user = req.app.locals.inMemoryUsers.find(u => u.username.toLowerCase() === trimmedUsername.toLowerCase());
    }
    
    if (!user) {
      return res.status(400).json({ error: "Invalid username or password." });
    }
    
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ error: "Invalid username or password." });
    }
    
    const token = generateToken({ id: user._id, username: user.username });
    return res.status(200).json({ success: true, token, username: user.username });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ error: "Internal server error during authentication login." });
  }
});

module.exports = router;
