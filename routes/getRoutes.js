const express = require('express')
const Posts = require('../models/postScheema')
const User = require('../models/userScheema')
const router = express.Router()

// To check if user is logged IN 
router.get('/logged-in', (req, res) => {
    console.log(req.session)
    if (req.session.userId) {
        return res.send({...req.session })
    } else {
        return res.send({loggedIn: false, userId: '', userData: {}})
    }
})

// To get All Posts Data
router.get('/all-post', (req,res,next) => {
    Posts.find()
        .then(data => (
            res.json(data)
        ))
        .catch(err => next(err))
})

// To get All Users
router.get('/all-users', (req,res,next) => {
    User.find()
        .then(data => {
            let userNames = []
            data.map(item => userNames.push(item.username))
            res.json(userNames)            
            })
        .catch(err => next(err))
})

// exporting the router
module.exports = router