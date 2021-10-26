const mongoose = require('mongoose');

const RoomSchema = new mongoose.Schema({
    socket_id: {
        type: String,
        required: true
    },
    roomname: {
        type: String,
        required: true
    },
    users: [
        {
            user_id: {
                type: String
            },
        }
    ],
    messages: [
        {
            text: {
                type: String
            },
            username: {
                type: String
            },
            date: {
                type: Date,
                default: Date.now
            }
        }
    ],
    date: {
        type: Date,
        default: Date.now,
        required: true
    }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

const Room = mongoose.model('rooms', RoomSchema);

module.exports = Room;