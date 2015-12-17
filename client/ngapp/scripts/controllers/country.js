'use strict';

/**
 * @ngdoc function
 * @name ooniAPIApp.controller:CountryViewCtrl
 * @description
 * # CountryViewCtrl
 * Controller of the ooniAPIApp
 */

angular.module('ooniAPIApp')
  .controller('CountryDetailViewCtrl', function ($q, $scope, Report, $routeParams, ISO3166) {

    $scope.countryCode = $routeParams.id;
    $scope.country = ISO3166.getCountryName($scope.countryCode);

    // XXX should use external pagination feature of ui grid
    // http://ui-grid.info/docs/#/tutorial/314_external_pagination

    $scope.loadMeasurements = function(queryOptions) {
      var deferred = $q.defer();

      var query = {
          filter: {
              fields: {
                  'test_name': true,
                  'input': true,
                  'test_start_time': true,
                  'report_id': true
              },
              where: {
                  'probe_cc': $scope.countryCode
              },
              offset: queryOptions.pageNumber * queryOptions.pageSize,
              limit: queryOptions.pageSize
          }
      }
      Report.find(query, function(data) {
        deferred.resolve(data);
      });

      return deferred.promise;
    }

})
