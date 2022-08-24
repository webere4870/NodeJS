let express = require('express')
let router = express.Router()

router.use((req, res, next)=>
{
    console.log("Home router")
    next()
})

router.get("/user", (req, res)=>
{
    res.send("User page")
})


module.exports = router
