## Project Contents

REQUIREMENTS.md: System requirements for running JScope

INSTALL.md: Installation instructions and how to run JScope

README.md: 

LICENSE: software license TODO
## Installation

Extract the compressed artifact first, and then build the docker image.

```bash
docker build -t jscope:latest .
```

You can then use our provided script to run the docker image and enter the container to use a shell inside.
```bash
./docker_run.sh 
```

**If you are using a device with Apple silicon (M1, M2, etc.), use the command below:**

```bash
docker build --platform linux/x86_64 -t jscope:latest .
```

**And also add the `--platform linux/x86_64` flag to the `docker run` command in the `docker_run.sh` script.**


After entering the container, you can navigate to the sample project directories.

```bash
cd projects-RQ1 # or projects-RQ2
```

And then navigate to any of the projects inside the directory. For example:

```bash
cd async-cache-dedupe
```

Install the project's dependencies:

```bash
npm install
```