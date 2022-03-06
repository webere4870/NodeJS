const express = require('express')
const app = express()
const server = require('http').createServer(app)
const io = require('socket.io')(server, {cors: {origin: '*'}})
const PORT = 3000;
app.set('view engine', 'ejs')

server.listen(PORT, (req, res)=>
{
    console.log("Listening on port", PORT)
})

app.get('/', (req, res)=>
{
    res.render('index')
})

io.on('connection', (socket)=>
{
    socket.on('message', (data)=>
    {
        socket.broadcast.emit('message', data)
    })
})