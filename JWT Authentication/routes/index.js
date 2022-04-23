const express = require('express')
const router = express.Router()
const User = require('mongoose').model('userModel')
const {validatePassword, generateDatabaseRecord, generateJWT} = require('../utils/generateJWT')

router.get('/', (req, res)=>
{
    res.render('index')
})

router.get('/login', (req, res)=>
{
    res.render('login')
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
        res.json({success: true, user: user, token: tokenObject.token, expires: tokenObject.expires})
    })
})

module.exports = router