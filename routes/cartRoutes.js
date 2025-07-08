const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const authenticateToken = require('../middlewares/authenticateToken');

router.post('/cart', authenticateToken, cartController.addToCart);
router.get('/cart/:user_id', authenticateToken, cartController.getCart);
router.put('/cart/:cart_id', authenticateToken, cartController.updateCartQuantity);
router.delete('/cart/:cart_id', authenticateToken, cartController.deleteCartItem);
router.post('/checkout/:user_id', authenticateToken, cartController.checkout);

module.exports = router; 