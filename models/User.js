const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        default: Date.now,
        required: true
    }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }});


const User = mongoose.model('users', UserSchema);

module.exports = User;