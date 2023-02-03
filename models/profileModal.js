const mongoose = require("mongoose");
const Posts = require("../models/postModal");

// Creating schema for profile.
const profileSchema = mongoose.Schema({
    
    firstName: {type: String, required: true},
    lastName: {type: String, required: true},
    userName: {type: String, required: true},
    email: {type: String, required: true},
    dob: {type: Date, required: true},
    profileCreated: {type: Boolean, required: true},
    avatar: {type: String, required: false},
    posts: [{type: mongoose.model("posts").schema , ref: "posts"}],
    followers: [{type: String, required: false}],
    following: [{type: String, required: false}]
})

//Creating a collections in mongoDB.
const Profiles = mongoose.model("profile", profileSchema);

module.exports = Profiles;