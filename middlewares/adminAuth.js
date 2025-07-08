const express = require("express");
const jwt = require("jsonwebtoken");
const { connection } = require("../config/db");
const router = express.Router();

const adminAuth = (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) {
            return res.status(401).json({ error: "Unauthorized: No token provided" });
        }

        const decoded = jwt.verify(token, "your_secret_key");

        connection.query(
            "SELECT role FROM users WHERE user_id = ?",
            [decoded.id],
            (err, results) => {
                if (err) {
                    return res.status(500).json({ error: "Database error" });
                }

                if (results.length === 0 || results[0].role !== "admin") {
                    return res.status(403).json({ error: "Access denied: Admins only" });
                }

                req.user = decoded;
                next();
            }
        );
    } catch (error) {
        return res.status(401).json({ error: "Invalid or expired token" });
    }
};

router.get("/verify-admin", adminAuth, (req, res) => {
    res.json({ message: "Admin verified", role: "admin" });
});

module.exports = adminAuth;
