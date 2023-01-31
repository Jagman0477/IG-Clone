const express = require("express");
let router = express.Router();
require('dotenv').config();

// Acquiring Controllers:
const validationController = require("../controllers/validationController");
const authController = require("../controllers/authController");
const usersController = require("../controllers/usersController");
const comment_likeController = require("../controllers/comment_likeController");

// Middle-Ware: 
router.use(express.json());

// Create a Profile on db.
router.route("/createProfile")
    // Front-end Work.
    .get(authController.authorizeUser, (req, res) => {
        res.render('profile');
    })
    // Back-end Work.
    .post(authController.authorizeUser, usersController.upload.single("avatar"), validationController.validateSchema(validationController.profileSchemaValid), (req, res) => {
    usersController.createProfile(req, res);
    })
    // Update user profile.
    .patch(authController.authorizeUser, usersController.upload.single("avatar"), (req, res) => {
        usersController.updateProfile(req, res);
    });

// See profile.
router.get("/profile", authController.authorizeUser, authController.checkProfileExists, (req, res) => {
    usersController.showProfile(req, res);
})

// Create a Post on db.
router.post("/creatingPost", authController.authorizeUser, usersController.upload2.single("media"), (req, res) => {

    usersController.creatingPost(req, res);

})

// Create a Comment on db.
router.post("/creatingComment", authController.authorizeUser, (req, res) => {

    comment_likeController.createComment(req, res);

})

// Add a like to a post.
router.post("/likeRequest", authController.authorizeUser, (req, res) => {

    comment_likeController.likingPost(req, res);

})

// Remove a like from a post.
router.post("/dislikeRequest", authController.authorizeUser, (req, res) => {

    comment_likeController.dislikingPost(req, res);

})

// Log out user from website.
router.post("/logout", authController.authorizeUser, (req, res) => {
    
    authController.logOutUser(req, res);

});

module.exports = router;