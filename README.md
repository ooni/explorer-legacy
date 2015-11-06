# OONI API

This is the code for the OONI report API accessible via:

http://api.ooni.io/

## How to run locally

### On Mac OS X

```
brew install node
```

### Install dependencies

```
npm install --development
npm install -g jshint
npm install -g grunt-cli
```

### Run with local postgres

#### Setup a test postgres database

On Mac OS X you can use: (http://postgresapp.com/)[http://postgresapp.com/]

Run the postgres shell and run the following commands:

```
# Create the user
CREATE USER operator WITH PASSWORD 'seCure'

# Create the dummy database
CREATE DATABASE ooni_api_db

# Grant the priviledges
GRANT ALL PRIVILEGES ON DATABASE ooni_api_db to operator
```

### Export the environment variable

You have to export the proper environment variables in order to make it function
properly:

`export REPORTS_DB_URL="postgres://operator:seCure@127.0.0.1:5432/ooni_data_api"`

### Run grunt-cli

To start the server run:

```
grunt server
```
