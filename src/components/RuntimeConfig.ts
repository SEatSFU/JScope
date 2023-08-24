import { Uri } from "vscode"
import * as fs from "fs"
import * as path from "path"
import * as BaseRuntimeConfig from '../jscope-config.json'
import Logger from "./Logger"

export default class RuntimeConfig {
    
    public testFramework: 'mocha' | 'tap'
    public testSubdir: string
    public testRegex: string

    constructor(uri: Uri) {
        let rc
        try {
            rc = JSON.parse(fs.readFileSync(path.join(uri.fsPath, 'jscope.json'), 'utf-8'))
        } catch (e) {
            Logger.report('No runtime config provided, using default configuration.')
            rc = {}
        }
        
        this.testFramework = rc.test_framework || BaseRuntimeConfig.default_test_framework
        this.testSubdir = rc.test_subdir || BaseRuntimeConfig.default_test_subdir
        this.testRegex = rc.test_regex || BaseRuntimeConfig.default_test_regex
    }
}
