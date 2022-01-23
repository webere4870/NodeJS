// Express/EJS packages
const express = require('express')
const app = express()
const expressLayouts = require('express-ejs-layouts')
app.use(express.urlencoded({extended: false}))
app.set('view engine', 'ejs')
app.use(expressLayouts)

// MongoDB packages
const uri = require('./uri.js')
const {MongoClient} = require('mongodb')
const bcrypt = require('bcrypt')
const client = new MongoClient(uri)
let db = null;

// Passport packages
const passport = require('passport')
const flash = require('express-flash')
const session = require('express-session')
const configPassport = require('./passportconfig')

configPassport(
    passport,
    async (email) => await db.findOne({email: email}),
    async (id) => await db.findOne({_id: id})
)

app.use(flash())
app.use(session({
        secret: process.env.SESSION_SECRET,
        // Resave if nothing changes?
        resave: false,
        // Do you wanna save an empty value?
        saveUninitialized: false
}))
app.use(passport.initialize())
app.use(passport.session())

function checkAuthenticated(req, res, next)
{
    if(req.isAuthenticated())
    {
        return next()
    }
    else
    {
        return res.redirect('login')
    }
}

function checkNotAuthenticated(req, res, next)
{
    if(req.isAuthenticated)
    {
        return res.redirect('index')
    }
    else
    {
        return next()
    }
}

async function run()
{

    // Connect to DB
    await client.connect()
    db = client.db('Users').collection('Users');

    app.get('/', checkAuthenticated, (req, res)=>
    {
        res.render('index')
    })

    app.get('/login', checkNotAuthenticated,(req, res)=>
    {
        res.render('login')
    })

    app.get('/register', checkNotAuthenticated, (req, res)=>
    {
        res.render('register')
    })

    app.post('/register', async (req, res)=>
    {
        const {name, email, password} = req.body
        const hashedPassword = await bcrypt.hash(password, 10)
        const user = {name: name, email: email, password: hashedPassword}
        await db.insertOne(user)
    })

    app.post('/login', passport.authenticate('local', 
    {
        successRedirect: '/',
        failureRedirect: '/login',
        'sesion': true,
        // Lets us have a flash message to display to our user
        failureFlash: true
    }))

    app.listen(5000, ()=>
    {
        console.log("Listening on port 5000");
    })
}