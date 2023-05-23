const express = require('express')
const User = require('../models/userScheema')
const mid = require('../middleware/index')
const router = express.Router()

// To Find Specific User
router.post('/find-account', (req, res, next) => {
    
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
router.patch('/update', mid.requiresLogin , (req, res, next) => {
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

// exporting the router
module.exports = router
