const express = require("express");
let router = express.Router();
const bodyparser = require("body-parser");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const fs = require("fs");
require('dotenv').config();

/*********** MIDDLEWARES ***********/

router.use(express.json());
router.use(cookieParser());
router.use(bodyparser.urlencoded({extended: true}));

// Acquiring Controller Modules:

const validationController = require("../controllers/validationController");
const authController = require("../controllers/authController");
const { fstat } = require("fs");

router.route('/signUp')
    .post(validationController.validateSchema(validationController.usersSchemaValid), async (req, res) => {
    authController.createUserAccount(req, res);
    })
    .get(function(req, res){
        res.render('signUp');
    });

// Basically login check the user and create a jwt token.
router.route("/signIn")
    .post(validationController.validateSchema(validationController.usersSchemaValid) ,(req, res) => {
    authController.loginUser(req, res);
    })
    .get(function(req, res){
        res.render('signIn');
    });

    router.post('/testing', (req, res) => {
        let stuff = JSON.stringify(req.body);
        fs.writeFile('testing.txt', stuff.toString(), (err) => {
            if(err){
                console.log(err);
            } else {
                console.log(fs.readFileSync("testing.txt", "utf8"));
            }
        }) 
        res.end();
    })

router.get("/test2", authController.checkProfileExists, (req, res) => {
    res.send("it works");
})

module.exports = router;