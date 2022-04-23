const mongoose = require('mongoose')
require('dotenv').config()
mongoose.connect(process.env.DB_STRING, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});