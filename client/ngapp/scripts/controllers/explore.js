'use strict';

/**
 * @ngdoc function
 * @name ooniAPIApp.controller:ExploreViewCtrl
 * @description
 * # ExploreViewCtrl
 * Controller of the ooniAPIApp
 */

angular.module('ooniAPIApp')
  .controller('ExploreViewCtrl', function ($q, $scope, $anchorScroll, $location, Report, Country, HttpRequestsInteresting, $routeParams) {

    // XXX should use external pagination feature of ui grid
    // http://ui-grid.info/docs/#/tutorial/314_external_pagination
    $scope.pageNumber = 0;
    $scope.pageSize = 100;

    // XXX The ordering should be determined from the GUI
    $scope.order = "test_start_time DESC";

    var query = {
        filter: {
            fields: {
                'test_name': true,
                'probe_cc': true,
                'input': true,
                'test_start_time': true,
                'report_id': true
            },
            where: {
                'probe_cc': $scope.countryCode
            },
            order: $scope.order,
            offset: $scope.pageNumber * $scope.pageSize,
            limit: $scope.pageSize
        }
    }
    Report.find(query, function(data) {
        $scope.reports = data;
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
            if (report.input === undefined) {
                $location.path('/report/' + report.id);
            } else {
                $location.path('/report/' + report.id)
                    .search({input: report.input});
            }
        };

        $scope.viewCountry = function(countryCode) {
          $location.path('/country/' + countryCode);
        };
      },
      templateUrl: 'views/directives/reports-table-row.html',
    };
}]);
