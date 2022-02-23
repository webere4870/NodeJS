const express = require('express')
const app = express()

app.set('port', process.env.PORT || 3300)
app.set('views', __dirname + "/views")
const server = app.listen(app.get('port'), ()=>
{
    console.log("Listening on " + app.get('port'))
})