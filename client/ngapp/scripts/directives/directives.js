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

        $rootScope.$watch('loaded', function() {
          // There is some problems with how rootscope is seen
          // by this directive
          $scope.loaded = $rootScope.loaded;
        });

        $scope.$watch('totalItems', function(newVal) {
          $scope.gridOptions.totalItems = newVal;
        })

        $scope.filterCallback = function() {
          $scope.getDataFunction($scope.queryOptions).then(assignData)
        }

        $scope.gridOptions = {};
        $scope.queryOptions = {};
        $scope.queryOptions.pageNumber = 0;
        $scope.queryOptions.pageSize = 100;

        $scope.queryOptions.order = "test_start_time DESC";
        $scope.queryOptions.where = {};

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
              if (typeof report.input === 'undefined' || report.input === null) {
                  return '/measurement/' + report.report_id;
              } else {
                  return '/measurement/' + report.report_id + '?input=' + encodeURIComponent(report.input);
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
                $scope.queryOptions.where['input'] = $scope.inputFilter;
            }
            if ($scope.testNameFilter.length > 0) {
                $scope.queryOptions.where['test_name'] = $scope.testNameFilter;
            }
            if ($scope.countryCodeFilter.length > 0) {
                $scope.queryOptions.where['probe_cc'] = $scope.countryCodeFilter;
            }
            var start, end;
            if ($scope.dateRangePicker.date.startDate && $scope.dateRangePicker.date.endDate) {
              start = $scope.dateRangePicker.date.startDate.hours(0).minutes(0).toISOString();
              end = $scope.dateRangePicker.date.endDate.hours(0).minutes(0).toISOString();
              $scope.queryOptions.where['test_start_time'] = {
                between: [start, end]
              }
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
              $scope.getDataFunction($scope.queryOptions).then(assignData);
            });
            gridApi.pagination.on.paginationChanged($scope, function (newPage, pageSize) {
              $scope.queryOptions.pageNumber = newPage - 1;
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

.directive('ooniLoadingMore',
  function () {
    return {
      restrict: 'A',
      scope: {
        initialChunks: '=',
        allChunks: '='
      },
      controller: function($scope, $element, $attrs) {
        console.log($element)
      }
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
          "Exploring the dark web",
          "Listening to the frequency of space",
          "Searching for alien life forms",
          "Turning down gravity to 8.63",
          "Proving Fermat's last theorem"
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

        $scope.page = 1;
        $scope.perPage = 14;

        var sliceBackwards = function(arr, perPage, page) {
          var start = -perPage * page;
          var end = -$scope.perPage * ($scope.page - 1)
          if (end >= -0) {
            return arr.slice(start)
          } else {
            return arr.slice(start, end)
          }
        }

        var updateData = function(chart, data) {


          var barWidth = $scope.groupWidth / 3,
              groupWidth = $scope.groupWidth,
              y = $scope.y,
              height = $scope.height;

          // set to data
          var barGroup = chart.selectAll('.bar-group')
              .data(data, function(d) {return d.test_start_time});

          // update old attributes

          barGroup
            .transition()
              .duration(750)
              .attr('transform', function(d, i) {
                var eachBar = parseInt(groupWidth * i, 10);
                return "translate(" + (eachBar) + ",0)";
              });

          // enter
          var barGroupEnter = barGroup
            .enter().append('g')
              .classed('bar-group', true)
              .attr('transform', function(d, i) {
                var eachBar = parseInt(groupWidth * i, 10);
                return "translate(" + (eachBar) + ",0)";
              });

          barGroupEnter.append("rect")
            .attr('class', 'bar total')
            .attr('height', 0)
            .attr('width', barWidth)
            .attr('x', groupWidth / 2)
            .attr('y', height)
            .transition()
              .duration(1000)
              .attr('y', function(d) { return y(d.total_count); })
              .attr('height', function(d) { return height - y(d.total_count); });

          barGroupEnter.append("rect")
            .attr('class', 'bar blocked')
            .attr('width', barWidth)
            .attr('x', groupWidth / 2)
            .attr('y', height)
            .attr('height', 0)
            .transition()
              .duration(1000)
              .attr('y', function(d) { return y(d.block_count); })
              .attr('height', function(d) { return height - y(d.block_count); });

          // text
          barGroupEnter.append('text')
            .attr("x", barWidth * 2)
            .classed({'total': true})
            .attr("y", function(d) { return y(d.total_count) - 20; })
            .attr("dy", ".75em")
            .text(function(d) { return d.total_count; });

          // blocked
          barGroupEnter.append('text')
            .attr('x', barWidth * 2 + barWidth - 8)
            .classed({'blocked': true})
            .attr('y', function(d) { return y(d.block_count) - 10; })
            .attr("dy", ".75em")
            .text(function(d) { return d.block_count; });

          // date
          barGroupEnter.append("text")
            .attr('class', 'date')
            .attr("dy", ".4em")
            .attr("transform", "translate("+ (barWidth * 2) +"," +(+height + 10) +")rotate(65)")
            .text(function(d) { return $filter('date')(d.test_start_time, 'shortDate'); });

          // exit
          barGroup.exit().remove()
        };

        $scope.$watch('countryData', function() {
          if ($scope.countryData) {

            var minGroupWidth = 90;
            var containerWidth = parseInt(d3.select('.container').style('width'), 10);

            var margin = {top: 60, right: 30, bottom: 80, left: 0},
                width = containerWidth - margin.left - margin.right;

            $scope.height = 240 - margin.top - margin.bottom;
            $scope.groupWidth = width / $scope.perPage;

            // only get the most recent data
            var viewing = sliceBackwards($scope.countryData, $scope.perPage, $scope.page);

            var max = d3.max($scope.countryData, function(d) {return parseInt(d.total_count, 10) });

            $scope.y = d3.scale.linear()
                .domain([0, max])
                .range([$scope.height, 0]);

            $scope.chart = d3.select('#blockpageCount-bar-chart')
                .attr("width", width + margin.left + margin.right)
                .attr("height", $scope.height + margin.top + margin.bottom)
              .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

            updateData($scope.chart, viewing);

          }
        });

        $scope.viewOlder = function(){
          $scope.page++;
          var viewing = sliceBackwards($scope.countryData, $scope.perPage, $scope.page)

          updateData($scope.chart, viewing);
        };

        $scope.viewNewer = function(){
          $scope.page--;
          var viewing = sliceBackwards($scope.countryData, $scope.perPage, $scope.page)

          updateData($scope.chart, viewing);
        };

      },
      templateUrl: 'views/directives/ooni-country-bar-chart.directive.html',
    };
})

.directive('ooniInfoCountryList',
  function () {
    return {
      restrict: 'A',
      scope: {
        getDataFunction: '='
      },
      link: function ($scope) {

        var assignData = function (response) {
          $scope.countries = response;
        }

        $scope.getDataFunction({}).then(assignData)
      },
      templateUrl: 'views/directives/ooni-info-country-list.directive.html'
    }
  })

.directive('ooniInfoExplorerList',
  function (Nettest) {
    return {
      restrict: 'A',
      scope: {
        getDataFunction: '='
      },
      link: function ($scope) {
        console.log('loaded explorer list')

        $scope.queryOptions = {}
        $scope.queryOptions.pageNumber = 0
        $scope.queryOptions.pageSize = 100

        $scope.queryOptions.order = 'test_start_time DESC'
        $scope.queryOptions.where = {}

        $scope.filterCallback = function() {
          $scope.getDataFunction($scope.queryOptions).then(assignData)
        }

        var assignData = function (response) {
          $scope.measurements = response
          $scope.total = Math.floor($scope.measurements.total / $scope.queryOptions.pageSize)
        }

        $scope.goTo = function (page) {
          $scope.queryOptions.pageNumber = page
          $scope.getDataFunction($scope.queryOptions).then(assignData)
        }

        $scope.getDataFunction($scope.queryOptions).then(assignData)
      },
      templateUrl: 'views/directives/ooni-info-explorer-list.directive.html'
    }
  })

.directive('scrollTo', function() {
    return {
      restrict: 'A',
      link: function ($scope, $element, $attrs) {
        $element.bind('click', function(event) {
          var sectionName = $attrs.scrollTo;
          var currentPosition = window.pageYOffset;
          var bbox = document.getElementById(sectionName).getBoundingClientRect();
          var scrollOffsetY = bbox.top + currentPosition;
          window.scroll(0, scrollOffsetY);
        })
      }
    }
  })

.directive('ooniPagination',
  function () {
    return {
      restrict: 'A',
      scope: {
        pageNumber: '=',
        goTo: '=',
        total: '=',
        pageSize: '='
      },
      templateUrl: 'views/directives/ooni-pagination.directive.html'
    }
  })

.directive('ooniExplorerListMeasurement',
  function () {
    return {
      restrict: 'A',
      scope: {
        measurement: '=ooniExplorerListMeasurement'

      },
      link: function ($scope) {
        $scope.encodeInput = window.encodeURIComponent
      },
      templateUrl: 'views/directives/ooni-explorer-list-measurement.directive.html'
    }
  })

.directive('ooniFilterListForm',
  function (Nettest, Report) {
    return {
      restrict: 'A',
      scope: {
        queryOptions: '=',
        afterFilter: '=',
        showCountryFilter: '='
      },
      link: function ($scope) {
        $scope.encodeInput = window.encodeURIComponent
        $scope.inputFilter = ''
        $scope.testNameFilter = ''
        $scope.countryCodeFilter = ''
        $scope.startDateFilter = ''
        $scope.endDateFilter = ''
        $scope.nettests = Nettest.find()

        $scope.dateRangePicker = {}

        $scope.dateRangePicker.date = {
          startDate: null,
          endDate: null
        }

        $scope.dateRangePicker.options = {
          maxDate: moment(),
          autoUpdateInput: true,
          eventHandlers: {
            'cancel.daterangepicker': function(ev, picker) {
              $scope.dateRangePicker.date = {startDate: null, endDate: null}
            }
          }
        }

        $scope.filterMeasurements = function () {
          $scope.queryOptions.where = {}
          if ($scope.inputFilter.length > 0) {
            $scope.queryOptions.where['input'] = $scope.inputFilter
          }
          if ($scope.testNameFilter.length > 0) {
            $scope.queryOptions.where['test_name'] = $scope.testNameFilter
          }
          if ($scope.countryCodeFilter.length > 0) {
            $scope.queryOptions.where['probe_cc'] = $scope.countryCodeFilter
          }
          var start, end
          if ($scope.dateRangePicker.date.startDate && $scope.dateRangePicker.date.endDate) {
            start = $scope.dateRangePicker.date.startDate.hours(0).minutes(0).toISOString()
            end = $scope.dateRangePicker.date.endDate.hours(0).minutes(0).toISOString()
            $scope.queryOptions.where['test_start_time'] = {
              between: [start, end]
            }
          }

          $scope.afterFilter()
        }

        $scope.$watch('showCountryFilter', function (ccsBool) {
          console.log(ccsBool)
          if (ccsBool !== undefined && ccsBool === true) {
            $scope.allCountryCodes = []
            Report.countByCountry({}, function (data) {
              // TODO: this should be loaded on app load if it's used regularly in views.
              // Don't want to reload every time the view is loaded.

              data.forEach(function (country) {
                $scope.allCountryCodes.push({
                    'alpha2': country.alpha2,
                    'name': country.name,
                });
              })
            }, function (error) {
              console.log('error', error)
            })
          }
        })
      },
      templateUrl: 'views/directives/ooni-filter-list-form.directive.html'
    }
  })
