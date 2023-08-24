import { LOG_TAGS, P_TYPE, PROMISE_OUTCOME, ReactionLogObj, PMap, PInfo, Pid, ID, COVERAGE_TYPE, TryCatchLogVal } from './constants'
import LogParser from './LogParser'
import CoverageHelper from './CoverageHelper'
import { compactStringify, isObjectEmpty, objectFilter, trimFilePath } from './utils'
import Logger from './Logger'

/**
 * - Keeps Promise map, functions map and other coverage-related information
 *   about coverage for a specific workspace.
 */
export class Coverage {
    private _logPath: string
    private _logs: any[]
    private _promiseMap: PMap
    private _pidToIdMap: {[pid: string/*PID*/]: string} // used to reduce search time from O(n) to O(1) when adding reactions. Filled while adding promises.
    private _plinks: {[id: string/*ID*/]: Set<ID>} // used to show links, A -> B means that B is linked to A, so A will decide the fate of B.
    private _functionsMap: any
    private _projectPath: string
    private _projectName: string

    /**
     * 
     * @param path {string} points to the log file containing coverage output.
     */
    constructor(path?: string) {
        this._logPath = path || ''
        this._projectPath = '' 
        this._projectName = '' 
        this._promiseMap = {}
        this._pidToIdMap = {}
        this._plinks = {}
        this._logs = []
    }

    setProjectInfo(projectPath: string, projectName: string) {
        this._projectPath = projectPath
        this._projectName = projectName
        this._logs = this._cleanupLogs(this._logs)
    }

    projectPath() {
        return this._projectPath
    }

    clear() {
        this._logs = [];
        this._projectPath = '' 
        this._projectName = '' 
        this._promiseMap = {}
        this._pidToIdMap = {}
        this._plinks = {}
        this._functionsMap = {}
    }

    private async _getLogs() {
        if (!this._logs.length) this._logs = await LogParser.parseJsonLogs(this._logPath)
    }

    // returns the functions map based on the logs in filepath.
    async getFunctionsMap(): Promise<any> {
        let functionsMap: any = {}
        if (!!this._functionsMap) {
            functionsMap = this._functionsMap
        }
        else {
            await this._getLogs()
            this._logs.forEach(log => {
                if (log.tag === LOG_TAGS.INVOKE_FUN) {
                    functionsMap[log.fid] = { 
                        iid: log.iid, 
                        location: log.location, 
                        returnVal: log.returnVal,
                        // code: log.code 
                    }
                }
            })
        }
        
        return functionsMap
    }


    // returns a promise map based on the logs in filepath
    async getPromiseMap(
        config?: {query?: string, promiseTypes: string[], coverageType: string}
    ): Promise<PMap> {
        let promiseMap = {}
        if (Object.keys(this._promiseMap).length) {
            promiseMap = this._promiseMap
        }
        else {
            await this._getLogs()
            this._logs = this._cleanupLogs(this._logs)
            promiseMap = await this._addPromises(this._logs)
            // Logger.log(`pidToId Map: ${JSON.stringify(this._pidToIdMap, null, 2)}`)
            promiseMap = await this._addReactions(this._logs, promiseMap)
            // Logger.log(`links: ${JSON.stringify(this._plinks, null, 2)}`)
            let fidToPromiseMap = this._getFidToPromiseMap(promiseMap, this._pidToIdMap)
            promiseMap = await this._handleSpecialSettlementCases(this._logs, promiseMap, fidToPromiseMap)
            promiseMap = await this._addPromiseThenLinks(promiseMap, this._pidToIdMap)
            // function objMap(obj: any, func: any) {
            //     return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, func(v)]));
            // }
            // Logger.log(`links: ${compactStringify(objMap(this._plinks, (v: Set<string>) => Array.from(v)), {maxLength: 20})}`)
            promiseMap = await this._handleAsyncFunctionSettlements(this._logs, promiseMap)
            promiseMap = await this._handleAwaits(this._logs, promiseMap)
            promiseMap = await this._handleLinkedPromiseSettlements(promiseMap)
            
            this._promiseMap = promiseMap
            Logger.log(`> Promise map created: ${compactStringify(promiseMap, {maxLength: 200, indent: 2})}`)
        }
        
        // if(!!config?.query) {
        //     promiseMap = objectFilter(promiseMap, (val: any) => val['code'].includes(config.query))
        // }
        // if(!config?.promiseTypes.includes('all')) {
        //     promiseMap = objectFilter(promiseMap, (val: any) => config?.promiseTypes.includes(val['type']))
        // }
        return promiseMap
    }

