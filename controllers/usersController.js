const express = require("express");
let router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
require('dotenv').config();

// Acquiring Controllers:

const validationController = require("../controllers/validationController");
const authController = require("../controllers/authController");

// Middle-Ware: 

router.use(express.json());

//For storing we create a type of schema.
const storage = multer.diskStorage({
    destination: (req, file, cb) =>{
        cb(null, "media/avatars");
    },
    filename: (req, file, cb) => {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        cb(null, Date.now() + "." + authController.decodeToken(token).user + "." + path.extname(file.originalname));
    }
});

//For storing we create a type of schema.
const storage2 = multer.diskStorage({
    destination: (req, file, cb) =>{
        cb(null, "media/posts");
    },
    filename: (req, file, cb) => {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        cb(null, Date.now() + "." + authController.decodeToken(token).user + "." + path.extname(file.originalname));
    }
});

// This is the middleware we use to upload avatars.
exports.upload = multer({storage: storage});

// This is to upload post media.
exports.upload2 = multer({storage: storage2});

// Acquiring models:
const Profiles = require("../models/profileModal");
const Posts = require("../models/postModal");
const { json } = require("body-parser");

const deleteFile = async (dir, file)=>{
    await fs.unlink(dir+file, (err) => {
        if(err) console.log(err);
        else console.log("Old file is deleted");
    });
}

exports.createProfile = (req, res) => {
    console.log(req.body);

    // Extracting username from jwt token.
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    let userName = authController.decodeToken(token).user;

    // Check if user already has profile.
    Profiles.findOne({userName: userName}, (err, foundusers)=>{
        if(!err) { 
        if(foundusers == null || !foundusers){
            if(!req.file){
                const profile = new Profiles({
                    firstName: req.body.firstName,
                    lastName: req.body.lastName,
                    userName: userName,
                    email: req.body.email,
                    dob: req.body.dob,
                    profileCreated: true,
                    avatar: null,
                    posts: []
                    })
                    profile.save((err) => {
                        if(err){
                            console.log(err);
                            fs.unlinkSync(req.file.path);                   
                            return res.status(500).send("Server error.");
                        } else {
                            return res.send("Profile is created.")
                        }
                    }); 
            } else if(req.file.path){
            const profile = new Profiles({
                firstName: req.body.firstName,
                lastName: req.body.lastName,
                userName: userName,
                email: req.body.email,
                dob: req.body.dob,
                profileCreated: true,
                avatar: req.file.path,
                posts: []
                })
                profile.save((err) => {
                    if(err){
                        console.log(err);
                        fs.unlinkSync(req.file.path);                   
                        return res.status(500).send("Server error.");
                    } else {
                        return res.send("Profile is created.")
                    }
                }); 
            }
                      
        } else if(foundusers && foundusers!= null){
            console.log(foundusers);
            return res.send("Profile already exists."); 
            }
    } else {
        console.log(err);
    }

    })
    
}

// Function to update a profile.
exports.updateProfile = (req, res) => {
        
    // Extracting username from jwt token.
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    let userName = authController.decodeToken(token).user;
    const dir = 'media/avatars/';

    // Check if profile exists.
    Profiles.findOne({userName: userName}, (err, foundusers) => {
        if(!err){
            if(foundusers && foundusers!=null && foundusers.profileCreated==true){
                if(!req.file){
                    let updatableStuff = {
                        firstName: req.body.firstName,
                        lastName: req.body.lastName,
                        email: req.body.email,
                        dob: req.body.dob
                    }
                    Profiles.updateOne({userName: userName}, {$set: updatableStuff}, (err, updatedUser) => {
                        if(!err && updatedUser.modifiedCount === 1){
                            console.log("Profile updated");
                            return res.status(200).send("Profile updated");
                        } else {
                            console.log(err);
                            return res.status(500).send("Server error(2a)");
                        }
                    })
                } else {
                    let updatableStuff = {
                        firstName: req.body.firstName,
                        lastName: req.body.lastName,
                        email: req.body.email,
                        dob: req.body.dob,
                        avatar: req.file.path
                    }
                    let curFilename = req.file.filename;
                    fs.readdir(dir, (err, files) => {
                        if(!err){
                            files.forEach(file => {
                            if(file.split('.')[1] === userName && file.split('.')[0]<curFilename.split('.')[0]){
                                fs.unlink(dir+file, (err) => {
                                    if(err) console.log(err);
                                    else console.log("Old file deleted");
                                })
                            }  
                            })
                        } else {
                            console.log(err);
                            return res.send("Media deletion error.")
                        }
                    })
                    Profiles.updateOne({userName: userName}, {$set: updatableStuff}, (err, updatedUser) => {
                        if(!err && updatedUser.modifiedCount === 1){
                            console.log("Profile updated");
                            return res.status(200).send("Profile updated");
                        } else {
                            console.log(err);
                            fs.unlink(req.file.path, (err)=>{
                                if(err) console.log(err);
                            });
                            return res.status(500).send("Server error(2)");
                        }
                    })
                } 
            }      
        }
    })

}

