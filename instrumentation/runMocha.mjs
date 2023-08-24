// DO NOT INSTRUMENT
import Mocha from 'mocha'
import glob from 'glob'
import { Promise as ProxyPromise } from './promiseWrapper.js'
import { readFileSync } from 'fs';


(async function run() {
  const config = JSON.parse(
    readFileSync(new URL('./config.json', import.meta.url))
  );
  var testDir = process.argv[process.argv.length - 2]
  var regex = process.argv[process.argv.length - 1].replaceAll('__SALT__', '')
  var testsRegex = `${testDir}/${regex}`
  console.log(testsRegex)

  // Instantiate a Mocha object.
  const mocha = new Mocha({
    reporter: 'json-stream',
    // reporter: console.log,
    // reporter: function () {}, // no logs
    ui: 'bdd',
    // bail: true,
    timeout: 10000,
    // require: [`${testDir}/../scripts/test-helper.js`],
  })  

  glob(testsRegex, async function(err, files) {
    // Add each .js file to the mocha instance
    await Promise.all(files.map(file => {
      console.log(file)
      mocha.addFile(file)
    }))
  
    // Wrap promise:
    Promise = ProxyPromise
    // END wrap promise
  
    // Run the tests.
    mocha.timeout(30000)
    mocha.loadFilesAsync()
      .then(() => {
        mocha.run(function (failures) {
          process.exitCode = failures ? 1 : 0 // exit with non-zero status if there were failures
        })
      }).catch(console.error)
  
  });
})().catch(console.error)
