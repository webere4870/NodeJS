// Environment variables
if(process.env.NODE_ENV !== "production")
{
    // Load in environment variables
    require('dotenv').config()
}

// Express
const path = require('path')
const express = require('express')
const app = express()
app.use(express.static('public'))
app.listen(5000, ()=>
{
    console.log("Listening on port 5000");
})


// AWS/S3 image upload libraries
const S3 = require('aws-sdk/clients/s3')
const fs =  require('fs')
const multer = require('multer')
const upload = multer({dest: 'uploads/'})
const region = process.env.AWS_REGION;
const accessKeyId = process.env.AWS_ID;
const secretAccessKey = process.env.AWS_SECRET;
const bucketName = process.env.AWS_BUCKET_NAME;

// New instance of the S3 bucket
const s3 = new S3({
    region,
    accessKeyId,
    secretAccessKey
})



// EJS
const expressLayouts = require('express-ejs-layouts');

// Hashing algorithms
const bcrypt = require('bcrypt')

//Passport
const passport = require('passport')
const config = require('./passportconfig.js')
const flash = require('express-flash')
const session = require('express-session')
const bodyParser = require('body-parser')

// MongoDB
const {MongoClient, ObjectId} = require('mongodb')
const uri = require('./uri.js')
const { log } = require('console')
const { get } = require('express/lib/response')
const { getCipherInfo } = require('crypto')
const client = new MongoClient(uri)


