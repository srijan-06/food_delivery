const express = require('express');
const router = express.Router();
const listingController = require('../controllers/listingController');
const authenticateToken = require('../middlewares/authenticateToken');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, "uploads/"),
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage: storage });

router.post('/add-listing', upload.single('image'), listingController.addListing);
router.patch('/listing/:listing_id/status', authenticateToken, listingController.updateListingStatus);
router.delete('/listing/:listingId', authenticateToken, listingController.deleteListing);
router.get('/listings/city/:city', authenticateToken, listingController.getListingsByCity);

module.exports = router; 