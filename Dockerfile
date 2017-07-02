FROM node:8.1.2-alpine
RUN mkdir -p /usr/src/app

# copy the app
COPY package.json /usr/src/app/
COPY lib /usr/src/app/lib
COPY node_modules /usr/src/app/node_modules

# set default app port
EXPOSE 8888

# start the app
WORKDIR /usr/src/app
CMD ["npm", "start"]

