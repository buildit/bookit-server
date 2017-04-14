#cloud-config

# Add app user and add travis ssh key

packages:
  - docker

runcmd:
  - chkconfig --levels 3 docker on
  - service docker start

  - echo 'installing compose'
  - curl -L "https://github.com/docker/compose/releases/download/1.11.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose && chmod +x /usr/local/bin/docker-compose

  - echo 'adding app user and key for travis'
  - useradd -G docker app && mkdir ~app/.ssh/ && echo '${travis_key}' > ~app/.ssh/authorized_keys
  - chmod -R 600 ~app/.ssh/*
  - chown -R app:app ~app/.ssh
