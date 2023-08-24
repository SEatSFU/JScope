import * as vscode from 'vscode'
import Logger from './Logger';
import { COMMAND_IDS, CoverageStatusCount, CoverageStatusTypeFlattened, COVERAGE_TYPE, PInfo, PMap, P_TYPE } from './constants';
import { DECORATION_TYPES, Decoration, Decorations } from './decorations';
import { Coverage } from './Coverage';
import CoverageHelper from './CoverageHelper';
import { capitalize, findClosingBracketMatchIndex, updateStartLocation } from './utils';
import {convertLocationToUriAndRange, isInUri} from './vscode-utils'
import CLIReporter from './CLIReporter';

const newline = `  \n`

export default class CoverageAnnotationsManager {

    private static instance: CoverageAnnotationsManager | undefined;
    private coverage: Coverage | undefined;
    

    async annotate(): Promise<vscode.Disposable | void> {
        const editor = vscode.window.activeTextEditor;
        const editorPath = vscode.window.activeTextEditor?.document.uri.fsPath
        if(!editor) return
        if(!this.coverage) return
        if(!editorPath?.includes(this.coverage.projectPath())) return

        const promiseMap = await this.coverage.getPromiseMap()
        // Logger.log(`> Promise map created. Keys: ${Object.keys(promiseMap).length}`)
        const functionsMap = await this.coverage.getFunctionsMap()
        // Logger.log(`> Function map created. Keys: ${Object.keys(functionsMap).length}`)
        // const coverageReport = CoverageReportProvider.getCoverageSummary(promiseMap, functionsMap)
        // Logger.report(`----------`)
        // Logger.report(`> Coverage report:`)
        // Logger.report(`> ${coverageReport}`)
        // Logger.log(`----------`)

        // FIXME: Find the reason for race condition, or find a better way to start.
        let decorations = await this.getDecorationnForEditor(promiseMap, editor)
        decorations = this.mergeDecorationsByType(decorations)
        // Logger.log(`Decorations: ${JSON.stringify(decorations, null, 2)}`)
        return new Annotation(decorations, editor)
    }    
    
    async getDecorationnForEditor(promiseMap: PMap, editor: vscode.TextEditor): Promise<Decorations> {
        let decorations: Decorations = Object.entries(promiseMap).map((p): Decoration => {
            const id: string = p[0]
            const val: any = p[1]
            let loc = val['location']
            if(!isInUri(loc, editor.document.uri))
                return { decorationType: DECORATION_TYPES.none, rangesOrOptions: [] }
            // Logger.log(`> valcode: ${val['code']}, ${typeof val['code']} cid: ${val['cid']}, id:${id}`)
            // TODO: Construct labels based on a structure.
            // let label: string | vscode.TreeItemLabel = TreeItem.createLabelFromLocation(loc)
            
            // Logger.log(`> adding new tree leaf: label: ${label}, location: ${loc}`)
            const promiseCovStatus = CoverageHelper.getCoverageStatusForPromiseFlattened(val)
            
            // For promise.then and promise.catch, only highlight the location of the .then
            // or .catch part, not the whole promise chain.
            if([P_TYPE.PromiseCatch, P_TYPE.PromiseThen].includes(val['type']) 
            && (val['code'].includes('.then') || val['code'].includes('.catch'))) {
                
                let closingInd = findClosingBracketMatchIndex(val['code'], val['code'].length - 1, true)
                if(closingInd !== -1) {
                    closingInd = val['code'].substr(0, closingInd).lastIndexOf('.')
                    let newLinesCnt = (val['code'].substr(0, closingInd).match(/\n/g)||[]).length;
                    let onlyThenCode = val['code'].substr(0, closingInd)
                    let colOffset = onlyThenCode.length - onlyThenCode.lastIndexOf('\n')
                    loc = updateStartLocation(loc, colOffset, newLinesCnt)
                    // Logger.log(`CODE<${closingInd}><${newLinesCnt}>: ${val['code']}`)
                    // Logger.log(`LOC><: \n${val['location']}\n${loc}`)
                }
            }
            const {range, uri} = convertLocationToUriAndRange(loc)
            
            const unCoveredCount = Object.values(promiseCovStatus).filter(v => v === false).length

            return {
                // @ts-ignore
                decorationType: DECORATION_TYPES[`severity_${Math.floor(unCoveredCount/2)}`],
                rangesOrOptions: [{
                    range: range,
                    hoverMessage: this.getHoverMessage(val, promiseCovStatus)
                }]
            }

        })
        return decorations;
    }
    
