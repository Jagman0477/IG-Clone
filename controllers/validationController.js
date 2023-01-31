const jwt = require("jsonwebtoken");
const yup = require("yup");
require('dotenv').config();


// Schema to validate using validateProfile function.
exports.profileSchemaValid = yup.object().shape({
    firstName: yup.string().required("First name required."),
    lastName: yup.string().required("last name required."),
    email: yup.string().email("Not an email.").required(),
    dob: yup.date().required(),
    profileCreated: yup.boolean().notRequired(),
    avatar: yup.mixed().notRequired(),
    posts: yup.array().notRequired()
});

// Schema used for ValidateUser function.
exports.usersSchemaValid = yup.object({
    userName: yup.string().required().min(5, "Username too short.").max(28, "Username too long."),
    password: yup.string().required().min(8, "Password too short").max(28, "Password too long")
});

// Used to validate userdata on '/createAccount'.
exports.validateSchema = (Schema) => async (req, res, next) =>{
    const Data = req.body;
    try{
        await Schema.validate(Data);
        return next();
    }
    
    // Catch the error and log error.
    catch(err){
        return res.status(422).send(err);               
    }
};