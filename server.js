const app = require('express')();
const server = require('http').createServer(app);
require('dotenv').config();
const moment = require('moment');
const { MongoClient } = require('mongodb');
const io = require('socket.io')(server, { cors: { origin: "*" }});

const PORT = process.env.PORT || 5000;
const Message = require('./models/message');
const JoinUser = require('./models/joinUser');

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri);
client.connect();

async function main(){
    try {
        // Connect to the MongoDB cluster
        await client.connect();
        console.log('MongoDB is connected successfully!')
        
        const userChangeStreams = client.db('chat-db').collection('users').watch();
        const roomsChangeStreams = client.db('chat-db').collection('rooms').watch();

        userChangeStreams.on('change', next => {
            // process next document
            console.log(next)
        })

        roomsChangeStreams.on('change', next => {
            // process next document
            console.log(next)
        })
        
    } catch (e) {
        console.error(e);
        console.log('Error! Database can\'t connect');
    } finally {
        // await client.close();
    }
}
 
main().catch(console.error);



//initializing the socket io connection 
io.on("connection", (socket) => {
    // socket.emit('message','Socket is running...');
    // for a new user joining the room
    console.log("Connected: " + socket.id);

    socket.on("disconnect", () => {
      console.log("Disconnected: " + socket.id);
    });

    socket.on('join_room', ({ username, roomname }) => {

        // create user 
        let join_params = {
            socket_id: socket.id,
            username,
            roomname,
            date: moment().format('MM-DD-YYYY HH:mmA')
        }

        socket.join(join_params.roomname);
        joinUser(client, join_params).then(res => {
            // display a welcome message
            socket.emit("message", {
                user_id: res.join.socket_id,
                username: res.join.username,
                text: `Welcome ${res.join.username}`,
                date: moment().format('MM-DD-YYYY HH:mmA')
            });

             // display a welcome message to the user who have joined a room  
            socket.broadcast.to(res.join.roomname).emit('message', {
                user_id: res.join.socket_id,
                username: res.join.username,
                text: `${res.join.username} has joined the chat room`,
                date: moment().format('MM-DD-YYYY HH:mmA'),
            });
        }).catch(err => console.log(err));
       
    })



    // user sending the message
    socket.on('chat', (text) => {
        // gets the current user and the message sent
        const c_user = getCurrentUser(socket.id);

        let sendMsg = {
            socket_id: socket.id,
            text
        }

        sendMessage(sendMsg).then(res => {
            // console.log(res)
            console.log(res.messages)
        
        }).catch(err => console.log(err));

        io.to(c_user.roomname).emit('message', {
            user_id: c_user.id,
            username: c_user.username,
            roomname: c_user.roomname,
            text: text,
            date: moment().format('MM-DD-YYYY HH:mmA'),
        });

    });


// console.log("Socket ID:" , socket.id )
});



const joinUser = async (client, params) => {
    let data = {};
    try {
        
        console.log(params);

        const result = await client.db('chat-db').collection('users').insertOne(params);
        
        const checkRoom = await client.db('chat-db').collection('rooms').findOne({ roomname: params.roomname });

        console.log(checkRoom)

        if(!checkRoom){

            let insert = {
                roomname: params.roomname,
                socket_id: params.socket_id,
                messages: []
            }

            await client.db('chat-db').collection('rooms').insertOne(insert);
        }

        console.log(result);

        data = { status: 1, join: params, message: 'success'};
    } catch (err) {
        console.log(err)
        data = { status: 0, message: 'Server Error'};
    }

    return data;
}


const userDisconnect = async (client, socket_id) => {
    let data = {};    
    try {
        let user;

        const findUser = await client.db('chat-db').collection('users').findOne({ socket_id: socket_id });
        
        user = findUser;

        await client.db('chat-db').collection('users').deleteOne({ socket_id: socket_id });

        data = { status: 1, user };

    } catch (error) {
        console.log(error);
        data = { status: 0, message: 'Server Error' }
    }

    return data;
}



const sendMessage = async (params) => {
    let data = {};
    try {

        // get the user data
        let user_data = await JoinUser.findOne({ socket_id: params.socket_id });

        console.log(user_data);

        let checkRoom = await Message.findOne({ roomname: user_data.roomname });

        if(checkRoom){
            let updateMessage = {
                socket_id: user_data.socket_id,
                username: user_data.username,
                text: params.text,
            }

            checkRoom.messages = [...checkRoom.messages, updateMessage];
            await checkRoom.save();

        } else{
            let storeMessage = {
                roomname: user_data.roomname,
                messages: [{ socket_id: user_data.socket_id, username: user_data.username, text: params.text }]
            }

            let newMessage = new Message(storeMessage);
            await newMessage.save();
        }

        let messages = await Message.findOne({ roomname: user_data.roomname }).select('messages').slice('array', -1);
        data = { status: 1, roomname: user_data.roomname, messages, message: 'success' };

    } catch (err) {
        console.log(err)
        data = { status: 0, message: 'Server Error'};
    }   

    return data;
}




server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
})
