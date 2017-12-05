var axios = require('axios')
var qs = require('qs')

var countries = require('country-data').countries

var apiClient = axios.create({
  //baseURL: 'https://api.ooni.io/api/',
  baseURL: 'http://localhost:3001/api/',
  timeout: 90000, // Maybe set this lower once performance is boosted
})

module.exports = function(Report) {

  Report.findMeasurements = function(probe_cc, input, order, page_number,
      page_size, since, until, test_name, callback) {
    var apiQuery = {}
    if (probe_cc) {
      apiQuery.probe_cc = probe_cc
    }
    if (input) {
      apiQuery.input = input
    }
    /*
     * XXX currently disabled due to gateway timeouts
     * cc @darkk
    if (order) {
      apiQuery.order_by = order.split(' ')[0]
      apiQuery.order = order.split(' ')[1]
    }
    */
    if (page_number && page_size) {
      apiQuery.offset = page_number * page_size
      apiQuery.limit = page_size
    }
    if (since) {
      apiQuery.since= since
    }
    if (until) {
      apiQuery.until = until
    }

    apiClient.get(`/v1/measurements?${qs.stringify(apiQuery)}`)
      .then(function(response) {
        callback(null, response.data.results)
      })
      .catch(function(error) {
        callback(error, null);
      })
  }
  Report.remoteMethod(
      'findMeasurements',
      { http: { verb: 'get' },
        description: 'Returns the list of measurements matching the query',
        accepts: [
          {arg: 'probe_cc', type: 'string'},
          {arg: 'input', type: 'string'},
          {arg: 'order', type: 'string'},
          {arg: 'page_number', type: 'string'},
          {arg: 'page_size', type: 'string'},
          {arg: 'since', type: 'string'},
          {arg: 'until', type: 'string'},
          {arg: 'test_name', type: 'string'}
        ],
        returns: {arg: 'data', type: ['Object'], root: true}
      }
  );


  Report.blockpageList = function(probe_cc, callback) {
    var apiQuery = {
      probe_cc: probe_cc
    }
    apiClient.get(`/_/blockpages?${qs.stringify(apiQuery)}`)
      .then(function(response) {
        callback(null, response.data.results)
      })
      .catch(function(error) {
        callback(error, null);
      })
  }

  Report.remoteMethod(
      'blockpageList',
      { http: { verb: 'get' },
        description: 'Returns the list of URLs that appear to be blocked in a given country',
        accepts: {arg: 'probe_cc', type: 'string'},
        returns: {arg: 'data', type: ['Object'], root: true}
      }
  );

  Report.total = function(callback) {
    apiClient.get(`/_/measurement_count_total`)
      .then(function(response) {
        callback(null, response.data)
      })
      .catch(function(error) {
        callback(error, null);
      })
  }

  Report.remoteMethod(
      'total',
      { http: { verb: 'get' },
        description: 'Returns the total number of measurements collected',
        returns: {arg: 'data', type: 'Object', root: true}
      }
  );

  Report.websiteDetails = function (website_url, callback) {
    var ds = Report.dataSource
    var wildcard_url = '%' + website_url

    var sql = 'SELECT * FROM domains WHERE url LIKE $1'
    ds.connector.query(sql, [wildcard_url], callback)
  }

  Report.remoteMethod(
      'websiteDetails',
      { http: { verb: 'get' },
        description: 'Returns website details',
        accepts: {arg: 'website_url', type: 'string'},
        returns: {arg: 'data', type: ['Object'], root: true}
      }
  )

  Report.asnName = function (asn, callback) {
    var ds = Report.dataSource

    var sql = 'SELECT name FROM asns WHERE asn = $1'
    ds.connector.query(sql, [asn], callback)
  }

  Report.remoteMethod(
      'asnName',
      { http: { verb: 'get' },
        description: 'Returns ASN name',
        accepts: {arg: 'asn', type: 'string'},
        returns: {arg: 'data', type: ['Object'], root: true}
      }
  )


  Report.websiteMeasurements = function (website_url, callback) {
    var ds = Report.dataSource
    var wildcard_url = '%' + website_url

    var sql = 'SELECT * FROM blockpage_urls WHERE input LIKE $1'
    ds.connector.query(sql, [wildcard_url], callback)
  }

  Report.remoteMethod(
      'websiteMeasurements',
      { http: { verb: 'get' },
        description: 'Returns website\'s measurements',
        accepts: {arg: 'website_url', type: 'string'},
        returns: {arg: 'data', type: ['Object'], root: true}
      }
  )

  Report.vendors = function(probe_cc, callback) {
    var ds = Report.dataSource;
    var sql = "SELECT * FROM identified_vendors";

    if (typeof(probe_cc) !== "undefined"){
        sql += " WHERE probe_cc = $1";
        ds.connector.query(sql, [probe_cc], callback);
    } else {
        ds.connector.query(sql, callback);
    }

  }

  Report.remoteMethod(
      'vendors',
      { http: { verb: 'get' },
        description: 'Returns the identified vendors of censorship and surveillance equipment',
        accepts: {arg: 'probe_cc', type: 'string'},
        returns: {arg: 'data', type: ['Object'], root: true}
      }
  );

  Report.blockpageDetected = function(callback) {
    var ds = Report.dataSource;
    var sql = "SELECT DISTINCT probe_cc FROM blockpage_count";
    ds.connector.query(sql, callback);
  }

  Report.remoteMethod(
      'blockpageDetected',
      { http: { verb: 'get' },
        description: 'Returns the country codes where we detected the presence of a blockpage',
        returns: { arg: 'data', type: ['Object'], root: true  }
      }
  );

  Report.blockpageCount = function(probe_cc, callback) {
    var ds = Report.dataSource;
    var sql = "SELECT * FROM blockpage_count WHERE probe_cc = $1 ORDER BY test_start_time";

    ds.connector.query(sql, [probe_cc], callback);
  }

  Report.remoteMethod(
      'blockpageCount',
      { http: { verb: 'get' },
        description: 'Returns the number of blockpages detected per total',
        accepts: {arg: 'probe_cc', type: 'string'},
        returns: { arg: 'data', type: ['Object'], root: true  }
      }
  );

  Report.countByCountry = function(callback) {
    apiClient.get(`/_/measurement_count_by_country`)
      .then(function(response) {
        var result = [];
        response.data.results.forEach(function(row) {
            var country = countries[row['probe_cc']];
            if (country !== undefined) {
                result.push({
                    name: country.name,
                    alpha3: country.alpha3,
                    alpha2: country.alpha2,
                    count: row['count']
                });
            }
        });
        callback(null, result)
      })
      .catch(function(error) {
        callback(error, null);
      })
  }

  Report.remoteMethod(
      'countByCountry',
      { http: { verb: 'get' },
        description: 'Get number of reports by country code',
        accepts: [],
        returns: { arg: 'data', type: ['Object'], root: true  }
      }
  );
};
