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
                                           $location, Nettest, Report,
                                           $routeParams, uiGridConstants,
                                           $rootScope) {

    $scope.loadMeasurements = function(queryOptions) {

      $scope.loaded = false;

      var deferred = $q.defer();
      console.log(queryOptions)
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
      var params = {}

      if (queryOptions.where) {
        params.probe_cc = queryOptions.where.probe_cc
        params.input = queryOptions.where.input
        params.test_name = queryOptions.where.test_name
        params.since = queryOptions.where.test_start_time && queryOptions.where.test_start_time.between[0]
        params.until = queryOptions.where.test_start_time && queryOptions.where.test_start_time.between[1]
      }
      params.order = queryOptions.order
      params.page_size = queryOptions.pageSize
      params.page_number = queryOptions.pageNumber

      Report.total(function (result) {
        Report.findMeasurements(params, function(data) {
          data.total = result.total;
          deferred.resolve(data);

          $scope.loaded = true;
        });
      })

      return deferred.promise;
    }

});
