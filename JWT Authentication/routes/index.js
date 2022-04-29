const express = require('express')
const router = express.Router()
const User = require('mongoose').model('userModel')
const {validatePassword, generateDatabaseRecord, generateJWT, validateRefresh} = require('../utils/generateJWT')
const dayjs = require('dayjs')
const crypto = require('crypto')
const { validate } = require('../config/userModel')
const passport = require('passport')
const fs = require('fs')

const refreshPrivate = fs.readFileSync(__dirname + "/../keys/id_rsa_priv_refresh.pem", 'utf-8')
const refreshPublic = fs.readFileSync(__dirname + "/../keys/id_rsa_pub_refresh.pem", 'utf-8')
const privateKey = fs.readFileSync(__dirname + "/../keys/id_rsa_priv.pem", 'utf-8')
const publicKey = fs.readFileSync(__dirname + "/../keys/id_rsa_pub.pem", 'utf-8')

router.get('/protected', validateRefresh,(req, res)=>
{
    res.render('protected')
})

router.get('/', (req, res)=>
{
    res.render('index')
})

router.get('/login', async (req, res)=>
{
    const {username, password} = req.body
    User.findOne({username: username}).then((user)=>
    {
        let valid = validatePassword(password, user.hash, user.salt)
        console.log(valid)
        if(valid == true)
        {
            res.json({success: true})
        }
        else
        {
            res.status(401).send({success: false})
        }
    }).catch((err)=>
    {
        res.status(401).send({success: false})
    })
})

router.get('/register', (req, res)=>
{
    res.render('register')
})

router.post('/register', async (req, res)=>
{
    const {username, password} = req.body
    let userRecord = generateDatabaseRecord(password)
    userRecord.username = username
    User.create(userRecord).then((user)=>
    {
        console.log(user)
        const tokenObject = generateJWT(user, privateKey)
        const temp = "Bearer " + tokenObject.token
        tokenObject.token = temp 
        const refreshToken = generateJWT(user, refreshPrivate)
        console.log(tokenObject, refreshToken)
        res.cookie("refresh", refreshToken.token, {httpOnly: true, maxAge: 1000000})
        res.json({token: tokenObject.token, expires: tokenObject.expires})
    })
})

module.exports = router