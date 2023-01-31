const mongoose = require("mongoose");
require("dotenv").config();

mongoose.connect(process.env.MongoURI, { useNewUrlParser: true });