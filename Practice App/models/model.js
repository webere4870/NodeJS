const mongoose = require('mongoose')

let nestedSchema = new mongoose.Schema({
    field1: {type: String}
})

let schema = new mongoose.Schema({
    record: {type: String, required: true},
    date: {type: Number, default: Date.now()},
    nestedObj: nestedSchema
})

const model = mongoose.model('Test model', schema)

module.exports = model;