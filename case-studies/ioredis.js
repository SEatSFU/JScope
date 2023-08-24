// https://github.com/luin/ioredis/pull/1466/files
// unhandled rejection. Linked promise

// Summary of issue description:
// There are calls to this.exec(...); all over the Pipeline that don't
// check if the returned Promise is caught which I believe could lead to
// unhandled Promise rejections on retrying failed commands.
// 
// Also, lib/autopipelining.js also called pipeline.exec without
// checking for errors.
// 
// The fix makes sure there is now exactly one Promise instance that can be returned
// and the rejection is handled for that promise,
// which means that this no longer can cause unhandled Promise rejections.



// NOTE: To avoid an unhandled promise rejection, this will unconditionally 
// always return this.promise, which always has the rejection handled 
// by standard-as-callback adding the provided rejection callback.
//
// If a different promise instance were returned, that promise would 
// cause its own unhandled promise rejection errors
Pipeline.prototype.exec = function (callback) {
    // ...
    
    // in cluster mode, loads scripts, then executes pipelines.
    if (this.isCluster) {
        return pMap(scripts, (script) => _this.redis.script("load", script.lua), {
            concurrency: 10,
        }).then(function () {
            for (let i = 0; i < scripts.length; i++) {
                _this.redis._addedScriptHashes[scripts[i].sha] = true;
            }
            // this returns another promise.
            return execPipeline(); // [FIX: REMOVE LINE]
        }); // [FIX: ADD] .then(execPipeline, this.reject);
        // [FIX: ADD] return this.promise;
    }
    // ...
}