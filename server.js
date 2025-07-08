const express = require("express");
const cors = require('cors');
const path = require('path');
const app = express();
const fs = require("fs");
const userRoutes = require('./routes/userRoutes');
const listingRoutes = require('./routes/listingRoutes');
const cartRoutes = require('./routes/cartRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const adminRoutes = require("./routes/admin");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(express.static('public'));
app.use("/uploads", express.static("uploads"));

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Mount routes
app.use('/api', userRoutes);
app.use('/api', listingRoutes);
app.use('/api', cartRoutes);
app.use('/api', reviewRoutes);
app.use('/api', transactionRoutes);
app.use('/admin', adminRoutes);

app.listen(3000, () => console.log('✅ Server running on http://localhost:3000'));

