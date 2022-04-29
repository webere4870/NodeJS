const crypto = require('crypto')
const jsonwebtoken = require('jsonwebtoken')
const fs = require('fs')
const path = require('path')
const User = require('mongoose').model('userModel')

const privateKey = fs.readFileSync(__dirname + "/../keys/id_rsa_priv.pem", 'utf-8')
const publicKey = fs.readFileSync(__dirname + "/../keys/id_rsa_pub.pem", 'utf-8')
const refreshPrivate = fs.readFileSync(__dirname + "/../keys/id_rsa_priv_refresh.pem", 'utf-8')
const refreshPublic = fs.readFileSync(__dirname + "/../keys/id_rsa_pub_refresh.pem", 'utf-8')

function validatePassword(password, hash, salt)
{
    var hashVerify = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    return hash === hashVerify;
}

function generateDatabaseRecord(password)
{
    var salt = crypto.randomBytes(32).toString('hex');
    var genHash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    
    return {
      salt: salt,
      hash: genHash
    };
}

function generateJWT(user, privateKey)
{
    const _id = user.id;
    const expiresIn = '1d';

    const payload = {
        sub: _id,
        iat: Date.now()
    };

    const signedToken = jsonwebtoken.sign(payload, privateKey,  { expiresIn: expiresIn, algorithm: 'RS256' })

    return {
        token: signedToken,
        expires: expiresIn
      }
}

async function validateRefresh(req, res, next)
{
    const refreshToken = req.cookies
    let response = jsonwebtoken.verify(refreshToken.refresh, refreshPublic)

    if(response.exp > Date.now())
    {
        console.log("valid")
        let user = await User.findById(response.sub)
        let refreshToken = generateJWT(user, refreshPrivate)
        res.cookie("refresh", refreshToken.token, {httpOnly: true, maxAge: 1000000})
    }
    else{
        console.log("invalid")
        res.clearCookie("refresh")
    }
    next()
}

module.exports = {validatePassword, generateDatabaseRecord, generateJWT, validateRefresh}