    getHoverMessage(pInfo: PInfo, promiseCovStatus: CoverageStatusTypeFlattened): vscode.MarkdownString {
        
        // FIXME: remove.
        let tooltip = new vscode.MarkdownString(
` \`\`\`js
JScope: ${pInfo.type}@${pInfo.location.slice(pInfo.location.indexOf(':')+1)}
\`\`\`
`       
// [Show covered actions](command:${peek}?${pInfo.id}) // TODO show the list of executed reaction functions,
                                                       // using CoverageHelper.getReactionFunctionLocation
        )
        tooltip.isTrusted = true

        if(pInfo.refs.length) {
            tooltip.appendMarkdown(
                `> [Open References](command:${COMMAND_IDS.PEEK_MENU_REFERENCES}?${encodeURIComponent(JSON.stringify({refs: pInfo.refs.length > 5 ? pInfo.refs.slice(0, 5) : pInfo.refs, location: pInfo.location}))})  \n`
            )
        }
        if(pInfo.links.length) {
            tooltip.appendMarkdown(
                `> [Open Links](command:${COMMAND_IDS.PEEK_MENU_LINKS}?${encodeURIComponent(JSON.stringify({links: pInfo.links.length > 5 ? pInfo.refs.slice(0, 5) : pInfo.links, location: pInfo.location}))})  \n`
            )
        }
        
        // @ts-ignore
        let warns = Object.keys(promiseCovStatus).filter((k: string) => promiseCovStatus[k] === false)
        if(!warns.length) warns.push('full')
        else if(warns.length === CoverageStatusCount) {
            tooltip.appendMarkdown(`${newline}- Promise not settled and has no reactions.  \n  Maybe you forgot to use \`await\` or \`.then()\`?`)
        }
        else warns.forEach(k => {
            // @ts-ignore
            tooltip.appendMarkdown(this._getActionMessageForReaction(pInfo, k))
        })
        return tooltip
    }

    private _getActionMessageForReaction(pinfo: PInfo, flattenedKey: string) {
        
        if(flattenedKey === 'full')
            return ``
        let [covType, covReaction] = flattenedKey.split('_')
        if (covType === COVERAGE_TYPE.settle) {
            return `${newline}- Promise never ${covReaction}ed.`
        } else if (covType === COVERAGE_TYPE.register) {
            return `${newline}- Missing ${covReaction.replace('reject', 'error')} handler.`
        }  else { // if (covType === COVERAGE_TYPE.execute) {
            return `${newline}- ${capitalize(covReaction.replace('reject', 'error'))} handler not executed.`
        }
    }

    mergeDecorationsByType(decorations: Decorations): Decorations {
        let mergedObj: any = {}
        decorations?.forEach((d: Decoration) => {
            if(mergedObj.hasOwnProperty(d.decorationType.key)) {
                mergedObj[d.decorationType.key].rangesOrOptions = [
                    ...mergedObj[d.decorationType.key].rangesOrOptions,
                    ...d.rangesOrOptions
                ]
            } else {
                mergedObj[d.decorationType.key] = {
                    decorationType: d.decorationType,
                    rangesOrOptions: [...d.rangesOrOptions]
                }
            }
        })
        return Object.values(mergedObj)
    }

    public static get() {
        if(!CoverageAnnotationsManager.instance) {
            CoverageAnnotationsManager.instance = new CoverageAnnotationsManager();
        }
        return CoverageAnnotationsManager.instance;
    }

    async refresh(projectPath: string, projectName: string, logUri?: vscode.Uri) {
        Logger.report(`> Refreshing AnnotationsManager ${logUri?.path}, ${projectPath}, ${projectName}`)
        this.coverage = new Coverage(logUri?.path)
        this.coverage.setProjectInfo(projectPath, projectName)
        CLIReporter.generateReport(this.coverage)
        await this.annotate()
    }

    async clearCoverage() {
        this.coverage?.clear()
        await this.annotate()
    }

}

export class Annotation implements vscode.Disposable {
    
    // protected disposable: vscode.Disposable;

    constructor(
        private decorations: Decorations,
		public editor: vscode.TextEditor,
	) {
        this.annotate(
            decorations,
            this.editor
        )
		// this.disposable = vscode.Disposable.from(
		// 	vscode.window.onDidChangeTextEditorSelection(this.onTextEditorSelectionChanged, this),
		// );
	}

    annotate(decorations: Decorations, editor: vscode.TextEditor) {
        if (this.decorations?.length) {
			this.clear();
		}

		this.decorations = decorations;
		if (this.decorations?.length) {
			for (const d of this.decorations) {
				editor.setDecorations(d.decorationType, d.rangesOrOptions);
			}
		}
    }

    // private onTextEditorSelectionChanged(e: vscode.TextEditorSelectionChangeEvent) {
	// 	if (this.editor?.document !== e.textEditor.document) return;
	// }


    dispose() {
		this.clear();
		// this.disposable.dispose();
	}

    clear() {
		if (this.editor == null) return;

		if (this.decorations?.length) {
			for (const d of this.decorations) {
                this.editor.setDecorations(d.decorationType, []);
			}
			this.decorations = undefined;
		}
    }
}