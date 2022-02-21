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
        let newIcons = await getIcons(articles);
        res.render('index', {articles: articles, icons: newIcons});
    })

    async function getIcons(articles)
    {
        let usernameList = [];
        for(let counter = 0; counter < articles.length; counter++)
        {
            usernameList.push(articles[counter].username)
        }
        const followingIcons = await db.find({username: {$in: usernameList}}).toArray()
        const newIcons = followingIcons.map((temp) => {
            return temp.icon;
        })
        return newIcons;
    }

    app.get('/explore', async (req, res)=>
    {
        const user = await db.findOne({"_id": ObjectId(req.session.passport.user.toString())})
        const articles = await db2.find().toArray();
        let newIcons = await getIcons(articles)
        res.render('explore', {name: `${user.first} ${user.last}`, articles: articles, icons: newIcons})
    })

    app.get('/write', checkAuthenticated,(req, res)=>
    {
        res.render('write')
    })

    app.post('/write/newBlog', async (req, res)=>
    {
        const {title, keywords, caption, article, date} = req.body;
        console.log(req.body)
        const user = await db.findOne({"_id": ObjectId(req.session.passport.user.toString())});
        console.log(caption, keywords, article);
        let newDate = new Date(Date.parse(date)).toLocaleDateString('en-us', { weekday:"long", year:"numeric", month:"short", day:"numeric"})
        const response = await db2.insertOne({title: title, username: user.username, caption: caption, article: article, keywords: keywords, likes: 0, comments: [], date: newDate});
        res.json({success: true, data: {message: "Thanks for sharing!"}});
    })

    app.get('/search/:search', async (req, res)=>
    {
        let {search} = req.params;
        console.log(search)
        const response = await db2.find({article: {$regex: search}}).toArray()
        console.log(response)
        res.json({success: true, data: response})
    })

    app.get('/settings', checkAuthenticated, async (req, res)=>
    {
        const user = await db.findOne({"_id": ObjectId(req.session.passport.user.toString())});
        res.render('settings', user)
    })

    app.get('/article/:page', checkAuthenticated, async (req, res)=>
    {
        const page = req.params.page;
        console.log(page);
        const {title, username, likes, comments, article} = await db2.findOne({title: page})

        res.render('article',{title: title, username: username, likes: likes, comments: comments, article: article, userID: ObjectId(req.session.passport.user).toString()});
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
            const newUser = {username: username, first: first, last: last, email: email, password: hashedPassword, followers: [], following: [], biography: "", icon: "bi bi-robot", color: "#0099ff"}
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
        let newIcons = await getIcons(articles);
        res.render('profile', {user: user, articles: articles, icons: newIcons})
    })

    app.post('/profile/settings', async (req, res) =>
    {
        const {username, icon, biography, color} = req.body;
        console.log(username, icon, biography, color);
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
        console.log(ObjectId(req.session.passport.user))
        res.render('article',{title: title, username: username, likes: likes, comments: comments, article: article, userID: ObjectId(req.session.passport.user).toString()});
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