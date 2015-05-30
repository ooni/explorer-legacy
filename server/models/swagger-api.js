
module.exports = function(SwaggerApi) {

/**
 * Returns all the reports that have been collected
 * @param {string[]} country_code country codes to filter by
 * @param {number} limit maximum number of results to return
 * @callback {Function} callback Callback function
 * @param {Error|string} err Error object
 * @param {Object} result Result object
 */
SwaggerApi.findReports = function(country_code, limit, callback) {
  var filter = {limit: limit};
  if (country_code && country_code.length) {
    filter.where = {tag: {inq: tags}};
  }
  SwaggerApi.app.models.report.find(filter, callback)
}

/**
 * Returns a user based on a single ID, if the user does not have access to the pet
 * @param {string} id ID of report to fetch
 * @callback {Function} callback Callback function
 * @param {Error|string} err Error object
 * @param {Object} result Result object
 */
SwaggerApi.findReportById = function(id, callback) {
  // Replace the code below with your implementation.
  // Please make sure the callback is invoked.
  process.nextTick(function() {
    var err = new Error('Not implemented');
    callback(err);
  });
  
}



SwaggerApi.remoteMethod('findReports',
  { isStatic: true,
  produces: [ 'application/json', 'application/xml', 'text/xml', 'text/html' ],
  accepts: 
   [ { arg: 'country_code',
       type: [ 'string' ],
       description: 'country codes to filter by',
       required: false,
       http: { source: 'query' } },
     { arg: 'limit',
       type: 'number',
       description: 'maximum number of results to return',
       required: false,
       http: { source: 'query' } } ],
  returns: 
   [ { description: 'unexpected error',
       type: 'Object',
       arg: 'data',
       root: true } ],
  http: { verb: 'get', path: '/reports' },
  description: 'Returns all the reports that have been collected' }
);

SwaggerApi.remoteMethod('findReportById',
  { isStatic: true,
  produces: [ 'application/json', 'application/xml', 'text/xml', 'text/html' ],
  accepts: 
   [ { arg: 'id',
       type: 'string',
       description: 'ID of report to fetch',
       required: true,
       http: { source: 'path' } } ],
  returns: 
   [ { description: 'report response',
       type: 'Report',
       arg: 'data',
       root: true },
     { description: 'unexpected error',
       type: 'Object',
       arg: 'data',
       root: true } ],
  http: { verb: 'get', path: '/reports/:id' },
  description: 'Returns a user based on a single ID, if the user does not have access to the pet' }
);

}
