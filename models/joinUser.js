const mongoose = require('mongoose');

const joinUserSchema = new mongoose.Schema({
    socket_id: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true
    },
    roomname: {
        type: String,
        required: true
    }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }});


const JoinUser = mongoose.model('join_users', joinUserSchema);

module.exports = JoinUser;