#!/bin/bash

DIR=`dirname $0`

scp -o StrictHostKeyChecking=no -i /Users/andrew/.aws/.keys/bookit-roman.pem ./spike/docker-compose.yml app@bookit.riglet.io:/home/app/
ssh -o StrictHostKeyChecking=no -i /Users/andrew/.aws/.keys/bookit-roman.pem app@bookit.riglet.io \
'docker-compose pull; docker-compose down; \
CLOUD_CONFIG="`./bin/fetch_aws_param.py CLOUD_CONFIG`" \
TEST_SECRET="`./bin/fetch_aws_param.py TEST_SECRET`" docker-compose up -d'
