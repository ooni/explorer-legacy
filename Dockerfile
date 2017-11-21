# Best practices from: https://nodejs.org/en/docs/guides/nodejs-docker-webapp/
FROM node:carbon

RUN mkdir -p /usr/src/app
RUN chown node:node /usr/src/app

USER root
RUN yarn add global grunt-cli

USER node
WORKDIR /usr/src/app
COPY package*.json ./
COPY yarn.lock ./

COPY Gruntfile.js ./
COPY global-config.js ./
COPY client ./
COPY common ./
COPY server ./
COPY server.js ./

RUN yarn install --development \
    && npm run build

EXPOSE 3000

CMD [ "npm", "start" ]
