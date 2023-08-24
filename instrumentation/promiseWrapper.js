// DO NOT INSTRUMENT

const { PROMISE_TYPES, minimizePromise } = require('./helper.js')
const logger = require('./logger.js')

const noop = (v) => v
global.__cid = 1
global.__fid = 1
// maybe create a mapping for each fid to its corresponding function and log it somewhere?

function PromiseWrapper(p, ptype, cid, executorFid) {
  logger.debug('call to PromiseWrapper', {
    tag: 'PromiseWrapper',
    global_cid: __cid,
    cid: cid,
    executorFid: executorFid,
    ptype: ptype,
    p: minimizePromise(p),
  })
  if(!ptype) {
    ptype = PROMISE_TYPES.NewPromise
  }
  if(!cid) {
    cid = __cid++
  }
  if(!p.__cid) p.__cid = `p${cid}`
  if(executorFid && !p.__executorFid) p.__executorFid = executorFid
  let realThen = p.then
  
  const fidForThenWrapper = `f${__fid++}`
  function __thenWrapper(onFulfill, onReject) {
    let fulFillWrapper = undefined
    let rejectWrapper = undefined
    if(!!onFulfill) {
      if(!onFulfill.__fid) onFulfill.__fid = `f${__fid++}`
      try {
        var a = {}; a.undef();
      } catch (e) {
        let stackTrace = e.stack
        logger.warn('registering fulfill reaction', {
          tag: 'register',
          reaction: 'fulfill',
          fid: onFulfill.__fid,
          wrapperFid: fidForThenWrapper,
          // f: onFulfill.toString(),
          // fname: onFulfill.name,
          p: minimizePromise(p),
          // stackTrace: stackTrace
        })
      }
      
      fulFillWrapper = (v) => {
        try {
          var a = {}; a.undef();
        } catch (e) {
          let stackTrace = e.stack
          logger.warn('executing fulfill reaction', {
            tag: 'execute',
            reaction: 'fulfill',
            fid: onFulfill.__fid,
            wrapperFid: fidForThenWrapper,
            // f: onFulfill.toString(),
            // fname: onFulfill.name,
            p: minimizePromise(p),
            // stackTrace
          })
        }
        return typeof onFulfill === 'function' ? onFulfill(v) : noop(v);
      }
      fulFillWrapper.__fid = onFulfill.__fid
    }
    if(!!onReject && !onReject.__fid) {
      if(!onReject.__fid) onReject.__fid = `f${__fid++}`
      try {
        var a = {}; a.undef();
      } catch (e) {
        let stackTrace = e.stack
        logger.warn('registering reject reaction', {
          tag: 'register',
          reaction: 'reject',
          fid: onReject.__fid,
          wrapperFid: fidForThenWrapper,
          // f: onReject.toString(),
          // fname: onReject.name,
          p: minimizePromise(p),
          // stackTrace,
        })
      }
      rejectWrapper = (e) => {
        try {
          var a = {}; a.undef();
        } catch (e) {
          // let stackTrace = e.stack
          logger.warn('executing reject reaction', {
            tag: 'execute',
            reaction: 'reject',
            fid: onReject.__fid,
            wrapperFid: fidForThenWrapper,
            f: onReject.toString(),
            // fname: onReject.name,
            p: minimizePromise(p),
            // stackTrace,
          })
        }
        return typeof onReject === 'function' ? onReject(e) : noop(e);
      }
      rejectWrapper.__fid = onReject.__fid
    }
    else {
      rejectWrapper = onReject
    }
    return PromiseWrapper(realThen.call(p, fulFillWrapper, rejectWrapper), PROMISE_TYPES.PromiseThen, __cid++)
  }
  __thenWrapper.__fid = fidForThenWrapper

  realCatch = p.catch
  const fidForCatchWrapper = `f${__fid++}`
  function __catchWrapper(onReject) {
    if(!!onReject) {
      if(!onReject.__fid) onReject.__fid = `f${__fid++}`
      try {
        var a = {}; a.undef();
      } catch (e) {
        let stackTrace = e.stack
        logger.warn('registering reject reaction', {
          tag: 'register',
          reaction: 'reject',
          fid: onReject.__fid,
          wrapperFid: fidForCatchWrapper,
          // f: onReject.toString(),
          // fname: onReject.name,
          p: minimizePromise(p),
          // stackTrace,
        })
      }
      rejectWrapper = (e) => {
        try {
          var a = {}; a.undef();
        } catch (e) {
          let stackTrace = e.stack
          logger.warn('executing reject reaction', {
            tag: 'execute',
            reaction: 'reject',
            fid: onReject.__fid,
            wrapperFid: fidForCatchWrapper,
            f: onReject.toString(),
            // fname: onReject.name,
            p: minimizePromise(p),
            // stackTrace,
          })
        }
        return onReject(e);
      }
      rejectWrapper.__fid = onReject.__fid
    }
    return PromiseWrapper(realThen.call(p, undefined, rejectWrapper), PROMISE_TYPES.PromiseCatch, __cid++)
  }
  __catchWrapper.__fid = fidForCatchWrapper
  
  if(!p.__coverage_wrapped) {
    logger.debug('wrapping an unwrapped promise', {
      tag: 'wrap-assign',
      f: __thenWrapper,
      cid: __cid,
      p,
      str: p.toString(),
      ptype: ptype,
    })
    p.then = __thenWrapper
    p.catch = __catchWrapper
    p.__coverage_wrapped = true
    // p.catch = catchWrapper
    // p.race = raceWrapper
  }
  if(ptype && !p.__ptype) {
    p.__ptype = ptype
  }
  return p
}

