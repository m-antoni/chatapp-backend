const app = require('express')();
const server = require('http').createServer(app);
const colors = require('colors');
const cors = require('cors');
const { joinUser, getCurrentUser, userDisconnect } = require('./utils/create_users');
const io = require('socket.io')(server, {
    cors: {
      origin: "*"
    }
});

const PORT = process.env.PORT || 5000;

//initializing the socket io connection 
io.on("connection", (socket) => {
    socket.emit('message','Socket is running...');

    // for a new user joining the room
    socket.on('join_room', ({ username, roomname }) => {
        // create user 
        const c_user = joinUser(socket.id, username, roomname);
        console.log(socket.id)
        socket.join(c_user.room);

        // display a welcome message to the user who have joined a room  
        socket.broadcast.to(c_user.room).emit('message', {
            user_id: c_user.id,
            username: c_user.username,
            text: `${c_user.username} has joined the chat room`
        });

        // user sending the message
        socket.on('chat', (text) => {
            // gets the current user and the message sent
            const c_user = getCurrentUser(socket.id);

            io.to(c_user.room).emit('message', {
                user_id: c_user.id,
                username: c_user.username,
                text: text
            });
        });
        
        // when the user left the chat room
        socket.on('disconnect', () => {
            // the user is deleted from array of users and a left room message displayed
            const c_user = userDisconnect(socket.id);

            if(c_user){
                io.to(c_user.room).emit('message', {
                    user_id: c_user.id,
                    username: c_user.username,
                    text: `${c_user.username} has left the room`
                });
            }
        })

    })


})


server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
})