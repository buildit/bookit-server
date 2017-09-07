#!/usr/bin/env bash

./scripts/ecs-deploy.sh -c ${INT_ECS_CLUSTER} -n ${INT_ECS_SERVICE} -i 006393696278.dkr.ecr.${AWS_DEFAULT_REGION}.amazonaws.com/${ECS_REPO}:${COMMIT_SHA}
./scripts/run-integration-tests.sh
TEST_EXIT=$?
if [ $TEST_EXIT -eq 0 ]; then ./scripts/ecs-deploy.sh -c ${STG_ECS_CLUSTER} -n ${STG_ECS_SERVICE} -i 006393696278.dkr.ecr.${AWS_DEFAULT_REGION}.amazonaws.com/${ECS_REPO}:${COMMIT_SHA}; fi
