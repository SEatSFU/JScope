// STACK link: https://stackoverflow.com/questions/63592041/node-js-function-returns-promise-pending-why

// ISSUE:
// This function returns "Promise {pending}"
// similar to the other stackoverflow issues in this file, User.findOne() returns a promise
// and it is not awaited, causing the user variable to be a Promise <pending> 

async function getCurrentUser(id){
    try{
        let user = User.findOne({id:id}) // returns a promise
        return user;
    
    }catch(err){
        return err;
    }     
}
