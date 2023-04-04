const express = require('express')
const Posts = require('../models/postScheema')
const mid = require('../middleware/index')
const User = require('../models/userScheema')
const router = express.Router()

// passowrd: VyXnsAIADBEJnNZT

// mongodb+srv://calebakpan7:<password>@cluster0.umga76a.mongodb.net/?retryWrites=true&w=majority

// code to handle Creating & Saving New Post
router.post('/new-post', mid.requiresLogin , async (req, res, next) => {
    const {authorName, authorUserName, body, photo} = req.body
    console.log(req.body)

    const newPost = new Posts ({
        authorId: req.session.userId,
        authorUserName,
        authorName,
        body: body,
        authorPhoto: photo
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
            const filtered = data.filter(data => data.username == userData.username)
            req.session.userData = filtered[0]

            res.json({
                status: 201,
                message: "Post successfully created",
                userData: req.session.userData
            })
        })
        .catch(err => next(err))
    }

    // Saving To Post Collection
    newPost.save()
        .then((data) => {
            updateCurrentUser()
        })
        .catch((err) => {
            next(err)
        }) 

})

// route to add comment to Post
router.patch('/add-comment', mid.requiresLogin , (req,res,next) => {

    const {postId, comment, authorName, authorUserName, authorImage} = req.body

    // Posts.updateOne({_id: postId}, {$push: 
    //     {comments: {
    //         $each: {comment, authorName, authorUserName, authorImage},
    //         $position: 0
    //       }
    //     }
    // })


    Posts.updateOne({_id: postId}, {$push: {comments: {comment, authorName, authorUserName, authorImage}}})
        .then((data) => {
            // console.log(data)
            res.json({
                status: 201,
                message: 'Your Comment Has Being Posted'
            })
        })
        .catch(err => next(err))

})

// route to like and unlike a Post
router.patch('/like-unlike', mid.requiresLogin , async (req,res,next) => {
    const {type, name, username, body, postId, authorImage: authorPhoto} = req.body
    const {_id} = req.session.userData    

    if (type == 'like') {
        User.updateOne({_id: _id}, {$push: {likedPost: {postId, name, username, body, authorPhoto}}})
        .then(async (data) => {

            const newUserdata = await User.findOne({_id: _id})

            req.session.userData = {...req.session.userData, likedPost: newUserdata.likedPost}
            res.json({...req.session})
        })
        .catch(err => next(err))
    } else if (type == 'unlike') {
        User.updateOne({_id: _id}, {$pull: {likedPost: {postId: postId}} })
        .then(async (data) => {
            const newUserdata = await User.findOne({_id: _id})

            req.session.userData = {...req.session.userData, likedPost: newUserdata.likedPost}
            // req.session.userData = newUserdata
            res.json({...req.session})
        })
        .catch(err => next(err))
    }


})


// exporting the router
module.exports = router