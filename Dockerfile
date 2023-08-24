FROM ubuntu:latest
RUN apt-get update
WORKDIR /app

RUN apt-get install -y nodejs
RUN node -v
RUN apt-get install -y npm
RUN npm -v
RUN apt-get install -y openjdk-11-jdk
ENV JAVA_HOME=/usr/lib/jvm/java-11-openjdk-amd64/

# dynamic analysis
RUN apt-get install -y git
RUN git clone https://github.com/Haiyang-Sun/nodeprof.js.git
RUN apt-get install wget
RUN wget https://github.com/graalvm/graalvm-ce-builds/releases/download/vm-20.2.0/graalvm-ce-java11-linux-amd64-20.2.0.tar.gz
RUN tar -xvzf graalvm-ce-java11-linux-amd64-20.2.0.tar.gz
RUN rm -r graalvm-ce-java11-linux-amd64-20.2.0.tar.gz
ENV NODEPROF_HOME=/app/graalvm-ce-java11-20.2.0/tools/nodeprof
ENV GRAAL_HOME=/app/graalvm-ce-java11-20.2.0
ENV NODEPROF_PATH=/app/nodeprof.js
RUN wget https://github.com/Haiyang-Sun/nodeprof.js/releases/download/v20.2.0-dev/nodeprof.jar
RUN mkdir graalvm-ce-java11-20.2.0/tools/nodeprof
RUN mv nodeprof.jar graalvm-ce-java11-20.2.0/tools/nodeprof/
RUN cp nodeprof.js/src/ch.usi.inf.nodeprof/js/jalangi.js graalvm-ce-java11-20.2.0/tools/nodeprof

COPY . /app/jscope/
WORKDIR /app/jscope/
RUN npm install
RUN npm run build

CMD ["tail", "-f", "/dev/null"]
