var countries = require('country-data').countries;
module.exports = function(Report) {


  Report.blockpageList = function(probe_cc, callback) {
    var ds = Report.dataSource;
    var sql = "SELECT * FROM blockpage_urls WHERE probe_cc = $1";

    ds.connector.query(sql, [probe_cc], callback);
  }

  Report.remoteMethod(
      'blockpageList',
      { http: { verb: 'get' },
        description: 'Returns the list of URLs that appear to be blocked in a given country',
        accepts: {arg: 'probe_cc', type: 'string'},
        returns: { arg: 'data', type: ['Object'], root: true  }
      }
  );


  Report.vendors = function(probe_cc, callback) {
    var ds = Report.dataSource;
    var sql = "SELECT * FROM identified_vendors WHERE probe_cc = $1";

    ds.connector.query(sql, [probe_cc], callback);
  }

  Report.remoteMethod(
      'vendors',
      { http: { verb: 'get' },
        description: 'Returns the identified vendors of censorship and surveillance equipment',
        accepts: {arg: 'probe_cc', type: 'string'},
        returns: { arg: 'data', type: ['Object'], root: true  }
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
    var ds = Report.dataSource;
    var sql = "SELECT probe_cc, count FROM country_counts_view";

    ds.connector.query(sql, function(err, data){
        if (err) {
            callback(err, null);
        }
        var result = [];
        data.forEach(function(row) {
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

        callback(err, result);
    });
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
