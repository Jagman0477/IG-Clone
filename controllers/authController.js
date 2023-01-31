const express = require("express");
let router = express.Router();
const bodyparser = require("body-parser");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
require('dotenv').config();

/*********** MIDDLEWARES ***********/

router.use(express.json());
router.use(cookieParser());
router.use(bodyparser.urlencoded({extended: true}));

// Acquiring models:

const Users = require("../models/userModal");
const RefreshTokens = require("../models/RefreshTokensModal");
const { access } = require("fs/promises");
const { request } = require("http");
const Profiles = require("../models/profileModal");

// Function to decode token for payload.
exports.decodeToken = (req) => {
    const decodedToken = JSON.parse(Buffer.from((req+'').split('.')[1], 'base64').toString());
    return decodedToken;
};

exports.loginUser = (req, res) => {

    const userName = req.body.userName;
    const password = req.body.password;

        //Check is username exists in the database.
        Users.findOne({userName: userName}, async (err, foundUser) => {
        if(!err && foundUser && foundUser!= null){
            
            //If user is logged in.
            if(foundUser.logInStatus === true)
            {res.send("You are already logged in.")}

            //Check if password matches.
            else if(await bcrypt.compare(password, foundUser.password)){
                
                //Update Login status.
                Users.updateOne({userName: userName}, {logInStatus: true}, async (err, updatedUser) => {
                if(err){
                    console.log(err);
                }
                else{

                // Sign token creation.
                const payload = {user :userName, status: true};
                let accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '20m'});
                const refreshToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '180d'});
                const refreshTokendb = new RefreshTokens({
                    refreshToken: refreshToken
                });
                refreshTokendb.save();
                res.cookie('jwtRefreshToken', refreshToken, {httpOnly: true});                
                res.json({accessToken: accessToken, refreshToken: refreshToken});
                console.log("you are logged in.");

                }   
            })
            } else {res.send("Wrong password.")}
        } else console.log(err);
    })
}

exports.createUserAccount = (req, res) => {

    Users.findOne({userName: req.body.userName}, async (err, foundUser) => {
        if(!err)
        {if(foundUser){
            res.send("Username already exists pick another username");
        } else {
                const hashedpass = await bcrypt.hash(req.body.password, 10);
                const user = new Users({
                userName: req.body.userName,
                password: hashedpass,
                logInStatus: false
                    })
                user.save( (err) => {
                    if(err)
                    console.log(err);
                    else 
                    res.send("Account Created");
                })
        }
    } else {console.log(err);
        res.send("Account not created")}
    })

}

exports.logOutUser = (req, res) => {

    const authHeader = req.headers['authorization'];
    const accesstoken = authHeader && authHeader.split(' ')[1];
    const userName = this.decodeToken(accesstoken).user;
    Users.findOne({userName: userName}, function(err, foundUser){
        if(!err){
            if(!foundUser.logInStatus){
                return res.send("You are already logged out.")
            }
            if(foundUser && foundUser!=null){
                Users.updateOne({userName: userName}, {logInStatus: false}, (err, updatedUser) => {
                    if(err){console.log(err);}
                    else{ 
                        RefreshTokens.deleteOne({refreshToken: req.cookies.jwtRefreshToken}, (err)=>{if(err)console.log(err);});
                        req.headers['authorization'] = '';
                        res.clearCookie('jwtRefreshToken', {domain: 'localhost', path: '/'});
                        return res.send("You are logged out.");
                    }
                });
            } else {res.send("You are not logged in!")}
        } else {res.send(err);}
    })
}

// Function to check if token is expired or not
const isTokenExpired = (token) => {
    console.log(this.decodeToken(token));
    const exp = this.decodeToken(token).exp;
    console.log(exp, Date.now()/1000);
    if(exp < (Date.now()/1000))
    {console.log(true);
    return true;}
    else 
    {console.log(false);
    return false;}
}

// Assingning new token from refresh token.
const assignNewToken = (req, cb) => {
    RefreshTokens.findOne({refreshToken: req}, cb);
}

const refreshTokenCheck = (req, cb) => {
    RefreshTokens.findOne({refreshToken: req}, cb);
}

// User authorization middleware.
exports.authorizeUser = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    let accesstoken = authHeader && authHeader.split(' ')[1];
    if(!accesstoken) //Checks if token exits.
        {return res.send("You are not authorized(no access token).");}
    
    refreshTokenCheck(req.cookies.jwtRefreshToken, (err, foundToken) => {
        if(!err && foundToken === null){
            return res.status(403).send("You are not authorized(refresh token doesn't match).");          
        } else if(err){
            console.log(err);
        } else if(!err && foundToken != null){
            // Verify the token data.
    jwt.verify(accesstoken, process.env.ACCESS_TOKEN_SECRET, (err, authData) => {
        if(err){
                if(!isTokenExpired(accesstoken)){
                console.log(err);
                return res.status(401).send("You are not authorized(look into the console for error).")
                
                // If user has the refresh token then even invalid accesstoken will work(don't know how to solve.)

                } else if(isTokenExpired(accesstoken)) {
                        assignNewToken(req.cookies.jwtRefreshToken, (err, foundToken)=>{
                        if(!err && foundToken && foundToken!=null){
                            if(isTokenExpired(foundToken.refreshToken)){
                                return res.send("You no longer have access");
                            }
                            const payload = {user: this.decodeToken(accesstoken).user, status: true};
                            let newAccesstoken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '20m'});
                            console.log("You got authorized.(token refreshed.)");
                            req.headers['auhtorization'] = newAccesstoken;
                            return next();
                        } else {
                            console.log(err);
                            res.status(401).send("You are not authorized(no refresh token.)");
                        }
                    });
                }            
        } else if(!err && authData.status === true){
            console.log("You got authorized");
            return next(); 
        }
    })
        }
    })
};

exports.checkProfileExists = (req, res, next) => {

    const authHeader = req.headers['authorization'];
    let accesstoken = authHeader && authHeader.split(' ')[1];
    let userName = this.decodeToken(accesstoken).user;

    Profiles.findOne({userName: userName}, (err, foundUser)  => {
        if(!err && foundUser != null){
            return next();
        } else if(!err && foundUser === null){
            return res.redirect("/users/createProfile")
        } else {
            console.log(err);  
            return res.send("error bro.")
        }
    })
}