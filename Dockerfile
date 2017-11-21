# Best practices from: https://nodejs.org/en/docs/guides/nodejs-docker-webapp/
FROM node:carbon

# BEGIN root
USER root
RUN yarn add global grunt-cli \
    && yarn global add loopback-sdk-angular-cli

RUN mkdir -p /usr/src/app

COPY . /usr/src/app
RUN chown -R node:node /usr/src/app
# END root

USER node
WORKDIR /usr/src/app

RUN yarn install --frozen-lockfile
RUN npm run build

EXPOSE 3000

CMD [ "npm", "start" ]
