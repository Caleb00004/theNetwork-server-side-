const mongoose = require('mongoose')
const express = require('express')
const Posts = require('./models/postScheema')
const User = require('./models/userScheema')
const mid = require('./middleware/index')
const cors = require('cors')

const authRoutes = require('./routes/auth')
const postRoutes = require('./routes/posts')
const MongoStore = require('connect-mongo')

const session = require('express-session')
const cloudinary = require('cloudinary').v2
const bodyParser = require('body-parser')
const dotenv = require('dotenv').config()

const app = express()

let testVar = 'mikeJackson'

const dbURI = process.env.mongoURI

mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then ((response) => (
        console.log('connected to database'),
        app.listen(process.env.PORT)
    ))
    .catch((err) => console.log(err))

// creating middleware to log out some details for every request
app.use((req,res,next) => {
    console.log('\nNew Request made: ')
    console.log('Host: ', req.hostname)
    console.log('Path: ', req.path)
    console.log('Method: ', req.method)
        
    next()
})

// configuring cloudinary
cloudinary.config({
    cloud_name: process.env.cloudinary_cloud_Name,
    api_key: process.env.cloudinary_api_key,
    api_secret: process.env.cloudinary_api_secret
});

// setting trust proxy
app.set("trust proxy", 1);

// setting up session.
app.use(session({
    secret: process.env.session_secret,
    resave: true, // forces session to be saved in the session store
    saveUninitialized: false, // forces an unitialized to not be saved in the session store.
    store: MongoStore.create({
        mongoUrl: process.env.mongoURI,
        // mongoUrl: dbURI,
        ttl: 14 * 24 * 60 * 60,
        autoRemove: 'native'
    }),
    cookie: {
        sameSite: 'none',
        secure: true,
        // httpOnly: false
      }
}))

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// setting up cors
app.use(cors({
    origin: process.env.cors_origin,
    credentials: true
}))

app.use(express.urlencoded()) // middleware for accepting form data
app.use(express.json()) // To parse any json gotten from the request. so it can be readable

app.get('/', async (req, res) => {
    res.json({
        status: 201,
        message: "No Data on this route, try GET '/all-post', '/logged-in' "
    })
})

// To check if user is logged IN 
app.get('/logged-in', (req, res) => {
    console.log(req.session)
    if (req.session.userId) {
        return res.send({...req.session })
    } else {
        return res.send({loggedIn: false, userId: '', userData: {}})
    }
})

// To get All Posts Data
app.get('/all-post', (req,res,next) => {
    Posts.find()
        .then(data => (
            res.json(data)
        ))
        .catch(err => next(err))
})

// To get All Users
app.get('/all-users', (req,res,next) => {
    User.find()
        .then(data => {
            let userNames = []
            data.map(item => userNames.push(item.username))
            res.json(userNames)            
            })
        .catch(err => next(err))
})

// Authentication Routes (/sign-up, /log-in, /logout )
app.use(authRoutes)
// Post Routes (/add-post, /add-comment, /like-UnlikePost )
app.use(postRoutes)

// To Find Specific User
app.post('/find-account', (req, res, next) => {
    
    const {username: findUserName} = req.body

    const isObjectEmpty = Object.keys(req.body).length === 0

    if (!isObjectEmpty) {
        const pipeline = [
            {
                $lookup: {
                from: 'posts',
                localField: 'username',
                foreignField: 'authorUserName',
                as: 'posts'
                }
            },
            // {$out: "users"}
        ];

        console.log('FILTERING DATA!!!')
        User.aggregate(pipeline)
            .then(data => {
                const filtered = data.filter(data => data.username == findUserName)

                if (!filtered[0]) {
                    err = {
                        status: '401',
                        message: "User Dose'nt exist"
                    }
                    return next(err)
                }
                const {name, username, posts, bio, photo} = filtered[0]

                res.json({
                    status: 201,
                    data: {name, username, posts, bio, photo}
                })
            })
            .catch(err => next(err))

    }
})

// To update User Documents
app.patch('/update', mid.requiresLogin , (req, res, next) => {
    const {...items} = req.body
    
    User.updateOne({_id: req.session.userId}, {$set: {...items}})
        .then((data) => {
            res.json({
                status: 201,
                message: 'Comment successfully Posted'
            }) 
        })
        .catch((err) => {
            next(err)
        })
})

// To handle errors
app.use((err, req, res, next) => {
    console.log("ERROR HANDLER")
    console.log(err)
    res.status(err.status || 500)
    res.json({
        message: err.message,
        error: {}
    })
})

exports.testVar = testVar;

// const saveInPostAndUser = async (session) => {
//     // update in post Array
//     const svaeInPost =  await newPost.save({session})

//     // save in array
//     const saveToArray = await User.updateOne(
//         { _id: req.session.userId},
//         {$push: {posts: newPost} },
//         { new: true, session }
//     )
    
//     console.log(`User has being Updated`)
// }

// const syncSession = await mongoose.startSession();

// try {
// await syncSession.withTransaction(async () => {
//     await saveInPostAndUser(syncSession);
// });
//     console.log('Transaction committed successfully!');
//     res.json({
//         status: 201,
//         message: 'Post Saved Successfully'
//     })
// } catch (error) {
//     console.log('AN ERROR OCCURED')
//     console.error(error);
//     next(error)
// } finally {
//     syncSession.endSession();
// }
