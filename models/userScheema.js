const mongoose = require('mongoose')
const Scheema = mongoose.Schema
const bcrypt = require('bcryptjs')

const userScheema = new Scheema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    username: {
        type: String,
        unique: true,
        required: true
    },
    bio: {
        type: String,
        required: false,
        default: 'Hello There Nice to meet you, welcome to my Bio..'
    },
    number: {
        type: Number,
        required: false,
        default: 1000
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    photo: {
        type: String,
        default: '/path/to/image',
    },
    // likedPost
    // age: {
    //     type: Number,
    //     required: true
    // },
    // posts: {
    //     type: Array
    // },
    dateOfBirth: {
        type: String,
        required: false,
        default: 'xxx-xx-xxx'
    },
    password: {
        type: String,
        required: true
    }
})

// To hash passwords before saving it
userScheema.pre('save', function (next) {
    const user = this // represents the current instance of the user model object to be saved in database.
    console.log(user)

    bcrypt.hash(user.password, 10, (err,hash) => {
        if (err) {
            console.log(err)
            return next()
        }
        console.log(hash)
        user.password = hash
        next()
    })
})

const User = mongoose.model('user', userScheema)
module.exports = User