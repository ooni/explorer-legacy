# OONI Explorer Legacy

**This repository is deprecated**

For the current OONI Explorer code repository see: https://github.com/ooni/explorer.

## Setup

### Docker

We include a docker file.

To build the docker image run:

```
docker build -t openobservatory/ooni-explorer .
```

When starting the docker container you should pass the following environment
variables to connect to the database:

* `DB_HOST`: should point to the host where the database is running (default: `localhost`)
* `DB_PORT`: should point to the port where the database is running (default: `5432`)
* `DB_NAME`: the name of the database to use (default: `ooni_pipeline`)
* `DB_USERNAME`: the name of the username for logging into the db (default: `ooni`)
* `DB_PASSWORD`: the password for the user to login to the db (default: `""`)

For example:

```
docker run -d \
  -e DB_HOST='ssdams.infra.ooni.io' \
  -e DB_PORT='5432' \
  -e DB_USERNAME='ooni' \
  -e DB_PASSWORD='mypassword' \
  -p 80:3000 \
  --name ooni-explorer \
  openobservatory/ooni-explorer
```

### On Mac OS X

```
brew install yarn
```

### Install dependencies

Install the node dependencies:

```
yarn add global jshint
yarn add global grunt-cli
yarn install --development
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
CREATE USER ooni WITH PASSWORD 'seCure'

# Create the dummy database
CREATE DATABASE ooni_explorer

# Grant the priviledges
GRANT ALL PRIVILEGES ON DATABASE ooni_explorer to ooni
```

### Run

If needed edit `server/datasources.staging.js` to suit your needs.

Then build the app for production with:

```
grunt build
```

Then you can run it in staging by running:

```
NODE_ENV="staging" DB_PASSWORD="seCure" node .
```

## Production deployment

For more details about deploying in production see [docs/deployment.md](docs/deployment.md)

## Generate angular.js $resources

To regenerate the angular.js services from the server-side REST API spec run:

```
grunt build
```
