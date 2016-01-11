var countries = require('country-data').countries;
module.exports = function(Report) {

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
