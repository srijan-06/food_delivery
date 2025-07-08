const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { connection } = require('../config/db');

exports.register = async (req, res) => {
    const { name, email, password, phone, address, city } = req.body;
    if (!name || !email || !password || !phone || !address || !city) {
        return res.status(400).json({ error: "All fields are required" });
    }
    connection.query(
        'SELECT email, phone FROM users WHERE email = ? OR phone = ?',
        [email, phone],
        async (err, results) => {
            if (err) {
                console.error("Database error:", err);
                return res.status(500).json({ error: "Database error" });
            }
            if (results.length > 0) {
                const existingUser = results[0];
                if (existingUser.email === email) {
                    return res.status(400).json({ error: "Email already exists" });
                }
                if (existingUser.phone === phone) {
                    return res.status(400).json({ error: "Mobile number already exists" });
                }
                return res.status(400).json({ error: "Email or Mobile number already exists" });
            }
            try {
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(password, salt);
                connection.query(
                    'INSERT INTO users (NAME, email, password_hash, phone, address, city, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())',
                    [name, email, hashedPassword, phone, address, city],
                    (err, results) => {
                        if (err) {
                            console.error("Database error:", err);
                            return res.status(500).json({ error: "Database error" });
                        }
                        res.json({ message: "User registered successfully" });
                    }
                );
            } catch (err) {
                console.error("Password hashing error:", err);
                res.status(500).json({ error: "Error hashing password" });
            }
        }
    );
};

exports.login = (req, res) => {
    const { email, password } = req.body;
    connection.query("SELECT * FROM users WHERE email = ?", [email], (err, results) => {
        if (err) {
            return res.status(500).json({ error: "Database error" });
        }
        if (results.length === 0) {
            return res.status(401).json({ error: "Invalid email or password" });
        }
        const user = results[0];
        if (!user.password_hash) {
            return res.status(500).json({ error: "Server error - password missing" });
        }
        bcrypt.compare(password, user.password_hash, (err, isMatch) => {
            if (err) {
                return res.status(500).json({ error: "Server error" });
            }
            if (!isMatch) {
                return res.status(401).json({ error: "Incorrect password" });
            }
            const role = user.role || "user";
            const token = jwt.sign({ id: user.user_id, role: role }, "your_secret_key", { expiresIn: "1h" });
            return res.json({
                message: "Login successful",
                token: token,
                user_id: user.user_id,
                email: user.email,
                role: role
            });
        });
    });
};

exports.getUser = (req, res) => {
    const userId = req.params.id;
    connection.execute(
        "SELECT email, name, phone, address, city FROM users WHERE user_id = ?",
        [userId],
        (err, results) => {
            if (err) {
                return res.status(500).json({ error: "Server error" });
            }
            if (results.length === 0) {
                return res.status(404).json({ error: "User not found" });
            }
            res.json(results[0]);
        }
    );
};

exports.updateUser = (req, res) => {
    const userId = req.params.id;
    const {
        name = null,
        phone = null,
        address = null,
        city = null
    } = req.body;
    const updateQuery = "UPDATE users SET name = ?, phone = ?, address = ?, city = ? WHERE user_id = ?";
    const updateFields = [name, phone, address, city, userId];
    connection.execute(updateQuery, updateFields, (err, results) => {
        if (err) {
            return res.status(500).json({ error: "Update failed" });
        }
        res.json({ message: "Profile updated successfully" });
    });
}; 