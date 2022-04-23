const mongoose = require('mongoose')

let schema = new mongoose.Schema({
    username: String,
    salt: String,
    hash: String
})

module.exports = mongoose.model("userModel", schema)