    private _cleanupLogs(_logs: any[]): any[] {
        return _logs.map((log) => {
            if (log.location) {
                log.location = trimFilePath(log.location)
                
                let relativePathStartInd = log.location.indexOf(`/${this._projectName}/`) + this._projectName.length + 1
                log.location = this._projectPath + log.location.substring(relativePathStartInd)
            }
            return log
        })
    }

    private getIdByPid(pid: Pid): string {
        return this._pidToIdMap[pid]
    }

    /**
     * 
     * @param {*} logs 
     * @param {*} promiseList 
     * @returns {PromiseInfo[]} 
     * Returns a list of promise infor objects identified by "new-promise" tag
     */
    private async _addPromises(logs: any[]): Promise<PMap> {
        
        let promiseMap: PMap = {} // {[id: number]: PInfo}
        logs.reduce((counter, log) => {
            if (log.tag === LOG_TAGS.NEW_PROMISE) {
                if(
                    log.location.includes('test') 
                    || log.location.includes('spec')
                    ) return counter + 1;
                let id = log.iid // HERE the key identifier for promises is decided between {defLocation}✔️ | {defLocation + refs[0]} | {defLocation + refs}
                
                if(promiseMap.hasOwnProperty(id)) {
                    promiseMap[id].pids.push(log.cid)
                    promiseMap[id]._parents.push(log.base && log.base.__cid ? log.base.__cid : null)
                    promiseMap[id]._types.push(log.ftype)
                    if(log.executorFid) promiseMap[id].executorFids.push(log.executorFid)
                    // promiseMap[id]._logs.push(log)
                } else if(this.getIdByPid(log.cid) && this.getIdByPid(log.cid) !== id) {
                    // cases for adding to refs. Where cid exists(in pidToIdMap), 
                    // but doesn't match with its corresponding iid, then it is being returned to other places.
                    // TODO: test with benchmarks.
                    promiseMap[this.getIdByPid(log.cid)].refs.push({id, location: log.location})
                    // promiseMap[this.getIdByPid(log.cid)]._logs.push(log)
                } else {
                    promiseMap[id] = {
                        id: id,
                        location: log.location,
                        iid: log.iid,
                        executorFids: log.executorFid ? [log.executorFid] : [],
                        refs: [],
                        pids: [log.cid],
                        links: [],
                        parent: log.base && log.base.__cid ? log.base.__cid : null,
                        _parents: [log.base && log.base.__cid ? log.base.__cid : null],
                        type: log.ftype,
                        _types: [log.ftype],
                        code: log.code,
                        settle: {
                            fulfill: [],
                            reject: [],
                        },
                        register: {
                            fulfill: [],
                            reject: [],
                        },
                        execute: {
                            fulfill: [],
                            reject: [],
                        },
                        _logs: [],//[log],
                    }
                }

                // Only the first occurance in log is linked here, which is the first place that a promise is created.
                if(!this.getIdByPid(log.cid)) {
                    this._pidToIdMap[log.cid] = id
                }
            }
            return counter + 1
        }, 0)
        return promiseMap
    }

