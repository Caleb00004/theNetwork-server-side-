const mongoose = require('mongoose')
const dotenv = require('dotenv').config()

const dbURI = process.env.mongoURI

const connectDatabase = (app) => {
    mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then ((response) => (
        console.log('connected to database'),
        app.listen(process.env.PORT)
    ))
    .catch((err) => console.log(err))
}

module.exports = connectDatabase