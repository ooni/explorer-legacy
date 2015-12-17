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

    $scope.gridOptions = {};

    $scope.pageNumber = 0;
    $scope.pageSize = 100;

    $scope.order = "test_start_time DESC";
    $scope.where = {};

    $scope.inputFilter = "";
    $scope.testNameFilter = "";
    $scope.countryCodeFilter = "";
    $scope.nettests = Nettest.find();

    var loadMeasurements = function() {
        var query = {
            filter: {
                fields: {
                    'test_name': true,
                    'probe_cc': true,
                    'input': true,
                    'test_start_time': true,
                    'report_id': true
                },
                where: $scope.where,
                order: $scope.order,
                offset: $scope.pageNumber * $scope.pageSize,
                limit: $scope.pageSize
            }
        }
        Report.find(query, function(data) {
            $scope.gridOptions.data = data;
        });
    }

    $scope.filterMeasurements = function() {
        $scope.where = {};
        if ($scope.inputFilter.length > 0) {
            $scope.where['input'] = $scope.inputFilter;
        }
        if ($scope.testNameFilter.length > 0) {
            $scope.where['test_name'] = $scope.testNameFilter;
        }
        if ($scope.countryCodeFilter.length > 0) {
            $scope.where['probe_cc'] = $scope.countryCodeFilter;
        }
        loadMeasurements();
    }

    $scope.gridOptions.columnDefs = [
        {
            name: 'Country code',
            field:'probe_cc'
        },
        {
            name: 'ASN',
            field:'probe_asn'
        },
        {
            name: 'Test name',
            field:'test_name'
        },
        {
            name: 'Input',
            field:'input'
        },
        {
            name: 'Start time',
            field:'test_start_time'
        }
    ];
    $scope.gridOptions.useExternalPagination = true;
    $scope.gridOptions.useExternalSorting = true;
    $scope.gridOptions.paginationPageSize = $scope.pageSize;
    $scope.gridOptions.paginationPageSizes = [50, 100, 150];

    $scope.gridOptions.onRegisterApi = function(gridApi) {
        $scope.gridApi = gridApi;
        $scope.gridApi.core.on.sortChanged($scope, function(grid, sortColumns) {
            $scope.order = sortColumns[0].field + " " + sortColumns[0].sort.direction.toUpperCase();
            loadMeasurements();
        });
        gridApi.pagination.on.paginationChanged($scope, function (newPage, pageSize) {
            $scope.pageNumber = newPage;
            $scope.pageSize = pageSize;
            loadMeasurements();
        });
    }
    loadMeasurements();
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
