import * as vscode from 'vscode'
import Logger from './Logger';
import { convertLocationToUriAndRange } from './vscode-utils';

export default class PeekView {

    static openLinks(promiseInfo: any) {
        // reduced version of promiseInfo, only contains location and links.
        // /**
        //  *  uri - The text document in which to start
        //     position - The position at which to start
        //     locations - An array of locations.
        //     multiple - Define what to do when having multiple results, either peek, gotoAndPeek, or `goto
        //  */
        let {uri: baseUri, range: baseRange} = convertLocationToUriAndRange(promiseInfo.location)
        const locations: vscode.Location[] = PeekView._getUniqueLocations(
            promiseInfo.links.map(
                (l: {id: string, location: string}) => l.location
            )
        )
        vscode.commands.executeCommand(
            'editor.action.peekLocations', 
            baseUri, 
            baseRange.end, 
            locations, 
            'peek',
            'No actions required.'
        )
    }

    static openReferences(promiseInfo: any) {
        // reduced version of promiseInfo, only contains location and refs.
        // /**
        //  *  uri - The text document in which to start
        //     position - The position at which to start
        //     locations - An array of locations.
        //     multiple - Define what to do when having multiple results, either peek, gotoAndPeek, or `goto
        //  */
        let {uri: baseUri, range: baseRange} = convertLocationToUriAndRange(promiseInfo.location)
        const locations: vscode.Location[] = PeekView._getUniqueLocations(
            promiseInfo.refs.map(
                (l: {id: string, location: string}) => l.location
            )
        )
        vscode.commands.executeCommand(
            'editor.action.peekLocations', 
            baseUri, 
            baseRange.end, 
            locations, 
            'peek',
            'No actions required.'
        )
    }

    private static _getUniqueLocations(locs: string[]): vscode.Location[] {
        let seenBefore = new Set<string>()
        let locations: vscode.Location[] = []
        locations = locs.reduce((prev: any, item: string) => {
            if(seenBefore.has(item)) return prev
            seenBefore.add(item)
            const {uri, range} = convertLocationToUriAndRange(item)
            return [...prev, new vscode.Location(uri, range)]
        }, locations)
        return locations
    }
}