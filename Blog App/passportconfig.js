const LocalStrategy = require('passport-local').Strategy
const bcrypt = require('bcrypt')

function initializePassport(passport, getUserByEmail, getUserByID)
{

    const authenticateUser = async (email, password, done) =>
    {
        try
        {
            const user = await getUserByEmail(email)
            if(email == null)
            {
                return done(null, false, {message: 'Account not found'})
            }

            if(await bcrypt.compare(user.password, password))
            {
                return done(null, user)
            }
            else
            {
                return done(null, false, {message: 'Invalid password.'})
            }
        }
        catch(e)
        {
            return done(null, false, {message: e})
        }
    }

    passport.use(new LocalStrategy({usernameField: 'email', passwordField: 'password'}, authenticateUser))

    passport.serializeUser((user, done) => done(null, user._id))
    passport.deserializeUser((id, done) => done(null, getUserByID(id)))
}

module.exports = initializePassport;