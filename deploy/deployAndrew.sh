#!/bin/bash

DIR=`dirname $0`

scp -o StrictHostKeyChecking=no -i /Users/andrew/.aws/.keys/bookit-andrew.pem ./spike/docker-compose.yml ec2-user@54.84.204.89:
ssh -o StrictHostKeyChecking=no -i /Users/andrew/.aws/.keys/bookit-andrew.pem ec2-user@54.84.204.89 \
'docker-compose pull; docker-compose down; \
CLOUD_CONFIG="`./bin/fetch_aws_param.py CLOUD_CONFIG`" \
TEST_SECRET="`./bin/fetch_aws_param.py TEST_SECRET`" docker-compose up -d'
