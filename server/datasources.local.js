var extend = require('util')._extend;
var url = require('url');

SUPPORTED_DATASTORES = {"postgres": "postgresql"};

var REPORTS_DB_URL = process.env.REPORTS_DB_URL || "memory://";

var db_url = url.parse(REPORTS_DB_URL);
var DB = db_url.protocol.split(":")[0];

if (!(DB in SUPPORTED_DATASTORES)) {
  console.error('Invalid DB "%s"', DB);
  console.error('Supported values', Object.keys(SUPPORTED_DATASTORES.join(' ')));
  process.exit(1);
}

var DB_CONNECTOR = SUPPORTED_DATASTORES[DB];
var DB_HOST = db_url.hostname;
var DB_PORT = db_url.port;
var DB_USERNAME = db_url.auth.split(":")[0];
var DB_PASSWORD = db_url.auth.split(":")[1];
var DB_NAME = db_url.path.split("/")[1];

var connector = DB_CONNECTOR === 'memory' ? DB_CONNECTOR : 'loopback-connector-' + DB_CONNECTOR;
var config = extend({ connector: connector }, {
  host: DB_HOST,
  port: DB_PORT,
  database: DB_NAME,
  username: DB_USERNAME,
  password: DB_PASSWORD,
  name: "db",
  ssl: "true"
});

module.exports = {
  postgres: config
};
