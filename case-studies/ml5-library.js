// PR here: https://github.com/ml5js/ml5-library/pull/1307
// The PR also explains this is step 1 of the fix, 
// step 2 would be adding reactions such as .catch for the rejections of the promise
// swallowed error, pending promise

// Issue here: https://github.com/ml5js/ml5-library/issues/1193
// IMPORTANT: this issue is well explained, and its description can be used
// in writing our case studies. 
// A sandbox is also provided to play around with the bug

// Summary of issue:
// In general, it is too hard for users to discover 
// what they are doing wrong when things don't work as expected.
// In ImageClassifier, If you create the model with an invalid model name
// then when you call model.predict(image) instead of showing the actual error, 
// an unrelated error is shown.
//
// But the real error is caught and not re-thrown so this is treated as a "success". 
// The Promise will resolve and the user gets an ImageClassifier instance, 
// but none of the methods will work properly.
//
// Basically, in all cases that the callCallback function should indicate 
// a final state of success or fail, it always returns a pending promise,
// making it impossible to detect the errors.



function callCallback(promise, callback) {
    if (callback) {
// FIX: return new Promise((resolve, reject) => {
        promise
        .then((result) => {
          callback(undefined, result);
          return result; // FIX: resolve(result)
        })
        .catch((error) => {
          callback(error);
          return error; // FIX: reject(error)
        });
    }
    // })
    return promise; // REMOVED IN FIX
  }

