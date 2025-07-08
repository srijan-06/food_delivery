const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');

router.post('/reviews', reviewController.addReview);
router.get('/reviews/:seller_id', reviewController.getReviewsBySeller);

module.exports = router; 