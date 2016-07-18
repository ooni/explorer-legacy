var GLOBAL_CONFIG = require('../global-config');

var isDevEnv = (process.env.NODE_ENV || 'development') === 'development';

module.exports = {
  hostname: GLOBAL_CONFIG.hostname,
  restApiRoot: GLOBAL_CONFIG.restApiRoot,
  livereload: process.env.LIVE_RELOAD,
  isDevEnv: isDevEnv,
  indexFile: require.resolve(isDevEnv ?
    '../client/ngapp/index.html' : '../client/dist/index.html'),
  port: GLOBAL_CONFIG.port,
  legacyExplorer: GLOBAL_CONFIG.legacyExplorer,
  remoting: {
    errorHandler: {
      handler: function(error, req, res, next) {
        if (error instanceof Error) {
          console.log(
            'Error in %s %s: errorName=%s errorMessage=%s \n errorStack=%s',
              req.method, req.url, error.name, error.message, error.stack);
        }
        else {
          console.log(req.method, req.originalUrl, res.statusCode, error);
        }
        next();
      }
    }
  }
};
