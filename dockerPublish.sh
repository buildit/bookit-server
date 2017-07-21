#!/bin/bash

npm run build
docker build . -t defpearlpilot/bookit-server:latest
docker push defpearlpilot/bookit-server:latest
