const express = require('express');
const router = express.Router();
const { getUserProgress, updateUserProgress } = require('../controllers/flowController');
const { protect } = require('../middleware/authMiddleware');

router.route('/:userId').get(protect, getUserProgress);
router.route('/').post(protect, updateUserProgress);

module.exports = router;
