const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authenticateToken = require('../middlewares/authenticateToken');

router.post('/register', userController.register);
router.post('/login', userController.login);
router.get('/user/:id', authenticateToken, userController.getUser);
router.put('/user/:id', authenticateToken, userController.updateUser);

module.exports = router;