function UpdateWrappedPromiseType(p, type) {
  logger.debug('call to updatePType', {
    p,
    type,
  })
  if(p.__coverage_wrapped) {
    // logger.warn('updating promise type', {
    // })
    p.__ptype = type
  }
}


let promiseWrapperHandlers = {
  construct: function(target, args) {    
    // This works for new Promise, Promise.all, Promise.race, Promise.resolve, Promise.reject
    // Promise.all and Promise.race both create promises under the hood, so they call constructor.
    // console.log('constructor', this, JSON.stringify(args))
    const currentCid = __cid++
    let originalCb = args[0]
    originalCb.__fid = `f${__fid++}`
    if(typeof args[0] === 'function'){ 
      
      let wrappedCb = function() {
        let resFn = arguments[0] || (() => {})
        if(!resFn.__fid) resFn.__fid = `f${__fid++}`
        let wrappedResolve = function(v) { 
          try {
            var a = {}; a.undef();
          } catch (e) {
            let stackTrace = e.stack
            logger.warn('fulfilling promise', {
              tag: 'settle',
              reaction: 'fulfill',
              cid: currentCid,
              fid: resFn.__fid,
              value: v && v.__coverage_wrapped ? minimizePromise(v) : 'N/A',
              // fn: resFn.toString(),
              // fnname: resFn.name,
              // stackTrace,
            })
          }
          return resFn(v);
        }
        wrappedResolve.__fid = resFn.__fid

        let rejFn = arguments[1] || (() => {})
        if(!rejFn.__fid) rejFn.__fid = `f${__fid++}`
        let wrappedReject = function(err){
          try {
            var a = {}; a.undef();
          } catch (e) {
            let stackTrace = e.stack
            logger.warn('rejecting promise', {
              tag: 'settle',
              reaction: 'reject',
              cid: currentCid,
              fid: rejFn.__fid,
              value: err && err.__coverage_wrapped ? minimizePromise(err) : 'N/A',
              // fn: rejFn.toString(),
              // fnname: rejFn.name,
              // stackTrace,
            })
          }
          return rejFn(err);
        }
        wrappedReject.__fid = rejFn.__fid

        return originalCb(wrappedResolve, wrappedReject)
      }
      args[0] = wrappedCb
    }
    
    
    let p = new target(...args)
    return PromiseWrapper(p, undefined, currentCid, originalCb.__fid)
  },
  get: function(target, prop, receiver) {
    // For capturing Promise.resolve, Promise.reject
    // console.log('get', prop, receiver)
    if(['resolve', 'reject', 'all', 'race'].includes(prop)) {
      const origMethod = target[prop];
      function wrapper(...args) {
          let result = origMethod.apply(this, args);
          const ptype = 
            prop === 'resolve' ? PROMISE_TYPES.PromiseResolve 
            : prop === 'reject' ? PROMISE_TYPES.PromiseReject
            : prop === 'all' ? PROMISE_TYPES.PromiseAll
            : prop === 'race' ? PROMISE_TYPES.PromiseRace : PROMISE_TYPES.NewPromise
            
          // console.log('+++ ' + ptype + JSON.stringify(args)
          //     + ' -> ' + JSON.stringify(result));
          UpdateWrappedPromiseType(result, ptype)
          return result
      };
      wrapper.__fid = `f${__fid++}`
      return wrapper
    }
    const value = Reflect.get(target, prop, receiver)
    // if (typeof value === 'function') {
    //   return value.bind(target);
    // } 
    return value
  }
}

var RealPromise = Promise
// Promise = new Proxy(RealPromise, promiseWrapperHandlers)

module.exports = {
  Promise: new Proxy(RealPromise, promiseWrapperHandlers),
  PromiseWrapper: PromiseWrapper
}