# How to

To start the service run:

```
slc ctl start
slc ctl env-set ooni-api REPORT_DB_URL="postgres://ooni:PASSWORD@HOSTNAME:5432/ooni_pipeline"
```

To inspect the console log output:

```
slc ctl log-dump ooni-api
```

# Resources

https://strongloop.com/strongblog/node-js-deploy-production-best-practice/
