module.exports = function(Country) {
  var app = require('lbclient'); 

  Country.prototype.getCountryInfo = function(country_code, callback) {
    app.models().country.getCountryInfo(country_code, callback);
  }
}
