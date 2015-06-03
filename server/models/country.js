var countries = require('country-data').countries;
module.exports = function(Country) {
  /**
  * Returns all the reports that have been collected
  * @param {string[]} country_code country codes to filter by
  * @param {number} limit maximum number of results to return
  * @callback {Function} callback Callback function
  * @param {Error|string} err Error object
  * @param {Object} result Result object
  */
  Country.getCountryInfo = function(country_code, callback) {
    callback(null, countries[country_code]);
  }

  Country.remoteMethod('getCountryInfo',
    { isStatic: true,
    produces: [ 'application/json', 'application/xml', 'text/xml', 'text/html' ],
    accepts: 
    [ { arg: 'country_code',
        type: [ 'string' ],
        description: 'country codes to filter by',
        required: true,
        http: { source: 'query' } }],
    returns: 
    [ { description: 'unexpected error',
        type: 'Object',
        arg: 'data',
        root: true } ],
    http: { verb: 'get', path: '/info' },
    description: 'Returns the country information' }
  );


}

