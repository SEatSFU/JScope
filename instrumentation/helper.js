// DO NOT INSTRUMENT
var BluebirdPromise = require('bluebird')
const logger = require('./logger.js')

var Helper = function () {}

var hasProp = {}.hasOwnProperty

// supporting promises created by libraries over native js promises, and bluebird promises
Helper.prototype.isPromise = function isPromise(obj) {
  try {
    if (obj !== null && typeof obj !== 'undefined') {
      if (obj === Promise || obj instanceof Promise || obj instanceof BluebirdPromise || obj === BluebirdPromise)
        return true
      else if (
        typeof obj.hasOwnProperty !== 'undefined' &&
        obj.hasOwnProperty('name') &&
        typeof obj.name !== 'undefined' &&
        obj.name !== null &&
        obj.name === 'Promise'
      )
        return true
    }
    if (this.isAnyBluebirdPromise(obj)) return true
    return false
  } catch(err) {
    return false
  }
  
}

Helper.prototype.isAnyBluebirdPromise = function isAnyBluebirdPromise(obj) {
  try {
    return hasProp.call(obj, '_promise0')
  } catch (e) {
    return false
  }
}

Helper.prototype.isPromiseThen = function isPromiseThen(fun, base) {
  return (
    fun.name === '__thenWrapper' || fun === Promise.prototype.then || fun === BluebirdPromise.prototype.then || this.isBluebirdPromiseThen(fun, base)
  )
}

Helper.prototype.isBluebirdPromiseThen = function isBluebirdPromiseThen(fun, base) {
  // handle .spread and other functions acting just like then from bluebird doc as well.
  return (
    this.isAnyBluebirdPromise(base) &&
    (fun === base.then || fun === base.spread || fun === base.tap || fun === base.bind) // handle this separately, dont consider this as a then, but keep it in promise chain.
  )
}

Helper.prototype.isPromiseCatch = function isPromiseCatch(fun, base) {
  return (
    fun === Promise.prototype.catch || fun === BluebirdPromise.prototype.catch || this.isBluebirdPromiseThen(fun, base)
  )
}

Helper.prototype.isBluebirdPromiseCatch = function isBluebirdPromiseCatch(fun, base) {
  this.isAnyBluebirdPromise(base) && fun === base.catch
}

Helper.prototype.isPromiseResolve = function isPromiseResolve(fun, base, result) {
  return this.isPromise(base) 
    && this.isPromise(result) 
    && fun.toString() === BluebirdPromise.resolve.toString()
}

Helper.prototype.isPromiseReject = function isPromiseReject(fun, base, result) {
  return this.isPromise(base) 
    && this.isPromise(result) 
    && fun.toString() === BluebirdPromise.reject.toString()
}

Helper.prototype.isPromiseAll = function isPromiseAll(fun, base, result) {
  return this.isPromise(base) 
    && this.isPromise(result) 
    && (fun.toString() === BluebirdPromise.all.toString()
      || fun.toString() === BluebirdPromise.allSettled.toString()
    )
}

Helper.prototype.isPromiseRace = function isPromiseRace(fun, base, result) {
  return this.isPromise(base) 
    && this.isPromise(result) 
    && fun.toString() === BluebirdPromise.race.toString()
}

Helper.prototype.getFunctionName = function getFunctionName(f, iid) {
  if (f === null) {
    return false
  }
  return f.name
}

Helper.prototype.isFunction = function isFunction(f) {
  return typeof f === 'function'
}

Helper.prototype.isRequire = function isRequire(f) {
  return this.isFunction(f) && f.name === 'require' && f.hasOwnProperty('resolve') && f.hasOwnProperty('cache')
}

Helper.prototype.isEmptyObject = function isEmptyObject(obj) {
  for (var prop in obj) {
    if (obj.hasOwnProperty(prop)) return false
  }

  return true
}

Helper.prototype.isInsideBlock = function isInsideBlock(innerLocation, outerLocation) {
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

Helper.prototype.mapValuesFilter = function* filter(iterable, predicate) {
  var i = 0;
  for (var item of iterable){
    if (predicate(item))
      yield item;
  }
    
}

Helper.prototype.PROMISE_TYPES = {
  NewPromise: 'NewPromise',
  AsyncFunction: 'AsyncFunction',
  Await: 'Await',
  PromiseThen: 'PromiseThen',
  PromiseCatch: 'PromiseCatch',
  PromiseResolve: 'PromiseResolve',
  PromiseReject: 'PromiseReject',
  PromiseAll: 'PromiseAll',
  PromiseRace: 'PromiseRace',
  CallbackArg: 'CallbackArg',
}

Helper.prototype.minimizePromise = function (p) {
  if (!p || typeof p !== 'object') return {}
  return {
    "__cid": p.__cid,
    "then": p.then,
    "catch": p.catch,
    "__coverage_wrapped": p.__coverage_wrapped,
    "__ptype": p.__ptype,
  }
}


module.exports = new Helper()
