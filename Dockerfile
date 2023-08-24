FROM ubuntu:20.04
RUN apt-get update
WORKDIR /app

RUN apt-get install -y nodejs
RUN apt-get install -y npm
RUN apt-get install -y vim
RUN apt-get install -y git
RUN apt-get install -y wget
RUN apt-get install -y python3
RUN apt-get install -y g++
RUN apt-get install -y make
RUN apt-get install -y python3-pip

# update node.js to version 14.16.1
RUN npm install -g n
RUN n 14.16.1

RUN git clone https://github.com/graalvm/mx.git
WORKDIR /app/mx
RUN git checkout 6.1.4
ENV PATH="/app/mx:$PATH"

COPY . /app/jscope/
WORKDIR /app/jscope/

CMD ["tail", "-f", "/dev/null"]
