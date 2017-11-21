FROM node:carbon

WORKDIR /usr/src/app
COPY package*.json ./
COPY bower.json ./
COPY .bowerrc ./

RUN npm install --development \
    && npm install -g jshint \
    && npm install -g bower \
    && npm install -g grunt-cli \
    && npm install -g strongloop

COPY Gruntfile.js ./
COPY global-config.js ./
COPY client ./
COPY common ./
COPY server ./
COPY server.js ./

RUN npm run build

EXPOSE 3000

CMD [ "npm", "start" ]
