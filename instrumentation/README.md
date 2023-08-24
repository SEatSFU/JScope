## Instructions

JScope uses these scripts to programmatically instrument the programs using Nodeprof.js.
In order for JScope to work, you need to install the dependencies described in the project's readme file.
These dependencies include nodeprof, graal, and mx. To see how to install these, follow the [tutorial on Nodeprof.js github page](https://github.com/Haiyang-Sun/nodeprof.js/blob/master/Tutorial.md).

## Debugging

In case of any problems, you can try one of the following:

- Look at `nodeprof.sh` in this directory and update the javaHome variable and add MX to the $PATH variable as explained.
- Run `chmod +x nodeprof.sh` to make `nodeprof.sh` executable.
- Install and run [a different version of GraalVM](https://www.graalvm.org/downloads/)