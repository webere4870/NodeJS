const express = require('express')
const passport = require('passport')
const mongoose = require('mongoose')
const app = express()
const expressLayouts = require('express-ejs-layouts')


require('./config/database.js')
require('./config/userModel.js')
const routes = require('./routes/index.js')

app.set('view engine', 'ejs')
app.use(express.urlencoded({extended: false}))
app.use(express.json())
app.use(expressLayouts)
app.use(passport.initialize())
app.use('/', routes)



app.listen(5000, ()=>
{
    console.log("Listening on port 5000...")
})