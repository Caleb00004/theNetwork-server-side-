const express = require('express')
const User = require('../models/userScheema')
const bcrypt = require('bcryptjs')
const mid = require('../middleware/index')
// const myModule = require('../index')
// const {loggeIn} = require('../index')
const router = express.Router()
const myVariable = require('../myVariable')


// code to handle Signinig up / creating User
router.post('/sign-up', mid.AlreadyLogged , (req, res, next) => {
    const users = req.body // I'm receiving a json obj, express.json() is what is making this readable
    // const {name, number, age, password, email, username} = req.body

    // const newUser = new User ({
    //     name,
    //     number,
    //     email,
    //     age,
    //     password,
    //     username
    // })
    
    const newUser = new User ({...req.body})

    newUser.save()
        .then ((data) => {
            console.log(data)
            req.session.userId = data._id
            const {name, username, bio, photo, posts, age, _id} = data
            myVariable.updateMyVariable({name, username, bio, photo, posts, age, _id})
            res.json({
                'user': 'A new User Has being Created'
            })
        })
        .catch((err) => {
            return next(err)
        })
})

// code to handle Log IN
router.post('/log-in', async (req, res, next) => {
    console.log(req.body)
    console.log(req.session)
    console.log(req.session.userId)
    try {
        // check if the user exists
        const user = await User.findOne({ email: req.body.email });
        if (user) {
          //check if password matches
          const result = await bcrypt.compare(req.body.password, user.password);
          if (result) { 
            req.session.userId = user._id
            const {name, username, bio, photo, posts, age, _id} = user
            myVariable.updateMyVariable({name, username, bio, photo, posts, age, _id})
            // myVariable.updateMyVariable(user)
            // console.log(myVariable.currentUser)
            // console.log(req.session)
            // console.log('succesfully logged in')
            res.json({
                loggedIn: true,
                userId: req.session.userId,
                userData: user
            })
          } else {
            const err = {
                status: 400,
                message: "password dose'nt match"
            }
            next(err)
          }
        } else {
            const err = {
                status: 400,
                message: "User doesn't exist"
            }
            next(err)
        }
        } catch (error) {
            next(error)
    }
})

// exporting the router
module.exports = router

