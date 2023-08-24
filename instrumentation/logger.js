// docs are here: https://www.npmjs.com/package/simple-json-log
// Set to 'debug'/'info' and use log.debug/log.info wherever you want to change level of logs.
// DO NOT INSTRUMENT

const settings = {
  PROJECT_DIR: __dirname,
  LOG_LEVEL: 'warn',
  LOG_INDENT: 0,
}

// LOG_LEVES {
//     trace: 0,
//     debug: 1,
//     info: 2,
//     warn: 3, // set this for coverage output only
//     error: 4,
//     fatal: 5,
//     off: 6
//   }


const logger = new (require('simple-json-log'))({ 
  level: settings.LOG_LEVEL, 
  indent: settings.LOG_INDENT, 
  timeFn: false 
})

module.exports = logger
