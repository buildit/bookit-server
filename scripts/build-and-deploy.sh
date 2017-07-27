#!/bin/bash

DIR='../deploy'
echo "DIR=$DIR"
echo "PWD=`pwd`"

if [[ "$TRAVIS_BRANCH" == "master" ]] && [[ "$TRAVIS_EVENT_TYPE" == "push" ]]; then
    export IMG_VERSION=`node -p -e "require('./package.json').version"`;
    echo "Building bookit-server $IMG_VERSION";
    npm prune --production;
    docker build -t builditdigital/bookit-server:$IMG_VERSION .;
    docker login -u="$DOCKER_USERNAME" -p="$DOCKER_PASSWORD";
    docker push builditdigital/bookit-server:$IMG_VERSION;
    docker tag builditdigital/bookit-server:$IMG_VERSION builditdigital/bookit-server:latest;
    docker push builditdigital/bookit-server:latest;

    openssl aes-256-cbc -K $encrypted_2d5b9f764c04_key -iv $encrypted_2d5b9f764c04_iv -in $DIR/ec2/travis.enc -out $DIR/ec2/travis -d
    chmod 600 $DIR/ec2/travis
    scp -o StrictHostKeyChecking=no -i $DIR/ec2/travis $DIR/dev/docker-compose.yml app@bookit.riglet.io:/home/app/
    ssh -o StrictHostKeyChecking=no -i $DIR/ec2/travis app@bookit.riglet.io \
      'docker-compose down; docker-compose pull; docker-compose up -d'
fi

