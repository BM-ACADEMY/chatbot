const mongoose = require('mongoose');

const userProgressSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    flowId: { type: mongoose.Schema.Types.ObjectId, ref: 'Flow', required: true },
    currentStep: { type: String, required: true, default: '1' },
    selectedOptions: [{ type: String }],
    followUpHistory: [{ type: Number }], // Store delayHours of sent follow-ups (e.g. [3, 12, 24])
    lastStepId: { type: String }, // The step the user was most recently asked (for input tracking)
    completed: { type: Boolean, default: false },
    lastUpdated: { type: Date, default: Date.now }
}, { timestamps: true });

// Ensure a user has only one progress record per flow
userProgressSchema.index({ userId: 1, flowId: 1 }, { unique: true });

// Pre-save hook to update lastUpdated on every modification
userProgressSchema.pre('save', async function () {
    this.lastUpdated = Date.now();
});

const UserProgress = mongoose.model('UserProgress', userProgressSchema);
module.exports = UserProgress;
