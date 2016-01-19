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
        hideFilter: '=?',
        countryCodes: '=?',
        totalItems: '=?',
        useExternalPagination: '=?', // defaults to True
        enablePagination: '=?', // defaults to True
        useExternalSorting: '=?', // defaults to True
      },
      link: function ($scope, $element, $attrs) {

        $scope.filterFormOpen = false;

        $rootScope.$watch('loaded', function() {
          // There is some problems with how rootscope is seen
          // by this directive
          $scope.loaded = $rootScope.loaded;
        });

        $scope.$watch('totalItems', function(newVal) {
          $scope.gridOptions.totalItems = newVal;
        })

        $scope.$watch('countryCodes', function(ccsBool) {
          if (ccsBool !== undefined && ccsBool === true) {
            $scope.allCountryCodes = {}
            Report.countByCountry({}, function(data) {
              // TODO: this should be loaded on app load if it's used regularly in views.
              // Don't want to reload every time the view is loaded.

              data.forEach(function(country) {
                $scope.allCountryCodes[country.alpha2] = country.name;
              })
            }, function(error) {
              console.log('error', error)
            })
          }
        });

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
          $scope.gridApi.core.queueRefresh()
        }

        $scope.filterMeasurements = function() {
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
            $scope.getDataFunction($scope.queryOptions).then(assignData);
        }

        $scope.gridOptions.rowTemplate = $scope.rowTemplate;

        $scope.gridOptions.enablePagination = $scope.enablePagination !== undefined ? $scope.enablePagination : true;
        $scope.gridOptions.useExternalPagination = $scope.useExternalPagination !== undefined ? $scope.useExternalPagination : true;
        $scope.gridOptions.useExternalSorting = $scope.useExternalSorting !== undefined ? $scope.useExternalSorting : true;

        $scope.gridOptions.paginationPageSize = $scope.queryOptions.pageSize;
        $scope.gridOptions.paginationPageSizes = [50, 100, 150];

        $scope.gridOptions.onRegisterApi = function(gridApi) {
            $scope.gridApi = gridApi;
            $scope.gridApi.core.on.sortChanged($scope, function(grid, sortColumns) {
              if (sortColumns.length > 0) {
                $scope.queryOptions.order = sortColumns[0].field + " " + sortColumns[0].sort.direction.toUpperCase();
              }
              console.log($scope.queryOptions.order)
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

.directive('ooniLoader',
  function () {
    return {
      restrict: 'A',
      scope: {
        loaded: '=',
        phrases: '=?'
      },
      controller: function($scope) {
        $scope.loading_phrases = [
          "Hacking some planet",
          "Extracting square root of i",
          "Modifying the space time continuum",
          "Adjusting ultra speed variable to be nominal",
          "Performing a safety meeting"
        ];
      },
      templateUrl: 'views/directives/ooni-loader.directive.html',
    };
})

.directive('ooniCountryBarChart',
  function ($filter) {
    return {
      restrict: 'A',
      scope: {
        countryData: '=',
      },
      link: function($scope) {

        $scope.$watch('countryData', function() {
          if ($scope.countryData) {
            console.log('country data loaded', $scope.countryData)
            var minGroupWidth = 90;
            var containerWidth = parseInt(d3.select('.container').style('width'), 10)

            if (minGroupWidth * $scope.countryData.length > containerWidth) {
              containerWidth = minGroupWidth * $scope.countryData.length;
            }

            var margin = {top: 60, right: 30, bottom: 60, left: 0},
                width = containerWidth - margin.left - margin.right,
                height = 240 - margin.top - margin.bottom,
                groupWidth = width / $scope.countryData.length,
                barWidth = groupWidth / 3;

            var max = d3.max($scope.countryData, function(d) {return parseInt(d.total_count, 10) })

            console.log(max)

            var y = d3.scale.linear()
                .domain([0, max])
                .range([height, 0]);

            var chart = d3.select('#blockpageCount-bar-chart')
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
              .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

            var barGroup = chart.selectAll('g')
                .data($scope.countryData)
              .enter().append('g')
                .attr('transform', function(d, i) {
                  var eachBar = parseInt(groupWidth * i, 10)
                  return "translate(" + (eachBar) + ",0)";
                })

            barGroup.append("rect")
              .attr('class', 'bar total')
              .attr('height', 0)
              .attr('x', groupWidth / 2)
              .attr('y', height)
              .attr('width', barWidth)
              .transition()
                .duration(1000)
                .attr('y', function(d) { console.log(d); return y(d.total_count); })
                .attr('height', function(d) { return height - y(d.total_count); })

            barGroup.append("rect")
              .attr('class', 'bar blocked')
              .attr('width', barWidth)
              .attr('x', groupWidth / 2)
              .attr('y', height)
              .attr('height', 0)
              .transition()
                .duration(1000)
                .attr('y', function(d) { return y(d.block_count); })
                .attr('height', function(d) { return height - y(d.block_count); })

            // text
            barGroup.append('text')
              .attr("x", barWidth * 2)
              .classed({'total': true})
              .attr("y", function(d) { return y(d.total_count) - 20; })
              .attr("dy", ".75em")
              .text(function(d) { return d.total_count; });

            // blocked
            barGroup.append('text')
              .attr('x', barWidth * 2 + barWidth)
              .classed({'blocked': true})
              .attr('y', function(d) { return y(d.block_count) - 10; })
              .attr("dy", ".75em")
              .text(function(d) { return d.block_count; });

            // date
            barGroup.append("text")
              .attr('class', 'date')
              // .attr("", barWidth * 2)
              // .attr("y", height )
              .attr("dy", ".4em")
              .attr("transform", "translate("+ (barWidth * 2) +"," +(+height + 10) +")rotate(65)")
              .text(function(d) { return $filter('date')(d.test_start_time, 'shortDate'); });
          }
        })

      },
      templateUrl: 'views/directives/ooni-country-bar-chart.directive.html',
    };
})
