const express = require('express')
const router = express.Router()
const User = require('mongoose').model('userModel')
const {validatePassword, generateDatabaseRecord, generateJWT} = require('../utils/generateJWT')
const dayjs = require('dayjs')
const crypto = require('crypto')
const { validate } = require('../config/userModel')
const passport = require('passport')

router.get('/protected', passport.authenticate('jwt', {session: false}),(req, res)=>
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
    console.log(username)
    let userRecord = generateDatabaseRecord(password)
    userRecord.username = username
    User.create(userRecord).then((user)=>
    {
        console.log(user)
        const tokenObject = generateJWT(user)
        console.log(tokenObject)
        res.json({token: tokenObject.token, expires: tokenObject.expires})
    })
})

module.exports = router