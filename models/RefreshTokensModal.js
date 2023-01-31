const mongoose = require("mongoose");

// Schema for users collection.
const refreshTokenModal = mongoose.Schema({

    refreshToken:{ type: String, required: true }

});

const RefreshTokens = mongoose.model('refreshToken', refreshTokenModal);

module.exports = RefreshTokens;