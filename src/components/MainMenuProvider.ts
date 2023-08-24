import * as vscode from 'vscode'
import { COMMAND_IDS } from './constants';
// import CoverageAnnotationsManager from './CoverageAnnotationsManager';
import Logger from './Logger';

/**
 * Creates the webview for coverage panel, appearing on top of the sidebar.
 * Contains form and buttons for configuring coverage.
 */
export class MainMenuProvider implements vscode.WebviewViewProvider {

	private _view?: vscode.WebviewView;

	constructor(
		private readonly _extensionUri: vscode.Uri,
	) { }

	public resolveWebviewView(
		webviewView: vscode.WebviewView,
		context: vscode.WebviewViewResolveContext,
		_token: vscode.CancellationToken,
	) {
		this._view = webviewView;

		webviewView.webview.options = {
			// Allow scripts in the webview
			enableScripts: true,

			localResourceRoots: [
				this._extensionUri
			]
		};

		webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

		webviewView.webview.onDidReceiveMessage(data => {
			Logger.log('New Coverage:')
			Logger.log(JSON.stringify(data))
			// Called through vscode.postMessage({ type: 'colorSelected', value: color }); in the JS files when run in extension.
			switch (data.type) {
				case 'startAnalysis': {
					vscode.commands.executeCommand(COMMAND_IDS.NEW_COVERAGE);
					break;
				}
				case 'annotate': {
					vscode.commands.executeCommand(COMMAND_IDS.ANNOTATE_EDITOR);
					break;
				}
			}
		});
	}

	// if you need messaging in reverse direction(from extension to webview)
	// public updateConfig() {
	// 	if (this._view) {
	// 		this._view.show?.(true); // `show` is not implemented in 1.49 but is for 1.50 insiders
	// 		this._view.webview.postMessage({ type: 'updateConfig' });
	// 	}
	// }

	private _getHtmlForWebview(webview: vscode.Webview) {
		// Get the local path to main script run in the webview, then convert it to a uri we can use in the webview.
		const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'config-view.js'));

		// Do the same for the stylesheet.
		const styleResetUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'reset.css'));
		const styleVSCodeUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'vscode.css'));
		const styleMainUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'config-view.css'));

		// Use a nonce to only allow a specific script to be run.
		const nonce = getNonce();

		return `
		<!DOCTYPE html>
		<html lang="en">
		<head>
			<meta charset="UTF-8">
		
			<!--
				Use a content security policy to only allow loading images from https or from our extension directory,
				and only allow scripts that have a specific nonce.
				COMMENT THIS WHEN DEBUGGING IN THE BROWSER.
			-->
			<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
		
			<!-- UNCOMMENT THESE WHEN DEBUGGING ON BROWSER -->
			<!-- <link href="./reset.css" rel="stylesheet">
			<link href="./vscode.css" rel="stylesheet">
			<link href="./config-view.css" rel="stylesheet"> -->
		
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
		
			<link href="${styleResetUri}" rel="stylesheet">
			<link href="${styleVSCodeUri}" rel="stylesheet">
			<link href="${styleMainUri}" rel="stylesheet">
			
			
			<title></title>
		</head>
		<body>

			<button class="start">New Coverage</button>
			<!-- <button class="annotate">Annotate Open Editor</button> -->
			<!-- <button class="clear-tree">Clear Tree</button> -->
			
			<hr>
			
			<!--
			<p>Choose Coverage Type:</p>
			<div><input type="radio" id="settle" name="coverageType" value="settle" checked>
			<label for="settle">Settlement coverage</label></div>
			<div><input type="radio" id="register" name="coverageType" value="register">
			<label for="register">Reaction Registration coverage</label></div>
			<div><input type="radio" id="execute" name="coverageType" value="execute">
			<label for="execute">Reaction Execution coverage</label></div>
			-->

			<!--
			<hr>
			<p>Select Promise Types:</p>
			<div><input type="checkbox" id="all" name="promiseType" value="all" checked>
			<label for="all">All</label></div>
			
			<div class="promise-type-other hidden"><input type="checkbox" id="NewPromise" name="promiseType" value="NewPromise">
			<label for="NewPromise">New Promise</label></div>
			<div class="promise-type-other hidden"><input type="checkbox" id="PromiseThen" name="promiseType" value="PromiseThen">
			<label for="PromiseThen">Promise.then</label></div>
			<div class="promise-type-other hidden"><input type="checkbox" id="PromiseCatch" name="promiseType" value="PromiseCatch">
			<label for="PromiseCatch">Promise.catch</label></div>
			<div class="promise-type-other hidden"><input type="checkbox" id="PromiseResolve" name="promiseType" value="PromiseResolve,PromiseReject">
			<label for="PromiseResolve">Promise.resolve/reject</label></div>
			<div class="promise-type-other hidden"><input type="checkbox" id="PromiseAll" name="promiseType" value="PromiseAll,PromiseRace">
			<label for="PromiseAll">Promise.race/all/any/allSettled</label></div>
			<div class="promise-type-other hidden"><input type="checkbox" id="AsyncFunction" name="promiseType" value="AsyncFunction">
			<label for="AsyncFunction">Async Function</label></div>    
			-->

			<!--
			<input type="search" placeholder="search in tree..." name="search" style="display: none;" id="search">
			-->

			<script nonce="${nonce}" src="${scriptUri}"></script>
			<!-- <script nonce="${nonce}" src="./config-view.js"></script> -->
		</body>
		</html>
			`;
	}
}

function getNonce() {
	let text = '';
	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (let i = 0; i < 32; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}