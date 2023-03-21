const mongoose = require('mongoose')
const express = require('express')
const Posts = require('./models/postScheema')
const User = require('./models/userScheema')
const multer = require('multer')
const mid = require('./middleware/index')
const cors = require('cors')
const authRoutes = require('./routes/auth')
const session = require('express-session')
const app = express()

let testVar = 'mikeJackson'
// exporting the app

const dbURI = `mongodb://localhost:27017`

mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then ((response) => (
        console.log('connected to database'),
        app.listen(3500)
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

// setting up session.
app.use(session({
    secret: 'secret-key',
    resave: true,
    saveUninitialized: false,
    // cookie: {
    //     sameSite: 'none',
    //     secure: true,
    //     httpOnly: false
    //   }
}))

// making session available to whole app
app.use((req, res, next) => {
    res.locals.currentUser = req.session.userId 
    console.log("SECOND MIDDLE FUNC")
    next();
})

app.use(cors({
    origin: "http://localhost:3000",
    credentials: true
}))

app.use(express.urlencoded()) // middleware for accepting form data
app.use(express.json()) // To parse any json gotten from the request. so it can be readable

app.get('/', (req, res) => {
    // User.find({"posts":{"$exists":true}})
    //     .then((data) => {
    //         console.log(data)
    //     })
    //     .catch(err => console.log(err))
    res.json({
        status: 201,
        message: "No Data on this route, try GET '/all-post', '/logged-in' "
    })
})

// To check if user is logged IN 
app.get('/logged-in', (req, res) => {
    if (req.session.userId) {
        return res.send({...req.session })
    } else {
        return res.send({loggedIn: false, userId: '', userData: {}})
    }
})

// To Handle Logging Out
app.post('/logout', mid.requiresLogin ,(req, res) => {

    req.session.destroy((err) => {
        if (err) {
            // console.log(err)
            return next(err)            
        }

        return res.json({
            status: 201,
            message: 'You are logged out'
        })
    })

})

// To get All Posts Data
app.get('/all-post', (req,res,next) => {
    Posts.find()
        .then(data => (
            console.log(data),
            res.json(data)
        ))
        .catch(err => next(err))
})

// Authentication Routes (Sign-up/ log-in)
app.use(authRoutes)


// To Find Specific User
app.get('/find-user', (req, res, next) => {

    User.find({email: 'karl@gmail.com'})
        .then((data) => {
            res.json(data)
        })
        .catch((err) => {
            next(err)
        })
    // updateOne('which doc to update', 'which fields to update')
    // User.updateOne({_id: 'id of book'}, {$set: {posts: [data]}})
})

// To update User Documents
app.patch('/update', mid.requiresLogin , (req, res, next) => {
    console.log('UPDATE IYA YIN')
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

app.patch('/add-comment', mid.requiresLogin , (req,res,next) => {

    const {postId, comment, authorName, authorUserName} = req.body

    Posts.updateOne({_id: postId}, {$push: {comments: {comment, authorName, authorUserName}}})
        .then((data) => {
            // console.log(data)
            res.json({
                status: 201,
                message: 'Your Comment Has Being Posted'
            })
        })
        .catch(err => next(err))

})

// route to add to likedPost 
app.patch('/add-like', mid.requiresLogin , (req,res,next) => {

    const {postData, comment, authorName, authorUserName} = req.body

    User.updateOne({_id: req.session.userId}, {$push: {likedPost: postData}})
        .then((data) => {
            res.json({
                status: 201,
                message: 'Your Comment Has Being Posted'
            })
        })
        .catch(err => next(err))

})

// code to handle Creating & Saving New Post
app.post('/new-post', mid.requiresLogin , async (req, res, next) => {
        const {authorName, authorUserName, body} = req.body
        console.log(req.body)

        const newPost = new Posts ({
            authorId: req.session.userId,
            authorUserName,
            authorName,
            body: body,
        })
          
        const pipeline = [
            // db.users.aggregate({$lookup: {from: "posts", localField: "username", foreignField: "authorUserName", as: "addr"}})
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

        function updateCurrentUser() {
            User.aggregate(pipeline)
            .then(data => {
                const {userData} = req.session
                // console.log(data)
                const filtered = data.filter(data => data.username == userData.username)
                console.log(filtered)
                req.session.userData = filtered[0]

                res.json({
                    status: 201,
                    message: "Post successfully created",
                    userData: req.session.userData
                })
            })
            .catch(err => next(err))
        }
    
        // handleAggregate() 

        // Saving To Post Collection
        newPost.save()  //, User.aggregate(pipeline)
            .then((data) => {
                console.log("SAVED TO POST COLLECTION")
                console.log(data)
                updateCurrentUser()
                // res.json({
                //     status: 201,
                //     message: "Post successfully created"
                // })
            })
            .catch((err) => {
                next(err)
            }) 

})


// to handle errors
app.use((err, req, res, next) => {
    console.log("I AM HERE")
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
