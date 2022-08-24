let express = require('express')
let passport = require('passport')
require('./strategy')
let app = express()
let session = require('express-session')
require('dotenv').config()

function isLoggedIn(req, res, next)
{
    req.user ? next() : res.sendStatus(401)
}

app.use(session({
    saveUninitialized: true,
    resave: false,
    secret: "KLJKLDSJJJJJJJLAKJLKFJ"
}))

app.use(passport.initialize())
app.use(passport.session())

app.get("/", (req, res)=>
{
    res.send('<a href="/auth/google">Authenticate with Google</a>')
})

app.get("/auth/google", passport.authenticate('google', {scope: ['profile', 'email']}))

// Ensure auth was successful
app.get('/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/protected');
  });

app.get("/failure", (req, res)=>
{
    res.send("Something went wrong")
})

app.get("/protected", isLoggedIn,(req, res)=>
{
    console.log(req.user)
    res.send("Made it")
})

app.listen(3000, ()=>
{
    console.log("Listening on port 3000")
})

