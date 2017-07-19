REGION=us-east-1

USE_CLOUD=true \
CLOUD_CONFIG=`aws ssm get-parameters --name CLOUD_CONFIG --region ${REGION} --with-decryption --output text | cut -f 4` \
TEST_SECRET=`aws ssm get-parameters --name TEST_SECRET --region ${REGION} --with-decryption --output text | cut -f 4` \
npm start
