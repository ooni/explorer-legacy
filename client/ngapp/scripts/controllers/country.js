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

/**
 * @ngdoc function
 * @name ooniAPIApp.directive:ooniReportsTableRow
 * @description
 * # ooniReportsTableRow
 * A directive that displays each OONI report as a table row.
 */

.directive('ooniReportsTableRow', ["$location", "$filter", "Report", "Country", "uiGridConstants",
  function ($location, $filter, Report, Country, uiGridConstants) {
    return {
      restrict: 'A',
      scope: {
        report: '=',
        showCountry: '='
      },
      link: function ($scope, $element, $attrs) {
        $scope.viewReport = function(report) {
          $location.path('/report/'+report.id);
        };
      },
      templateUrl: 'views/directives/reports-table-row.html',
    };
}]);
