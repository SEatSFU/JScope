
> Note: Considering that some of our benchmark projects require external libraries or frameworks such as MongoDB to successfully execute their test suites, rerunning the experiments with the provided docker image might result in different coverage outcomes for some benchmark projects. This is caused by some of the tests in the test suite failing, or the test suite not executing completely as a result of skipping tests queued after a failed test. We will use the package `minipass` as our working example for a walkthrough, the process is similar for other packages.

## Requirements

A Dockerfile is provided to run the project in an isolated container along with all of its dependencies.
The only requirement is having Docker installed on your machine.

## Installation

Run the following command in the root project directory to build the `jscope` docker image

```bash
docker build -t jscope:latest .
```

Next, run `docker_run.sh` script to run the docker image and enter the container to use a shell inside.

```bash
./docker_run.sh 
```

The provided docker image has dependencies installed and benchmark projects ready to reproduce the experiments.

Inside the container, run `install.sh` provided in the root directory of jscope to install Nodeprof and JScope:

```bash
./install.sh
```

The benchmark projects are located at `/app/jscope/projects-RQ1/` inside the container.

> Note: A `jscope.json` is included for all existing projects, but make sure to add a proper `jscope.json` config file to any project you add manually. Read [README.md](/README.md) for more info about how JScope uses it. You can see a sample `jscope.json` file in [src/jscope.json.sample](/src/jscope.json.sample).


Before running JScope-CLI on a project, enter the directory of the project and build it.
Most projects can simply be built using `npm install`. 
However, take a look at their `package.json` for possible extra build procedures.

For our working example, you can build `minipass` with the following commands:

```bash
cd /app/jscope/projects-RQ1/minipass
npm install
```

And then navigate back to `/app/jscope`. and run:

```bash
cd /app/jscope/
node out/cli.js /app/jscope/projects-RQ1/minipass
```

> Note: Rerunning experiments for RQ2 can be achieved similar to RQ1, you will have to pull the projects and checkout to the commit hash mentioned in table 4 in the manuscript before running JScope. As RQ2 focuses on helpfulness of JScope in detecting test inadequacies for promises, it is recommended to run this with the extension and not just the CLI.

> Note: Performance and overhead of JScope inside a docker container might be different than what is reported in the manuscript depending on the enviroment and the hardware. Our Performance measurements are recorded on a macbook air m1 with 16 GB of ram.