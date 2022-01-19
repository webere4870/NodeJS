const LocalStrategy = require('passport-local').Strategy
const bcrypt = require('bcrypt')
function initialize(passport, getUserByEmail, getUserByID)
{
    async function authenticateUser(email, password, done)
    {
        const user = getUserByEmail(email)
        if(user == null)
        {
            return done(null, false, {message: 'No user with that email'})
        }

        try
        {
            const hashedPassword = await bcrypt.hash(password, 10)
            if(await bcrypt.compare(password, hashedPassword))
            {
                return done(null, user)
            }
            else
            {
                return done(null, false, {message: 'Invalid password'})
            }
        }
        catch(e)
        {
            done(null, false, {message: e})
        }
    }

    passport.use(new LocalStrategy({usernameField: 'email', passwordField: 'password'}, authenticateUser))
    passport.serializeUser((user, done) => done(null, user.id))
    passport.deserializeUser((user, done) => done(null, user))
}

module.exports = initialize;

/*
const LocalStrategy = require('passport-local').Strategy
const bcrypt = require('bcrypt')
function initialize(passport, getUserByEmail, getUserByID)
{

    // This is the function that gets called from the login page
    const authenticateUser = async (email, password, done)=>
    {
        const user = getUserByEmail(email)

        if(user == null)
        {
            return done(null, false, {message: "No user with that email"})
        }

        try
        {
            if(await bcrypt.compare(password, user.password))
            {
                return done(null, user)
            }
            else
            {
                return done(null, false, {message: 'Password incorrect.'})
            }
        }
        catch(e)
        {
            return done(e)
        }
    }

    // The following function is called to authenticate the user
    passport.use(new LocalStrategy({usernameField: 'email', passwordField: 'password'}, authenticateUser))

    passport.serializeUser((user, done)=> done(null, user.id))

    passport.deserializeUser((id, done) => {
        return done(null, getUserByID(id))
      })
}

module.exports = initialize
*/