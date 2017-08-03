#!/usr/bin/env sh

if [ -z "${AWS_REGION}" ]; then
  echo "AWS_REGION not passed in.  Obtaining AWS region from ECS Container Agent."
  AWS_REGION=$(curl -s http://localhost:51678/v1/tasks | grep 'Arn.*arn\:aws\:ecs' | head -1 | cut -d : -f 5)
fi
echo "AWS_REGION is ${AWS_REGION}"

USE_CLOUD=true \
CLOUD_CONFIG=$(aws ssm get-parameters --name CLOUD_CONFIG --region ${AWS_REGION} --with-decryption --output text | cut -f 4) \
BUILDIT_SECRET=$(aws ssm get-parameters --name BUILDIT_SECRET --region ${AWS_REGION} --with-decryption --output text | cut -f 4) \
npm start
