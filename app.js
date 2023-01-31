const express = require("express");
const app = express();
const auth = require("./routes/auth");
const user = require("./routes/users");
const bodyparser = require("body-parser");
const ejs = require("ejs");
const _= require("lodash");
const { default: mongoose } = require("mongoose");
require("./db");


/*********** MIDDLEWARES ***********/

//Lodash
app.locals._ = _;

//EJS
app.use(express.static("public"));
app.set('view engine', 'ejs');

//Body-Parser
app.use(express.json());
app.use(bodyparser.urlencoded({extended: true}));
app.use(function(req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type, Authorization');
    next();
});

/************** ROUTES ***************/

app.use("/", auth);
app.use("/users", user);

app.listen(3000, function(req, res){
    console.log("The server is running.");
});