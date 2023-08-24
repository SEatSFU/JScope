import { Uri } from "vscode";
import * as vscode from "vscode";
import * as path from "path";
import { sh } from "./sh";
import { ANALYSIS_PATHS, DEPLOY_ENV, TestFrameworkEnum } from "./constants";
import { WorkspacePicker } from "./WorkspacePicker";
import Logger from "./Logger";
import CoverageAnnotationsManager from "./CoverageAnnotationsManager";
import * as BaseRuntimeConfig from '../jscope-config.json'
import RuntimeConfig from "./RuntimeConfig";

/**
 * Runs the dynamic analysis and creates a log file as output.
 */
export class Analyzer {
    private static instance: Analyzer | undefined;
    
    workspace: vscode.WorkspaceFolder | undefined;
    _extensionPath: string;

    private constructor() {
        this._extensionPath = '';
    }

    public static destroyExisting() {
        Analyzer.instance = undefined;
    }
    
    public static getInstance(): Analyzer {
        if (!Analyzer.instance) {
            Analyzer.instance = new Analyzer();
        }

        return Analyzer.instance;
    }

    init(context: vscode.ExtensionContext) {
        this._extensionPath = context.extensionPath;
    }

    /**
     * 
     * @param nodeprofPath 
     * @param logDirUri 
     * 
     * @returns logFileUri - a uri pointing to a logfile that is created containing analysis output logs
     */
    async runAnalysis(): Promise<undefined> {
        if(!this.workspace) {
            if(vscode.workspace.workspaceFolders === undefined) {
                const message = "> No open workspace found, open a folder an try again" ;
                Logger.log(message)
                vscode.window.showErrorMessage(message);
                return
            }
            const wp = new WorkspacePicker();
            await wp.pick()
            return
        }
        await Logger.clear()
        const nameOfLogFile = `${this.workspace.name}.log`
        let outputLogUri
        if(DEPLOY_ENV === 'internal') {
            const logPath = `${this._extensionPath}/logs/${nameOfLogFile}`
            Logger.log(`> Deploy env is "internal". Reading logs from ${logPath}`)
            outputLogUri = Uri.file(logPath)
        }
        else if(DEPLOY_ENV === 'production') {
            const logs_dir = path.resolve(path.join(__dirname, ANALYSIS_PATHS.TMP_LOG_DIR))
            outputLogUri = Uri.file(path.join(logs_dir, nameOfLogFile))
            Logger.report(`> Instrumenting ${this.workspace.name}. Please wait...`)             

            await Analyzer.createLogDirIfNotExist(logs_dir)

            const appConfig = new RuntimeConfig(this.workspace.uri)
            Logger.report(`Project Configuration: ${JSON.stringify(appConfig, null, 2)}`)
            
            const extensionPath = this._extensionPath
            const cmd = Analyzer.createCommand(
                `cd ${BaseRuntimeConfig.nodeprof_path} &&`,
                `${extensionPath}/${ANALYSIS_PATHS.NODEPROF_CMD}`,
                `${extensionPath}/${ANALYSIS_PATHS.ANALYSIS}`,
                `${extensionPath}/${ANALYSIS_PATHS.FRAMEWORKS[appConfig.testFramework]}`,
                `${path.join(this.workspace.uri.path, appConfig.testSubdir)}`,
                `__SALT__${appConfig.testRegex}__SALT__`, // SALT is added to avoid bash to expand the regex before passing it as argument
                '>',
                `${outputLogUri.path}`
            )
            
            
            // vscode.window.showInformationMessage(`cmd: ${cmd}`);
            Logger.log(`cmd: ${cmd}`) 
            Logger.report(`Running tests. Please wait...`)
            Logger.report(`> Logs are recorded at ${outputLogUri}`) 
            const {stdout, stderr} = await sh(cmd)
            // Logger.log(`> stdout: ${stdout}`) 
            if (stderr) Logger.report(`> stderr: ${stderr}`) 
            Logger.report(`> Finished analysis for ${this.workspace.name}`) 
            Logger.log(`> output URI: ${outputLogUri.path}`)
        }

        
        // vscode.Uri.file(this._extensionPath)
        await CoverageAnnotationsManager.get().refresh(this.workspace.uri.path, this.workspace.name, outputLogUri)
        // PromiseTreeProvider.getInstance().refresh(this.workspace.uri.path, this.workspace.name, outputLogUri)
    }

    async updateSelectedWorkspace(newWorkspace: vscode.WorkspaceFolder) {
        this.workspace = newWorkspace;
        Logger.log(`> selectedWorkspace: ${newWorkspace.name}`)
        await this.runAnalysis();
    }

    // static async askForTestFramework(): Promise<TestFrameworkEnum> {
    //     // TODO: Prompt user to select between 'tap' and 'mocha'
    //     return TestFrameworkEnum.tap
    // }

    static createCommand(...args: any[]) {
        return args.join(' ')
    }

    static async createLogDirIfNotExist(logDir: string) {
        return sh(`mkdir -p ${logDir}`)
    }
}