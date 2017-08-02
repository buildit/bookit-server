FROM node:8.1.2-alpine

# Install AWS CLI so the run-in-aws.sh script can run as a CMD, if desired.
RUN \
	mkdir -p /aws && \
	apk -Uuv add groff less python py-pip && \
	pip install awscli && \
	apk --purge -v del py-pip && \
	rm /var/cache/apk/*

RUN apk --no-cache add curl

RUN mkdir -p /usr/src/app

# copy the app
COPY package.json /usr/src/app/
COPY lib /usr/src/app/lib
COPY node_modules /usr/src/app/node_modules

# special script to run properly in AWS ECS
COPY scripts/run-in-aws.sh /usr/src/app

# set default app port
EXPOSE 8888

# start the app
WORKDIR /usr/src/app
CMD ["npm", "start"]

