const { connection } = require('../config/db');
const jwt = require("jsonwebtoken");

const authenticateAdmin = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: "Authentication required" });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, "your_secret_key");
  } catch (err) {
    console.error("JWT verification failed:", err);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
  
  const sql = "SELECT * FROM users WHERE user_id = ? AND role = 'admin'";
  connection.query(sql, [decoded.id], (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ message: "Internal server error" });
    }

    if (results.length === 0) {
      return res.status(403).json({ message: "Admin access required" });
    }

    req.user = results[0];
    next();
  });
};

module.exports = authenticateAdmin; 