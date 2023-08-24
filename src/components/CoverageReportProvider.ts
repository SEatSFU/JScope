import { COVERAGE_TYPE, PROMISE_OUTCOME, P_TYPE } from './constants'
import CoverageHelper from './CoverageHelper';


export default class CoverageReportProvider {

    static getCoverageSummary(promiseMap: any, functionsMap: any) {
        const {coverage, stats} = CoverageReportProvider._getTotalCoverageReport(promiseMap);
        const types = CoverageReportProvider._getCoverageReportByType(promiseMap)
        const reportString = 
`
    ---
    coverage type:         %       (res, rej)
    Settlement coverage:   ${coverage['settlement-coverage']}%  (${stats.setResCnt}/${stats.setResTot}, ${stats.setRejCnt}/${stats.setRejTot})
    Registration coverage: ${coverage['registration-coverage']}%  (${stats.regResCnt}/${stats.regResTot}, ${stats.regRejCnt}/${stats.regRejTot})
    Execution coverage:    ${coverage['execution-coverage']}%  (${stats.execResCnt}/${stats.execResTot}, ${stats.execRejCnt}/${stats.execRejTot})
    ---
    Number of Async Objects: ${stats.pCnt}
`
// ${Object.keys(types)
//         .filter((k) => types[k] > 0 && k !=='pCnt')
//         .reduce((prev, cur) => `${prev}    ${cur}: ${types[cur]}\n`, '')
//     }`
        return reportString
    }

    private static _getCoverageReportByType(promiseMap: any) {
        const ptypesZero = Object.entries(P_TYPE).map(t => {
            const key = `${t[1]}`
            return [key, 0]
        })

        const coverageObj = {
            pCnt: 0,
            ...Object.fromEntries(ptypesZero),
        }
        Object.entries(promiseMap).forEach((p: any) => {
            const id = p[0]
            const val = p[1]

            coverageObj.pCnt++;
            const typeKey = `${val.type}`
            coverageObj[typeKey] += 1

        })
            
        return coverageObj
    }

    private static _getTotalCoverageReport(promiseMap: any) {
        const coverageObj = {
            pCnt: 0,
            setResCnt: 0,
            setRejCnt: 0,
            setResTot: 0,
            setRejTot: 0,

            regResCnt: 0,
            regRejCnt: 0,
            regResTot: 0,
            regRejTot: 0,

            execResCnt: 0,
            execRejCnt: 0,
            execResTot: 0,
            execRejTot: 0,
        }

        let exclude = CoverageHelper.ExcludeForType
        let reactionCov = CoverageHelper.coverageForReaction
        Object.entries(promiseMap).forEach((p: any) => {
            const id = p[0]
            const val = p[1]
            // const loc = process.argv.length > 2 ? val['location2'] : val['location2'].split('benchmark_projects')[1]

            coverageObj.pCnt++;

            coverageObj.setResCnt += +(!!reactionCov(val, COVERAGE_TYPE.settle, PROMISE_OUTCOME.fulfill))
            coverageObj.setRejCnt += +(!!reactionCov(val, COVERAGE_TYPE.settle, PROMISE_OUTCOME.reject))
            coverageObj.setResTot += +(!exclude['settle_fulfill'].includes(val.type))
            coverageObj.setRejTot += +(!exclude['settle_reject'].includes(val.type))

            coverageObj.regResCnt += +(!!reactionCov(val, COVERAGE_TYPE.register, PROMISE_OUTCOME.fulfill)) // TODO: Handle registration for linked promises in here!
            coverageObj.regRejCnt += +(!!reactionCov(val, COVERAGE_TYPE.register, PROMISE_OUTCOME.reject))
            coverageObj.regResTot += +(!exclude['register_fulfill'].includes(val.type))
            coverageObj.regRejTot += +(!exclude['register_reject'].includes(val.type))

            coverageObj.execResCnt += +(!!reactionCov(val, COVERAGE_TYPE.execute, PROMISE_OUTCOME.fulfill))
            coverageObj.execRejCnt += +(!!reactionCov(val, COVERAGE_TYPE.execute, PROMISE_OUTCOME.reject))
            coverageObj.execResTot += +(!exclude['execute_fulfill'].includes(val.type))
            coverageObj.execRejTot += +(!exclude['execute_reject'].includes(val.type))
        })
        return {
            coverage: {
                'promise-count': coverageObj.pCnt,
                'settlement-coverage': (100.0 * (coverageObj.setResCnt + coverageObj.setRejCnt) / (coverageObj.setResTot + coverageObj.setRejTot)).toFixed(2),
                'registration-coverage': (100.0 * (coverageObj.regResCnt + coverageObj.regRejCnt) / (coverageObj.regResTot + coverageObj.regRejTot)).toFixed(2),
                'execution-coverage': (100.0 * (coverageObj.execResCnt + coverageObj.execRejCnt) / (coverageObj.execResTot + coverageObj.execRejTot)).toFixed(2),
                'statement-coverage': '',
                'branch-coverage': '',
                'function-coverage': '',
            },
            stats: coverageObj
        }
    }

}