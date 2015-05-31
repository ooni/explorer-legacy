module.exports = function(Report) {

  /**
  * Returns all the reports that have been collected
  * @param {string[]} country_code country codes to filter by
  * @param {number} limit maximum number of results to return
  * @callback {Function} callback Callback function
  * @param {Error|string} err Error object
  * @param {Object} result Result object
  */
  Report.findReports = function(country_code, fields, limit, callback) {
    var filter = {limit: limit};
    if (country_code && country_code.length) {
      filter.where = {country_code: {inq: country_code}};
    }
    if (fields && fields.length) {
      filter.fields = {}
      for (i in fields) {
        var field = fields[i];
        filter.fields[field] = true;
      }
    }
    Report.app.models.report.find(filter, callback)
  }

  Report.listReportFiles = function(key, callback) {
    var filter = {
      fields: {
        report_filename: true
      }
    }
    filter.fields[key] = true;
    function done(err, data) {
      var result = {};
      data.forEach(function(item){
        result[item[key]] = result[item[key]] || [];
        result[item[key]].push(item);
      });
      console.log(result);
      callback(err, result);
    }
    Report.app.models.report.find(filter, done);
  }

  Report.remoteMethod('findReports',
    { isStatic: true,
    produces: [ 'application/json', 'application/xml', 'text/xml', 'text/html' ],
    accepts: 
    [ { arg: 'country_code',
        type: [ 'string' ],
        description: 'country codes to filter by',
        required: false,
        http: { source: 'query' } },
        { arg: 'fields',
        type: [ 'string' ],
        description: 'list of fields to include in response',
        required: false,
        http: { source: 'query' } },
      { arg: 'limit',
        type: 'number',
        description: 'maximum number of results to return',
        required: false,
        http: { source: 'query' } },
      { arg: 'unique',
        type:  'boolean',
        description: 'if to return only unique values',
        required: false,
        http: { source: 'query' } }],
    returns: 
    [ { description: 'unexpected error',
        type: 'Object',
        arg: 'data',
        root: true } ],
    http: { verb: 'get', path: '/headers' },
    description: 'Returns all the report headers that have been collected' }
  );

  Report.remoteMethod('listReportFiles',
    { isStatic: true,
    produces: [ 'application/json', 'application/xml', 'text/xml', 'text/html' ],
    accepts: 
    [ { arg: 'by',
        type: 'string',
        description: 'what should be the key to list report files by',
        required: true,
        http: { source: 'query' } }],
    returns: 
    [ { description: 'unexpected error',
        type: 'Object',
        arg: 'data',
        root: true } ],
    http: { verb: 'get', path: '/files' },
    description: 'Returns all the report files submitted' }
  );



};
