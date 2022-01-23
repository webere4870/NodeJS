const LocalStrategy = require('passport-local').Strategy
const bcrypt = require('bcrypt')

function initializePassport(passport, getUserByEmail, getUserByID)
{
    passport.use()
}

module.exports = initializePassport;