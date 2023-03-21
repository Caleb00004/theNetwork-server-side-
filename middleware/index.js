// middleware to check if a User is logged In or Not
function requiresLogin(req, res, next) {
    if(req.session && req.session.userId) {
        return next()
    } else {
        let err = {
            status: 401,
            message: 'User Not Logged In'
        }
        next(err)
    }
}

function AlreadyLogged (req, res, next) {
    if (req.session && req.session.userId) {
        console.log('Currently Logged In')
        res.redirect('/')
    } else {
        next()
    }
}

module.exports.AlreadyLogged = AlreadyLogged
module.exports.requiresLogin = requiresLogin