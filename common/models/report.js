var countries = require('country-data').countries;
module.exports = function(Report) {

  Report.countByCountry = function(alpha2, callback) {
    var ds = Report.dataSource;
    var sql = "SELECT probe_cc, count FROM country_counts_view";

    // This is clearly not ideal, does Strongloop provide for sanitization?
    // Surely their query language is a bit stronger than this?
    if (alpha2 !== undefined && alpha2 !== null) {
      sql += " WHERE probe_cc='" + alpha2 + "';";
    }

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
        accepts: { arg: 'alpha2', type: 'string' },
        returns: { arg: 'data', type: ['Object'], root: true  }
      }
  );
};
