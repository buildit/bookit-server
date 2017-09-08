#!/usr/bin/env bash

./scripts/install-awscli.sh \
  && ./scripts/get-deployment-scripts.sh \
  && npm prune --production \
  && ./scripts/push-to-ecr.sh \
  && ./scripts/ecs-deploy.sh -c ${INT_ECS_CLUSTER} -n ${INT_ECS_SERVICE} -i 006393696278.dkr.ecr.${AWS_DEFAULT_REGION}.amazonaws.com/${ECS_REPO}:${COMMIT_SHA} \
  && ./scripts/run-integration-tests.sh \
  && ./scripts/ecs-deploy.sh -c ${STG_ECS_CLUSTER} -n ${STG_ECS_SERVICE} -i 006393696278.dkr.ecr.${AWS_DEFAULT_REGION}.amazonaws.com/${ECS_REPO}:${COMMIT_SHA}
