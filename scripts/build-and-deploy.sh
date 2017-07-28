#!/bin/bash

DEPLOY_HOME='./deploy'

if [[ "$TRAVIS_BRANCH" == "master" ]] && [[ "$TRAVIS_EVENT_TYPE" == "push" ]]; then
    export IMG_VERSION=`node -p -e "require('./package.json').version"`;
    echo "Building bookit-server $IMG_VERSION";
    npm prune --production;
    docker build -t builditdigital/bookit-server:$IMG_VERSION .;
    docker login -u="$DOCKER_USERNAME" -p="$DOCKER_PASSWORD";
    docker push builditdigital/bookit-server:$IMG_VERSION;
    docker tag builditdigital/bookit-server:$IMG_VERSION builditdigital/bookit-server:latest;
    docker push builditdigital/bookit-server:latest;

    openssl aes-256-cbc -K $encrypted_2d5b9f764c04_key -iv $encrypted_2d5b9f764c04_iv -in $DEPLOY_HOME/ec2/travis.enc -out $DEPLOY_HOME/ec2/travis -d
    chmod 600 $DEPLOY_HOME/ec2/travis
    scp -o StrictHostKeyChecking=no -i $DEPLOY_HOME/ec2/travis $DEPLOY_HOME/dev/docker-compose.yml app@bookit.riglet.io:/home/app/
    ssh -o StrictHostKeyChecking=no -i $DEPLOY_HOME/ec2/travis app@bookit.riglet.io \
      'docker-compose pull; \
       docker-compose down; \
       CLOUD_CONFIG="`/usr/src/app/bin/fetch_aws_param.py CLOUD_CONFIG`" \
       BUILDIT_SECRET="`/usr/src/app/bin/fetch_aws_param.py BUILDIT_SECRET`" docker-compose up -d'
fi

