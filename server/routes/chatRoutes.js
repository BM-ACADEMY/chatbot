const express = require('express');
const router = express.Router();
const { getMessages, sendMessage } = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');

router.route('/:userId').get(protect, getMessages);
router.route('/').post(protect, sendMessage);

module.exports = router;
