const mongoose = require("mongoose");

// Schema for users collection.
const userSchema = mongoose.Schema({

    userName:{ type: String, required: true },
    password: { type: String, required: true },
    logInStatus: { type: Boolean, required: true}

});

// This created a collection named users in the database.
const  Users = mongoose.model('user', userSchema);

module.exports = Users;