const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Sub-Schema for structured attachments
const attachmentSchema = new mongoose.Schema({
    name: { type: String, required: true },
    url: { type: String, required: true },
    type: { type: String },
    uploadedAt: { type: Date, default: Date.now }
});

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    email: { type: String },
    address: { type: String },
    password: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin', 'sub-admin'], default: 'user' },
    tags: [{ type: String }],
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    specialty: { type: String },
    pushSubscription: { type: Object },
    leadStatus: { type: String, default: 'New' }, // NEW: Track lead stage
    leadData: { type: Map, of: String },
    enquiries: [{ 
        service: String, 
        details: String, 
        timestamp: { type: Date, default: Date.now } 
    }],
    userAttachments: [attachmentSchema] // Now using an explicit sub-schema
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
