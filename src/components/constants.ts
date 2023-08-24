/**
 * if internal, will not execute the analysis and read the logs from logs folder.
 */
// FIXME: change for production
export const DEPLOY_ENV: 'production' | 'internal' = 'production'

export enum STORAGE_KEYS {
    NODEPROF_PATH = 'NODEPROF_PATH',
}

export enum TestFrameworkEnum {
    mocha = 'mocha',
    tap = 'tap'
}

export const COMMAND_IDS = {
    NEW_COVERAGE: 'jscope.new-coverage',
    MAIN_MENU_WEBVIEW: 'jscope.main-menu-webview',
    
    PEEK_MENU_REFERENCES: 'jscope.peek-references',
    PEEK_MENU_LINKS: 'jscope.peek-links',

    ANNOTATE_EDITOR: 'jscope.annotate-editor',
  };

export const ANALYSIS_PATHS = {
    ANALYSIS:  'instrumentation/analysis.js',
    NODEPROF_CMD:  'instrumentation/nodeprof.sh',
    FRAMEWORKS: {
        'mocha': 'instrumentation/runMocha.mjs',
        'tap':   'instrumentation/runTap.js',
    },
    TMP_LOG_DIR: '.__jscope__logs'
}

export enum P_TYPE {
    NewPromise = 'NewPromise',
    AsyncFunction = 'AsyncFunction',
    Await = 'Await',
    PromiseThen = 'PromiseThen',
    PromiseCatch = 'PromiseCatch',
    PromiseResolve = 'PromiseResolve',
    PromiseReject = 'PromiseReject',
    PromiseAll = 'PromiseAll',
    PromiseRace = 'PromiseRace',
}

export enum COVERAGE_TYPE {
    settle = 'settle',
    register = 'register',
    execute = 'execute',
}

export enum PROMISE_OUTCOME {
    fulfill = 'fulfill',
    reject = 'reject'
}

export enum LOG_TAGS {
    NEW_PROMISE = 'new-promise',
    SETTLEMENT = 'settle',
    REGISTER = 'register',
    EXECUTE = 'execute',
    INVOKE_FUN = 'function-invoke',
    ASYNC_FUNC_EXIT = 'async-function-exit',
    TRY_CATCH = 'try-catch',
    AWAIT = 'await',
    AWAIT_PRE = 'awaitPre',
  }

export enum CoverageGroupByEnum {
    file= 'file',
    promiseType = 'promiseType',
}

export type CoverageStatusType = {
    settle: {fulfill: null | boolean, reject: null | boolean},
    register: {fulfill: null | boolean, reject: null | boolean},
    execute: {fulfill: null | boolean, reject: null | boolean}
}

export type CoverageStatusTypeFlattened = {
    // Null: invalid, should not consider in total states.
    // True: covered
    // False: not covered.
    settle_fulfill: null | boolean, 
    settle_reject: null | boolean,
    register_fulfill: null | boolean, 
    register_reject: null | boolean,
    execute_fulfill: null | boolean, 
    execute_reject: null | boolean
}

export const CoverageStatusCount = 6; // all possible warnings in coverage

export type ID = string
export type Location = `${string}:${string}:${string}:${string}:${string}`
export type Pid = `p${number}`

export type PInfo = {
    id: ID,
    location: Location,
    iid: number,
    executorFids: string[], // promises created using a constructor have this field, points to the executor function.
    refs: {id: ID, location: Location}[],
    pids: Pid[],
    links: {id: ID, location: Location}[],
    parent: Pid,
    _parents: Pid[], // For debugging purposes
    type: P_TYPE,
    _types: P_TYPE[], // For debugging purposes
    code?: string,
    settle: {fulfill: any[], reject: any[]},
    register: {fulfill: any[], reject: any[]},
    execute: {fulfill: any[], reject: any[]},
    _logs: any[], // For debugging purposes
}

export type PMap = { [id: string]: PInfo; }

export type ReactionLogObj = {
    fid: string, 
    wrapperFid: string, 
    tag: LOG_TAGS,
    location?: Location,
    reaction: PROMISE_OUTCOME, 
    value: any, 
    path: string
}

export type TryCatchLogVal = {
    iid: number,
    location: Location,
    // wasExceptionalCtrlFlowObserved: boolean
}
