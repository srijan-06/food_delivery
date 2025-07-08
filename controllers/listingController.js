const { connection } = require('../config/db');

exports.addListing = (req, res) => {
    const { title, description, price, quantity, expiry_date, user_id } = req.body;
    const image_url = req.file ? "/uploads/" + req.file.filename : null;
    if (!user_id) {
        return res.status(400).json({ success: false, message: "User ID is required!" });
    }
    const sql = "INSERT INTO foodlistings (user_id, title, description, price, quantity, expiry_date, image_url,int_qnt) VALUES (?, ?, ?, ?, ?, ?, ?,?) ";
    connection.query(sql, [user_id, title, description, price, quantity, expiry_date, image_url,quantity], (err, result) => {
        if (err) {
            return res.status(500).json({ success: false, message: "Database error!" });
        }
        res.json({ success: true, message: "Listing added successfully!" });
    });
};

exports.updateListingStatus = (req, res) => {
    const listingId = req.params.listing_id;
    const { avl } = req.body;
    if (!["online", "offline"].includes(avl)) {
        return res.status(400).json({ error: "Invalid status value. Must be 'online' or 'offline'." });
    }
    const query = "UPDATE foodlistings SET avl = ? WHERE listing_id = ?";
    connection.query(query, [avl, listingId], (err, results) => {
        if (err) {
            return res.status(500).json({ error: "Internal server error." });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ error: "Listing not found." });
        }
        res.json({ message: `Listing updated to ${avl}.` });
    });
};

exports.deleteListing = (req, res) => {
    const listingId = parseInt(req.params.listingId);
    const token = req.headers.authorization?.split(" ")[1];
    const jwt = require('jsonwebtoken');
    if (!token) {
        return res.status(401).json({ error: "Unauthorized access" });
    }
    jwt.verify(token, "your_secret_key", (err, decoded) => {
        if (err) {
            return res.status(403).json({ error: "Invalid token" });
        }
        const checkOwnershipQuery = `SELECT user_id FROM foodlistings WHERE listing_id = ?`;
        connection.query(checkOwnershipQuery, [listingId], (err, results) => {
            if (err) {
                return res.status(500).json({ error: "Database query failed" });
            }
            if (results.length === 0) {
                return res.status(404).json({ error: "Listing not found" });
            }
            const listingOwnerId = results[0].user_id;
            if (listingOwnerId !== decoded.id) {
                return res.status(403).json({ error: "You can only delete your own listings" });
            }
            const deleteQuery = `DELETE FROM foodlistings WHERE listing_id = ?`;
            connection.query(deleteQuery, [listingId], (err, result) => {
                if (err) {
                    return res.status(500).json({ error: "Database query failed" });
                }
                if (result.affectedRows === 0) {
                    return res.status(404).json({ error: "Listing not found" });
                }
                res.json({ success: true, message: "Listing deleted successfully" });
            });
        });
    });
};

exports.getListingsByCity = (req, res) => {
    const { city } = req.params;
    const currentUserId = req.user.id;
    const sql = `
            SELECT 
            f.*, 
            u.NAME, 
            ROUND(AVG(r.rating), 1) AS Rating,
            r.comment
        FROM 
            foodlistings f
        JOIN 
            users u ON f.user_id = u.user_id
        LEFT JOIN 
            reviews r ON f.user_id = r.seller_id
        WHERE 
            u.city = ? 
            AND f.user_id != ? 
            AND f.avl = 'online' 
            AND f.quantity > 0
            AND f.expiry_date >= CURRENT_DATE
        GROUP BY 
            f.listing_id
    `;
    connection.query(sql, [city, currentUserId], (err, results) => {
      if (err) {
        return res.status(500).json({ error: "Internal server error" });
      }
      res.json(results);
    });
}; 