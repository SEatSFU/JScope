// STACK link here: https://stackoverflow.com/questions/54259504/once-function-returns-promise-pending
// unhandled resolve.

// DESCRIPTION:
// there is no .then to use the result of promise,
// alternative could be for this to be async function and await this promise

exports.notificationMake = functions.database.ref(`/dhabba_orders/{userId}/status`)
    .onWrite((change, context) => {
        const userId = admin.database()
        .ref(`/dhabba_orders/{userID}`).once('value'); // THIS returns a promise
        // Either add .then, or make this an async function and await this promise.
        console.log(userId);  
        const payload = {
            notification: {
            title: `Hi`,
            body: `Hey`
            }
        };
        return admin.messaging().sendToDevice(userId, payload);
});