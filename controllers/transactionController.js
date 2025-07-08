const { connection } = require('../config/db');
const jwt = require('jsonwebtoken');

exports.getSoldListings = (req, res) => {
    const userId =parseInt(req.params.userId);
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
        return res.status(401).json({ error: "Unauthorized access" });
    }
    jwt.verify(token, "your_secret_key", (err, decoded) => {
        if (err) {
            return res.status(403).json({ error: "Invalid token" });
        }
        if (decoded.id !== userId) {
            return res.status(403).json({ error: "Access denied" });
        }
        const query = `
            SELECT 
                f.listing_id,
                f.title, 
                f.price, 
                f.image_url, 
                f.quantity,
                f.avl,
                f.int_qnt as quantity_listed,
                f.created_at AS listing_date, 
                t.quantity AS quantity_sold,
                t.transaction_id, 
                t.transaction_date, 
                fos.status, 
                t.buyer_id, 
                u1.NAME AS buyer_name
            FROM foodlistings f
            LEFT JOIN transactions t ON f.listing_id = t.listing_id
            LEFT JOIN food_order_status fos ON t.transaction_id = fos.transaction_id
            LEFT JOIN users u1 ON t.buyer_id = u1.user_id
            WHERE f.user_id = ?
            ORDER BY COALESCE(t.transaction_date, f.created_at) DESC;
        `;
        connection.query(query, [userId], (err, results) => {
            if (err) {
                return res.status(500).json({ error: "Database query failed" });
            }
            res.json(results);
        });
    });
};

exports.getBoughtListings = (req, res) => {
    const userId = parseInt(req.params.userId);
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
        return res.status(401).json({ error: "Unauthorized access" });
    }
    jwt.verify(token, "your_secret_key", (err, decoded) => {
        if (err) {
            return res.status(403).json({ error: "Invalid token" });
        }
        const query = `
            SELECT 
                t.transaction_id, 
                f.title, 
                f.price, 
                f.image_url, 
                t.transaction_date, 
                fos.status, 
                t.buyer_id, 
                t.seller_id, 
                u2.NAME AS seller_name 
            FROM transactions t
            JOIN foodlistings f ON t.listing_id = f.listing_id
            JOIN food_order_status fos ON t.transaction_id = fos.transaction_id
            JOIN users u2 ON t.seller_id = u2.user_id
            WHERE t.buyer_id = ?
            ORDER BY t.transaction_date DESC;
        `;
        connection.query(query, [userId], (err, results) => {
            if (err) {
                return res.status(500).json({ error: "Database query failed" });
            }
            res.json(results);
        });
    });
}; 