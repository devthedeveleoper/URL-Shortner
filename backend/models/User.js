// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: function() { return this.githubId === undefined; },
        unique: true,
        lowercase: true,
        trim: true,
        sparse: true
    },
    password: {
        type: String,
        required: function() { return this.githubId === undefined; }
    },
    githubId: {
        type: String,
        unique: true,
        sparse: true
    },
    // Add fields for GitHub user info
    displayName: {
        type: String,
        required: false // Not required for email/password users
    },
    profilePicture: {
        type: String,
        required: false // Not required
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

userSchema.pre('save', async function(next) {
    if (this.isModified('password') && this.password) {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    }
    next();
});

userSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);