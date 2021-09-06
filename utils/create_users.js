
const c_users = [];

// joins the user to specific room
const joinUser = (id, username, roomname) => {
    
    const join_user = { id, username, roomname };
    
    c_users.push(join_user);

    console.log(c_users);
    
    return join_user;
}


// Get the user id to return the current user
const getCurrentUser = (id) => {
    return c_users.find(user => user.id === id);
}


// When the user left the chat room user object will be deleted
const userDisconnect = (id) => {
    const index = c_users.findIndex((c_user) => c_user.id === id);

    if (index !== -1) {
      return c_users.splice(index, 1)[0];
    }
}


module.exports = {
    joinUser,
    getCurrentUser,
    userDisconnect
}