const mongoose = require("mongoose");

const Comments = require("./commentsModal");

// Creating Schema for posts.
const postSchema = mongoose.Schema({

    post: {type: String, required: true },
    media: {type: String, required: false },
    createdBy: {type: String, required: true},
    likes: [{type: String, required: false}],
    comments: [mongoose.model("comments").schema],
    createdOn: {type: Date, requierd: true}

});

// Creating posts model(collection) on db.
const Posts = mongoose.model("posts", postSchema);

module.exports = Posts;