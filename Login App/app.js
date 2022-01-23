// Environment variables
if(process.env.NODE_ENV !== "production")
{
    // Load in environment variables
    require('dotenv').config()
}

// Express
const express = require('express')
const app = express()
app.listen(5000, ()=>
{
    console.log("Listening on port 5000");
})

// EJS
const expressLayouts = require('express-ejs-layouts');

// Hashing algorithms
const bcrypt = require('bcrypt')

//Passport
const passport = require('passport')
const config = require('./passport-config.js')
const flash = require('express-flash')
const session = require('express-session')
const bodyParser = require('body-parser')

// MongoDB
const {MongoClient, ObjectId} = require('mongodb')
const uri = require('./uri.js')
const client = new MongoClient(uri)


// Main function
async function run()
{

    // Connect to database
    await client.connect()
    let db = client.db('Users').collection('Users')


    // Configure passport
    config(
        passport,

        async (email)=>
        {
            return await db.findOne({email: email})
        },

        async (id)=>
        {
            return await db.findOne({_id: id})
        }
    )


    // Middleware
    app.set('view engine', 'ejs')
    app.set('views', __dirname + '/views')
    app.use(expressLayouts)

    app.use(bodyParser.urlencoded({extended: false}))


    // Passport middleware
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

    app.get('/login', checkNotAuthenticated,(req, res)=>
    {
        res.render('login')
    })

    app.get('/register', checkNotAuthenticated,(req, res)=>
    {
        res.render('register')
    })

    app.get('/', checkAuthenticated, async (req, res)=>
    {
        console.log(req.session.passport);
        let user = await db.findOne({"_id": ObjectId(req.session.passport.user.toString())})
        res.render('index', {name: user.name})
    })

    app.post('/login', passport.authenticate('local', {
        successRedirect: '/',
        failureRedirect: '/login',
        'sesion': true,
        // Lets us have a flash message to display to our user
        failureFlash: true
    }))

    app.post('/register', async (req, res)=>
    {
        try
        {
            const hashedPassword = await bcrypt.hash(req.body.password, 10);
            const {name, email} = req.body
            const newUser = {name: name, email: email, password: hashedPassword}
            await db.insertOne(newUser)
            res.redirect('login')
        }
        catch(e)
        {
            res.redirect('register')
        }
    })

    app.post('/logout', (req, res)=>
    {
        req.logout()
        req.logout()
        req.session.destroy()
        res.redirect('/login')
    })

    function checkAuthenticated(req, res, next)
    {
        if(req.isAuthenticated())
        {
            next()
        }
        else
        {
            res.redirect('/login')
        }
    }

    function checkNotAuthenticated(req, res, next)
    {
        if(req.isAuthenticated())
        {
            res.redirect('index')
        }
        else
        {
            next()
        }
    }
}

run()


/*

if(process.env.NODE_ENV !== "production")
{
    // Load in environment variables
    require('dotenv').config()
}

// Express
const express = require('express')
const app = express()
const bcrypt = require('bcrypt')

//EJS
const expressLayouts = require('express-ejs-layouts')
app.set('view engine', 'ejs')
app.use(expressLayouts)
app.use(express.urlencoded({extended: false}))


//Passport
const passport = require('passport')
const flash = require('express-flash')
const session = require('express-session')
const initializePassport = require('./passport-config.js')

initializePassport(
    passport,
    email => users.find(user => user.email === email),
    id => users.find(user => user.id === id)
  )
// I.E. How do we use passport?
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

let users = []

app.get('/', checkAuthenticated,(req, res)=>
{
    res.render('index', {title: 'Index', name: req.user.name})
})

app.get('/login', checkNotAuthenticated ,(req, res)=>
{
    res.render('login', {title: 'Login'})
})

app.get('/register', (req, res)=>
{
    res.render('register', {title: 'Register'})
})

app.post('/login', passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    // Lets us have a flash message to display to our user
    failureFlash: true
}))

app.post('/register', checkNotAuthenticated, async (req, res)=>
{
    try
    {
        const hashedPassword = await bcrypt.hash(req.body.password, 10)
        users.push({
      id: Date.now().toString(),
      name: req.body.name,
      email: req.body.email,
      password: hashedPassword
        })
        console.log(users)
        res.redirect('/login')
    }
    catch(e)
    {
        res.redirect('/register')
    }   
    
})

app.post("/logout", function(req, res) {
    req.logout();
    req.logOut();
    req.session.destroy();
    res.redirect("/login");
});

function checkAuthenticated(req, res, next)
{
    if(req.isAuthenticated())
    {
        return next()
    }
    else
    {
        res.redirect('/login')
    }
}

function checkNotAuthenticated(req, res, next)
{
    if(req.isAuthenticated())
    {
        res.redirect('/login')
    }

    next()
}

app.listen(5000, ()=>
{
    console.log("Listening");
})
*/