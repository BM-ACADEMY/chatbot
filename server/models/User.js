const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    email: { type: String }, // NEW: Proper Email field
    address: { type: String }, // NEW: Proper Address field
    password: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin', 'sub-admin'], default: 'user' }, // role-based chat
    tags: [{ type: String }], // e.g. 'Academy Lead', 'Hot Lead'
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Reference to admin/sub-admin
    specialty: { type: String }, // e.g. 'counselor', 'sales', 'hr'
    pushSubscription: { type: Object }, // Web push subscription
    leadData: { type: Map, of: String }, // Flexible storage for 'Expected Time', 'Mode', etc.
    documents: [{ 
        name: String, 
        url: String, 
        type: String, 
        uploadedAt: { type: Date, default: Date.now } 
    }] // Store multiple documents separately
}, { timestamps: true });

userSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
module.exports = User;
