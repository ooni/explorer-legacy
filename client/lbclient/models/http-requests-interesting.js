module.exports = function(HttpRequestsInteresting) {
  HttpRequestsInteresting.findInteresting = function(country_code, fields, limit, callback) {
    HttpRequestsInteresting.app.models.RemoteHttpRequestsInteresting.findInteresting(country_code, fields, limit, callback)
  }
  
  HttpRequestsInteresting.listInteresting = function(key, callback) {
    HttpRequestsInteresting.app.models.RemoteHttpRequestsInteresting.find(key, callback);
  }
};