// Function to create a post
exports.creatingPost = (req, res) => {
    
     // Extracting username from jwt token.
     const authHeader = req.headers['authorization'];
     const token = authHeader && authHeader.split(' ')[1];
     let userName = authController.decodeToken(token).user;
 
     // Check if user has profile.
     Profiles.findOne({userName: userName}, (err, foundusers)=>{
        if(!err){
            if(foundusers && foundusers!=null && foundusers.profileCreated==true){
                if(!req.file){
                    const newPost = new Posts({
                        post: req.body.post,
                        media: null,
                        createdBy: userName,
                        like: 0,
                        comments: [],
                        createdOn: Date.now()
                    })
                    newPost.save((err) => {
                            if(err){
                                console.log(err);                   
                                return res.status(500).send("Server error(1).");
                            } else {
                                Profiles.updateOne({userName: userName}, {$push: {posts: newPost}}, (err, updatedUser) => {
                                    if(!err && updatedUser.modifiedCount === 1){
                                        console.log("post Created");
                                        return res.status(200).send("Post created");
                                    } else {
                                        console.log(err);
                                        return res.status(500).send("Server error(2)");
                                    }
                                })
                            }
                    })
                } else {const newPost = new Posts({
                    post: req.body.post,
                    media: req.file.path,
                    createdBy: userName,
                    like: 0,
                    comments: [],
                    createdOn: Date.now()
                })
                newPost.save((err) => {
                        if(err){
                            console.log(err);
                            fs.unlinkSync(req.file.path);                   
                            return res.status(500).send("Server error(1).");
                        } else {
                            Profiles.updateOne({userName: userName}, {$push: {posts: newPost}}, (err, updatedUser) => {
                                if(!err && updatedUser.modifiedCount === 1){
                                    console.log("post Created");
                                    return res.status(200).send("Post created");
                                } else {
                                    console.log(err);
                                    fs.unlinkSync(req.file.path);
                                    return res.status(500).send("Server error(2)")
                                }
                            })
                        }
                    })
                }
            } else {
                return res.redirect('/users/createProfile');
            }
        }
     })

}

exports.showProfile = (req, res) => {
    // Extracting username from jwt token.
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    let userName = authController.decodeToken(token).user;

    Profiles.findOne({userName: userName}, (err, founduser) => {
        if(!err && founduser && founduser != null){
            res.render('profile', {profileData: founduser})
        }
    })
}

exports.follow = (req, res) => {
    let otherUser = req.body.profileUserName
    
    // Extracting username from jwt token.
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    let userName = authController.decodeToken(token).user;

    Profiles.updateOne({userName: otherUser}, {$push: {followers: userName}}, (err, updatedUser)=>{
        if(!err && updatedUser.modifiedCount===1){
            console.log("Follower added to " + otherUser);
            Profiles.updateOne({userName: userName}, {$push: {following: otherUser}}, (err, updatedUser2)=>{
                if(!err && updatedUser2.modifiedCount===1){
                    console.log("Following added to " + userName);
                    return res.status(200).send("Followed someone.");
                } console.log("failed on adding following - "+err);
            })
        } else console.log("failed on adding follower - "+err);
    })
}

exports.unfollow = (req, res) => {
    let otherUser = req.body.profileUserName
    
    // Extracting username from jwt token.
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    let userName = authController.decodeToken(token).user;

    Profiles.updateOne({userName: otherUser}, {$pull: {followers: userName}}, (err, updatedUser)=>{
        if(!err && updatedUser.modifiedCount===1){
            console.log("Follower removed from " + otherUser);
            Profiles.updateOne({userName: userName}, {$pull: {following: otherUser}}, (err, updatedUser2)=>{
                if(!err && updatedUser2.modifiedCount===1){
                    console.log("Following removed from " + userName);
                    return res.status(200).send("Unfollowed someone.");
                } console.log("failed on remove following - "+err);
            })
        } else console.log("failed on remove follower - "+err);
    })

}