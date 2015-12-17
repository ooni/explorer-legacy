'use strict';

/**
 * @ngdoc function
 * @name ooniAPIApp.controller:ExploreViewCtrl
 * @description
 * # ExploreViewCtrl
 * Controller of the ooniAPIApp
 */

angular.module('ooniAPIApp')
  .controller('ExploreViewCtrl', function ($q, $scope, $anchorScroll,
                                           $location, Report, Nettest,
                                           $routeParams, uiGridConstants) {

    $scope.loadMeasurements = function(queryOptions) {
      var deferred = $q.defer();

      var query = {
          filter: {
              fields: {
                  'test_name': true,
                  'probe_cc': true,
                  'input': true,
                  'test_start_time': true,
                  'id': true
              },
              where: queryOptions.where,
              order: queryOptions.order,
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

/**
 * @ngdoc function
 * @name ooniAPIApp.directive:ooniReportsTable
 * @description
 * # ooniReportsTable
 * A directive that wraps rows of the ooni reports
 */

.directive('ooniReportsTable', ["$location", "$filter", "Report", "Country", "uiGridConstants",
  function ($location, $filter, Report, Country, uiGridConstants) {
    return {
      restrict: 'A',
      scope: {
        reports: '=',
        showCountry: '='
      },
      link: function ($scope, $element, $attrs) {

      },
      templateUrl: 'views/directives/reports-table.html',
    };
}])
