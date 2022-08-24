let mongoose = require('mongoose')

let EmployeeSchema = new mongoose.Schema({
    name: String,
    email: String,
    id: Number
})

module.exports = mongoose.model('Employees', EmployeeSchema)