// Main function
async function run()
{

    // Connect to database
    await client.connect()
    let db = client.db('Users').collection('Users')
    let db2 = client.db('Users').collection('Articles')

    // Configure passport
    config(
        passport,

        async (email)=>
        {
            return await db.findOne({email: email})
        },

        async (id)=>
        {
            return await db.findOne({_id: id})
        }
    )


    // Middleware
    app.set('view engine', 'ejs')
    app.set('views', path.join(__dirname, 'views'));
    app.use(expressLayouts)
    app.use(express.json())
    app.use(express.urlencoded({extended: false}))


    // Passport middleware
    app.use(flash())
    app.use(session({
        secret: process.env.SESSION_SECRET,
        // Resave if nothing changes?
        resave: false,
        // Do you wanna save an empty value?
        saveUninitialized: false
    }))
    app.use(passport.initialize())
    app.use(passport.session())

    app.get('/login', checkNotAuthenticated,(req, res)=>
    {
        res.render('login')
    })

    app.get('/register', checkNotAuthenticated,(req, res)=>
    {
        res.render('register')
    })

    app.get('/', checkAuthenticated, async (req, res)=>
    {
        const {following} = await db.findOne({"_id": ObjectId(req.session.passport.user.toString())})
        const articles = await db2.find({username: {$in: following}}).toArray();
        let finalImgList = [];
        let objectFollowing = following.map((temp)=>
        {
            return {username: temp}
        })
        getKeyList(objectFollowing)
        .then((img)=>{
            console.log(img)
            finalImgList = img.map((tempImg)=>
            {
                return {username: tempImg.username, mimetype: tempImg.mimetype, b64: encode(tempImg.data.Body)}
            })
            res.render('index', {articles: articles, profilePicData: finalImgList})
        })
    })

    app.post('/profile/image', checkAuthenticated, upload.single('avatar'), async (req, res)=>
    {
        let user = await db.findOne({'_id': ObjectId(req.session.passport.user)})
        let img = user.img
        if(img)
        {
            await deleteFile(img)
        }
        const file = req.file
        const {key} = await uploadFile(file)
        await db.updateOne({"_id": ObjectId(req.session.passport.user.toString())}, {$set: {img: key, mimetype: file.mimetype}})
        user = await db.findOne({'_id': ObjectId(req.session.passport.user)})
        let articles = await db2.find({username: user.username}).toArray()
        let hashMap = await getIcons(articles);
        let followersHash = await getIconsString(user.followers)
        let followingHash = await getIconsString(user.following)
        let totalList = followersHash.concat(followingHash)
        let tempUserPic = await getUserProfilePic(user.img)
        let userPic = {username: user.username, mimetype: user.mimetype, b64: encode(tempUserPic.Body)}
        console.log(totalList)
        let finalImgList = [];
        getKeyList(totalList)
        .then((img)=>{
            console.log(img)
            finalImgList = img.map((tempImg)=>
            {
                return {username: tempImg.username, mimetype: tempImg.mimetype, b64: encode(tempImg.data.Body)}
            })
            finalImgList.push(userPic)
            res.render('profile', {user: user, articles: articles, hashMap: hashMap, followersHash: followersHash, followingHash: followingHash, profilePicData: finalImgList, userPic: userPic})
        })
    })

    function uploadFile(file)
    {
        const fileStream = fs.createReadStream(file.path)
        const uploadParams = 
        {
            Bucket: bucketName,
            Body: fileStream,
            Key: file.filename
        }
        return s3.upload(uploadParams).promise();
    }

    function deleteFile(file)
    {
        return s3.deleteObject({
            Bucket: bucketName,
            Key: file
           }).promise()
    }

    async function getKeyList(users)
    {
        console.log(users, "users")
        let userList = users.map((temp)=> temp.username)
        let fullList = await db.find({username: {$in: userList}}).toArray()
        let keyList = fullList.map((temp)=> {
            console.log(temp.username, temp.mimetype)
            return {username: temp.username, img: temp.img, mimetype: temp.mimetype}

        })
        let imageList = [];

        for(let counter = 0; counter < keyList.length; counter++)
        {
            if(keyList[counter].img)
            {
                imageList.push({username: keyList[counter].username, mimetype: keyList[counter].mimetype, data: await arrayKeyList(keyList[counter].img)})
            }
        }
        return imageList;
    }

    function getUserProfilePic(singleUserKey)
    {
        let params = 
        {
            Bucket: bucketName,
            Key: singleUserKey
        }

        return s3.getObject(params).promise()
    }

    function arrayKeyList(key)
    {
        let params = {
            Bucket: bucketName, 
            Key: key
        }
        return s3.getObject(params).promise()
    }


    async function getIcons(articles)
    {
        let usernameList = [];
        for(let counter = 0; counter < articles.length; counter++)
        {
            usernameList.push(articles[counter].username)
        }
        const followingIcons = await db.find({username: {$in: usernameList}}).toArray()
        const hashMap = followingIcons.map((temp) => {
            return {username: temp.username, icon: temp.icon};
        })
        return hashMap;
    }

    async function getIconsString(list)
    {
        let usernameList = [];
        for(let counter = 0; counter < list.length; counter++)
        {
            usernameList.push(list[counter])
        }
        const followingIcons = await db.find({username: {$in: usernameList}}).toArray()
        const hashMap = followingIcons.map((temp) => {
            return {username: temp.username, icon: temp.icon};
        })
        return hashMap;
    }

    app.get('/explore', async (req, res)=>
    {
        if(req.session.passport)
        {
            const articles = await db2.find().toArray();
            let finalImgList = [];
            let objectFollowing = articles.map((temp)=>
            {
                return {username: temp.username}
            })
            getKeyList(objectFollowing)
            .then((img)=>{
            console.log(img)
            finalImgList = img.map((tempImg)=>
            {
                return {username: tempImg.username, mimetype: tempImg.mimetype, b64: encode(tempImg.data.Body)}
            })
            res.render('explore', {articles: articles, profilePicData: finalImgList})
        })
        }
        else
        {
            const articles = await db2.find().toArray();
            let finalImgList = [];
            let objectFollowing = articles.map((temp)=>
            {
                return {username: temp.username}
            })
            getKeyList(objectFollowing)
            .then((img)=>{
            console.log(img)
            finalImgList = img.map((tempImg)=>
            {
                return {username: tempImg.username, mimetype: tempImg.mimetype, b64: encode(tempImg.data.Body)}
            })
            res.render('explore', {articles: articles, profilePicData: finalImgList})
        })
        }
    })

    app.get('/write', checkAuthenticated,(req, res)=>
    {
        res.render('write')
    })

    app.post('/write/newBlog', async (req, res)=>
    {
        const {title, keywords, caption, article, date} = req.body;
        const user = await db.findOne({"_id": ObjectId(req.session.passport.user.toString())});
        let newDate = new Date(Date.parse(date)).toLocaleDateString('en-us', { weekday:"long", year:"numeric", month:"short", day:"numeric"})
        const response = await db2.insertOne({title: title, username: user.username, caption: caption, article: article, keywords: keywords, likes: 0, comments: [], date: newDate});
        res.json({success: true, data: {message: "Thanks for sharing!"}});
    })

    app.get('/search/:search', async (req, res)=>
    {
        let {search} = req.params;
        const response = await db2.find({article: {$regex: search}}).toArray()
        let usernameOnly = response.map((temp)=> temp.username)
        let usernameAndTitle = response.map((temp)=>
        {
            return {username: temp.username, title: temp.title}
        })
        const userData = await db.find({username: {$in: usernameOnly}}).toArray()
        let imageAndMimeType = userData.map((temp)=>
        {
            return {username: temp.username, img: temp.img, mimetype: temp.mimetype}
        })
        console.log(imageAndMimeType)
        for(let temp of imageAndMimeType)
        {
            let s3Data = await getUserProfilePic(temp.img)
            console.log(s3Data)
            temp.b64 = encode(s3Data.Body)
        }
        for(let temp of usernameAndTitle)
        {
            let joinIndex = imageAndMimeType.findIndex((i)=> i.username == temp.username);
            temp.b64 = imageAndMimeType[joinIndex].b64
            temp.mimetype = imageAndMimeType[joinIndex].mimetype
        }
        res.json({success: true, data: usernameAndTitle})
    })


    app.get('/searchUser/:search', async (req, res)=>
    {
        let {search} = req.params;
        const response = await db.find({username: {$regex: search}}).toArray()
        res.json({success: true, data: response})
    })

    app.get('/settings', checkAuthenticated, async (req, res)=>
    {
        const user = await db.findOne({"_id": ObjectId(req.session.passport.user.toString())});
        res.render('settings', user)
    })

    app.get('/article/:page', async (req, res)=>
    {
        const page = req.params.page;
        const {title, username, likes, comments, article} = await db2.findOne({title: page})
        let commentsArr = comments.map((temp)=>
        {
            return temp.username
        })
        let userIcons = await db.find({username: {$in: commentsArr}}).toArray()
        let hashMap = await getIcons(userIcons);
        if(req.session.passport)
        {
            res.render('article',{title: title, username: username, likes: likes, comments: comments, article: article, userID: ObjectId(req.session.passport.user).toString(), hashMap: hashMap});
        }
        else
        {
            res.render('article',{title: title, username: username, likes: likes, comments: comments, article: article,  hashMap: hashMap});
        }
    })

    app.post('/login', passport.authenticate('local', {
        successRedirect: '/',
        failureRedirect: '/login',
        'session': true,
        // Lets us have a flash message to display to our user
        failureFlash: true
    }))

    app.post('/register', async (req, res)=>
    {
        try
        {
            const hashedPassword = await bcrypt.hash(req.body.password, 10);
            const {first, last, email, username} = req.body
            const newUser = {username: username, first: first, last: last, email: email, password: hashedPassword, followers: [], following: [], biography: "", icon: "bi bi-robot", color: "#0099ff", img: "", mimetype: ""}
            await db.insertOne(newUser)
            res.redirect('login')
        }
        catch(e)
        {
            res.redirect('register')
        }
    })

    app.post('/logout', (req, res)=>
    {
        req.logout()
        req.logout()
        req.session.destroy()
        res.redirect('/login')
    })

    app.get('/profile/:username', async (req, res)=>
    {
        const {username} = req.params
        let user = await db.findOne({username: username})
        let articles = await db2.find({username: username}).toArray()
        let hashMap = await getIcons(articles);
        let followersHash = await getIconsString(user.followers)
        let followingHash = await getIconsString(user.following)
        let totalList = followersHash.concat(followingHash)
        let tempUserPic = await getUserProfilePic(user.img)
        let userPic = {username: user.username, mimetype: user.mimetype, b64: encode(tempUserPic.Body)}
        let finalImgList = [];
        getKeyList(totalList)
        .then((img)=>{
            console.log(img)
            finalImgList = img.map((tempImg)=>
            {
                return {username: tempImg.username, mimetype: tempImg.mimetype, b64: encode(tempImg.data.Body)}
            })
            finalImgList.push(userPic)
            res.render('profile', {user: user, articles: articles, hashMap: hashMap, followersHash: followersHash, followingHash: followingHash, profilePicData: finalImgList, userPic: userPic})
        })
        
    })
    app.get('/profile', checkAuthenticated, async (req, res)=>
    {
        const user = await db.findOne({'_id': ObjectId(req.session.passport.user)});
        let articles = await db2.find({username: user.username}).toArray()
        let hashMap = await getIcons(articles);
        let followersHash = await getIconsString(user.followers)
        let followingHash = await getIconsString(user.following)
        let totalList = followersHash.concat(followingHash)
        let tempUserPic = await getUserProfilePic(user.img)
        let userPic = {username: user.username, mimetype: user.mimetype, b64: encode(tempUserPic.Body)}
        let finalImgList = [];
        getKeyList(totalList)
        .then((img)=>{
            console.log(img)
            finalImgList = img.map((tempImg)=>
            {
                return {username: tempImg.username, mimetype: tempImg.mimetype, b64: encode(tempImg.data.Body)}
            })
            finalImgList.push(userPic)
            res.render('profile', {user: user, articles: articles, hashMap: hashMap, followersHash: followersHash, followingHash: followingHash, profilePicData: finalImgList, userPic: userPic})
        })
        
        /*let finalImgList = totalHashData.map((tempImg)=>
        {
            return {username: tempImg.username, mimetype: tempImg.mimetype, b64: encode(tempImg.data.Body)}
        })*/
        

       /* res.render('profile', {user: user, articles: articles, hashMap: hashMap, followersHash: followersHash, followingHash: followingHash})
        */
    })

    function encode(data){
        let buf = Buffer.from(data);
        let base64 = buf.toString('base64');
        return base64
        }

    app.post('/profile/settings', async (req, res) =>
    {
        const {username, icon, biography, color} = req.body;
        let changeProfile = await db.updateOne({username: username}, 
            {
                $set:{icon: icon, biography: biography, color: color}
            })
        res.json({success: true});
    })

    app.post('/likes/:article', async (req, res) =>
    {
        const article =  req.params.article;
        let {likes} = await db2.findOne({title: article})
        likes++;
        await db2.updateOne({
            title: article
        },
        {
            $set:
            {
                likes: likes
            }
        })
        const obj = await db2.findOne({title: article})
        res.json({success: true, likes: obj.likes});
    })

    app.post('/downLikes/:title', async (req, res)=>
    {
        const {title} = req.params;
        let {likes} = await db2.findOne({title: title})
        likes--;
        await db2.updateOne({title: title}, {$set: {likes: likes}})
        const obj = await db2.findOne({title: title})
        res.json({success: true, likes: obj.likes})
    })

    app.post('/newComment/', async (req, res)=>
    {
        let {comment, title} = req.body
        const user1 = await db.findOne({'_id': ObjectId(req.session.passport.user)});
        const postComment = { _id: ObjectId(req.session.passport.user), username: user1.username, comment: comment};
         const response = await db2.findOneAndUpdate({title: title}, {$push: {comments: postComment}});
         const {username, likes, comments, article} = await db2.findOne({title: title})
         const usernameMap = comments.map((temp) => 
         {
             if(temp.username)
             {
                return temp.username
             }
             
         })
         const hashMap = await getIconsString(usernameMap)
        res.render('article',{title: title, username: username, likes: likes, comments: comments, article: article, userID: ObjectId(req.session.passport.user).toString(), hashMap: hashMap});
    })

    function checkAuthenticated(req, res, next)
    {
        if(req.isAuthenticated())
        {
            next()
        }
        else
        {
            res.redirect('/login')
        }
    }

    function checkNotAuthenticated(req, res, next)
    {
        if(req.isAuthenticated())
        {
            res.redirect('index')
        }
        else
        {
            next()
        }
    }
}

