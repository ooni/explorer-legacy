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
    $scope.pageNumber = 0;
    $scope.pageSize = 100;

    var query = {
        filter: {
            fields: {
                'test_name': true,
                'input': true,
                'test_start_time': true
            },
            where: {
                'probe_cc': $scope.countryCode
            },
            offset: $scope.pageNumber * $scope.pageSize,
            limit: $scope.pageSize
        }
    }
    Report.find(query, function(data) {
        $scope.reports = data;
    });
})
