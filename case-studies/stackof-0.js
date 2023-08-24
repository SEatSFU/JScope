// STACK LINK(213 upvote): https://stackoverflow.com/questions/38884522/why-is-my-asynchronous-function-returning-promise-pending-instead-of-a-val

// ISSUE: 
// The user gets Promise <pending> as the result in console.log,
// which is a case where promise is not resolved, but the user 
// wants to read the value.

let AuthUser = data => {
return google.login(data.username, data.password).then(token => { return token } )
}

let userToken = AuthUser(data)
console.log(userToken)
