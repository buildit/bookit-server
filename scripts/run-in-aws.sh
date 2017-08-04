#!/usr/bin/env sh

awsparam () {
  echo `aws ssm get-parameters --region ${AWS_REGION} --names $1 --with-decryption --output text | cut -f 4`
}

if [ -z "${AWS_REGION}" ]; then
  echo "AWS_REGION not passed in.  Obtaining AWS region from ECS Container Agent."
  AWS_REGION=$(curl -s http://169.254.169.254/latest/dynamic/instance-identity/document | grep '"region"' | cut -d : -f 2 | tr -d \" | tr -d \,)
fi
echo "AWS_REGION is ${AWS_REGION}"

USE_CLOUD=true \
CLOUD_CONFIG=$(awsparam CLOUD_CONFIG) \
BUILDIT_SECRET=$(awsparam BUILDIT_SECRET) \
npm start