    private async _addReactions(logs: any[], promiseMap: PMap) {
        logs.forEach(log => {
            // Used to keep the same structure for all reactions.
            let logReactionTag: COVERAGE_TYPE = log.tag
            let logVal: ReactionLogObj = {
                fid: log.fid, 
                wrapperFid: log.wrapperFid, 
                tag: log.tag, 
                reaction: log.reaction, 
                value: log.value, 
                path: `${log.fid}`
            }
            
            if ([LOG_TAGS.REGISTER, LOG_TAGS.EXECUTE].includes(log.tag)) { 
                let id = this.getIdByPid(log.p.__cid)
                if (promiseMap.hasOwnProperty(id)) {
                    promiseMap[id][logReactionTag][logVal.reaction].push(logVal)
                    let curr_cid = log.p.__cid
                    let prefix = ''
                    let curr_key = this.getIdByPid(curr_cid)
                    while (promiseMap.hasOwnProperty(curr_key) && promiseMap[curr_key].parent) {
                        prefix = `${curr_key}>${prefix}`
                        curr_cid = promiseMap[curr_key].parent
                        curr_key = this.getIdByPid(curr_cid)
                        if (promiseMap[curr_key]) {
                            promiseMap[curr_key][logReactionTag][logVal.reaction].push({...logVal, path: `${prefix}${log.fid}`})
                        }
                    }
                } else {
                    // console.error(`trying to access a non-existing promise with cid=${log.p.__cid}`)
                }
            }
            else if ([LOG_TAGS.SETTLEMENT].includes(log.tag)) { 
                let pid: Pid = `p${log.cid}`
                if (promiseMap[this.getIdByPid(pid)]) {
                    
                    // promise is settled with another promise
                    if(logVal.value?.hasOwnProperty && logVal.value?.hasOwnProperty('__cid') && 
                        !promiseMap[this.getIdByPid(pid)].links.some(v => v.id === this.getIdByPid(logVal.value.__cid))) {

                        let linkedToId = this.getIdByPid(logVal.value.__cid)
                        promiseMap[this.getIdByPid(pid)].links.push({id: linkedToId, location: promiseMap[linkedToId]?.location || ""})
                        if(linkedToId) {
                            if (!this._plinks[linkedToId]) this._plinks[linkedToId] = new Set<string>()
                            this._plinks[linkedToId].add(this.getIdByPid(pid).toString()) 
                        }
                    }
                    else {
                        // If not a promise linking, then settlement takes effect
                        promiseMap[this.getIdByPid(pid)][logReactionTag][logVal.reaction].push(logVal)
                    }
                } else {
                    // console.error(`trying to access a non-existing promise with cid=${log.p.__cid}`)
                }
            }
        })
        return promiseMap
    }

    private async _addPromiseThenLinks(promiseMap: PMap, pidToIdMap: any): Promise<PMap> {
        let functionsMap = await this.getFunctionsMap()
        Object.keys(promiseMap).forEach(keyId => {
            let pInfo = promiseMap[keyId]
            if(!pInfo.parent) return;
            
            
            let fulfillFids = pInfo.settle.fulfill.map(fulfillFunc => fulfillFunc.fid)
            fulfillFids.map(fid => {
                
                const returnVal = functionsMap[fid].returnVal
                // Means .then returns a promise, so it is linked to .then
                if(returnVal.hasOwnProperty('__cid')) {
                    let returnValId = pidToIdMap[returnVal.__cid]
                    if(!returnValId) return
                    promiseMap[keyId].links.push({id: returnValId, location: promiseMap[returnValId]?.location || ""})
                    if (!this._plinks[returnValId]) this._plinks[returnValId] = new Set<string>()
                    this._plinks[returnValId].add(keyId)
                }
            })
        })
        return promiseMap
    }

    private async _handleLinkedPromiseSettlements(promiseMap: PMap): Promise<PMap> {
        Object.keys(this._plinks).forEach((key: ID) => {
            let linkedTo = key
            let links: Set<string> = this._plinks[key]
            links.forEach(linked => {
                promiseMap[linked].settle.fulfill = [...promiseMap[linked].settle.fulfill, ...promiseMap[linkedTo].settle.fulfill]
                promiseMap[linked].settle.reject = [...promiseMap[linked].settle.reject, ...promiseMap[linkedTo].settle.reject]
            })
            
        })
        return promiseMap
    }

