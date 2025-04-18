const mysql = require('mysql2');
require('dotenv').config(); // Load environment variables

// ✅ Create MySQL connection
const connection = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'your_database_name'
});

// ✅ Connect to MySQL
connection.connect((err) => {
    if (err) {
        console.error('❌ Database connection failed:', err.message);
        process.exit(1); // Stop the server if DB connection fails
    }
    console.log('✅ Connected to MySQL database');
});

module.exports = connection.promise();
