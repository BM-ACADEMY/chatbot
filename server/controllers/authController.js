const User = require('../models/User');
const generateToken = require('../utils/generateToken');

// @desc    Register a new user
// @route   POST /api/register
// @access  Public
const registerUser = async (req, res) => {
    const { name, phone, password, role } = req.body;

    try {
        const userExists = await User.findOne({ phone });

        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const appRole = role === 'admin' ? 'admin' : 'user';

        const user = await User.create({
            name,
            phone,
            password,
            role: appRole
        });

        if (user) {
            res.status(201).json({
                _id: user.id,
                name: user.name,
                phone: user.phone,
                role: user.role,
                token: generateToken(user._id),
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Auth user & get token
// @route   POST /api/login
// @access  Public
const authUser = async (req, res) => {
    const { phone, password } = req.body;

    try {
        const user = await User.findOne({ phone });

        if (user && (await user.matchPassword(password))) {
            res.json({
                _id: user.id,
                name: user.name,
                phone: user.phone,
                role: user.role,
                token: generateToken(user._id),
            });
        } else {
            res.status(401).json({ message: 'Invalid phone or password' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all users for admin
// @route   GET /api/auth/users
// @access  Private/Admin
const getUsers = async (req, res) => {
    try {
        const users = await User.find({ role: 'user' })
            .select('-password')
            .populate('assignedTo', 'name specialty');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all admins/sub-admins for assignment
// @route   GET /api/auth/team
const getTeam = async (req, res) => {
    try {
        const team = await User.find({ role: { $in: ['admin', 'sub-admin'] } }).select('name role specialty');
        res.json(team);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getSpecialties = async (req, res) => {
    try {
        const specialties = await User.distinct('specialty', { specialty: { $ne: null } });
        res.json(specialties);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { registerUser, authUser, getUsers, getTeam, getSpecialties };
