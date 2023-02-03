const express = require("express");
let router = express.Router();
const bodyparser = require("body-parser");
const mongoose = require("mongoose");
require('dotenv').config();

// Acquiring Controllers:
const validationController = require("../controllers/validationController");
const authController = require("../controllers/authController");

// Middle-Ware: 
router.use(express.json());
router.use(bodyparser.urlencoded({extended: true}));

// Acquiring models:
const Profiles = require("../models/profileModal");
const Posts = require("../models/postModal");
const Comments = require("../models/commentsModal");

exports.createComment = (req, res) => {

    
    // Extracting username from jwt token.
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    let userName = authController.decodeToken(token).user;

    let postid = req.body.postid;
    let comment = req.body.comment;
    comment = comment.toString();

    if(comment==null || comment.length<=0){
        return res.status(400).send("Can't send empty commment.");
    }
    if(comment.length > 300)
        comment = comment.substring(0,300);
    
    const newComment = new Comments({
        comment: comment,
        createdOn: Date.now(),
        createdBy: userName,
        postid: req.body.postid
    })
    newComment.save((err) => {
        if(err){
            console.log(err);
            return res.status(500).send("Server error(1).");
        } else {
            Posts.updateOne({_id: postid.toString()}, {$push: {comments: newComment}}, (err, updatedPost) => {
                console.log(updatedPost);
                if(!err && updatedPost.modifiedCount === 1){
                    Profiles.updateOne({userName: userName, "posts._id": req.body.postid}, {$push: {"posts.$.comments": newComment}}, (err, updatedUser) => {
                        if(!err && updatedUser.modifiedCount === 1){
                            return res.status(200).send("Comment created");
                        } else console.log(err);
                    })                    
                } else {
                    console.log(err);
                    Comments.deleteOne({createdBy: newComment.createdBy, createdOn: newComment.createdOn, postid: newComment.postid}, (err));
                    return res.status(500).send("Server eroor(2).");
                }
            })
        }
    })
}

exports.likingPost = (req, res) => {

    // Extracting username from jwt token.
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    let userName = authController.decodeToken(token).user;

    let postid = req.body.postid

    Posts.findOne({_id: postid.toString()}, (err, foundPost) => {
        if(!err && foundPost.likes.includes(userName)){
            return res.send("Already Liked");
        } else if(!err && !foundPost.likes.includes(userName)){
            Profiles.updateOne({userName: userName, "posts._id": postid.toString()}, {$push: {"posts.$.likes": userName}}, (err, updatedPost) => {
                if(err){
                    console.log(err);
                    return res.status(500).send("Server error(1).");
                } else if(!err && updatedPost.modifiedCount === 1){
                    Posts.updateOne({_id: postid.toString()}, {$push: {likes: userName}}, (err, updatedPost) => {
                        if(!err && updatedPost.modifiedCount === 1){
                            return res.status(200).send("Post liked");
                        } else console.log(err);
                    })                    
                }
            })
        } else console.log(err);
    })
}

exports.dislikingPost = (req, res) => {

    // Extracting username from jwt token.
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    let userName = authController.decodeToken(token).user;

    let postid = req.body.postid
    
    Posts.findOne({_id: postid.toString()}, (err, foundPost) => {
        if(!err && !foundPost.likes.includes(userName)){
            return res.send("You didn't even like it. ;( ");
        } else if(!err && foundPost.likes.includes(userName)){
            Profiles.updateOne({userName: userName, "posts._id": postid.toString()}, {$pull: {"posts.$.likes": userName}}, (err, updatedUser) => {
                if(err){
                    console.log(err);
                    return res.status(500).send("Server error(1).");
                } else if(!err && updatedUser.modifiedCount === 1){
                    Posts.updateOne({_id: postid.toString()}, {$pull: {likes: userName}}, (err, updatedPost) => {
                        if(!err && updatedPost.modifiedCount === 1){
                            return res.status(200).send("Post disliked");
                        } else console.log(err);
                    })   
                }
            })
        }
    })
}