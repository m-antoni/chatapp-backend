const app = require('express')();
const server = require('https').createServer(app);
const colors = require('colors');
const cors = require('cors');
const io = require('socket.io')(server);
const PORT = process.env.PORT || 5000;

app.use(cors());

io.on("connection", (socket) => {
    console.log('what is socket: ', socket);
    console.log('socket is active to connect.');


    socket.on('chat', (payload) => {
        console.log(payload)
        io.emit('chat', payload)
    });
})


server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
})
