const mongoose = require('mongoose')
const express = require('express')
const Posts = require('./models/postScheema')
const User = require('./models/userScheema')
const multer = require('multer')
const mid = require('./middleware/index')
const cors = require('cors')
// const bcrypt = require('bcryptjs')

const myVariable = require('./myVariable') // Path To Variable

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

// app.locals.userData = ""
// app.locals.userData = myVariable.myVars.currentUser

// making session available to whole app
app.use((req, res, next) => {
    res.locals.currentUser = req.session.userId 
    res.locals.userData = myVariable.myVars.currentUser
    // console.log(res.locals)
    // console.log(app.locals)
    // res.locals.userData = {}
    console.log('ENTERS FIRST!!!')
    // console.log(myVariable.currentUser)
    // console.log(app.locals.userData)
    
    next();

})

app.use(cors({
    origin: "http://localhost:3000",
    credentials: true
}))

// middleware for accepting form data
app.use(express.urlencoded()) 
app.use(express.json()) // To parse any json gotten from the request. so it can be readable

// const setStatus = (req, res, next) => {
//     if (operationInProgress) {
//       res.statusMessage = 'pending'
//     } else {
//       res.statusMessage = 'fulfilled'
//     }
//     next()
// }

app.get('/', (req,res) => {
    console.log(req.session.userId)

    // User.find({"posts":{"$exists":true}})
    //     .then((data) => {
    //         console.log(data)
    //     })
    //     .catch(err => console.log(err))

    res.json({
        name: 'caleb',
        age: '23'
    })
})

// To check if user is logged IN 
app.get('/logged-in', (req, res) => {
    console.log('CHECKINGIF LOGED IN')

    console.log(res.locals.userData)
    if (req.session.userId) {
        return res.send({...req.session, userData: res.locals.userData})
    } else {
        return res.send({loggedIn: false, userId: '', userData: {}})
    }
})

// To Handle Logging Out
app.post('/logout', (req, res) => {
    if (req.session.userId) {
    
        req.session.destroy((err) => {
            if (err) {
                console.log(err)
                return next(err)            
            }
    
            return res.json({
                status: 201,
                message: 'You are logged out'
            })
        })
    } else {
        res.json({
            status: 201,
            message: 'You are not Logged in'
        })
    }
})

// To get All Posts Data
app.get('/filter', (req,res) => {

    User.find({}, {posts: 1, _id: 0})
        .then ((data) => {
            // console.log(data)

            /* 
                // logic to map through and display individual Post Item

                data.map(item => {
                    item.posts.map(postItem => (
                        console.log(postItem)
                    ))
                })
            */

            res.json(data)
        })
        .catch((err) => {
            return next(err)
        }
            )
})

// Authentication ROutes (Sign-up/ log-in)
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
    
    myVariable.updateComments(items.posts)
    // console.log(items.post)

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

// app.patch('/add-comment', (req, res, next) => {
//     // User.updateOne({_id: req.session.userId}, {$push: {posts: newPost}})
//     console.log('called')
//     User.updateOne(
//         {_id: req.session.userId},
//         {$push : 
//             {
//                 "posts.$[].comments" : 
//                     {
//                         "name": "Second Comment",
//                         "comment": "I commented"
//                     }
//             }}
//         )
//             .then((data) => {
//                 res.send("comment Posted")
//             })
//             .catch((err) => {
//                 next(err)
//             })
// })


// code to handle Creating & Saving New Post
app.post('/new-post', async (req, res, next) => {
    if (req.session.userId) {
        const {authorName, authorUserName, body} = req.body
        console.log(req.body)

        const newPost = new Posts ({
            authorId: req.session.userId,
            authorUserName,
            authorName,
            body: body,
        })

        function saveToPostArray() {
            // Save Post to User's Post Array.
            User.updateOne({_id: req.session.userId}, {$push: {posts: newPost}})
            .then((data) => {
                console.log(data)
                res.json({
                    status: 201,
                    message: "Post saved to User"
                })
            })
            .catch((err) => {
                next(err)
            })
        }

        // Saving To Post Collection
        newPost.save()
            .then((data) => {
                console.log(data)
                saveToPostArray()
                // res.json({
                //     status: 201,
                //     message: "Post successfully created"
                // })
            })
            .catch((err) => {
                next(err)
            }) 

    } else {
        let err = {
            status: 401,
            message: 'You need to be logged In'
        }
        next(err)
    }
    console.log(req.session.userId)
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