const LocalStrategy = require('passport-local').Strategy
const bcrypt = require('bcrypt')

function initialize(passport, getUserByEmail, getUserByID)
{

    const authenticateUser = async (email, password, done) =>
    {
        try
        {
            const user = await getUserByEmail(email)
            if(user==null)
            {
                return done(null, false, {message: 'User could not be found.'})
            }
            else
            {
                if(await bcrypt.compare(password, user.password))
                {
                    return done(null, user)
                }
                else
                {
                    return done(null, false, {message: 'Incorrect password'})
                }
            }
        }
        catch(e)
        {
            return done(e)
        }
    }

    passport.use(new LocalStrategy({usernameField: 'email', passwordField: 'password'}, authenticateUser))


    // Grant access and store user
    passport.serializeUser((user, done) => 
    { 
        console.log(user._id);
        return done(null, user._id)})
    // Remove user with given id
    passport.deserializeUser((id, done) =>
    {
        console.log(id);
        return done(null, getUserByID(id))})
}

module.exports = initialize

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