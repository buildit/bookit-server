#!/bin/bash

DIR=`dirname $0`

chmod 600 $DIR/ec2/travis
scp  -i $DIR/ec2/travis $DIR/dev/docker-compose.yml app@bookit.riglet.io:/home/app/
ssh -o StrictHostKeyChecking=no -i $DIR/ec2/travis app@bookit.riglet.io \
'docker-compose down; docker-compose pull; docker-compose up -d'
