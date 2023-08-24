#!/bin/sh

# docker build -t jscope .
docker stop jscope
docker rm jscope
docker run -d --name jscope jscope
docker exec -it jscope /bin/bash
