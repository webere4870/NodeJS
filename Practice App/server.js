const express = require('express')
const app = express()
const expressLayouts = require('express-ejs-layouts')
const mongoose = require('mongoose')
const someSchema = require('./models/model.js')

console.log(mongoose.model('Test model'))

//Connect maybe not complete yet, but you can
// still use mongoose because it gets queued

mongoose.connect('mongodb://localhost/test')

app.use(express.json())
app.use(express.urlencoded())
app.set('view engine', 'ejs')
app.use(expressLayouts)

app.get('/', async (req, res)=>
{
    
    let record = {record: "Hey", date: 10, nestedObj: {field1: "Hey again bo"}}
    let rec = await someSchema.create(record)
    console.log(rec)
    res.render('index')
})

app.listen(5000, ()=>
{
    console.log("listening on port 5000")
})

/*const express = require('express')
const app = express()
const sessions = require('express-session')
const expressLayouts = require('express-ejs-layouts')
const cookieParser = require('cookie-parser')
const session = require('express-session')
const MongoDBStore = require('connect-mongodb-session')(session);
const oneDay = 1000 * 60 * 60 * 24;

const store = new MongoDBStore({
    uri: 'mongodb+srv://webere4870:Jack$Bauer$24$@cluster0.fyc6b.mongodb.net/myFirstDatabase?retryWrites=true&w=majority',
    collection: 'Auth',
    databaseName: 'Users'
});

app.use(sessions({
    secret: "stuff",
    saveUninitialized:true,
    cookie: { maxAge: oneDay },
    store: store,
    resave: true
}))

app.use(express.json())
app.use(express.urlencoded({extended: false}))
app.set('view engine', 'ejs')
app.use(expressLayouts)
app.use(cookieParser())


const indexRoutes = require('./routes/indexRoute.js')
const authRoutes = require('./routes/auth.js')
app.use('/', indexRoutes)
app.use('/', authRoutes)

app.listen((5000), ()=>
{
    console.log("listening")
})*/