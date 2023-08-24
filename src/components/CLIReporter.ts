import { COVERAGE_TYPE, PInfo } from "./constants"
import { Coverage } from "./Coverage"
import CoverageHelper from "./CoverageHelper"
import CoverageReportProvider from "./CoverageReportProvider"
import Logger from "./Logger"


/**
 * - Generates coverage reports.
 */
export default class CLIReporter {
     
    private static _getActionMessageForReaction(pinfo: PInfo, flattenedKey: string) {
        let [covType, covReaction] = flattenedKey.split('_')
        if (covType === COVERAGE_TYPE.settle) {
            return `p${pinfo.id}: Promise never \`${covReaction}ed\`. @ ${pinfo.location}`
        } else if (covType === COVERAGE_TYPE.register) {
            return `p${pinfo.id}: No \`${covReaction}\` reaction registered. @ ${pinfo.location}`
        }  else { // if (covType === COVERAGE_TYPE.execute) {
            return `p${pinfo.id}: No \`${covReaction}\` reaction executed. @ ${pinfo.location}`
        }
    }

    static async generateReport(cov: Coverage): Promise<void> {
        const promiseMap = await cov.getPromiseMap()
        const functionsMap = await cov.getFunctionsMap()
        const coverageReport = CoverageReportProvider.getCoverageSummary(promiseMap, functionsMap)
        Logger.report(`Report for ${cov.projectPath()}`)
        Logger.report(`----------`)
        Logger.report(`Coverage Report:`)
        Logger.report(`${coverageReport}`)
                
        Logger.report(`----------`)
//         Logger.report(`Promise Report:`)
//         Object.values(promiseMap).forEach((pInfo: PInfo) => {
//             Logger.report(`    p${pInfo.id} - ${pInfo.type} @ ${pInfo.location}`)
//             const promiseCovStatus = CoverageHelper.getCoverageStatusForPromiseFlattened(pInfo)
//             const s = promiseCovStatus
//             const n = (v: any) => v === null ? 'N' : Number(v)
//             Logger.report(
// `    ${n(s.settle_fulfill)}${n(s.register_fulfill)}${n(s.execute_fulfill)}
//     ${n(s.settle_reject)}${n(s.register_reject)}${n(s.execute_reject)}`)
        
//             // const unCoveredCount = Object.values(promiseCovStatus).filter(v => v === false).length
//         })

//         Logger.report(`----------`)
        Logger.report(`Warns:`)       
        let warns: String[] = Object.values(promiseMap).flatMap((pInfo: PInfo) => {
            const promiseCovStatus = CoverageHelper.getCoverageStatusForPromiseFlattened(pInfo)
            // @ts-ignore
            return Object.keys(promiseCovStatus).filter((k: string) => promiseCovStatus[k] === false).map(k => CLIReporter._getActionMessageForReaction(pInfo, k))
        })
        warns.forEach(warn => {
            Logger.report(`    ${warn}`)
        })
    }


}