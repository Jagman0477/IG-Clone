const { uniqueId } = require("lodash");
const mongoose = require("mongoose");

// Create comment Schema.
const commentSchema = mongoose.Schema({
    comment: String,
    createdOn: Date,
    createdBy: String,
    postid: String
});

// Create a collection in db.
const Comments = mongoose.model("comments", commentSchema);

module.exports = Comments;