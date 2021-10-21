const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    roomname: {
        type: String,
        required: true
    },
    messages: [
        {
            socket_id: {
                type: String
            },
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
    ]
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

const Message = mongoose.model('messages', messageSchema);

module.exports = Message;