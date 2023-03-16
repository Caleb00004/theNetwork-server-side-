let myVars = {
    currentUser: {},
    anotherVaraible: 123    
}

function updateMyVariable(newValue) {
    myVars.currentUser = newValue
    // console.log(currentUser)
}

function updateComments(data) {
    // let comments = myVars.currentUser.post.comments
    console.log('UPDATE COMMENTS')

    let newUserData = {...myVars.currentUser, posts: data}
//    console.log(newUserData)
    updateMyVariable(newUserData)
}

// console.log('OUTSIDE FUNCTON!!!')
// console.log(myVars)

module.exports = {
    myVars,
    updateMyVariable,
    updateComments
}