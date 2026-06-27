const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "antigravity_secret_key_123456";

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Access denied. Please log in or sign up to proceed." });
  }

  try {
    const verified = jwt.verify(token, JWT_SECRET);
    req.user = verified; // Verified user payload: { id, username }
    next();
  } catch (err) {
    return res.status(403).json({ error: "Session expired or invalid. Please log in again." });
  }
}

module.exports = {
  authenticateToken,
  JWT_SECRET
};
