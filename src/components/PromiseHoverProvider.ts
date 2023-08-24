import * as vscode from 'vscode'
import {HoverProvider, TextDocument, Position, CancellationToken, Hover} from 'vscode'

/**
 * returns a text hover object for. Used for showing texts when you hover over a TreeItem.
 */
export class PromiseHoverProvider implements HoverProvider {
    public provideHover(document: TextDocument, position: Position, token: CancellationToken): Hover {
        const content = new vscode.MarkdownString('');
        const range = new vscode.Range(position, position);
        return new Hover(content, range);
    }
}