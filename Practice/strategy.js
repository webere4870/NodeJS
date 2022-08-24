const passport = require('passport')
const GoogleStrategy = require('passport-google-oidc')
require('dotenv').config()

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "http://localhost:3000/google/callback"
},
function(accessToken, refreshToken, profile, done) {
  console.log(accessToken, refreshToken, profile)
  return done(null, profile);
}
));


// Called after successful authentication
// Puts the user onto session store
passport.serializeUser((user, done)=>
{
    done(null, user)
})

// Called if user detected on request
// If so, deserialize and make it available to middleware
passport.deserializeUser((user, done)=>
{
    done(null, user)
})