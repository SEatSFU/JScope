#!/bin/bash

# TODO: After installing MX, add it to path here. 
# You may also add it to your .bashrc so that it is available everywhere
#PATH="<dir/to/mx>:$PATH"

# Set javaHome variable to the home directory of JDK 1.8.0 or a version compatible with graalVM
# More info at https://github.com/Haiyang-Sun/nodeprof.js/blob/master/README.md
# If your default version of java is 1.8.0 then ignore this
# javaHome="/Library/Java/JavaVirtualMachines/jdk1.8.0_261.jdk/Contents/Home"
# javaHome="$HOME/.mx/jdks/labsjdk-ce-11-jvmci-22.2-b03/Contents/Home"
javaHome="/app/labsjdk-ce-17"

nodeprof () { 
    if [ "$#" -lt "4" ]; then
        echo "args passed: $*"
        echo "Usage: ./nodeprof.sh path/to/nodeprof/analysis.js path/to/runnerFile.js path/to/project/test/dir testRegex"
        echo "  - runnerFile.js: either runMocha.mjs or runTap.js"
        exit 1
    fi
    # args passed: 
        # $1=path/to/analysis.js 
        # $2=path/to/somecode.js 
        # $3=path/to/project/tests/directory  
        # $4=regex to select all test files, e.g. *-test.js
        # optional:$5=path/to/output/log.txt
    
    SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
    local regex="${4}"
    local testDir="${3}"
    local runner="${2}"
    local analysis="${1}"
    local current="${SCRIPT_DIR}"
    
    # cd "$nodeprofSrc" || exit
    if test -d $javaHome; then
        export JAVA_HOME=$javaHome
    fi
    cmd="mx -v jalangi --excl=\"node_modules,internal,spec,chai,css,promiseWrapper.js,test\" --scope=app --analysis \"${analysis}\" \"${runner}\" \"${testDir}\" \"${regex}\""
    # cmd="$GRAAL_HOME/bin/node --jvm --experimental-options --vm.Dtruffle.class.path.append=$GRAAL_HOME/tools/nodeprof.jar --nodeprof \"$NODEPROF_PATH/src/ch.usi.inf.nodeprof/js/jalangi.js\" --analysis ${analysis} ${runner} --nodeprof.ExcludeSource=\"node_modules,internal,spec,chai,css,promiseWrapper.js,test\" --nodeprof.Scope=app ${testDir} ${regex}"
    echo -e "$cmd"
    if [ "$#" -eq "5" ]; then
        eval "$cmd" | tee "${5}"
    else
        eval "$cmd"
    fi
    cd "$current" || exit
}

nodeprof "$@"
