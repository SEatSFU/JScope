import * as vscode from 'vscode'
import * as path from 'path'
import { trimFilePath } from './utils';

export function convertLocationToUriAndRange(location: string) {
    let loc = location.replace(/\)|\(/g, '').split(':')
    let [filepath, startLine, startCol, endLine, endCol] = loc
    
    const selectedUri = vscode.Uri.file(filepath)
    
    const start = new vscode.Position(+startLine - 1, +startCol - 1);
    const end = new vscode.Position(+endLine - 1, +endCol - 1);
    const selectionRange = new vscode.Range(start, end)
    return {range: selectionRange, uri: selectedUri}
}

export function isInUri(location: string, file: vscode.Uri) {
    return location.includes(trimFilePath(file.toString()))
}

export function getIconPath(extensionPath: string, icon: string): vscode.Uri {
    return vscode.Uri.file(path.join(extensionPath, 'media', 'icons', icon))
}