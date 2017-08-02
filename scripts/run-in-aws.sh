#!/usr/bin/env sh
USE_CLOUD=true \
CLOUD_CONFIG=$(aws ssm get-parameters --name CLOUD_CONFIG --region ${AWS_REGION} --with-decryption --output text | cut -f 4) \
BUILDIT_SECRET=$(aws ssm get-parameters --name BUILDIT_SECRET --region ${AWS_REGION} --with-decryption --output text | cut -f 4) \
npm start
