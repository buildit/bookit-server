#!/usr/bin/env sh

awsparam () {
  echo `aws ssm get-parameter --region ${AWS_REGION} --name ${PARAMETER_STORE_NAMESPACE}/$1 --with-decryption --output text | cut -f 4`
}

if [ -z "${AWS_REGION}" ]; then
  echo "AWS_REGION not passed in.  Obtaining AWS region from ECS Container Agent."
  AWS_REGION=$(curl -s http://169.254.169.254/latest/dynamic/instance-identity/document | grep '"region"' | cut -d : -f 2 | tr -d \" | tr -d \,)
fi
echo "AWS_REGION is ${AWS_REGION}"

export USE_AZURE=true
export CLOUD_CONFIG=$(awsparam CLOUD_CONFIG)
CLOUD_CONFIG_UPPER=$(echo $CLOUD_CONFIG | tr '[a-z]' '[A-Z]')
SECRET_NAME=${CLOUD_CONFIG_UPPER}_SECRET

eval export "${SECRET_NAME}=$(awsparam ${SECRET_NAME})"
echo "CLOUD_CONFIG: ${CLOUD_CONFIG}, CLOUD_CONFIG_UPPER: ${CLOUD_CONFIG_UPPER}, SECRET_NAME: ${SECRET_NAME}, SECRET_VALUE: ${BUILDIT_SECRET}"

npm start
