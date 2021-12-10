const express = require('express');
const app = express()
const server = require('http').createServer(app);
const mongoose = require('mongoose');
require('dotenv').config();
const cors = require('cors');
const os = require('os');
const { leave_room, chat_message, get_all_messages } = require('./controllers/chat.controller');
const io = require('socket.io')(server, { path: '/api/socket.io', cors: { origin: "*"}});
const Room = require('./models/Room');
const nodeCron = require('node-cron');

// enable cors
app.use(cors());
app.options('*', cors());

// parse json request body
app.use(express.json());

// parse urlencoded request body
app.use(express.urlencoded({ extended: true }));


// api base route
app.get('/', (req, res) => {
    const info = {
        name: 'ChatHive',
        description: 'Simple chat app using MERN Stack, socket.io',
        created: 'Michael Antoni',
        server: {
            node: process.version,
            cpu: os.cpus()[0].model,
            cores: os.cpus().length,
            platform: process.platform,
            memory: Math.round( os.totalmem() / 1024 / 1024 ),
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
                // console.log('Change Stream ROOM: INSERT')
                break;
            case 'update':
                // console.log('Change Stream ROOM: UPDATE')
                break;
            case 'delete': 
                // console.log('Change Stream ROOM: DELETE')
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
        // socket.broadcast.emit('message', { room_id: data[0].room_id, messages: data[0].messages })
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
        // io.to(data[0].room_id).emit('message', { room_id: data[0].room_id, messages: data[0].messages })

        // send to all connected clients
        io.emit('message', { room_id: data[0].room_id, messages: data[0].messages })
    });

    socket.on('getAllMessages', async (payload) => {
        const data = await get_all_messages(payload);
        // io.to(data[0].room_id).emit('message', { room_id: data[0].room_id, messages: data[0].messages })

        // send to all connected clients
        io.emit('message', { room_id: data[0].room_id, messages: data[0].messages })
    });

    socket.on("typing", async (payload) => {
        socket.broadcast.emit("typing", payload);
        console.log(payload)
    });
    
    socket.on('disconnect', () => {
        console.log('Disconnected', socket.id)
    })
});


// api routes
app.use('/api', require('./routes/chat.routes'));


/*  Use cron job to drop the collection */
nodeCron.schedule("0 0 0 * * *", async () => {
    /*
        ┌────────────── second (optional)
        │ ┌──────────── minute
        │ │ ┌────────── hour
        │ │ │ ┌──────── day of month
        │ │ │ │ ┌────── month
        │ │ │ │ │ ┌──── day of week
        │ │ │ │ │ │
        │ │ │ │ │ │
        * * * * * *
    */
    
    /* 
    *   Do whatever you want in here. Send email, Make  database backup or download data
    *
    *   Schedule drop of collection every midnight 
    */ 
    await connection.collection('rooms').drop();
    await connection.collection('users').drop();
    // await connection.collection('test').drop();

    console.log(`Collections has been drop at [${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}]`);

}, { scheduled: true, timezone: 'Asia/Manila' })




/* For testing puposes only */
app.get('/drop/:col', async (req, res) => {

    const { col } = req.params;

    let message = {};
    switch (col) {
        case 'users':
            await connection.collection('users').drop();
            message = {
                status: 'ok',
                text: 'users collection has been drop'
            }
            break;
        case 'rooms':
            await connection.collection('rooms').drop();
            message = {
                status: 'ok',
                text: 'rooms collection has been drop'
            }
            break;
        case 'all':
            await connection.collection('users').drop();
            await connection.collection('rooms').drop();
            message = {
                status: 'ok',
                text: 'rooms/users collections has been drop'
            }
            break;
        default:
            message = {
                status: 'bad',
                text: 'Not found!'
            }
            break;
    }
    // console.log(col)
    res.json(message);
});


const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
})



