#!/usr/bin/env sh

if [ -z "${AWS_REGION}" ]; then
  echo "AWS_REGION not passed in.  Obtaining AWS region from EC2 instance data"
  AWS_REGION=$(curl -s http://169.254.169.254/latest/dynamic/instance-identity/document  | grep '"region"' | cut -d : -f 2 | tr -d \")
fi
echo "AWS_REGION is ${AWS_REGION}"

USE_CLOUD=true \
CLOUD_CONFIG=$(aws ssm get-parameters --name CLOUD_CONFIG --region ${AWS_REGION} --with-decryption --output text | cut -f 4) \
BUILDIT_SECRET=$(aws ssm get-parameters --name BUILDIT_SECRET --region ${AWS_REGION} --with-decryption --output text | cut -f 4) \
npm start
