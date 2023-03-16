const mongoose = require('mongoose')
const Schema = mongoose.Schema

const postSchema = new Schema({
    authorId: {
        type: String,
        required: true
    },
    authorName: {
        type: String,
        required: true
    },
    authorUserName: {
        type: String,
        requires: true
    },
    body: {
        type: String,
        required: true
    },
    comments: {
        type: Array,
        required: false,
        default: []
    }
},{timestamps: true})

const Posts = mongoose.model('post', postSchema)
module.exports = Posts