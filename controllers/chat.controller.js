const { capitalize } = require('./../utils/helpers');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
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
                                    { 
                                        roomname: roomname
                                    },
                                    { 
                                        $push: { 
                                            users: {
                                                user_id: user._id,
                                                username: user.username,
                                            },
                                            messages: {
                                                user_id: user._id,
                                                username: user.username,
                                                text: `Welcome ${capitalize(user.username)}`
                                            },
                                        }
                                    }
                                );
            data = update;          

        }else{
            // insert the new room 
            const room = await Room.create({ 
                                socket_id, 
                                roomname, 
                                users: [
                                    { user_id: user._id }
                                ],
                                messages: [
                                    {
                                        user_id: user._id,
                                        username: user.username,
                                        text: `Welcome ${capitalize(user.username)}`
                                    }
                                ] 
                            })

            data = room;                
        }

        res.json({ 
            message: 'user inserted success', 
            user_data: { 
                room_id: data._id,
                socket_id: data.socket_id,
                username: user.username,
                user_id: user._id,
                roomname: data.roomname,
                date: data.date,
            } 
        });
        
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'Server Error' });
    }
}


exports.get_all_messages = async (req, res) => {
    try {
        
        const pipeline = [
            {
                $match: {
                    _id: ObjectId(req.params.id)
                } 
            },
            {
                $project: {
                    _id: 0,
                    messages: "$messages",
                    total: {
                        $size: "$messages"
                    }
                }
            }
        ]

        const getAllMessages = await Room.aggregate(pipeline);

        res.json({ user_data: getAllMessages[0] });

    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'Server Error' });
    }
}


exports.chat_message = async (userData) => {
    try {
    
        const room = await Room.findOneAndUpdate(
            {
                _id: ObjectId(userData.room_id)
            },
            {
                $push: {
                    "messages": {
                        user_id: userData.user_id,
                        username: userData.username,
                        text: userData.text
                    },  
                }
            }
        )

    } catch (err) {
        console.log(err);
    }
}


// update remove the user_id  in the users array
exports.leave_room = async (userData) => {
    // console.log(userData)
    try {
        await Room.findOneAndUpdate(
                { socket_id: userData.socket_id },
                {
                    $pull: {
                        users: {
                            user_id: userData.user_id
                        }
                    },
                    $push :{
                        messages: {
                            user_id: userData._id,
                            username: userData.username,
                            text: `${capitalize(userData.username)} has left the chat room`
                        },
                    }

                },
            );

    } catch (error) {
        console.log(error);
    }
}

