const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const connection = require('../config/db'); // Import DB connection

// ✅ Register a new user (POST)
router.post('/register', async (req, res) => {
    const { name, email, password, phone, address, city } = req.body;

    try {
        if (!password) {
            return res.status(400).json({ error: "Password is required" });
        }

        // ✅ Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // ✅ Insert user into the database
        connection.query(
            'INSERT INTO users (name, email, password_hash, phone, address, city, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())',
            [name, email, hashedPassword, phone, address, city],
            (err, results) => {
                if (err) return res.status(500).json({ error: err.message });
                res.status(201).json({ id: results.insertId, message: "User registered successfully" });
            }
        );
    } catch (err) {
        res.status(500).json({ error: "Error hashing password" });
    }
});

// ✅ Fetch all users (GET)
router.get('/users', (req, res) => {
    connection.query('SELECT user_id, name, email, phone, address, city, created_at FROM users', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// ✅ Fetch a single user by ID (GET)
router.get('/users/:id', (req, res) => {
    const userId = req.params.id;
    connection.query('SELECT id, name, email, phone, address, city, created_at FROM users WHERE id = ?', [userId], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(404).json({ error: "User not found" });
        res.json(results[0]);
    });
});

// ✅ Update user by ID (PUT)
router.put('/users/:id', async (req, res) => {
    const userId = req.params.id;
    const { name, email, password, phone, address, city } = req.body;

    try {
        let hashedPassword = null;
        if (password) {
            const salt = await bcrypt.genSalt(10);
            hashedPassword = await bcrypt.hash(password, salt);
        }

        const query = 'UPDATE users SET name=?, email=?, phone=?, address=?, city=?' + (hashedPassword ? ', password_hash=?' : '') + ' WHERE id=?';
        const params = hashedPassword ? [name, email, phone, address, city, hashedPassword, userId] : [name, email, phone, address, city, userId];

        connection.query(query, params, (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: "User updated successfully" });
        });
    } catch (err) {
        res.status(500).json({ error: "Error updating password" });
    }
});

// ✅ Delete user by ID (DELETE)
router.delete('/users/:id', (req, res) => {
    const userId = req.params.id;
    connection.query('DELETE FROM users WHERE id = ?', [userId], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "User deleted successfully" });
    });
});

module.exports = router;
