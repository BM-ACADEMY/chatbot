const User = require('../models/User');

const getVapidPublicKey = (req, res) => {
    res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
};

const subscribe = async (req, res) => {
    try {
        const subscription = req.body;
        const user = await User.findById(req.user._id);
        if (user) {
            user.pushSubscription = subscription;
            await user.save();
            res.status(201).json({ message: 'Push subscription saved successfully.' });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getVapidPublicKey, subscribe };
