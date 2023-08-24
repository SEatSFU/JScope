// DO NOT INSTRUMENT
// DO NOT INSTRMENT
const helper = require('./helper.js')
const { PromiseWrapper } = require('./promiseWrapper.js')
const { Utils } = require('./utils.js')
// const { SMemory } = require('./analyses/SMemory')
const logger = require('./logger.js');

const PROMISE_TYPES = helper.PROMISE_TYPES

;(function(sandbox) {
  function RuntimeAnalysis() {
    /////////////////
    // LOCAL
    // VARIABLES
    /////////////////
    
    // just to keep the values from functionExit and log them in asyncFunctionExit.
    // must have a max length of 1 at all times.
    asyncFuncStack = []

    awaitToValMap = new Map() // iid->valAwaited
    let promiseSeq = 0 // promise sequence, used for generating incremental id for promises.

    /////////////////
    // START
    // OF
    // ANALYSIS
    /////////////////


    /** @type {Utils} */
    var utils = sandbox.utils
    // /** @type {SMemory} */
    // var smemory = sandbox.smemory

    var functionsMap = {}

    /**
     * These callbacks are called before and after a function, method, or constructor invocation.
     **/
    this.invokeFunPre = function(iid, f, base, args, isConstructor, isMethod, functionIid, functionSid) {
      for (let i = 0; i < args.length; i++) {
        if(args[i] && args[i].__fid) {
          let func = args[i]
          logger.debug('invoke function - args', {
            iid,
            tag: 'function-invoke', // if there are different cases for this, create a new tag.
            index: i,
            fid: func.__fid,
            location: J$.iidToLocation(iid),
            code: J$.iidToCode(iid),
            f: func,
          })
        }
      }
      return { f: f, base: base, args: args, skip: false }
    }
    this.invokeFun = function(iid, f, base, args, result, isConstructor, isMethod, functionIid, functionSid) {
      
      try {

        if(f.__fid) {
          logger.warn('function invoked', {
            iid,
            tag: 'function-invoke',
            fid: f.__fid,
            location: J$.iidToLocation(iid),
            code: J$.iidToCode(iid),
            returnVal: result && result.__coverage_wrapped ? helper.minimizePromise(result) : 'N/A',
            f,
          })
        }

      } catch (err) {
        console.error(`Some error in invokeFun (function-invoke): ${err}`)
      }

      let ftype = PROMISE_TYPES.NewPromise
      let pInfo = null
      let parent = null
      try {
        
        // check if f is a callback arg
        // const possibleCallbackArg = pc.getCallbackArgByOid(utils.getObjectID(f))
        // if (possibleCallbackArg && possibleCallbackArg.ptype == PROMISE_TYPES.CallbackArg) {
        //   possibleCallbackArg.setCalled()
        // }
        
        if (helper.isPromiseResolve(f, base, result)) {
          ftype = PROMISE_TYPES.PromiseResolve
        }
        else if (helper.isPromiseReject(f, base, result)) {
          ftype = PROMISE_TYPES.PromiseReject
        }

        else if (helper.isPromiseAll(f, base, result)) {
          ftype = PROMISE_TYPES.PromiseAll
        }
        else if (helper.isPromiseRace(f, base, result)) {
          ftype = PROMISE_TYPES.PromiseRace
        }
        
        if (helper.isPromiseThen(f, base)) {
          ftype = PROMISE_TYPES.PromiseThen
        }

        else if (helper.isPromiseCatch(f, base)) {
          ftype = PROMISE_TYPES.PromiseCatch
        }
      
      } catch (err) {
        console.error(`Some error in invokeFun (get-promise-type): ${err}`)
      }
        
        // else if (
        //   (helper.isPromise(result) || helper.isAnyBluebirdPromise(result))
        //   && !(helper.isRequire(f))
        // ) {
        //   ftype = PROMISE_TYPES.NewPromise
        // }
      try {

        if (result && helper.isPromise(result) && !(helper.isRequire(f)) && !result.__coverage_wrapped) {
          logger.warn('Proxy not working, probably promise object was overwritten...', {
            cid: result.__cid,
            executorFid: result.__executorFid,
            iid,
            fname: f.name,
            ftype: !!result.__ptype && ftype !== result.__ptype ? ftype : result.__ptype || ftype,
            code: J$.iidToCode(iid),
            location: J$.iidToLocation(iid),
            base,
            result: helper.minimizePromise(result),
          })
          result = PromiseWrapper(result, ftype)
        }

      } catch (err) {
        console.error(`Some error in invokeFun (proxy-not-working): ${err}`)
      }

      try {

        if (result && result.__coverage_wrapped) {
          logger.warn('new promise', {
            tag: 'new-promise',
            cid: result.__cid,
            executorFid: result.__executorFid,
            iid,
            fname: f.name,
            ftypeOnly: ftype,
            ptypeOnly: result.__ptype,
            ftype: result.__ptype,
            base: base && base.__coverage_wrapped ? helper.minimizePromise(base) : null,
            code: J$.iidToCode(iid),
            location: J$.iidToLocation(iid),
            // coverage id, manually assigned id to promise.
            // fOid: utils.getObjectID(f),
            // baseOid: utils.getObjectID(base, args, true, true),
            // resultOid: utils.getObjectID(result, '', false, true),
            f,
            // args,
          })
        }
      } catch (err) {
        console.error(`Some error in invokeFun(warn-new-promise): ${err} ${err.stack}`)
      }  
      return { result: result }
    }

    /**
     * This callback is called after the creation of a literal. A literal can be a function
     * literal, an object literal, an array literal, a number, a string, a boolean, a regular
     * expression, null, NaN, Infinity, or undefined.
     *
     * literalType is a new argument provided by NodeProf showing the type of literal
     *
     * memberNames: an array of member fields' names, each name in form of [getter/setter]-name
     *  e.g, setter-x => setter for member field x
     *  -y => a normal member field y
     *  Please be noted that the name can include a '-' as well, so always use the first '-' as the delimiter for the flag
     **/
    this.literal = function(iid, val, hasGetterSetter, literalType, memberNames) {
      // logger.debug('new literal', { iid, val, literalType, valOid: utils.getObjectID(val), valName: val.name })
      if (helper.isPromise(val)) {
        // let basePromiseOid = utils.getObjectID(base, offset, true)
        logger.trace('new literal - promise', { basePromiseOid, base, offset })
      }
 
      return { result: val }
    }
    // optional literal type filter: by specifying the types in an array, only given types of literals will be instrumented
    this.literal.types = ['ObjectLiteral', 'FunctionLiteral']

    /**
     * These callbacks are called before and after a property of an object is accessed.
     **/
    this.getFieldPre = function(iid, base, offset, isComputed, isOpAssign, isMethodCall) {
      return { base: base, offset: offset, skip: false }
    }
    this.getField = function(iid, base, offset, val, isComputed, isOpAssign, isMethodCall) {
      // if (helper.isPromise(base)) {
      //   // TODO: check promise.then and promise.catch as visited here.
      //   let basePromiseOid = utils.getObjectID(base, offset, true)

      //   let basePromise = pc.getPromiseByOid(basePromiseOid)
      //   logger.trace('getField - base is promise', { basePromiseOid, base, offset })
      //   if (basePromise) {
      //     if (offset === 'then') {
      //       basePromise.visitThen()
      //     } else if (offset === 'catch') {
      //       basePromise.visitCatch()
      //     }
      //   }
      // }
      return { result: val }
    }

    /**
     * These callbacks are called before a property of an object is written
     **/
    this.putFieldPre = function(iid, base, offset, val, isComputed, isOpAssign) {
      return { base: base, offset: offset, val: val, skip: false }
    }
    this.putField = function(iid, base, offset, val, isComputed, isOpAssign) {
      return { result: val }
    }

    /**
     * These callbacks are called after a variable is read or written.
     **/
    this.read = function(iid, name, val, isGlobal, isScriptLocal) {
      return { result: val }
    }
    this.write = function(iid, name, val, lhs, isGlobal, isScriptLocal) {
      if (helper.isPromise(val)) {
        // let rhsPromiseOid = utils.getObjectID(val)
        // logger.trace('write - promise', { name, val, rhsPromiseOid })
        // TODO: handle aliasing maybe?
      }

      return { result: val }
    }
  
    /**
     * These callbacks are called before the execution of a function body starts and after it completes.
     **/
    this.functionEnter = function(iid, f, dis, args) {
      logger.debug('functionEnter', {
        iid, f, location: J$.iidToLocation(iid)
      })

      functionsMap[iid] = f

      // To avoid global scope function call to be included in this
      // Node wraps every module inside a function and when require(module) is called, 
      // calls that function.
      // https://www.freecodecamp.org/news/require-module-in-node-js-everything-about-module-require-ccccd3ad383/
      // if(helper.isEmptyObject(dis)) return 

      for (var i = 0; i < args.length; i++) {
        logger.debug('arg info', { 
          f: f, 
          fname: f.name, 
          position: i,
          location: J$.iidToLocation(iid),
          arg: args[i], 
          type: typeof args[i], 
          isFunction: helper.isFunction(args[i]),
        })
        // if(helper.isFunction(args[i])) {
        //   // if isFunction, add a new instance in AsyncItems set. cover when call to this arg is visited, with oid?
        //   let callbackArg = new CallbackArg(J$.iidToLocation(iid), iid, utils.getObjectID(args[i]))
        //   callbackArg.setPosition(i)
        //   pc.addCallbackArg(callbackArg)
        // }
      }

    }
    this.functionExit = function(iid, returnVal, wrappedExceptionVal) {
      logger.trace('functionExit', {
        iid, returnVal, location: J$.iidToLocation(iid)
      })
      
      let code = J$.iidToCode(iid)
      let f = functionsMap[iid]
      if(f.__fid) {
        logger.warn('function exited', {
          iid,
          tag: 'function-invoke',
          returnVal: returnVal && returnVal.__coverage_wrapped ? helper.minimizePromise(returnVal) : 'N/A',
          exception: wrappedExceptionVal,
          // exceptionVal: wrappedExceptionVal,// && wrappedExceptionVal.exception ? wrappedExceptionVal.exception : 'N/A',
          fid: f.__fid,
          code,
          location: J$.iidToLocation(iid),
          f,
        })
      }
      if(code.startsWith('async') && !wrappedExceptionVal.yield) { // this is a call to async function.
        
        asyncFuncStack.push({
          val: returnVal || wrappedExceptionVal.exception,
          isException: wrappedExceptionVal.hasOwnProperty('exception')
        })
        logger.warn('async function exited', {
          iid,
          // tag: 'function-invoke',
          // tag: 'async-function-exit',
          returnVal: returnVal && returnVal.__coverage_wrapped ? helper.minimizePromise(returnVal) : 'N/A',
          exceptionVal: wrappedExceptionVal,
          fid: f.__fid,
          code,
          location: J$.iidToLocation(iid),
          f,
        })
      }

      return { returnVal: returnVal, wrappedExceptionVal: wrappedExceptionVal, isBacktrack: false }
    }

    /**
     * These callbacks are called before the execution of a builtin function body starts and after it completes.
     **/
    this.builtinEnter = function(name, f, dis, args) {
      logger.trace('builtinEnter', {name})
    }
    this.builtinExit = function(name, f, dis, args, returnVal, exceptionVal) {
      // logger.trace('builtinExit', {name, returnVal, exceptionVal})
      return { returnVal: returnVal }
    }

    /**
     * These callbacks are called before and after a binary operation.
     **/
    this.binaryPre = function(iid, op, left, right, isOpAssign, isSwitchCaseComparison, isComputed) {
      return { op: op, left: left, right: right, skip: false }
    }
    this.binary = function(iid, op, left, right, result, isOpAssign, isSwitchCaseComparison, isComputed) {
      return { result: result }
    }

    /**
     * These callbacks are called before and after a unary operation.
     **/
    this.unaryPre = function(iid, op, left) {
      return { op: op, left: left, skip: false }
    }
    this.unary = function(iid, op, left, result) {
      return { result: result }
    }

    /**
     * This callback is called after a conditional expression has been evaluated
     **/
    this.conditional = function(iid, result) {
      return { result: result }
    }

    /**
     * The callbacks are called before and after an expression
     * @param iid {integer} source code location id
     * @param type {string} type of the expression, TODO: use some standard type names, e.g., ESTree
     * @param result {} the execution result of the expression
     **/
    this.startExpression = function(iid, type) {
      // logger.trace('startExpression', {iid, type, location: J$.iidToLocation(iid), code: J$.iidToCode(iid)})
    }

    this.endExpression = function(iid, type, result) {
      // logger.trace('endExpression', {iid, type, result})
    }


    this.startStatement = function (iid, type) {
      logger.trace('startStatement', {iid, type, location: J$.iidToLocation(iid), code: J$.iidToCode(iid)})
    }
    this.endStatement = function (iid, type) {
    }
    

    /**
     * This callback is called when an execution terminates in node.js.
     **/
    this.endExecution = function() {
      console.log('End of exec')
    }

    //for callbacks that are new or different from Jalangi
    var extraFeatures = true
    if (extraFeatures) {
      /**
       *  These callbacks are called before and after code is executed by eval.
       **/
      this.evalPre = function(iid, str) {}
      this.evalPost = function(iid, str) {}

      this.tryPre = function(iid) {
        logger.debug('tryPre', {iid, location: J$.iidToLocation(iid) })
        logger.warn('try/catch block', {
          tag: 'try-catch',
          iid,
          location: J$.iidToLocation(iid),
          code: J$.iidToCode(iid),
          // wasExceptionalCtrlFlowObserved,
        })
      }
      this.tryPost = function(iid, result, exceptionVal, wasExceptionalCtrlFlowObserved) {
        // logger.warn('try/catch block', {
        //   tag: 'try-catch',
        //   iid,
        //   location: J$.iidToLocation(iid),
        //   code: J$.iidToCode(iid),
        //   wasExceptionalCtrlFlowObserved,
        // })
        logger.debug('tryPost', {
          iid, 
          location: J$.iidToLocation(iid),
          result, 
          exceptionVal, 
          wasExceptionalCtrlFlowObserved,
        })
      }

      /**
       *  These callabcks are called before and after body of functions defined with the Function constructor are executed.
       **/
      this.evalFunctionPre = function(args) {}
      this.evalFunctionPost = function(args, ret, exceptionVal) {}

      /**
       * This callback is called when new source code is encountered during instrumentation.
       **/
      this.newSource = function(sourceInfo, source) {
        logger.warn(`new source loaded: ${sourceInfo.name}`)
      }

      /**
       *  Declaration of a symbol, type can be `const, let, var`
       *  Jalangi version: this.declare = function (iid, name, val, isArgument, argumentIndex, isCatchParam) {
       **/
      this.declare = function(iid, name, type) {
        // logger.trace('declare', {iid, name, type})
      }

      /**
       *  forin or forof support
       *  the object being iterated can be known by checking the last expression's result (via endExpression)
       **/
      this.forObject = function(iid, isForIn) {}

      /**
       * This callback is called before a value is returned from a function using the <tt>return</tt> keyword.
       *
       * This does NOT mean the function is being exited. Functions can return 0, 1, or more times.
       * For example:
       * - <tt>void</tt> functions return 0 times
       * - functions that use the <tt>return</tt> keyword regularly return 1 time
       * - functions that return in both parts of a try/finally block can return 2 times
       *
       * To see when a function ACTUALLY exits, see the <tt>functionExit</tt> callback.
       *
       * @param {number} iid - Static unique instruction identifier of this callback
       * @param {*} val - Value to be returned
       */
      this._return = function(iid, val) {
        // let valOid = utils.getObjectID(val, '', false, true)
        // console.log('return val', val)
        logger.debug('return', {
          iid,
          location: J$.iidToLocation(iid),
          val,
          valName: val && helper.isFunction(val) && val.hasOwnProperty('name') ? val.name : '',
          // oid: valOid,
          isValFunction: helper.isFunction(val),
          isValPromise: helper.isPromise(val),
        })
        // if(helper.isPromise(val)) {
        //   pc.removePromiseByOid(valOid)
        //   logger.warn('return', {
        //     iid,
        //     tag: 'new-promise',
        //     cid: val.__cid,
        //     location: J$.iidToLocation(iid),
        //     val,
        //     valName: val && helper.isFunction(val) && val.hasOwnProperty('name') ? val.name : '',
        //     oid: valOid,
        //     isValFunction: helper.isFunction(val),
        //     isValPromise: helper.isPromise(val),
        //   })
        // }
      }

      this.asyncFunctionEnter = function(iid, ...other) {
        // logger.warn('asyncFunctionEnter', { 
        //   iid, 
        //   location: J$.iidToLocation(iid), 
        //   code: J$.iidToCode(iid),
        //   other: other
        // })
      }
      this.asyncFunctionExit = function(iid, result, exceptionVal) {
        logger.debug('asyncFunctionExit', {
          isPromise: helper.isPromise(result), 
          result: JSON.stringify(result), 
          exceptionVal: JSON.stringify(exceptionVal),
          iid, 
          location: J$.iidToLocation(iid),
          code: J$.iidToCode(iid)
        })
        if (helper.isPromise(result) && asyncFuncStack.length) {
          let asyncVal = asyncFuncStack.pop()
          result = PromiseWrapper(result, PROMISE_TYPES.AsyncFunction)
          logger.warn('asyncFunctionExit', {
            tag: 'async-function-exit',
            stackSize: asyncFuncStack.length,
            result,
            cid: result ? result.__cid : null,
            isException: asyncVal.isException, 
            returnVal: asyncVal.val && asyncVal.val.__coverage_wrapped ? helper.minimizePromise(asyncVal.val) : 'N/A', 
            iid, 
            location: J$.iidToLocation(iid),
            code: J$.iidToCode(iid),
          })
        }

        logger.debug('asyncFunctionExit', { 
          // resultOid: utils.getObjectID(result),
          iid, 
          result, 
          exceptionVal, 
          location: J$.iidToLocation(iid),
          isResultPromise:  helper.isPromise(result)
        })
      }
      this.awaitPre = function(iid, valAwaited) {
        logger.warn('awaitPre', { // for when awaiting pending promises.
          iid, 
          tag: 'awaitPre',
          location: J$.iidToLocation(iid),
          valAwaited: valAwaited && valAwaited.__coverage_wrapped ? helper.minimizePromise(valAwaited) : 'N/A', // value that await is waiting on.
          isPromise: helper.isPromise(valAwaited),
        })
        awaitToValMap.set(iid, valAwaited)
      }
      this.awaitPost = function(iid, valAwaited, result, rejected) {
        logger.warn('await', { 
          iid, 
          tag: 'await',
          valAwaited: valAwaited && valAwaited.__coverage_wrapped ? helper.minimizePromise(valAwaited) : 'N/A', // value that await waited on.
          // result, // this is the final return value of await stmt, is the value promise is resolved or rejected with.
          rejected, // whether the promise rejected or not.
          location: J$.iidToLocation(iid),
          code: J$.iidToCode(iid),
          isPromise: helper.isPromise(valAwaited) 
        })
        if(helper.isPromise(valAwaited)) {
          logger.debug('awaitPost, value awaited is a Promise')
          // let promise = pc.getPromiseByOid(utils.getObjectID(valAwaited))
          // Object.setPrototypeOf(promise, Object.create(PromiseAwait.prototype))
          // promise.setType(PROMISE_TYPES.Await)
          // promise.visitThen()
        }
        
      }
    }
    
  }

  sandbox.analysis = new RuntimeAnalysis()
})(J$)
