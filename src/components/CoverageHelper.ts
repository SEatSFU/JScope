import * as vscode from 'vscode'
import { CoverageStatusType, CoverageStatusTypeFlattened, COVERAGE_TYPE, PInfo, PROMISE_OUTCOME, P_TYPE, ReactionLogObj } from "./constants"
import Logger from "./Logger"
import { convertLocationToUriAndRange } from './vscode-utils'

export default class CoverageHelper {
    // FIXME: DEPRECATED.
    static getCoverageStatusForPromise(item: any): CoverageStatusType {
        // TODO: take into account semantics of promises as well.
        
        let cov = {
            settle: {
                fulfill: ([P_TYPE.PromiseReject].includes(item.type) ? null : !!item['settle']['fulfill'].length),
                reject: ([P_TYPE.PromiseCatch, P_TYPE.PromiseResolve].includes(item.type) ? null : !!item['settle']['reject'].length)
            },
            register: {
                fulfill: ([P_TYPE.PromiseCatch, P_TYPE.PromiseReject, P_TYPE.PromiseThen].includes(item.type) ? null : !!item['register']['fulfill'].length),
                reject: ([P_TYPE.PromiseCatch, P_TYPE.PromiseReject, P_TYPE.PromiseResolve].includes(item.type) ? null : !!item['register']['reject'].length)
            },
            execute: {
                fulfill: ([P_TYPE.PromiseCatch, P_TYPE.PromiseReject, P_TYPE.PromiseThen].includes(item.type) ? null : !!item['execute']['fulfill'].length),
                reject: ([P_TYPE.PromiseCatch, P_TYPE.PromiseReject, P_TYPE.PromiseResolve].includes(item.type) ? null : !!item['execute']['reject'].length)
            },
        }
        return cov
    }

    static ExcludeForType: {[id: string]: Array<string>} = {
        settle_fulfill: [P_TYPE.PromiseReject],
        settle_reject: [P_TYPE.PromiseCatch, P_TYPE.PromiseResolve],
        register_fulfill: [P_TYPE.PromiseCatch, P_TYPE.PromiseReject, P_TYPE.PromiseThen],
        register_reject: [P_TYPE.PromiseCatch, P_TYPE.PromiseResolve],
        execute_fulfill: [P_TYPE.PromiseCatch, P_TYPE.PromiseReject, P_TYPE.PromiseThen],
        execute_reject: [P_TYPE.PromiseCatch, P_TYPE.PromiseResolve]
    }
    static coverageForReaction(p: any, type: COVERAGE_TYPE, fulfillOrReject: PROMISE_OUTCOME) : any {
        return CoverageHelper.ExcludeForType[`${type}_${fulfillOrReject}`].includes(p.type) ? null : !!p[type][fulfillOrReject].length
    }

    static getCoverageStatusForPromiseFlattened(item: any): CoverageStatusTypeFlattened {
        let reactionCov = CoverageHelper.coverageForReaction
        let cov = {
            settle_fulfill: reactionCov(item, COVERAGE_TYPE.settle, PROMISE_OUTCOME.fulfill),
            settle_reject: reactionCov(item, COVERAGE_TYPE.settle, PROMISE_OUTCOME.reject),
            register_fulfill: reactionCov(item, COVERAGE_TYPE.register, PROMISE_OUTCOME.fulfill),
            register_reject: reactionCov(item, COVERAGE_TYPE.register, PROMISE_OUTCOME.reject),
            execute_fulfill: reactionCov(item, COVERAGE_TYPE.execute, PROMISE_OUTCOME.fulfill),
            execute_reject: reactionCov(item, COVERAGE_TYPE.execute, PROMISE_OUTCOME.reject),
        }
        return cov
    }

    static getReactionFunctionLocation(coverageType: COVERAGE_TYPE, reaction: ReactionLogObj, functionsMap: any) {
        // Logger.log(`ctype: ${coverageType}, reaction: ${reaction.reaction}, fid: ${reaction.fid}, wrapperFid: ${reaction.wrapperFid}`)
        if(reaction.location) {
            return reaction.location
        }
        if(['register'].includes(coverageType))
            return functionsMap[reaction.wrapperFid]?.location
        return functionsMap[reaction.fid]?.location
    }
    
    static isInsideBlock(innerLocation: string, outerLocation: string) {
        let coordsInner = innerLocation.replace(/\)|\(/g, '').split(':')
        let coordsOuter = outerLocation.replace(/\)|\(/g, '').split(':')
        if (!(coordsInner.length === coordsOuter.length && coordsOuter.length === 5)) {
            console.error('error parsing locations', innerLocation, outerLocation)
            return false
        }
        let isFileNameEqual = coordsInner[0] === coordsOuter[0]
        let isAfterStart =
            parseInt(coordsInner[1]) > parseInt(coordsOuter[1]) ||
            (parseInt(coordsInner[1]) === parseInt(coordsOuter[1]) && parseInt(coordsInner[2]) > parseInt(coordsOuter[2]))
        let isBeforeEnd =
            parseInt(coordsInner[3]) < parseInt(coordsOuter[3]) ||
            (parseInt(coordsInner[3]) === parseInt(coordsOuter[3]) && parseInt(coordsInner[4]) < parseInt(coordsOuter[4]))
        // console.log(isFileNameEqual, isAfterStart, isBeforeEnd)
        return isFileNameEqual && isAfterStart && isBeforeEnd
    }

    static *filterForMapValues(iterable: any[], predicate: Function) {
        var i = 0;
        for (var item of iterable) {
            if (predicate(item))
                yield item;
        }
    }

    static requiredReactions(coverage: COVERAGE_TYPE, ptype: P_TYPE): PROMISE_OUTCOME[] {
        if([COVERAGE_TYPE.execute, COVERAGE_TYPE.register].includes(coverage)) {
            if([P_TYPE.PromiseReject, P_TYPE.PromiseThen].includes(ptype))
                return [PROMISE_OUTCOME.reject]
            else if(ptype === P_TYPE.PromiseCatch)
                return []
            else if([P_TYPE.PromiseResolve].includes(ptype))
                return [PROMISE_OUTCOME.fulfill]
            return [PROMISE_OUTCOME.fulfill, PROMISE_OUTCOME.reject]
        }
        else {// settlement
            if([P_TYPE.PromiseReject].includes(ptype))
                return [PROMISE_OUTCOME.reject]
            else if(ptype === P_TYPE.PromiseCatch) // we don't semantically want to see promiseCatch throw errors.
                return [PROMISE_OUTCOME.fulfill]
            else if([P_TYPE.PromiseResolve].includes(ptype))
                return [PROMISE_OUTCOME.fulfill]
            return [PROMISE_OUTCOME.fulfill, PROMISE_OUTCOME.reject]
        }
    }
}