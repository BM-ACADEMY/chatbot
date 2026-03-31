const express = require('express');
const router = express.Router();
const { registerUser, authUser, getUsers, getTeam, getSpecialties } = require('../controllers/authController');
const { protect, admin } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', authUser);
router.get('/users', protect, admin, getUsers);
router.get('/team', protect, admin, getTeam);
router.get('/specialties', protect, admin, getSpecialties);

module.exports = router;
