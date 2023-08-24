// DO NOT INSTRUMENT
const glob = require('glob')

var testDir = process.argv[process.argv.length - 2]
var regex = process.argv[process.argv.length - 1].replaceAll('__SALT__', '')
var testsRegex = `${testDir}/${regex}`

console.log(testsRegex)

glob(testsRegex, async function(err, files) {
  // require each .js file to run the tests
  if(err) {
    console.error('TAP GLOB ERROR:', err)
  }
  // Wrap promise:
  const UnWrappedPromise = Promise
  Promise = require('./promiseWrapper.js').Promise
  // END wrap promise

  await Promise.all(files.map(async (file) => {
    console.log(file)
    require(file)
  }))

});
