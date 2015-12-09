'use strict';

/**
 * @ngdoc function
 * @name ooniAPIApp.controller:CountryViewCtrl
 * @description
 * # CountryViewCtrl
 * Controller of the ooniAPIApp
 */

angular.module('ooniAPIApp')
  .controller('CountryDetailViewCtrl', function ($q, $scope, $anchorScroll, $location, Report, Country, HttpRequestsInteresting, $routeParams) {

    $scope.countryCode = $routeParams.id;
    $scope.country = {};

    $scope.countryReports = {};

    Country.getCountryInfo({country_code: $scope.countryCode}, function(country) {
      $scope.country = country;
    });

    Report.findReports({country_code: "IT"}, function(response) {
      $scope.reports = response.reports;
    });
})
