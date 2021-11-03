const express = require('express');
const app = express()
const server = require('http').createServer(app);
const moment = require('moment');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
require('dotenv').config();
const connectDB = require('./config/db');
const cors = require('cors');
const os = require('os');
const { joinRoom, leave_room, chat_message, get_all_messages } = require('./controllers/chat.controller');
const io = require('socket.io')(server, { cors: { origin: "*" }});
const Room = require('./models/Room');

// MongoDB Connection
// connectDB();

// enable cors
app.use(cors());
app.options('*', cors());

// parse json request body
app.use(express.json());

// parse urlencoded request body
app.use(express.urlencoded({ extended: true }));


// api base route
app.get('/info', (req, res) => {
    const info = {
        details: 'Simple Chat App using MERN Stack, socket.io',
        created: 'Michael Antoni',
        server: {
            node: process.version,
            platform: os.cpus().length,
            memory: Math.round( os.totalmem() / 1024 / 1024 ) 
        }
    }

    res.json(info);
});



// Mongodb Connection
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true, 
    useUnifiedTopology: true,
})

const connection = mongoose.connection;

connection.once('open', () => {
    console.log('MongoDB database connected.');
    // change streams 
    const userChangeStreams = connection.collection('users').watch();
    const roomsChangeStreams = connection.collection('rooms').watch();

    // userChangeStreams.on('change', (change) => {
    //     console.log(change)
    //     switch (change.operationType) {
    //         case 'insert':
    //             console.log('Change Stream USER: INSERT')
    //             break;
    //         case 'update':
    //             console.log('Change Stream USER: UPDATE')
    //             break;
    //         case 'delete':
    //             console.log('Change Stream USER: DELETE')
    //         default:
    //             break;
    //     }
    // })

    roomsChangeStreams.on('change', async (change) => {

        const pipeline = [
            {
                $match: {
                    _id: change.documentKey._id
                }
            },
            {
                $project: {
                    _id: 0,
                    socket_id: "$socket_id",
                    messages: "$messages",
                    total_messages: {
                        $size: "$messages"
                    }
                }
            }
        ];

        const room = await Room.aggregate(pipeline);

        // console.log(change)
        // console.log(room)
                                    
        switch (change.operationType) {
            case 'insert':
                console.log('Change Stream ROOM: INSERT')
                // io.to(room[0].socket_id).emit('message', room[0])
                break;
            case 'update':
                console.log('Change Stream ROOM: UPDATE')
                // io.to(room[0].socket_id).emit('message', room[0])
                break;
            case 'delete': 
                console.log('Change Stream ROOM: DELETE')
                break;
            default:
                break;
        }
    })
})



//initializing the socket io connection 
io.on("connection", (socket) => {
    // socket.emit('message','Socket is running...');
    // for a new user joining the room
    console.log("Socket ID: " + socket.id);

    socket.on('joinRoom', (payload) => {
        socket.join(payload.room_id);
        // console.log(socket)
    })

    socket.on('leaveRoom', async (payload) => {
        socket.leave(payload.room_id)
        const data = await leave_room(payload);
        // io.to(data[0].room_id).emit('message', { room_id: data[0].room_id, messages: data[0].messages })

        // send to all connected clients
        io.emit('message', { room_id: data[0].room_id, messages: data[0].messages })
    })

    socket.on('chatMessage', async (payload) => {
        const data = await chat_message(payload);
        // console.log(data);
        // io.to(data[0].room_id).emit('message', { room_id: data[0].room_id, messages: data[0].messages })

        // send to all connected clients
        io.emit('message', { room_id: data[0].room_id, messages: data[0].messages })
    });

    socket.on('getAllMessages', async (payload) => {
        const data = await get_all_messages(payload);
        // console.log(data)
        // io.to(data[0].room_id).emit('message', { room_id: data[0].room_id, messages: data[0].messages })

        // send to all connected clients
        io.emit('message', { room_id: data[0].room_id, messages: data[0].messages })
    });
    
    socket.on('disconnect', () => {
        console.log('Disconnected', socket.id)
    })
   
});



// api routes
app.use('/api', require('./routes/chat.routes'));

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
})