    private async _handleAwaits(logs: any[], promiseMap: any): Promise<any> {
        const tryCatchBlocksMap = new Map<number, TryCatchLogVal>()
        logs.forEach((log: any) => {
            if ([LOG_TAGS.TRY_CATCH].includes(log.tag)) {
                tryCatchBlocksMap.set(log.iid, {
                    iid: log.iid,
                    location: log.location
                })
            }
        })
        
        logs.forEach(log => {
            // if awaitPre was observed: registerFulfillReaction
            // if awaitPost was observed executeFulfillReaction
            if ([LOG_TAGS.AWAIT_PRE].includes(log.tag) || [LOG_TAGS.AWAIT_PRE].includes(log.warn) ||
                [LOG_TAGS.AWAIT].includes(log.tag) || [LOG_TAGS.AWAIT].includes(log.warn)) { 
                if(!(log.isPromise && log.valAwaited.__cid)) return // not awaiting a promise val.
                
                let logVal: ReactionLogObj = {
                    fid: log.fid,
                    wrapperFid: log.wrapperFid, 
                    location: log.location,
                    tag: log.tag, // Use this to later address this type.
                    reaction: PROMISE_OUTCOME.fulfill, 
                    value: log.result,
                    path: `${log.iid}`
                }

                let id = this.getIdByPid(log.valAwaited.__cid)
                if (promiseMap.hasOwnProperty(id)) {
                    const isInsideSomeTryCatchBlock = Array.from(tryCatchBlocksMap.values()).find(
                        (tryBlock) => CoverageHelper.isInsideBlock(log.location, tryBlock.location)
                    )

                    let rejected = log.rejected || false
                    this._addAwaitToReactionsForPromise(promiseMap, id, logVal, isInsideSomeTryCatchBlock, rejected)
                    
                    let curr_cid = log.valAwaited.__cid
                    let prefix = ''
                    let curr_key = this.getIdByPid(curr_cid)
                    while (promiseMap.hasOwnProperty(curr_key) && promiseMap[curr_key].parent) {
                        prefix = `${curr_key}>${prefix}`
                        curr_cid = promiseMap[curr_key].parent
                        curr_key = this.getIdByPid(curr_cid)
                        if (promiseMap[curr_key]) {
                            this._addAwaitToReactionsForPromise(promiseMap, curr_key, logVal, isInsideSomeTryCatchBlock, rejected, prefix)
                        }
                    }
                } else {
                    // console.error(`trying to access a non-existing promise with cid=${log.p.__cid}`)
                }
            }
        })
        return promiseMap
    }

    private _addAwaitToReactionsForPromise(
        promiseMap: PMap, 
        id: ID, 
        logVal: ReactionLogObj, 
        isInsideSomeTryCatchBlock: TryCatchLogVal | undefined, 
        rejected: boolean, 
        pathPrefix: string = '') 
    {
        if(logVal.tag === LOG_TAGS.AWAIT_PRE) {
            promiseMap[id].register.fulfill.push({...logVal, path: `${pathPrefix}${logVal.path}`})
        } else if (logVal.tag === LOG_TAGS.AWAIT) {
            let settlement = rejected ? PROMISE_OUTCOME.reject : PROMISE_OUTCOME.fulfill
            promiseMap[id].settle[settlement].push({...logVal, path: `${pathPrefix}${logVal.path}`})
            promiseMap[id].execute.fulfill.push({...logVal, path: `${pathPrefix}${logVal.path}`})
        }

        if (isInsideSomeTryCatchBlock) {
            // Logger.log(`isInside a try/catch block ${JSON.stringify(logVal)}, ${JSON.stringify(isInsideSomeTryCatchBlock)}`)
            let tryCatchLogVal: ReactionLogObj = {
                ...logVal, 
                tag: LOG_TAGS.TRY_CATCH,
                location: isInsideSomeTryCatchBlock.location,
                reaction: PROMISE_OUTCOME.reject, 
                path: `${pathPrefix}${isInsideSomeTryCatchBlock.iid}`
            }
            promiseMap[id].register.reject.push(tryCatchLogVal)
            // if awaitPost && awaitPost.rejected and inside a try/catch block, means error was caught.
            if(rejected) {
                promiseMap[id].execute.reject.push(tryCatchLogVal)
            }
        }
    }

