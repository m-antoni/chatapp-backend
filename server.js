const express = require('express');
const app = express()
const server = require('http').createServer(app);
const moment = require('moment');
const mongoose = require('mongoose');
require('dotenv').config();
const connectDB = require('./config/db');
const cors = require('cors');
const os = require('os');
const { joinRoom } = require('./controllers/chat.controller');
const io = require('socket.io')(server, { cors: { origin: "*" }});


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
    const changeStreams = connection.collection('users').watch();

    changeStreams.on('change', (change) => {
        console.log(change)
        switch (change.operationType) {
            case 'insert':
                console.log('Change Stream: INSERT')
                break;
            case 'update':
                console.log('Change Stream: UPDATE')

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

    socket.on('joinRoom', async ({ username, roomname }) => {

        console.log(username, roomname, socket.id)

        // create user 
        let join_params = {
            socket_id: socket.id,
            username,
            roomname,
            date: moment().format('MM-DD-YYYY HH:mmA')
        }

        socket.join(join_params.roomname);
    })



    socket.on('leaveRoom', ({ socket_id}) => {
        socket.leave(socket_id)
        console.log('User has left the room', socket_id)
    })

    // user sending the message
    socket.on('chat', (text) => {
        // gets the current user and the message sent
        const c_user = getCurrentUser(socket.id);

        let sendMsg = {
            socket_id: socket.id,
            text
        }

        io.to(c_user.roomname).emit('message', {
            user_id: c_user.id,
            username: c_user.username,
            roomname: c_user.roomname,
            text: text,
            date: moment().format('MM-DD-YYYY HH:mmA'),
        });

    });



    socket.on('disconnect', () => {
        console.log('Disconnected', socket.id)
    })


// console.log("Socket ID:" , socket.id )
});



// api routes
app.use('/api', require('./routes/chat.routes'));

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
})



