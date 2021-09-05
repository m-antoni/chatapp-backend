const app = require('express')();
const server = require('http').createServer(app);
const colors = require('colors');
const cors = require('cors');

const io = require('socket.io')(server, {
    cors: {
      origin: "*"
    }
});

const PORT = process.env.PORT || 5000;



io.on("connection", (socket) => {

    socket.emit('message','Socket is running...');

    socket.on('chat', (payload) => {
        socket.emit('chat', payload);
    })


    socket.on('disconnect', () => {
        socket.emit('user has left the chat room')
    })
})


server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
})