run()


/*

if(process.env.NODE_ENV !== "production")
{
    // Load in environment variables
    require('dotenv').config()
}

// Express
const express = require('express')
const app = express()
const bcrypt = require('bcrypt')

//EJS
const expressLayouts = require('express-ejs-layouts')
app.set('view engine', 'ejs')
app.use(expressLayouts)
app.use(express.urlencoded({extended: false}))


//Passport
const passport = require('passport')
const flash = require('express-flash')
const session = require('express-session')
const initializePassport = require('./passport-config.js')

initializePassport(
    passport,
    email => users.find(user => user.email === email),
    id => users.find(user => user.id === id)
  )
// I.E. How do we use passport?
app.use(flash())
app.use(session({
    secret: process.env.SESSION_SECRET,
    // Resave if nothing changes?
    resave: false,
    // Do you wanna save an empty value?
    saveUninitialized: false
}))
app.use(passport.initialize())
app.use(passport.session())

let users = []

app.get('/', checkAuthenticated,(req, res)=>
{
    res.render('index', {title: 'Index', name: req.user.name})
})

app.get('/login', checkNotAuthenticated ,(req, res)=>
{
    res.render('login', {title: 'Login'})
})

app.get('/register', (req, res)=>
{
    res.render('register', {title: 'Register'})
})

app.post('/login', passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    // Lets us have a flash message to display to our user
    failureFlash: true
}))

app.post('/register', checkNotAuthenticated, async (req, res)=>
{
    try
    {
        const hashedPassword = await bcrypt.hash(req.body.password, 10)
        users.push({
      id: Date.now().toString(),
      name: req.body.name,
      email: req.body.email,
      password: hashedPassword
        })
        console.log(users)
        res.redirect('/login')
    }
    catch(e)
    {
        res.redirect('/register')
    }   
    
})

app.post("/logout", function(req, res) {
    req.logout();
    req.logOut();
    req.session.destroy();
    res.redirect("/login");
});

function checkAuthenticated(req, res, next)
{
    if(req.isAuthenticated())
    {
        return next()
    }
    else
    {
        res.redirect('/login')
    }
}

function checkNotAuthenticated(req, res, next)
{
    if(req.isAuthenticated())
    {
        res.redirect('/login')
    }

    next()
}

app.listen(5000, ()=>
{
    console.log("Listening");
})
*/