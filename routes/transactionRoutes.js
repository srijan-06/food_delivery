const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const authenticateToken = require('../middlewares/authenticateToken');

router.get('/sold/:userId', authenticateToken, transactionController.getSoldListings);
router.get('/bought/:userId', authenticateToken, transactionController.getBoughtListings);

module.exports = router; 