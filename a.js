const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static('public')); // Serve frontend files

// Database Connection
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'food'
});

connection.connect((err) => {
    if (err) console.error('Database connection failed:', err);
    else console.log('✅ Database connected');
});

// Register User
app.post('/api/register', async (req, res) => {
    const { name, email, password, phone, address, city } = req.body;
    if (!name || !email || !password || !phone || !address || !city) {
        return res.status(400).json({ error: "All fields are required" });
    }

    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        connection.query(
            'INSERT INTO users (NAME, email, password_hash, phone, address, city, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())',
            [name, email, hashedPassword, phone, address, city],
            (err, results) => {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ message: "User registered successfully" });
            }
        );
    } catch (err) {
        res.status(500).json({ error: "Error hashing password" });
    }
});

// Login User
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
    }

    connection.query(
        'SELECT * FROM users WHERE email = ?',
        [email],
        async (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            if (results.length === 0) return res.status(400).json({ error: "User not found" });

            const user = results[0];
            const isMatch = await bcrypt.compare(password, user.password_hash);
            if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

            const token = jwt.sign(
                { id: user.user_id, name: user.NAME, email: user.email, role: user.role },
                "your_secret_key",
                { expiresIn: "1h" }
            );

            res.json({
                message: "Login successful",
                token,
                user: { id: user.user_id, name: user.NAME, email: user.email, role: user.role }
            });
        }
    );
});

// Start Server
app.listen(3000, () => console.log('✅ Server running on port 3000'));
