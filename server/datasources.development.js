module.exports = {
  "db": {
    "host": process.env.DB_HOST || "localhost",
    "port": process.env.DB_PORT || "5432",
    "database": process.env.DB_NAME || "ooni_pipeline",
    "username": process.env.DB_USERNAME || "ooni",
    "password": process.env.DB_PASSWORD || "",
    "name": "postgres",
    "debug": false,
    "connector": "postgresql",
    "ssl": process.env.DISABLE_SSL !== 'true'
  },
  "mem": {
    "name": "mem",
    "connector": "memory"
  }
}
