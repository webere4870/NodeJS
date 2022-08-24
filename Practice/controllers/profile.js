let express = require('express')
let app = express()
let cookieParser = require('cookie-parser')

app.use(cookieParser())
app.use((req, res, next)=>
{
    res.cookie("user", "mayliaisababe")
    console.log("cookie sent")
    next()
})

app.get("/", (req, res)=>
{
    res.send("<h1>Maylia is the prettiest girl in the world. </h1>")
})

app.listen(5000, (req, res)=>
{
    console.log("listening on port 5000")
})
