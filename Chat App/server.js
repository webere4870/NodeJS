const express = require('express')
const http = require('http')
const app = express()
let server = http.createServer(app)
const io = require('socket.io')(server, {cors: {origin: "*"}})

app.set('view engine', 'ejs')

app.get('/', async (req, res)=>
{
    res.render('index')
})

server.listen(3000, ()=>
{
    console.log("Listening on port 3000...")
})

// Person connects to server
// Socket variable configures the connection
// Each socket is unique
// All logic takes place here
io.on('connection', (socket) =>
{
    console.log("User: " + socket.id)

    // On receives an event, emit gives off an event
    socket.on('message', (data) =>
    {
        socket.broadcast.emit('message',data)
    })

})
