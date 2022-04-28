const passport = require('passport')
const User = require('mongoose').model('userModel')
const fs = require('fs')

const JWTStrategy = require('passport-jwt').Strategy
const ExtractJwt = require('passport-jwt').ExtractJwt

// To decrypt
const publicKey = fs.readFileSync("./keys/id_rsa_pub.pem", 'utf-8')

const options = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    // This is the verification
    secretOrKey: publicKey,
    algorithms: ['RS256']
};

const strategy = new JWTStrategy(options, async (payload, done)=>
{
    try
    {
        console.log("made it to her in the workflow")
        const user = await User.findOne({_id: payload.sub})
        if(user)
        {
            return done(null, user)
        }
        else
        {
            return done(null, false)
        }
    }
    catch(err)
    {
        return done(err, null)
    }
})

passport.use(strategy)

