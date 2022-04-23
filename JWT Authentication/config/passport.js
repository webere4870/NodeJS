const passport = require('passport')
const User = require('mongoose').model('userModel')
const fs = require('fs')
const passport = require('passport')
const JWTStrategy = require('passport-jwt').Strategy
const ExtractJwt = require('passport-jwt').ExtractJwt

// To decrypt
const publicKey = fs.readFileSync(__dirname + "/keys/id_rsa_pub.pem", 'utf-8')

const options = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    // This is the verification
    secretOrKey: PUB_KEY,
    algorithms: ['RS256']
};

const strategy = new JWTStrategy(options, async (payload, done)=>
{
    try
    {
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

module.exports = passport