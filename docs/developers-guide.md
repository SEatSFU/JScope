# Developer's Guide

## Dependencies

To use JScope, you first need these installed:

- [Visual Studio Code](https://code.visualstudio.com/download)
- [Typescript](https://www.typescriptlang.org/download)
- [Nodeprof.js](https://github.com/Haiyang-Sun/nodeprof.js)

Download VSCode, install typescript and follow the instructions to set up and install NodeProf.js through the links provided.

## Extension Components, How things work.

There are two main components in this project, instrumentation, and the VSCode extension.

- Everything related to the dynamic analysis and instrumentation of code can be found in the instrumentation directory. We use one of `runMocha.mjs` or `runTap.js` to execute a repository's tests programmatically. `PromiseWrapper.js` creates a proxy wrapper for the global Promise object. `analysis.js` is the main dynamic analysis file. It contains the instrumentation hooks and is passed to NodeProf.js to instrument a project's source code.
- The code for extension is under `src/` directory. The `Analyzer.ts` component is responsible for running the analysis in the extension, using the `nodeprof.sh` script in the `instrumentation/` directory. The `Coverage.ts` is responsible for measurement of async coverage results. And `CLIReporter.ts` and `CoverageAnnotationsManager.ts` are used to provide textual report and async coverage visualizations, respectively. 

## FAQ

If you have any questions, please email me at m_ganji@sfu.ca