#!/bin/sh

# docker build --platform linux/x86_64 -t jscope:latest .
docker stop jscope
docker rm jscope
docker run --platform linux/x86_64 -d --name jscope jscope:latest
docker exec -it jscope /bin/bash
