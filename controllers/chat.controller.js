const Room = require('./../models/Room');
const User = require('./../models/User');

exports.login = async (req, res) => {

    const { socket_id, username, roomname } = req.body;

    try {
        // User validation 
        const findUser = await User.findOne({ username: username });

        if(findUser){
            // check if the username is already in the room 
            const findUserInRoom = await Room.findOne({ 
                                            roomname: roomname, 
                                            users: { 
                                                $elemMatch: { 
                                                    user_id: findUser._id 
                                                } 
                                            }
                                        });

            if(findUserInRoom){
                res.status(404).json({ message: `${username} is already in the room, please try another name` });
                return false;
            }
        }

        const user = await User.create({ username });
        // check for the room
        const findRoom = await Room.findOne({ roomname: roomname });

        let data = {};
        if(findRoom){
            // update room users field
            const update = await Room.findOneAndUpdate(
                                    { roomname: roomname },
                                    { $push: { 
                                            users: { 
                                                user_id: user._id 
                                            }
                                        } 
                                });

            data['socket_id']   = update.socket_id;
            data['messages']    = update.messages;
            data['date']        = update.date;
            data['roomname']    = update.roomname

        }else{
            // insert the new room 
            const room = await Room.create({ 
                                socket_id, 
                                roomname, 
                                users: [{ user_id: user._id }], 
                                messages: [] 
                            })
            console.log(room.socket_id)

            data['socket_id']   = room.socket_id;
            data['messages']    = room.messages;
            data['date']        = room.date;
            data['roomname']    = room.roomname
        }

        res.json({ 
            message: 'user inserted success', 
            user_data: { 
                socket_id: data.socket_id,
                username: user.username,
                roomname: data.roomname,
                messages: data.messages,
                date: data.date,
            } 
        });

    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'Server Error' });
    }
}

exports.leave_room = async (client, socket_id) => {
    let data = {};    
    try {
        let user;

        // const findUser = await client.db('chat-db').collection('users').findOne({ socket_id: socket_id });
        
        // user = findUser;

        // await client.db('chat-db').collection('users').deleteOne({ socket_id: socket_id });

        // data = { status: 1, user };

    } catch (error) {
        console.log(error);
        data = { status: 0, message: 'Server Error' }
    }

    return data;
}

