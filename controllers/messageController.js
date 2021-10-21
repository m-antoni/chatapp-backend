const Message = require('../models/message');
const JoinUser = require('../models/joinUser')

const joinRoom = async (data) => {
    try {
        
        const join = await JoinUser(data);
        join.save();
    
    } catch (e) {
        console.log(e)
    }
}


module.exports = {
    joinRoom
}