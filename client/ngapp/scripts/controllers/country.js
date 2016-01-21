'use strict';

/**
 * @ngdoc function
 * @name ooniAPIApp.controller:CountryViewCtrl
 * @description
 * # CountryViewCtrl
 * Controller of the ooniAPIApp
 */

angular.module('ooniAPIApp')
  .controller('CountryDetailViewCtrl', function ($q, $scope, $rootScope, $filter, Report, $http, $routeParams, ISO3166) {
    $scope.loaded = false;

    $scope.countryCode = $routeParams.id;
    $scope.countryName = ISO3166.getCountryName($scope.countryCode);

    $http.get('bower_components/factbook-country-data/data/' + $scope.countryCode + '.json')
      .then(function(response) {
        $scope.countryDetails = response.data;
      }, function(error) {
        console.log('error', error)
      })

    Report.blockpageCount( {probe_cc: $scope.countryCode}, function(resp) {
      // this goes off and gets processed by the bar-chart directive
      $scope.blockpageCount = resp;
    });

    Report.blockpageList( {probe_cc: $scope.countryCode}, function(resp) {
      $scope.blockpageList = resp;

      $scope.chunkedBlockpageList = {}

      resp.forEach(function(page) {
        if ($scope.chunkedBlockpageList[page.input] === undefined) {
          $scope.chunkedBlockpageList[page.input] = {
            measurements: [page]
          }
        } else {
          $scope.chunkedBlockpageList[page.input].measurements.push(page)
        }
      })

      console.log($scope.chunkedBlockpageList)
    });

    Report.vendors( {probe_cc: $scope.countryCode}, function(resp) {
      $scope.vendors = resp;
      console.log('vendors', resp);
    });

    Report.count({where: {probe_cc: $scope.countryCode }}, function(count) {
      $scope.count = count.count;
    });

    // XXX should use external pagination feature of ui grid
    // http://ui-grid.info/docs/#/tutorial/314_external_pagination

    $scope.loadMeasurements = function(queryOptions) {
      var deferred = $q.defer();

      queryOptions.where['probe_cc'] = $scope.countryCode;
      var query = {
          filter: {
              fields: {
                  'test_name': true,
                  'input': true,
                  'probe_cc': true,
                  'test_start_time': true,
                  'id': true,
                  'probe_asn': true
              },
              where: queryOptions.where,
              offset: queryOptions.pageNumber * queryOptions.pageSize,
              limit: queryOptions.pageSize
          }
      }

      if (queryOptions.order) {
        query.filter.order = queryOptions.order;
      }

      Report.find(query, function(data) {
        deferred.resolve(data);
        $scope.loaded = true;
      });

      return deferred.promise;
    }

})
