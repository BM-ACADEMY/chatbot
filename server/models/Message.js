const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Null if it's the bot
    text: { type: String, required: true },
    fileUrl: { type: String }, // URL to uploaded document
    fileType: { type: String }, // e.g. 'image/png', 'application/pdf'
    captureType: { type: String, enum: ['text', 'file'], default: 'text' }, // What format the bot expects next
    captureMapping: { type: String }, // What field the bot is capturing: name, phone, email, demo_date, demo_time etc.
    isBotResponse: { type: Boolean, default: false },
    options: [{
        label: String,
        nextStep: String
    }]
}, { timestamps: true });

const Message = mongoose.model('Message', messageSchema);
module.exports = Message;
