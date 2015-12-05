module.exports = {
  "db": {
    "host": "db-1.infra.ooni.io",
    "port": "5432",
    "database": "ooni_pipeline",
    "username": "ooni",
    "password": "XXX",
    "name": "postgres",
    "debug": false,
    "connector": "postgresql",
    "ssl": true
  },
  "mem": {
    "name": "mem",
    "connector": "memory"
  }
}
