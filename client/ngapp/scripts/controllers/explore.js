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
                                           $routeParams, uiGridConstants,
                                           $rootScope) {

    $scope.loadMeasurements = function(queryOptions) {
      $rootScope.loaded = false;

      var deferred = $q.defer();

      var query = {
          filter: {
              fields: {
                  'test_name': true,
                  'probe_cc': true,
                  'probe_asn': true,
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
        $rootScope.loaded = true;
      });

      return deferred.promise;
    }

});
