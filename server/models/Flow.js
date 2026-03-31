const mongoose = require('mongoose');

const flowSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String },
    isActive: { type: Boolean, default: false },
    isPublished: { type: Boolean, default: false },
}, { timestamps: true });

// Ensure only one flow is active at a time
flowSchema.pre('save', async function () {
    if (this.isActive) {
        await this.constructor.updateMany({ _id: { $ne: this._id } }, { isActive: false });
    }
});

const Flow = mongoose.model('Flow', flowSchema);
module.exports = Flow;