    // To handle settlements for special cases in chains.
    private async _handleSpecialSettlementCases(logs: any[], promiseMap: any, fidToPromiseMap: Map<string, string[]>) {
        
        logs.forEach((log: any) => {
            let logVal: ReactionLogObj = {
                fid: log.fid, 
                wrapperFid: log.wrapperFid, 
                tag: log.tag, 
                reaction: log.reaction, 
                value: log.value, 
                path: `${log.fid}`
            }
            
            if ([LOG_TAGS.INVOKE_FUN].includes(log.tag) && log.warn === 'function exited') {
                // Logger.log(`log of func invoke: ${JSON.stringify(log, null, 2)}`)
                if(!isObjectEmpty(log.exception)) {
                    let promiseForThisExecutorFunction: any = Object.values(promiseMap).find((pInfo: any) => pInfo.executorFids.includes(log.fid))                
                    if (promiseForThisExecutorFunction)
                        promiseMap[promiseForThisExecutorFunction.id]['settle'][PROMISE_OUTCOME.reject].push(logVal)
                }

                if(!fidToPromiseMap.has(log.fid)) return;
                // @ts-ignore
                fidToPromiseMap.get(log.fid).map((key: string) => {
                    // Logger.log(`adding settle reaction to this key: ${key} : ${JSON.stringify(promiseMap[key])}, logVal: ${JSON.stringify(logVal)}`)
                    if(isObjectEmpty(log.exception))
                        promiseMap[key]['settle'][PROMISE_OUTCOME.fulfill].push(logVal)
                    else
                        promiseMap[key]['settle'][PROMISE_OUTCOME.reject].push(logVal)

                    if(logVal.value?.hasOwnProperty && log.returnVal.hasOwnProperty('__cid') && 
                        !promiseMap[key].links.some((v: any) => v.id === this.getIdByPid(log.returnVal.__cid))) {
                        let linkedToId = this.getIdByPid(log.returnVal.__cid)
                        if(linkedToId) {
                            promiseMap[key].links.push({id: linkedToId, location: promiseMap[linkedToId]?.location || ""})
                            if (!this._plinks[linkedToId]) this._plinks[linkedToId] = new Set<string>()
                            this._plinks[linkedToId].add(key)
                        }
                    }
                })    
            }
        })
        return promiseMap
    }

    private async _handleAsyncFunctionSettlements(logs: any[], promiseMap: PMap) {
        logs.forEach((log: any) => {
            if ([LOG_TAGS.ASYNC_FUNC_EXIT].includes(log.tag)) {
                if(!log.result || !log.result.__cid) return 

                let logVal: ReactionLogObj = {
                    fid: log.iid, 
                    wrapperFid: log.wrapperFid, 
                    tag: LOG_TAGS.SETTLEMENT, 
                    reaction: log.isException ? PROMISE_OUTCOME.reject : PROMISE_OUTCOME.fulfill, 
                    location: log.location,
                    value: log.returnVal, 
                    path: `${log.iid}`
                }
                let key = this.getIdByPid(log.result.__cid)
                promiseMap[key]?.settle[logVal.reaction].push(logVal)
            }
        })
        return promiseMap
    }

    private _getFidToPromiseMap(promiseMap: any, cidToIdMap: any): Map<string, string[]> {
        // go through promises, if they have parents, check their parent objects, 
        // then in their parents(with their own type), if there is any reaction registered with their type(fulfill for then, reject for catch, etc.) add the fid->pid pair to the map
        let fidToPromiseMap: Map<string, string[]> = new Map()
        Object.keys(promiseMap).forEach(keyId => {
            let pInfo = promiseMap[keyId]
            if(!pInfo.parent) return;
            
            let reaction = undefined
            if(pInfo.type === P_TYPE.PromiseThen) reaction = PROMISE_OUTCOME.fulfill
            else if(pInfo.type === P_TYPE.PromiseCatch) reaction = PROMISE_OUTCOME.reject
            
            if(!reaction) return;
            let parentInfo = promiseMap[cidToIdMap[pInfo.parent]]
            if(!parentInfo) return;
            parentInfo['register'][reaction].forEach((logVal: ReactionLogObj) => {
                // @ts-ignore
                let prev = fidToPromiseMap.get(logVal.fid)
                if(!prev) prev = []
                if(!logVal.path.startsWith(keyId))
                    prev.push(keyId)
                fidToPromiseMap.set(logVal.fid, prev)
            });
        })

        // function replacer(key: any, value: any) {
        //     if(value instanceof Map) {
        //         return {
        //         dataType: 'Map',
        //         value: Array.from(value.entries()), // or with spread: value: [...value]
        //         };
        //     } else {
        //         return value;
        //     }
        // }
        // Logger.log(`fidToPromiseMap: ${JSON.stringify(fidToPromiseMap, replacer, 2)}`)
        return fidToPromiseMap
    }

}