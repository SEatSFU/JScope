import * as fs from 'fs'
import * as readline from 'readline'

/**
 * Parses the logs outputs from dynamic analysis and returns array of JS objects.
 */
export default class LogParser {
  
  static async parseJsonLogs(path: string): Promise<any[]> {
    const rl = readline.createInterface({
      input: fs.createReadStream(path),
      crlfDelay: Infinity
    })
    let result = []
    for await (const line of rl) {
      // console.log(line);
      try {
        let parsedJsonLog = JSON.parse(line)
        result.push(parsedJsonLog)
      } catch (e) {
        // console.log(`${line} is not json`)
        // IGNORE
      }
    }
    return result 
  }

}