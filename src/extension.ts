

import * as vscode from 'vscode';
import * as path from 'path'
import { STORAGE_KEYS, COMMAND_IDS as IDS } from './components/constants';
import { MainMenuProvider } from './components/MainMenuProvider';
import { Analyzer } from './components/Analyzer';
import Logger from './components/Logger';
import CoverageAnnotationsManager from './components/CoverageAnnotationsManager';
import PeekView from './components/PeekView';


export function activate(context: vscode.ExtensionContext) {
  const _channel = vscode.window.createOutputChannel("JScope");
  _channel.show()
  Logger.init(_channel)
  context.subscriptions.push(_channel)
  Logger.log('> Initializing extension...')
  // let promiseMap = JSON.parse(fs.readFileSync(datafile, 'utf8'))
  let workspaceDir: vscode.Uri;
  
  // JScope Menu Provider
  const mainMenuProvider = new MainMenuProvider(context.extensionUri);
  context.subscriptions.push(vscode.window.registerWebviewViewProvider(IDS.MAIN_MENU_WEBVIEW, mainMenuProvider));


  // Add Coverage Annotations for open editor command
  context.subscriptions.push(vscode.commands.registerCommand(IDS.ANNOTATE_EDITOR, async () => {
    // await vscode.commands.executeCommand(IDS.NEW_COVERAGE);
    await CoverageAnnotationsManager.get().annotate()
  }));
  
  // Attach an event listener so whenever a new file is opened, annotate that file if coverage is available for it.
  vscode.window.onDidChangeActiveTextEditor(async () => {
    await CoverageAnnotationsManager.get().annotate()
  }) // try using vscode.workspace.onDidOpenTextDocument() if there are unexpected cases with this listener.

  // RUN PROMISE COVERAGE COMMAND
  context.subscriptions.push(vscode.commands.registerCommand(IDS.NEW_COVERAGE, async () => {
    // let nodeprofPath = await askForNodeprofPath(); // TODO:
    // nodeprofPath = path.resolve(nodeprofPath, 'nodeprof.jar')
    // await context.globalState.update(STORAGE_KEYS.NODEPROF_PATH, nodeprofPath)
    Analyzer.destroyExisting()
    const analyzer = Analyzer.getInstance()
    analyzer.init(context)
    await analyzer.runAnalysis();
  }));

  ///////////////
  // Peek Views
  
  // Open References
  context.subscriptions.push(
    vscode.commands.registerCommand(
      IDS.PEEK_MENU_REFERENCES, 
      PeekView.openReferences
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      IDS.PEEK_MENU_LINKS, 
      PeekView.openLinks
    )
  );
  
  
  // Use this for adding diagnostics on promises. https://raw.githubusercontent.com/microsoft/vscode-extension-samples/main/diagnostic-related-information-sample/src/extension.ts

  // context.subscriptions.push(vscode.languages.registerHoverProvider('typescript', new PromiseHoverProvider()));
  // context.subscriptions.push(vscode.languages.registerHoverProvider('javascript', new PromiseHoverProvider()));
  Logger.log('> All good.')
}

export function deactivate() {}