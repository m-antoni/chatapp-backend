const { capitalize } = require('./../utils/helpers');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const Room = require('./../models/Room');
const User = require('./../models/User');

const login = async (req, res) => {

    const { socket_id, username, roomname } = req.body;

    if(username === '' || roomname === ''){
        res.status(404).json({ message: `username and roomname is required`});
        return false;
    }

    try {
        // User validation 
        const findUser = await User.findOne({ username: username });
        if(findUser){
            res.status(404).json({ message: `${username} is already taken, please use another name` });
            return false;
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
                                                text: `Welcome ${capitalize(user.username)}.`
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
                                        text: `Welcome ${capitalize(user.username)}.`
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


const get_all_messages = async (userData) => {
    try {
        // get all the messages
        const pipeline = [
            {
                $match: {
                    _id: ObjectId(userData.room_id)
                } 
            },
            {
                $project: {
                    _id: 0,
                    socket_id: "$socket_id",
                    room_id: userData.room_id,
                    messages: "$messages",
                    total: {
                        $size: "$messages"
                    }
                }
            }
        ];

        const getAllMessages = await Room.aggregate(pipeline);

        return getAllMessages;

    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'Server Error' });
    }
}


const chat_message = async (userData) => {

    let data = [];

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
        );

        data = await AggregateProjectionPipeline(room._id, userData)

    } catch (err) {
        console.log(err);
    }

    return data;
}


// update remove the user_id  in the users array
const leave_room = async (userData) => {

    let data = [];

    try {
        const room = await Room.findOneAndUpdate(
                { 
                    socket_id: userData.socket_id 
                },
                {
                    $pull: {
                        users: {
                            user_id: userData.user_id
                        }
                    },
                    $push :{
                        messages: {
                            text: `${capitalize(userData.username)} has left the chat room.`
                        },
                    }

                },
            );
                
        data = await AggregateProjectionPipeline(room._id, userData)

    } catch (error) {
        console.log(error);
    }

    return data;
}



const AggregateProjectionPipeline = async (roomID, userData) => {

    let data = [];

    try {
        
        const pipeline = [
            {
                $match: {  _id: roomID }
            },
            {
                $project: {
                    _id: 0,
                    socket_id: "$socket_id",
                    room_id: userData.room_id,
                    messages: "$messages",
                    total_messages: { $size: "$messages" }
                }
            }
        ];

        data = await Room.aggregate(pipeline);

    } catch (error) {
        console.log(error)
    }

    return data;
}


module.exports = {
    login,
    get_all_messages,
    chat_message,
    leave_room,
}