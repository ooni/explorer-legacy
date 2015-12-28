/**
 * @ngdoc function
 * @name ooniAPIApp.directive:ooniGridWrapper
 * @description
 * # ooniReportsTableRow
 * A directive that displays a UI Grid according to OONI standards.
 */

angular.module('ooniAPIApp')
.directive('ooniGridWrapper',
  function ($location, $rootScope, $filter, Report, Country, Nettest, uiGridConstants ) {
    return {
      restrict: 'A',
      scope: {
        getDataFunction: '=',
        queryOptions: '=?', // TODO: still need to implement this
        viewRowObjectFunction: '=?', // TODO: still need to implement this
        customColumnDefs: '=?',
        hideFilter: '=?'
      },
      link: function ($scope, $element, $attrs) {

        $rootScope.$watch('loaded', function() {
          // There is some problems with how rootscope is seen
          // by this directive
          $scope.loaded = $rootScope.loaded;
        })

        $scope.gridOptions = {};
        $scope.queryOptions = {};
        $scope.queryOptions.pageNumber = 0;
        $scope.queryOptions.pageSize = 100;

        $scope.queryOptions.order = "test_start_time DESC";
        $scope.queryOptions.where = {};

        $scope.inputFilter = "";
        $scope.testNameFilter = "";
        $scope.countryCodeFilter = "";
        $scope.startDateFilter = "";
        $scope.endDateFilter = "";
        $scope.nettests = Nettest.find();

        if ($scope.customColumnDefs !== undefined) {
          $scope.gridOptions.columnDefs = $scope.customColumnDefs;
        } else {
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
              },
              {
                  field: 'id',
                  visible: false
              }
          ];
        }

        if ($scope.viewRowObjectFunction !== undefined) {
          $scope.viewRowObject = $scope.viewRowObjectFunction
        } else {
          $scope.viewRowObject = function(row) {
              var report = row.entity;
              if (report.input === undefined) {
                  $location.path('/measurement/' + report.id);
              } else {
                  $location.path('/measurement/' + report.id)
                      .search({input: report.input});
              }
          }
        }

        $scope.rowTemplate = '/views/directives/row-template.html'

        var assignData = function(data) {
          $scope.gridOptions.data = data;
        }

        $scope.filterMeasurements = function() {
            console.log('date filters', $scope.startDateFilter, $scope.endDateFilter);
            $scope.queryOptions.where = {};
            if ($scope.inputFilter.length > 0) {
                $scope.queryOptions.where['input'] = {'like': '%' + $scope.inputFilter + '%'};
            }
            if ($scope.testNameFilter.length > 0) {
                $scope.queryOptions.where['test_name'] = $scope.testNameFilter;
            }
            if ($scope.countryCodeFilter.length > 0) {
                $scope.queryOptions.where['probe_cc'] = $scope.countryCodeFilter;
            }
            if ($scope.startDateFilter.length > 0) {
              if ($scope.queryOptions.where['test_start_time'] === undefined) {
                $scope.queryOptions.where['test_start_time'] = {}
              }
              $scope.queryOptions.where['test_start_time']['gte'] = $scope.startDateFilter;
            }
            if ($scope.endDateFilter.length > 0) {
              if ($scope.queryOptions.where['test_start_time'] === undefined) {
                $scope.queryOptions.where['test_start_time'] = {}
              }
              $scope.queryOptions.where['test_start_time']['lte'] = $scope.endDateFilter;
            }
            console.log('resending query', $scope.queryOptions.where)
            $scope.getDataFunction($scope.queryOptions).then(assignData);
        }

        $scope.gridOptions.rowTemplate = $scope.rowTemplate;
        $scope.gridOptions.useExternalPagination = true;
        $scope.gridOptions.useExternalSorting = true;
        $scope.gridOptions.paginationPageSize = $scope.queryOptions.pageSize;
        $scope.gridOptions.paginationPageSizes = [50, 100, 150];

        $scope.gridOptions.onRegisterApi = function(gridApi) {
            $scope.gridApi = gridApi;
            $scope.gridApi.core.on.sortChanged($scope, function(grid, sortColumns) {
                $scope.queryOptions.order = sortColumns[0].field + " " + sortColumns[0].sort.direction.toUpperCase();
                $scope.getDataFunction($scope.queryOptions).then(assignData);
            });
            gridApi.pagination.on.paginationChanged($scope, function (newPage, pageSize) {
                $scope.queryOptions.pageNumber = newPage;
                $scope.queryOptions.pageSize = pageSize;
                $scope.getDataFunction($scope.queryOptions).then(assignData);
            });
        }


        $scope.getDataFunction($scope.queryOptions).then(assignData);

      },
      templateUrl: 'views/directives/ooni-grid-wrapper-directive.html',
    };
})

.directive('ooniMoreInfoHover',
  function () {
    return {
      restrict: 'A',
      scope: {
        definition: '=',
        content: '=',
        id: '=?',
        label: '=?'
      },
      templateUrl: 'views/directives/ooni-more-info-hover-directive.html',
    };
})

.directive('ooniReportDetailTableRow',
  function () {
    return {
      restrict: 'A',
      scope: {
        definition: '=?',
        content: '=',
        id: '=?',
        label: '=?'
      },
      templateUrl: 'views/directives/ooni-report-detail-table-row.html',
    };
})
