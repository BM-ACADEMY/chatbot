const mongoose = require('mongoose');

const followUpSchema = new mongoose.Schema({
    flowId: { type: mongoose.Schema.Types.ObjectId, ref: 'Flow', required: true },
    delayHours: { type: Number, required: true }, // e.g., 3, 12, 24, 48
    text: { type: String, required: true },
    options: [{
        label: { type: String, required: true },
        nextStep: { type: String }
    }]
}, { timestamps: true });

// Ensure unique delay per flow
followUpSchema.index({ flowId: 1, delayHours: 1 }, { unique: true });

const FollowUp = mongoose.model('FollowUp', followUpSchema);
module.exports = FollowUp;
