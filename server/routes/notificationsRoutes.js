const express = require('express');
const router = express.Router();
const { getVapidPublicKey, subscribe } = require('../controllers/notificationsController');
const { protect } = require('../middleware/authMiddleware');

router.get('/vapidPublicKey', getVapidPublicKey);
router.post('/subscribe', protect, subscribe);

module.exports = router;
