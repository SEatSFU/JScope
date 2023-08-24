// https://github.com/kylefarris/clamscan/pull/96
// More simplified in here: http://www.sfu.ca/~mga95/study/ctl/t8_test.html
// unsettled promise. pending promise, no calls to resolve

// Summary of issue description:
// the situation basically looks like this:
// var p = new Promise((resolve) => {
//    return someAsyncFunction();
//    // WHICH INSTEAD SHOULD BE:
//    //         var data = await someAsyncFunction();
//    //         resolve(data); // notice resolve was not called previously.
// })

// Module dependencies.
const os = require('os');
const { execFileSync } = require('child_process');


/**
 * Asynchronously gets list of files in a path.
 *
 * @param {String} path - a path to be scanned
 * @returns {Promise<Array>}
 */
async function getAllFiles(path) {};

/**
 * Scans an array of files or paths.
 *
 * @param {Array} files - A list of files or paths (full paths) to be scanned
 * @returns {Promise<object>} Object like: `{ goodFiles: Array, viruses: Array }`
 * @example
 * const {goodFiles, viruses} = await clamscan.scanFiles(files);
 */
async function scanFiles(files = []) {};


/**
 * Scans an entire directory.
 *
 * @param {string} path - The directory to scan files of
 * @param {Boolean} [scanRecursively] - whether to scan the subdirectories recursively or not. defaults to true.
 * @returns {Promise<object>} Object like: `{ goodFiles: Array, viruses: Array }`
 * @example
 * const {goodFiles, viruses} = await clamscan.scanDir('/some/path/to/scan');
 */
function scanDir(path = '', callback) {
    // ...
    return new Promise(async (resolve, reject) => {
        // Get all files recursively using `scanFiles`
        if(callback) {
            return callback(goodFiles, viruses)
        }
        else{
            try {
                const allFiles = await getAllFiles(path);
                // BUG: unresolved promise
                return callback ? callback(goodFiles, viruses) : this.scanFile(allFiles);
                // FIX: call resolve.
                // const { goodFiles, badFiles, viruses, errors } = await this.scanFiles(allFiles);
                // return resolve({ goodFiles, badFiles, viruses, errors });
            } catch (e) {
                const err = new Error(
                    `Could not read the file listing of the ${path}: ${e}`
                );
                return reject(err);
            }
        }
    });
}




// *******************************
// TESTS
// *******************************

describe('scanDir', () => {
    before(async () => {
        // initializes following directory structure:
        //   - good_dir/
        //         - sub_dir1/
        //               - good_file1.txt
        //               - good_file2.txt 
        //         - sub_dir2/
        //               - good_file3.txt 
        initializeDirectories()
    });

    it('should be a function', () => {
        scanDir.should.be.a('function');
    });

    it('should support scanning a directory', () => {
        scanDir(`${__dirname}/good_dir`).then((data) => {
            expect(data.to.be.an('object'))
            expect(data.goodFiles.to.be.an('array').that.is.not.empty)
        });
    });

    it('should return error if directory not found', () => {
        expect(scanDir(`${__dirname}/missing_dir`)).to.be.rejectedWith(Error);
    });
});