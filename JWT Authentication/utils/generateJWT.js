const crypto = require('crypto')
const jsonwebtoken = require('jsonwebtoken')
const fs = require('fs')
const privateKey = fs.readFileSync(__dirname + "/../keys/id_rsa_priv.pem", 'utf-8')

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

function generateJWT(user)
{
    const _id = user.id;
    const expiresIn = '1d';

    const payload = {
        sub: _id,
        iat: Date.now()
    };

    const signedToken = jsonwebtoken.sign(payload, privateKey,  { expiresIn: expiresIn, algorithm: 'RS256' })

    return {
        token: "Bearer " + signedToken,
        expires: expiresIn
      }
}

module.exports = {validatePassword, generateDatabaseRecord, generateJWT}