const mongoose = require('mongoose');

const urlSchema = new mongoose.Schema({
    originalUrl: {
        type: String,
        required: true,
    },
    shortCode: { // This will be your self-generated short code
        type: String,
        required: true,
        unique: true,
        index: true,
        minlength: 6 // A reasonable minimum length for unique codes
    },
    user: { // Optional: Link to the user who created it
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false // Not required for unauthenticated users
    },
    clicks: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Url', urlSchema);