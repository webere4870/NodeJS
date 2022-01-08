const express = require('express')
const {MongoClient} = require('mongodb')
const uri = require('./uri.js')
const app = express()

app.use(express.static('./public'))
app.use(express.urlencoded())
app.use(express.json())
const client = new MongoClient(uri)
let db;
let db2;

async function run()
{
    await client.connect()
    db = client.db('cluster0').collection('messages')
    db2 = client.db('cluster0').collection('reactions')

    app.get('/api/commentList', async (req, res)=>
    {
        let arr = await db.find({comment: {$exists: true}}).toArray()
        res.status(200).json({success: true, data: arr})
    })

    app.get('/api/reactions', async (req, res)=>
    {
        const result = await db2.findOne({likes: {$exists: true}})
        console.log(result);
        res.status(200).json({success: true, data: result})
    })

    app.post('/api/reactions', async(req, res)=>
    {
        const {selector} = req.body
        console.log(selector);
        const allReactions = await db2.findOne({likes: {$exists: true}})
        const response = await db2.updateOne({likes: {$exists: true}}, 
            {$set: {[`${selector}`]: allReactions[`${selector}`]+1}})
        res.status(200).json({success: true, data: {[`${selector}`]: await db2.findOne({likes: {$exists: true}})}})
    })  

    app.post('/api/comment', async (req,res)=>
    {
        const {name, comment} = req.body
        const result = await db.insertOne({name, comment});
        const obj = {namer: name, commenter: comment}
        console.log(name, comment);
        const newResults = await db.find({comment: {$exists: true}}).toArray()
        res.status(200).json({success: true, data: newResults})
    })

    app.get('/api/newComment', async (req, res) =>
    {
        const request = req.body
    })

    app.listen(5000, ()=>
    {
        console.log("Listening on port 5000...");
    })
}

run()



