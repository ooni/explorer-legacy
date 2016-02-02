# OONI Explorer

This is the code for the OONI report API accessible via:

http://api.ooni.io/

## Setup

### On Mac OS X

```
brew install node
```

### Install dependencies

Install the node dependencies:

```
npm install --development
npm install -g jshint
npm install -g bower
npm install -g grunt-cli
npm install -g strongloop
```

Then install the bower dependencies:

```
bower update
```

## Development environment

To run this within a development environment for network and postgres free
development do:

```
NODE_ENV="development" grunt serve
```

Edit the script inside of `server/boot/create-fixtures.js` to create custom
fixtures for development.

## Local staging

### Setup a test postgres database

On Mac OS X you can use [PostgresApp.com/](http://postgresapp.com/)

Then add to your `PATH` the following directory:

```
export PATH=$PATH:/Applications/Postgres.app/Contents/Versions/9.4/bin
```

Run the postgres shell and run the following commands:

```
# Create the user
CREATE USER operator WITH PASSWORD 'seCure'

# Create the dummy database
CREATE DATABASE ooni_api_db

# Grant the priviledges
GRANT ALL PRIVILEGES ON DATABASE ooni_api_db to operator
```

### Run

If needed edit `server/datasources.staging.js` to suit your needs.

Then build the app for production with:

```
grunt build
```

Then you can run it in staging by running:

```
NODE_ENV="staging" node .
```

## Production deployment

For more details about deploying in production see [docs/deployment.md](docs/deployment.md)

## Generate angular.js $resources

To regenerate the angular.js services from the server-side REST API spec run:

```
lb-ng server/server.js client/ngapp/scripts/services/lbclient.js
```
