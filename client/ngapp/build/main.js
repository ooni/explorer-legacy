'use strict';

/**
 * @ngdoc overview
 * @name ooniAPIApp
 * @description
 *
 * Main module of the application.
 */
angular
  .module('ooniAPIApp', [
    'ngRoute',
    'lbServices',
    'ngResource',
    'datamaps',
    'angularTypewrite',
    'ui.grid',
    'ui.grid.pagination',
    'iso-3166-country-codes',
    'jsonFormatter'
  ])
  .config(function ($routeProvider, $locationProvider) {
    Object.keys(window.CONFIG.routes)
      .forEach(function(route) {
        var routeDef = window.CONFIG.routes[route];
        $routeProvider.when(route, routeDef);
      });

    $routeProvider
      .otherwise({
        redirectTo: '/'
      });

    $locationProvider.html5Mode(true);
  })
  // Things to run before the app loads;
  .run(function($rootScope, $location) {

    $rootScope.$location = $location;

    $rootScope.loading_phrases = [
      "Hacking some planet",
      "Extracting square root of i",
      "Modifying the space time continuum",
      "Adjusting ultra speed variable to be nominal",
      "Performing a safety meeting"
    ];
  });
;'use strict';

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
    $scope.countryName = ISO3166.getCountryName($scope.countryCode);

    // XXX should use external pagination feature of ui grid
    // http://ui-grid.info/docs/#/tutorial/314_external_pagination

    $scope.loadMeasurements = function(queryOptions) {
      var deferred = $q.defer();

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
              where: {
                  'probe_cc': $scope.countryCode
              },
              offset: queryOptions.pageNumber * queryOptions.pageSize,
              limit: queryOptions.pageSize
          }
      }
      Report.find(query, function(data) {
        deferred.resolve(data);
      });

      return deferred.promise;
    }

})
;'use strict';

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

    $scope.loadMeasurements = function(queryOptions) {
      var deferred = $q.defer();

      var query = {
          filter: {
              fields: {
                  'test_name': true,
                  'probe_cc': true,
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

      Report.find(query, function(data) {
        deferred.resolve(data);
      });

      return deferred.promise;
    }

});
;'use strict';

/**
 * @ngdoc function
 * @name ooniAPIApp.controller:HomeCtrl
 * @description
 * # HomeCtrl
 * Controller of the ooniAPIApp
 */

angular.module('ooniAPIApp')
  .controller('HomeCtrl', function ($q, $scope, $anchorScroll, $location, Report, Country, $rootScope) {

    // $rootScope.$location = $location

    $rootScope.loaded = false;

    $scope.countries = {
      alpha3: {},
      alpha2: {}
    };

    $scope.columnDefs = [{
        name: 'Country Code',
        field:'alpha2'
    },
    {
        name: 'Country Name',
        field:'name'
    },
    {
        name: 'Count',
        field:'count'
    }]

    var worldMap = {
        scope: 'world',
        responsive: true,
        geographyConfig: {
            borderColor: '#636363',
            borderWidth: 1
        },
        fills: {
            'HIGH': colorbrewer.PuBu[4][3],
            'MEDIUM': colorbrewer.PuBu[4][2],
            'LOW': colorbrewer.PuBu[4][1],
            'defaultFill': colorbrewer.PuBu[4][0]
        },
        data: {},
        geographyConfig: {
            popupTemplate: function(geo, data) {
                return ['<div class="hoverinfo"><strong>',
                        'Number of reports ' + data.reportCountry,
                        ': ' + data.reportCount,
                        '</strong></div>'].join('');
            },
            highlightFillColor: '#26292C',
            highlightBorderColor: '#B4B4B4',
            highlightBorderWidth: 1,
            highlightBorderOpacity: 1
        }
    };

    $scope.loadReports = function(queryOptions) {
      var deferred = $q.defer();
      Report.countByCountry(function(report_counts) {
          $scope.reportsByCountry = report_counts;
          angular.forEach(report_counts, function(country){
              worldMap.data[country.alpha3] = {
                  reportCount: country.count,
                  reportCountry: country.name,
                  alpha2: country.alpha2
              };
              if (country.count < 100) {
                  worldMap.data[country.alpha3]["fillKey"] = "LOW";
              } else if (country.count < 1000) {
                  worldMap.data[country.alpha3]["fillKey"] = "MEDIUM";
              } else {
                  worldMap.data[country.alpha3]["fillKey"] = "HIGH";
              }
          })
          $scope.worldMap = worldMap;
          $rootScope.loaded = true;
          deferred.resolve($scope.reportsByCountry);
      });
      return deferred.promise;
    }

    $scope.map_clicked = function(geo) {
      var country_code = $scope.worldMap.data[geo.id].alpha2;
      $location.path('/country/' + country_code);
    };

    $scope.viewCountry = function(row) {
      console.log("viewing country", row.entitry)
      $location.path('/country/' + row.entity.alpha2);
    }
});

;'use strict';

/**
 * @ngdoc function
 * @name ooniAPIApp.controller:MeasurementDetailViewCtrl
 * @description
 * # ReportDetailViewCtrl
 * Controller of the ooniAPIApp
 */

angular.module('ooniAPIApp')
  .controller('MeasurementDetailViewCtrl', function ($q, $scope, $anchorScroll, $location, Report, Country, $routeParams) {

    $scope.measurementId = $routeParams.id;
    $scope.measurementInput = $routeParams.input;

    $scope.loaded = false;
    // XXX should use external pagination feature of ui grid
    // http://ui-grid.info/docs/#/tutorial/314_external_pagination
    $scope.pageNumber = 0;
    $scope.pageSize = 100;

    var query = {
        filter: {
            where: {
                'id': $scope.measurementId,
            },
            offset: $scope.pageNumber * $scope.pageSize,
            limit: $scope.pageSize
        }
    }

    function loading_success(data) {
      console.log('success');
      $scope.report = data[0];
      $scope.loaded = true;
    }

    function loading_failure() {
      console.log('hi');
      $scope.loaded = true;
      $scope.not_found = true;
    }

    if ($scope.measurementInput != undefined) {
        query['filter']['where']['input'] = $scope.measurementInput;
        $scope.measurement = Report.find(query, loading_success, loading_failure);
    } else {
        $scope.measurements = Report.find(query, loading_success, loading_failure);
    }

});
;angular.module('ooniAPIApp')
.controller('BridgeReachabilityViewCtrl', function ($scope, $location){
  angular.forEach($scope.report.test_keys.requests, function(request){
    if (request.request.tor === true || request.request.is_tor === true) {
      $scope.control = request.response;
    } else {

      $scope.experiment = request.response;
      console.log($scope.experiment);
    }
  })
});
;angular.module('ooniAPIApp')
.controller('HTTPRequestsViewCtrl', function ($scope, $location){
  angular.forEach($scope.report.test_keys.requests, function(request){
    if (request.request.tor === true || request.request.is_tor === true) {
      $scope.control = request.response;
    } else {

      $scope.experiment = request.response;
      console.log($scope.experiment);
    }
  })
});
;'use strict';

// The idea behind this file is to keep a place for all specific nettest
// controllers in one place, as long as they don't have any specific
// functionality

angular.module('ooniAPIApp')
.controller('NettestDefaultViewCtrl', function ($scope, $location){
  angular.forEach($scope.report.test_keys.requests, function(request){
    if (request.request.tor === true || request.request.is_tor === true) {
      $scope.control = request.response;
    } else {

      $scope.experiment = request.response;
      console.log($scope.experiment);
    }
  })
});

;angular.module('ooniAPIApp')
.controller('TCPConnectViewCtrl', function ($scope, $location){
  angular.forEach($scope.report.test_keys.requests, function(request){
    if (request.request.tor === true || request.request.is_tor === true) {
      $scope.control = request.response;
    } else {

      $scope.experiment = request.response;
      console.log($scope.experiment);
    }
  })
});
;'use strict';

/**
 * @ngdoc function
 * @name ooniAPIApp.controller:OverviewCtrl
 * @description
 * # OverviewCtrl
 * Controller of the ooniAPIApp
 */

angular.module('ooniAPIApp')
  .controller('OverviewCtrl', function ($rootScope, $location) {

});
;/**
 * @ngdoc function
 * @name ooniAPIApp.directive:ooniGridWrapper
 * @description
 * # ooniReportsTableRow
 * A directive that displays a UI Grid according to OONI standards.
 */

angular.module('ooniAPIApp')
.directive('ooniGridWrapper',
  function ($location, $filter, Report, Country, Nettest, uiGridConstants ) {
    return {
      restrict: 'A',
      scope: {
        getDataFunction: '=',
        queryOptions: '=?', // TODO: still need to implement this
        viewRowObjectFunction: '=?', // TODO: still need to implement this
        customColumnDefs: '=?'
      },
      link: function ($scope, $element, $attrs) {

        $scope.gridOptions = {};
        $scope.queryOptions = {};
        $scope.queryOptions.pageNumber = 0;
        $scope.queryOptions.pageSize = 100;

        $scope.queryOptions.order = "test_start_time DESC";
        $scope.queryOptions.where = {};

        $scope.inputFilter = "";
        $scope.testNameFilter = "";
        $scope.countryCodeFilter = "";
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
;;(function(window, angular, undefined) {'use strict';

var urlBase = "/api";
var authHeader = 'authorization';

/**
 * @ngdoc overview
 * @name lbServices
 * @module
 * @description
 *
 * The `lbServices` module provides services for interacting with
 * the models exposed by the LoopBack server via the REST API.
 *
 */
var module = angular.module("lbServices", ['ngResource']);

/**
 * @ngdoc object
 * @name lbServices.Report
 * @header lbServices.Report
 * @object
 *
 * @description
 *
 * A $resource object for interacting with the `Report` model.
 *
 * ## Example
 *
 * See
 * {@link http://docs.angularjs.org/api/ngResource.$resource#example $resource}
 * for an example of using this object.
 *
 */
module.factory(
  "Report",
  ['LoopBackResource', 'LoopBackAuth', '$injector', function(Resource, LoopBackAuth, $injector) {
    var R = Resource(
      urlBase + "/reports/:id",
      { 'id': '@id' },
      {

        // INTERNAL. Use Report.country() instead.
        "prototype$__get__country": {
          url: urlBase + "/reports/:id/country",
          method: "GET"
        },

        /**
         * @ngdoc method
         * @name lbServices.Report#create
         * @methodOf lbServices.Report
         *
         * @description
         *
         * Create a new instance of the model and persist it into the data source.
         *
         * @param {Object=} parameters Request parameters.
         *
         *   This method does not accept any parameters.
         *   Supply an empty object or omit this argument altogether.
         *
         * @param {Object} postData Request data.
         *
         * This method expects a subset of model properties as request parameters.
         *
         * @param {function(Object,Object)=} successCb
         *   Success callback with two arguments: `value`, `responseHeaders`.
         *
         * @param {function(Object)=} errorCb Error callback with one argument:
         *   `httpResponse`.
         *
         * @returns {Object} An empty reference that will be
         *   populated with the actual data once the response is returned
         *   from the server.
         *
         * <em>
         * (The remote method definition does not provide any description.
         * This usually means the response is a `Report` object.)
         * </em>
         */
        "create": {
          url: urlBase + "/reports",
          method: "POST"
        },

        /**
         * @ngdoc method
         * @name lbServices.Report#createMany
         * @methodOf lbServices.Report
         *
         * @description
         *
         * Create a new instance of the model and persist it into the data source.
         *
         * @param {Object=} parameters Request parameters.
         *
         *   This method does not accept any parameters.
         *   Supply an empty object or omit this argument altogether.
         *
         * @param {Object} postData Request data.
         *
         * This method expects a subset of model properties as request parameters.
         *
         * @param {function(Array.<Object>,Object)=} successCb
         *   Success callback with two arguments: `value`, `responseHeaders`.
         *
         * @param {function(Object)=} errorCb Error callback with one argument:
         *   `httpResponse`.
         *
         * @returns {Array.<Object>} An empty reference that will be
         *   populated with the actual data once the response is returned
         *   from the server.
         *
         * <em>
         * (The remote method definition does not provide any description.
         * This usually means the response is a `Report` object.)
         * </em>
         */
        "createMany": {
          isArray: true,
          url: urlBase + "/reports",
          method: "POST"
        },

        /**
         * @ngdoc method
         * @name lbServices.Report#upsert
         * @methodOf lbServices.Report
         *
         * @description
         *
         * Update an existing model instance or insert a new one into the data source.
         *
         * @param {Object=} parameters Request parameters.
         *
         *   This method does not accept any parameters.
         *   Supply an empty object or omit this argument altogether.
         *
         * @param {Object} postData Request data.
         *
         * This method expects a subset of model properties as request parameters.
         *
         * @param {function(Object,Object)=} successCb
         *   Success callback with two arguments: `value`, `responseHeaders`.
         *
         * @param {function(Object)=} errorCb Error callback with one argument:
         *   `httpResponse`.
         *
         * @returns {Object} An empty reference that will be
         *   populated with the actual data once the response is returned
         *   from the server.
         *
         * <em>
         * (The remote method definition does not provide any description.
         * This usually means the response is a `Report` object.)
         * </em>
         */
        "upsert": {
          url: urlBase + "/reports",
          method: "PUT"
        },

        /**
         * @ngdoc method
         * @name lbServices.Report#exists
         * @methodOf lbServices.Report
         *
         * @description
         *
         * Check whether a model instance exists in the data source.
         *
         * @param {Object=} parameters Request parameters.
         *
         *  - `id` – `{*}` - Model id
         *
         * @param {function(Object,Object)=} successCb
         *   Success callback with two arguments: `value`, `responseHeaders`.
         *
         * @param {function(Object)=} errorCb Error callback with one argument:
         *   `httpResponse`.
         *
         * @returns {Object} An empty reference that will be
         *   populated with the actual data once the response is returned
         *   from the server.
         *
         * Data properties:
         *
         *  - `exists` – `{boolean=}` - 
         */
        "exists": {
          url: urlBase + "/reports/:id/exists",
          method: "GET"
        },

        /**
         * @ngdoc method
         * @name lbServices.Report#findById
         * @methodOf lbServices.Report
         *
         * @description
         *
         * Find a model instance by id from the data source.
         *
         * @param {Object=} parameters Request parameters.
         *
         *  - `id` – `{*}` - Model id
         *
         *  - `filter` – `{object=}` - Filter defining fields and include
         *
         * @param {function(Object,Object)=} successCb
         *   Success callback with two arguments: `value`, `responseHeaders`.
         *
         * @param {function(Object)=} errorCb Error callback with one argument:
         *   `httpResponse`.
         *
         * @returns {Object} An empty reference that will be
         *   populated with the actual data once the response is returned
         *   from the server.
         *
         * <em>
         * (The remote method definition does not provide any description.
         * This usually means the response is a `Report` object.)
         * </em>
         */
        "findById": {
          url: urlBase + "/reports/:id",
          method: "GET"
        },

        /**
         * @ngdoc method
         * @name lbServices.Report#find
         * @methodOf lbServices.Report
         *
         * @description
         *
         * Find all instances of the model matched by filter from the data source.
         *
         * @param {Object=} parameters Request parameters.
         *
         *  - `filter` – `{object=}` - Filter defining fields, where, include, order, offset, and limit
         *
         * @param {function(Array.<Object>,Object)=} successCb
         *   Success callback with two arguments: `value`, `responseHeaders`.
         *
         * @param {function(Object)=} errorCb Error callback with one argument:
         *   `httpResponse`.
         *
         * @returns {Array.<Object>} An empty reference that will be
         *   populated with the actual data once the response is returned
         *   from the server.
         *
         * <em>
         * (The remote method definition does not provide any description.
         * This usually means the response is a `Report` object.)
         * </em>
         */
        "find": {
          isArray: true,
          url: urlBase + "/reports",
          method: "GET"
        },

        /**
         * @ngdoc method
         * @name lbServices.Report#findOne
         * @methodOf lbServices.Report
         *
         * @description
         *
         * Find first instance of the model matched by filter from the data source.
         *
         * @param {Object=} parameters Request parameters.
         *
         *  - `filter` – `{object=}` - Filter defining fields, where, include, order, offset, and limit
         *
         * @param {function(Object,Object)=} successCb
         *   Success callback with two arguments: `value`, `responseHeaders`.
         *
         * @param {function(Object)=} errorCb Error callback with one argument:
         *   `httpResponse`.
         *
         * @returns {Object} An empty reference that will be
         *   populated with the actual data once the response is returned
         *   from the server.
         *
         * <em>
         * (The remote method definition does not provide any description.
         * This usually means the response is a `Report` object.)
         * </em>
         */
        "findOne": {
          url: urlBase + "/reports/findOne",
          method: "GET"
        },

        /**
         * @ngdoc method
         * @name lbServices.Report#updateAll
         * @methodOf lbServices.Report
         *
         * @description
         *
         * Update instances of the model matched by where from the data source.
         *
         * @param {Object=} parameters Request parameters.
         *
         *  - `where` – `{object=}` - Criteria to match model instances
         *
         * @param {Object} postData Request data.
         *
         * This method expects a subset of model properties as request parameters.
         *
         * @param {function(Object,Object)=} successCb
         *   Success callback with two arguments: `value`, `responseHeaders`.
         *
         * @param {function(Object)=} errorCb Error callback with one argument:
         *   `httpResponse`.
         *
         * @returns {Object} An empty reference that will be
         *   populated with the actual data once the response is returned
         *   from the server.
         *
         * The number of instances updated
         */
        "updateAll": {
          url: urlBase + "/reports/update",
          method: "POST"
        },

        /**
         * @ngdoc method
         * @name lbServices.Report#deleteById
         * @methodOf lbServices.Report
         *
         * @description
         *
         * Delete a model instance by id from the data source.
         *
         * @param {Object=} parameters Request parameters.
         *
         *  - `id` – `{*}` - Model id
         *
         * @param {function(Object,Object)=} successCb
         *   Success callback with two arguments: `value`, `responseHeaders`.
         *
         * @param {function(Object)=} errorCb Error callback with one argument:
         *   `httpResponse`.
         *
         * @returns {Object} An empty reference that will be
         *   populated with the actual data once the response is returned
         *   from the server.
         *
         * <em>
         * (The remote method definition does not provide any description.
         * This usually means the response is a `Report` object.)
         * </em>
         */
        "deleteById": {
          url: urlBase + "/reports/:id",
          method: "DELETE"
        },

        /**
         * @ngdoc method
         * @name lbServices.Report#count
         * @methodOf lbServices.Report
         *
         * @description
         *
         * Count instances of the model matched by where from the data source.
         *
         * @param {Object=} parameters Request parameters.
         *
         *  - `where` – `{object=}` - Criteria to match model instances
         *
         * @param {function(Object,Object)=} successCb
         *   Success callback with two arguments: `value`, `responseHeaders`.
         *
         * @param {function(Object)=} errorCb Error callback with one argument:
         *   `httpResponse`.
         *
         * @returns {Object} An empty reference that will be
         *   populated with the actual data once the response is returned
         *   from the server.
         *
         * Data properties:
         *
         *  - `count` – `{number=}` - 
         */
        "count": {
          url: urlBase + "/reports/count",
          method: "GET"
        },

        /**
         * @ngdoc method
         * @name lbServices.Report#prototype$updateAttributes
         * @methodOf lbServices.Report
         *
         * @description
         *
         * Update attributes for a model instance and persist it into the data source.
         *
         * @param {Object=} parameters Request parameters.
         *
         *  - `id` – `{*}` - PersistedModel id
         *
         * @param {Object} postData Request data.
         *
         * This method expects a subset of model properties as request parameters.
         *
         * @param {function(Object,Object)=} successCb
         *   Success callback with two arguments: `value`, `responseHeaders`.
         *
         * @param {function(Object)=} errorCb Error callback with one argument:
         *   `httpResponse`.
         *
         * @returns {Object} An empty reference that will be
         *   populated with the actual data once the response is returned
         *   from the server.
         *
         * <em>
         * (The remote method definition does not provide any description.
         * This usually means the response is a `Report` object.)
         * </em>
         */
        "prototype$updateAttributes": {
          url: urlBase + "/reports/:id",
          method: "PUT"
        },

        /**
         * @ngdoc method
         * @name lbServices.Report#createChangeStream
         * @methodOf lbServices.Report
         *
         * @description
         *
         * Create a change stream.
         *
         * @param {Object=} parameters Request parameters.
         *
         *   This method does not accept any parameters.
         *   Supply an empty object or omit this argument altogether.
         *
         * @param {Object} postData Request data.
         *
         *  - `options` – `{object=}` - 
         *
         * @param {function(Object,Object)=} successCb
         *   Success callback with two arguments: `value`, `responseHeaders`.
         *
         * @param {function(Object)=} errorCb Error callback with one argument:
         *   `httpResponse`.
         *
         * @returns {Object} An empty reference that will be
         *   populated with the actual data once the response is returned
         *   from the server.
         *
         * Data properties:
         *
         *  - `changes` – `{ReadableStream=}` - 
         */
        "createChangeStream": {
          url: urlBase + "/reports/change-stream",
          method: "POST"
        },

        /**
         * @ngdoc method
         * @name lbServices.Report#countByCountry
         * @methodOf lbServices.Report
         *
         * @description
         *
         * Get number of reports by country code
         *
         * @param {Object=} parameters Request parameters.
         *
         *   This method does not accept any parameters.
         *   Supply an empty object or omit this argument altogether.
         *
         * @param {function(Array.<Object>,Object)=} successCb
         *   Success callback with two arguments: `value`, `responseHeaders`.
         *
         * @param {function(Object)=} errorCb Error callback with one argument:
         *   `httpResponse`.
         *
         * @returns {Array.<Object>} An empty reference that will be
         *   populated with the actual data once the response is returned
         *   from the server.
         *
         * <em>
         * (The remote method definition does not provide any description.
         * This usually means the response is a `Report` object.)
         * </em>
         */
        "countByCountry": {
          isArray: true,
          url: urlBase + "/reports/countByCountry",
          method: "GET"
        },
      }
    );



        /**
         * @ngdoc method
         * @name lbServices.Report#updateOrCreate
         * @methodOf lbServices.Report
         *
         * @description
         *
         * Update an existing model instance or insert a new one into the data source.
         *
         * @param {Object=} parameters Request parameters.
         *
         *   This method does not accept any parameters.
         *   Supply an empty object or omit this argument altogether.
         *
         * @param {Object} postData Request data.
         *
         * This method expects a subset of model properties as request parameters.
         *
         * @param {function(Object,Object)=} successCb
         *   Success callback with two arguments: `value`, `responseHeaders`.
         *
         * @param {function(Object)=} errorCb Error callback with one argument:
         *   `httpResponse`.
         *
         * @returns {Object} An empty reference that will be
         *   populated with the actual data once the response is returned
         *   from the server.
         *
         * <em>
         * (The remote method definition does not provide any description.
         * This usually means the response is a `Report` object.)
         * </em>
         */
        R["updateOrCreate"] = R["upsert"];

        /**
         * @ngdoc method
         * @name lbServices.Report#update
         * @methodOf lbServices.Report
         *
         * @description
         *
         * Update instances of the model matched by where from the data source.
         *
         * @param {Object=} parameters Request parameters.
         *
         *  - `where` – `{object=}` - Criteria to match model instances
         *
         * @param {Object} postData Request data.
         *
         * This method expects a subset of model properties as request parameters.
         *
         * @param {function(Object,Object)=} successCb
         *   Success callback with two arguments: `value`, `responseHeaders`.
         *
         * @param {function(Object)=} errorCb Error callback with one argument:
         *   `httpResponse`.
         *
         * @returns {Object} An empty reference that will be
         *   populated with the actual data once the response is returned
         *   from the server.
         *
         * The number of instances updated
         */
        R["update"] = R["updateAll"];

        /**
         * @ngdoc method
         * @name lbServices.Report#destroyById
         * @methodOf lbServices.Report
         *
         * @description
         *
         * Delete a model instance by id from the data source.
         *
         * @param {Object=} parameters Request parameters.
         *
         *  - `id` – `{*}` - Model id
         *
         * @param {function(Object,Object)=} successCb
         *   Success callback with two arguments: `value`, `responseHeaders`.
         *
         * @param {function(Object)=} errorCb Error callback with one argument:
         *   `httpResponse`.
         *
         * @returns {Object} An empty reference that will be
         *   populated with the actual data once the response is returned
         *   from the server.
         *
         * <em>
         * (The remote method definition does not provide any description.
         * This usually means the response is a `Report` object.)
         * </em>
         */
        R["destroyById"] = R["deleteById"];

        /**
         * @ngdoc method
         * @name lbServices.Report#removeById
         * @methodOf lbServices.Report
         *
         * @description
         *
         * Delete a model instance by id from the data source.
         *
         * @param {Object=} parameters Request parameters.
         *
         *  - `id` – `{*}` - Model id
         *
         * @param {function(Object,Object)=} successCb
         *   Success callback with two arguments: `value`, `responseHeaders`.
         *
         * @param {function(Object)=} errorCb Error callback with one argument:
         *   `httpResponse`.
         *
         * @returns {Object} An empty reference that will be
         *   populated with the actual data once the response is returned
         *   from the server.
         *
         * <em>
         * (The remote method definition does not provide any description.
         * This usually means the response is a `Report` object.)
         * </em>
         */
        R["removeById"] = R["deleteById"];


    /**
    * @ngdoc property
    * @name lbServices.Report#modelName
    * @propertyOf lbServices.Report
    * @description
    * The name of the model represented by this $resource,
    * i.e. `Report`.
    */
    R.modelName = "Report";


        /**
         * @ngdoc method
         * @name lbServices.Report#country
         * @methodOf lbServices.Report
         *
         * @description
         *
         * Fetches belongsTo relation country.
         *
         * @param {Object=} parameters Request parameters.
         *
         *  - `id` – `{*}` - PersistedModel id
         *
         *  - `refresh` – `{boolean=}` - 
         *
         * @param {function(Object,Object)=} successCb
         *   Success callback with two arguments: `value`, `responseHeaders`.
         *
         * @param {function(Object)=} errorCb Error callback with one argument:
         *   `httpResponse`.
         *
         * @returns {Object} An empty reference that will be
         *   populated with the actual data once the response is returned
         *   from the server.
         *
         * <em>
         * (The remote method definition does not provide any description.
         * This usually means the response is a `Country` object.)
         * </em>
         */
        R.country = function() {
          var TargetResource = $injector.get("Country");
          var action = TargetResource["::get::report::country"];
          return action.apply(R, arguments);
        };

    return R;
  }]);

/**
 * @ngdoc object
 * @name lbServices.Country
 * @header lbServices.Country
 * @object
 *
 * @description
 *
 * A $resource object for interacting with the `Country` model.
 *
 * ## Example
 *
 * See
 * {@link http://docs.angularjs.org/api/ngResource.$resource#example $resource}
 * for an example of using this object.
 *
 */
module.factory(
  "Country",
  ['LoopBackResource', 'LoopBackAuth', '$injector', function(Resource, LoopBackAuth, $injector) {
    var R = Resource(
      urlBase + "/countries/:id",
      { 'id': '@id' },
      {

        /**
         * @ngdoc method
         * @name lbServices.Country#create
         * @methodOf lbServices.Country
         *
         * @description
         *
         * Create a new instance of the model and persist it into the data source.
         *
         * @param {Object=} parameters Request parameters.
         *
         *   This method does not accept any parameters.
         *   Supply an empty object or omit this argument altogether.
         *
         * @param {Object} postData Request data.
         *
         * This method expects a subset of model properties as request parameters.
         *
         * @param {function(Object,Object)=} successCb
         *   Success callback with two arguments: `value`, `responseHeaders`.
         *
         * @param {function(Object)=} errorCb Error callback with one argument:
         *   `httpResponse`.
         *
         * @returns {Object} An empty reference that will be
         *   populated with the actual data once the response is returned
         *   from the server.
         *
         * <em>
         * (The remote method definition does not provide any description.
         * This usually means the response is a `Country` object.)
         * </em>
         */
        "create": {
          url: urlBase + "/countries",
          method: "POST"
        },

        /**
         * @ngdoc method
         * @name lbServices.Country#createMany
         * @methodOf lbServices.Country
         *
         * @description
         *
         * Create a new instance of the model and persist it into the data source.
         *
         * @param {Object=} parameters Request parameters.
         *
         *   This method does not accept any parameters.
         *   Supply an empty object or omit this argument altogether.
         *
         * @param {Object} postData Request data.
         *
         * This method expects a subset of model properties as request parameters.
         *
         * @param {function(Array.<Object>,Object)=} successCb
         *   Success callback with two arguments: `value`, `responseHeaders`.
         *
         * @param {function(Object)=} errorCb Error callback with one argument:
         *   `httpResponse`.
         *
         * @returns {Array.<Object>} An empty reference that will be
         *   populated with the actual data once the response is returned
         *   from the server.
         *
         * <em>
         * (The remote method definition does not provide any description.
         * This usually means the response is a `Country` object.)
         * </em>
         */
        "createMany": {
          isArray: true,
          url: urlBase + "/countries",
          method: "POST"
        },

        /**
         * @ngdoc method
         * @name lbServices.Country#upsert
         * @methodOf lbServices.Country
         *
         * @description
         *
         * Update an existing model instance or insert a new one into the data source.
         *
         * @param {Object=} parameters Request parameters.
         *
         *   This method does not accept any parameters.
         *   Supply an empty object or omit this argument altogether.
         *
         * @param {Object} postData Request data.
         *
         * This method expects a subset of model properties as request parameters.
         *
         * @param {function(Object,Object)=} successCb
         *   Success callback with two arguments: `value`, `responseHeaders`.
         *
         * @param {function(Object)=} errorCb Error callback with one argument:
         *   `httpResponse`.
         *
         * @returns {Object} An empty reference that will be
         *   populated with the actual data once the response is returned
         *   from the server.
         *
         * <em>
         * (The remote method definition does not provide any description.
         * This usually means the response is a `Country` object.)
         * </em>
         */
        "upsert": {
          url: urlBase + "/countries",
          method: "PUT"
        },

        /**
         * @ngdoc method
         * @name lbServices.Country#exists
         * @methodOf lbServices.Country
         *
         * @description
         *
         * Check whether a model instance exists in the data source.
         *
         * @param {Object=} parameters Request parameters.
         *
         *  - `id` – `{*}` - Model id
         *
         * @param {function(Object,Object)=} successCb
         *   Success callback with two arguments: `value`, `responseHeaders`.
         *
         * @param {function(Object)=} errorCb Error callback with one argument:
         *   `httpResponse`.
         *
         * @returns {Object} An empty reference that will be
         *   populated with the actual data once the response is returned
         *   from the server.
         *
         * Data properties:
         *
         *  - `exists` – `{boolean=}` - 
         */
        "exists": {
          url: urlBase + "/countries/:id/exists",
          method: "GET"
        },

        /**
         * @ngdoc method
         * @name lbServices.Country#findById
         * @methodOf lbServices.Country
         *
         * @description
         *
         * Find a model instance by id from the data source.
         *
         * @param {Object=} parameters Request parameters.
         *
         *  - `id` – `{*}` - Model id
         *
         *  - `filter` – `{object=}` - Filter defining fields and include
         *
         * @param {function(Object,Object)=} successCb
         *   Success callback with two arguments: `value`, `responseHeaders`.
         *
         * @param {function(Object)=} errorCb Error callback with one argument:
         *   `httpResponse`.
         *
         * @returns {Object} An empty reference that will be
         *   populated with the actual data once the response is returned
         *   from the server.
         *
         * <em>
         * (The remote method definition does not provide any description.
         * This usually means the response is a `Country` object.)
         * </em>
         */
        "findById": {
          url: urlBase + "/countries/:id",
          method: "GET"
        },

        /**
         * @ngdoc method
         * @name lbServices.Country#find
         * @methodOf lbServices.Country
         *
         * @description
         *
         * Find all instances of the model matched by filter from the data source.
         *
         * @param {Object=} parameters Request parameters.
         *
         *  - `filter` – `{object=}` - Filter defining fields, where, include, order, offset, and limit
         *
         * @param {function(Array.<Object>,Object)=} successCb
         *   Success callback with two arguments: `value`, `responseHeaders`.
         *
         * @param {function(Object)=} errorCb Error callback with one argument:
         *   `httpResponse`.
         *
         * @returns {Array.<Object>} An empty reference that will be
         *   populated with the actual data once the response is returned
         *   from the server.
         *
         * <em>
         * (The remote method definition does not provide any description.
         * This usually means the response is a `Country` object.)
         * </em>
         */
        "find": {
          isArray: true,
          url: urlBase + "/countries",
          method: "GET"
        },

        /**
         * @ngdoc method
         * @name lbServices.Country#findOne
         * @methodOf lbServices.Country
         *
         * @description
         *
         * Find first instance of the model matched by filter from the data source.
         *
         * @param {Object=} parameters Request parameters.
         *
         *  - `filter` – `{object=}` - Filter defining fields, where, include, order, offset, and limit
         *
         * @param {function(Object,Object)=} successCb
         *   Success callback with two arguments: `value`, `responseHeaders`.
         *
         * @param {function(Object)=} errorCb Error callback with one argument:
         *   `httpResponse`.
         *
         * @returns {Object} An empty reference that will be
         *   populated with the actual data once the response is returned
         *   from the server.
         *
         * <em>
         * (The remote method definition does not provide any description.
         * This usually means the response is a `Country` object.)
         * </em>
         */
        "findOne": {
          url: urlBase + "/countries/findOne",
          method: "GET"
        },

        /**
         * @ngdoc method
         * @name lbServices.Country#updateAll
         * @methodOf lbServices.Country
         *
         * @description
         *
         * Update instances of the model matched by where from the data source.
         *
         * @param {Object=} parameters Request parameters.
         *
         *  - `where` – `{object=}` - Criteria to match model instances
         *
         * @param {Object} postData Request data.
         *
         * This method expects a subset of model properties as request parameters.
         *
         * @param {function(Object,Object)=} successCb
         *   Success callback with two arguments: `value`, `responseHeaders`.
         *
         * @param {function(Object)=} errorCb Error callback with one argument:
         *   `httpResponse`.
         *
         * @returns {Object} An empty reference that will be
         *   populated with the actual data once the response is returned
         *   from the server.
         *
         * The number of instances updated
         */
        "updateAll": {
          url: urlBase + "/countries/update",
          method: "POST"
        },

        /**
         * @ngdoc method
         * @name lbServices.Country#deleteById
         * @methodOf lbServices.Country
         *
         * @description
         *
         * Delete a model instance by id from the data source.
         *
         * @param {Object=} parameters Request parameters.
         *
         *  - `id` – `{*}` - Model id
         *
         * @param {function(Object,Object)=} successCb
         *   Success callback with two arguments: `value`, `responseHeaders`.
         *
         * @param {function(Object)=} errorCb Error callback with one argument:
         *   `httpResponse`.
         *
         * @returns {Object} An empty reference that will be
         *   populated with the actual data once the response is returned
         *   from the server.
         *
         * <em>
         * (The remote method definition does not provide any description.
         * This usually means the response is a `Country` object.)
         * </em>
         */
        "deleteById": {
          url: urlBase + "/countries/:id",
          method: "DELETE"
        },

        /**
         * @ngdoc method
         * @name lbServices.Country#count
         * @methodOf lbServices.Country
         *
         * @description
         *
         * Count instances of the model matched by where from the data source.
         *
         * @param {Object=} parameters Request parameters.
         *
         *  - `where` – `{object=}` - Criteria to match model instances
         *
         * @param {function(Object,Object)=} successCb
         *   Success callback with two arguments: `value`, `responseHeaders`.
         *
         * @param {function(Object)=} errorCb Error callback with one argument:
         *   `httpResponse`.
         *
         * @returns {Object} An empty reference that will be
         *   populated with the actual data once the response is returned
         *   from the server.
         *
         * Data properties:
         *
         *  - `count` – `{number=}` - 
         */
        "count": {
          url: urlBase + "/countries/count",
          method: "GET"
        },

        /**
         * @ngdoc method
         * @name lbServices.Country#prototype$updateAttributes
         * @methodOf lbServices.Country
         *
         * @description
         *
         * Update attributes for a model instance and persist it into the data source.
         *
         * @param {Object=} parameters Request parameters.
         *
         *  - `id` – `{*}` - PersistedModel id
         *
         * @param {Object} postData Request data.
         *
         * This method expects a subset of model properties as request parameters.
         *
         * @param {function(Object,Object)=} successCb
         *   Success callback with two arguments: `value`, `responseHeaders`.
         *
         * @param {function(Object)=} errorCb Error callback with one argument:
         *   `httpResponse`.
         *
         * @returns {Object} An empty reference that will be
         *   populated with the actual data once the response is returned
         *   from the server.
         *
         * <em>
         * (The remote method definition does not provide any description.
         * This usually means the response is a `Country` object.)
         * </em>
         */
        "prototype$updateAttributes": {
          url: urlBase + "/countries/:id",
          method: "PUT"
        },

        /**
         * @ngdoc method
         * @name lbServices.Country#createChangeStream
         * @methodOf lbServices.Country
         *
         * @description
         *
         * Create a change stream.
         *
         * @param {Object=} parameters Request parameters.
         *
         *   This method does not accept any parameters.
         *   Supply an empty object or omit this argument altogether.
         *
         * @param {Object} postData Request data.
         *
         *  - `options` – `{object=}` - 
         *
         * @param {function(Object,Object)=} successCb
         *   Success callback with two arguments: `value`, `responseHeaders`.
         *
         * @param {function(Object)=} errorCb Error callback with one argument:
         *   `httpResponse`.
         *
         * @returns {Object} An empty reference that will be
         *   populated with the actual data once the response is returned
         *   from the server.
         *
         * Data properties:
         *
         *  - `changes` – `{ReadableStream=}` - 
         */
        "createChangeStream": {
          url: urlBase + "/countries/change-stream",
          method: "POST"
        },

        // INTERNAL. Use Report.country() instead.
        "::get::report::country": {
          url: urlBase + "/reports/:id/country",
          method: "GET"
        },
      }
    );



        /**
         * @ngdoc method
         * @name lbServices.Country#updateOrCreate
         * @methodOf lbServices.Country
         *
         * @description
         *
         * Update an existing model instance or insert a new one into the data source.
         *
         * @param {Object=} parameters Request parameters.
         *
         *   This method does not accept any parameters.
         *   Supply an empty object or omit this argument altogether.
         *
         * @param {Object} postData Request data.
         *
         * This method expects a subset of model properties as request parameters.
         *
         * @param {function(Object,Object)=} successCb
         *   Success callback with two arguments: `value`, `responseHeaders`.
         *
         * @param {function(Object)=} errorCb Error callback with one argument:
         *   `httpResponse`.
         *
         * @returns {Object} An empty reference that will be
         *   populated with the actual data once the response is returned
         *   from the server.
         *
         * <em>
         * (The remote method definition does not provide any description.
         * This usually means the response is a `Country` object.)
         * </em>
         */
        R["updateOrCreate"] = R["upsert"];

        /**
         * @ngdoc method
         * @name lbServices.Country#update
         * @methodOf lbServices.Country
         *
         * @description
         *
         * Update instances of the model matched by where from the data source.
         *
         * @param {Object=} parameters Request parameters.
         *
         *  - `where` – `{object=}` - Criteria to match model instances
         *
         * @param {Object} postData Request data.
         *
         * This method expects a subset of model properties as request parameters.
         *
         * @param {function(Object,Object)=} successCb
         *   Success callback with two arguments: `value`, `responseHeaders`.
         *
         * @param {function(Object)=} errorCb Error callback with one argument:
         *   `httpResponse`.
         *
         * @returns {Object} An empty reference that will be
         *   populated with the actual data once the response is returned
         *   from the server.
         *
         * The number of instances updated
         */
        R["update"] = R["updateAll"];

        /**
         * @ngdoc method
         * @name lbServices.Country#destroyById
         * @methodOf lbServices.Country
         *
         * @description
         *
         * Delete a model instance by id from the data source.
         *
         * @param {Object=} parameters Request parameters.
         *
         *  - `id` – `{*}` - Model id
         *
         * @param {function(Object,Object)=} successCb
         *   Success callback with two arguments: `value`, `responseHeaders`.
         *
         * @param {function(Object)=} errorCb Error callback with one argument:
         *   `httpResponse`.
         *
         * @returns {Object} An empty reference that will be
         *   populated with the actual data once the response is returned
         *   from the server.
         *
         * <em>
         * (The remote method definition does not provide any description.
         * This usually means the response is a `Country` object.)
         * </em>
         */
        R["destroyById"] = R["deleteById"];

        /**
         * @ngdoc method
         * @name lbServices.Country#removeById
         * @methodOf lbServices.Country
         *
         * @description
         *
         * Delete a model instance by id from the data source.
         *
         * @param {Object=} parameters Request parameters.
         *
         *  - `id` – `{*}` - Model id
         *
         * @param {function(Object,Object)=} successCb
         *   Success callback with two arguments: `value`, `responseHeaders`.
         *
         * @param {function(Object)=} errorCb Error callback with one argument:
         *   `httpResponse`.
         *
         * @returns {Object} An empty reference that will be
         *   populated with the actual data once the response is returned
         *   from the server.
         *
         * <em>
         * (The remote method definition does not provide any description.
         * This usually means the response is a `Country` object.)
         * </em>
         */
        R["removeById"] = R["deleteById"];


    /**
    * @ngdoc property
    * @name lbServices.Country#modelName
    * @propertyOf lbServices.Country
    * @description
    * The name of the model represented by this $resource,
    * i.e. `Country`.
    */
    R.modelName = "Country";


    return R;
  }]);

/**
 * @ngdoc object
 * @name lbServices.Nettest
 * @header lbServices.Nettest
 * @object
 *
 * @description
 *
 * A $resource object for interacting with the `Nettest` model.
 *
 * ## Example
 *
 * See
 * {@link http://docs.angularjs.org/api/ngResource.$resource#example $resource}
 * for an example of using this object.
 *
 */
module.factory(
  "Nettest",
  ['LoopBackResource', 'LoopBackAuth', '$injector', function(Resource, LoopBackAuth, $injector) {
    var R = Resource(
      urlBase + "/nettests/:id",
      { 'id': '@id' },
      {

        /**
         * @ngdoc method
         * @name lbServices.Nettest#create
         * @methodOf lbServices.Nettest
         *
         * @description
         *
         * Create a new instance of the model and persist it into the data source.
         *
         * @param {Object=} parameters Request parameters.
         *
         *   This method does not accept any parameters.
         *   Supply an empty object or omit this argument altogether.
         *
         * @param {Object} postData Request data.
         *
         * This method expects a subset of model properties as request parameters.
         *
         * @param {function(Object,Object)=} successCb
         *   Success callback with two arguments: `value`, `responseHeaders`.
         *
         * @param {function(Object)=} errorCb Error callback with one argument:
         *   `httpResponse`.
         *
         * @returns {Object} An empty reference that will be
         *   populated with the actual data once the response is returned
         *   from the server.
         *
         * <em>
         * (The remote method definition does not provide any description.
         * This usually means the response is a `Nettest` object.)
         * </em>
         */
        "create": {
          url: urlBase + "/nettests",
          method: "POST"
        },

        /**
         * @ngdoc method
         * @name lbServices.Nettest#createMany
         * @methodOf lbServices.Nettest
         *
         * @description
         *
         * Create a new instance of the model and persist it into the data source.
         *
         * @param {Object=} parameters Request parameters.
         *
         *   This method does not accept any parameters.
         *   Supply an empty object or omit this argument altogether.
         *
         * @param {Object} postData Request data.
         *
         * This method expects a subset of model properties as request parameters.
         *
         * @param {function(Array.<Object>,Object)=} successCb
         *   Success callback with two arguments: `value`, `responseHeaders`.
         *
         * @param {function(Object)=} errorCb Error callback with one argument:
         *   `httpResponse`.
         *
         * @returns {Array.<Object>} An empty reference that will be
         *   populated with the actual data once the response is returned
         *   from the server.
         *
         * <em>
         * (The remote method definition does not provide any description.
         * This usually means the response is a `Nettest` object.)
         * </em>
         */
        "createMany": {
          isArray: true,
          url: urlBase + "/nettests",
          method: "POST"
        },

        /**
         * @ngdoc method
         * @name lbServices.Nettest#upsert
         * @methodOf lbServices.Nettest
         *
         * @description
         *
         * Update an existing model instance or insert a new one into the data source.
         *
         * @param {Object=} parameters Request parameters.
         *
         *   This method does not accept any parameters.
         *   Supply an empty object or omit this argument altogether.
         *
         * @param {Object} postData Request data.
         *
         * This method expects a subset of model properties as request parameters.
         *
         * @param {function(Object,Object)=} successCb
         *   Success callback with two arguments: `value`, `responseHeaders`.
         *
         * @param {function(Object)=} errorCb Error callback with one argument:
         *   `httpResponse`.
         *
         * @returns {Object} An empty reference that will be
         *   populated with the actual data once the response is returned
         *   from the server.
         *
         * <em>
         * (The remote method definition does not provide any description.
         * This usually means the response is a `Nettest` object.)
         * </em>
         */
        "upsert": {
          url: urlBase + "/nettests",
          method: "PUT"
        },

        /**
         * @ngdoc method
         * @name lbServices.Nettest#exists
         * @methodOf lbServices.Nettest
         *
         * @description
         *
         * Check whether a model instance exists in the data source.
         *
         * @param {Object=} parameters Request parameters.
         *
         *  - `id` – `{*}` - Model id
         *
         * @param {function(Object,Object)=} successCb
         *   Success callback with two arguments: `value`, `responseHeaders`.
         *
         * @param {function(Object)=} errorCb Error callback with one argument:
         *   `httpResponse`.
         *
         * @returns {Object} An empty reference that will be
         *   populated with the actual data once the response is returned
         *   from the server.
         *
         * Data properties:
         *
         *  - `exists` – `{boolean=}` - 
         */
        "exists": {
          url: urlBase + "/nettests/:id/exists",
          method: "GET"
        },

        /**
         * @ngdoc method
         * @name lbServices.Nettest#findById
         * @methodOf lbServices.Nettest
         *
         * @description
         *
         * Find a model instance by id from the data source.
         *
         * @param {Object=} parameters Request parameters.
         *
         *  - `id` – `{*}` - Model id
         *
         *  - `filter` – `{object=}` - Filter defining fields and include
         *
         * @param {function(Object,Object)=} successCb
         *   Success callback with two arguments: `value`, `responseHeaders`.
         *
         * @param {function(Object)=} errorCb Error callback with one argument:
         *   `httpResponse`.
         *
         * @returns {Object} An empty reference that will be
         *   populated with the actual data once the response is returned
         *   from the server.
         *
         * <em>
         * (The remote method definition does not provide any description.
         * This usually means the response is a `Nettest` object.)
         * </em>
         */
        "findById": {
          url: urlBase + "/nettests/:id",
          method: "GET"
        },

        /**
         * @ngdoc method
         * @name lbServices.Nettest#find
         * @methodOf lbServices.Nettest
         *
         * @description
         *
         * Find all instances of the model matched by filter from the data source.
         *
         * @param {Object=} parameters Request parameters.
         *
         *  - `filter` – `{object=}` - Filter defining fields, where, include, order, offset, and limit
         *
         * @param {function(Array.<Object>,Object)=} successCb
         *   Success callback with two arguments: `value`, `responseHeaders`.
         *
         * @param {function(Object)=} errorCb Error callback with one argument:
         *   `httpResponse`.
         *
         * @returns {Array.<Object>} An empty reference that will be
         *   populated with the actual data once the response is returned
         *   from the server.
         *
         * <em>
         * (The remote method definition does not provide any description.
         * This usually means the response is a `Nettest` object.)
         * </em>
         */
        "find": {
          isArray: true,
          url: urlBase + "/nettests",
          method: "GET"
        },

        /**
         * @ngdoc method
         * @name lbServices.Nettest#findOne
         * @methodOf lbServices.Nettest
         *
         * @description
         *
         * Find first instance of the model matched by filter from the data source.
         *
         * @param {Object=} parameters Request parameters.
         *
         *  - `filter` – `{object=}` - Filter defining fields, where, include, order, offset, and limit
         *
         * @param {function(Object,Object)=} successCb
         *   Success callback with two arguments: `value`, `responseHeaders`.
         *
         * @param {function(Object)=} errorCb Error callback with one argument:
         *   `httpResponse`.
         *
         * @returns {Object} An empty reference that will be
         *   populated with the actual data once the response is returned
         *   from the server.
         *
         * <em>
         * (The remote method definition does not provide any description.
         * This usually means the response is a `Nettest` object.)
         * </em>
         */
        "findOne": {
          url: urlBase + "/nettests/findOne",
          method: "GET"
        },

        /**
         * @ngdoc method
         * @name lbServices.Nettest#updateAll
         * @methodOf lbServices.Nettest
         *
         * @description
         *
         * Update instances of the model matched by where from the data source.
         *
         * @param {Object=} parameters Request parameters.
         *
         *  - `where` – `{object=}` - Criteria to match model instances
         *
         * @param {Object} postData Request data.
         *
         * This method expects a subset of model properties as request parameters.
         *
         * @param {function(Object,Object)=} successCb
         *   Success callback with two arguments: `value`, `responseHeaders`.
         *
         * @param {function(Object)=} errorCb Error callback with one argument:
         *   `httpResponse`.
         *
         * @returns {Object} An empty reference that will be
         *   populated with the actual data once the response is returned
         *   from the server.
         *
         * The number of instances updated
         */
        "updateAll": {
          url: urlBase + "/nettests/update",
          method: "POST"
        },

        /**
         * @ngdoc method
         * @name lbServices.Nettest#deleteById
         * @methodOf lbServices.Nettest
         *
         * @description
         *
         * Delete a model instance by id from the data source.
         *
         * @param {Object=} parameters Request parameters.
         *
         *  - `id` – `{*}` - Model id
         *
         * @param {function(Object,Object)=} successCb
         *   Success callback with two arguments: `value`, `responseHeaders`.
         *
         * @param {function(Object)=} errorCb Error callback with one argument:
         *   `httpResponse`.
         *
         * @returns {Object} An empty reference that will be
         *   populated with the actual data once the response is returned
         *   from the server.
         *
         * <em>
         * (The remote method definition does not provide any description.
         * This usually means the response is a `Nettest` object.)
         * </em>
         */
        "deleteById": {
          url: urlBase + "/nettests/:id",
          method: "DELETE"
        },

        /**
         * @ngdoc method
         * @name lbServices.Nettest#count
         * @methodOf lbServices.Nettest
         *
         * @description
         *
         * Count instances of the model matched by where from the data source.
         *
         * @param {Object=} parameters Request parameters.
         *
         *  - `where` – `{object=}` - Criteria to match model instances
         *
         * @param {function(Object,Object)=} successCb
         *   Success callback with two arguments: `value`, `responseHeaders`.
         *
         * @param {function(Object)=} errorCb Error callback with one argument:
         *   `httpResponse`.
         *
         * @returns {Object} An empty reference that will be
         *   populated with the actual data once the response is returned
         *   from the server.
         *
         * Data properties:
         *
         *  - `count` – `{number=}` - 
         */
        "count": {
          url: urlBase + "/nettests/count",
          method: "GET"
        },

        /**
         * @ngdoc method
         * @name lbServices.Nettest#prototype$updateAttributes
         * @methodOf lbServices.Nettest
         *
         * @description
         *
         * Update attributes for a model instance and persist it into the data source.
         *
         * @param {Object=} parameters Request parameters.
         *
         *  - `id` – `{*}` - PersistedModel id
         *
         * @param {Object} postData Request data.
         *
         * This method expects a subset of model properties as request parameters.
         *
         * @param {function(Object,Object)=} successCb
         *   Success callback with two arguments: `value`, `responseHeaders`.
         *
         * @param {function(Object)=} errorCb Error callback with one argument:
         *   `httpResponse`.
         *
         * @returns {Object} An empty reference that will be
         *   populated with the actual data once the response is returned
         *   from the server.
         *
         * <em>
         * (The remote method definition does not provide any description.
         * This usually means the response is a `Nettest` object.)
         * </em>
         */
        "prototype$updateAttributes": {
          url: urlBase + "/nettests/:id",
          method: "PUT"
        },

        /**
         * @ngdoc method
         * @name lbServices.Nettest#createChangeStream
         * @methodOf lbServices.Nettest
         *
         * @description
         *
         * Create a change stream.
         *
         * @param {Object=} parameters Request parameters.
         *
         *   This method does not accept any parameters.
         *   Supply an empty object or omit this argument altogether.
         *
         * @param {Object} postData Request data.
         *
         *  - `options` – `{object=}` - 
         *
         * @param {function(Object,Object)=} successCb
         *   Success callback with two arguments: `value`, `responseHeaders`.
         *
         * @param {function(Object)=} errorCb Error callback with one argument:
         *   `httpResponse`.
         *
         * @returns {Object} An empty reference that will be
         *   populated with the actual data once the response is returned
         *   from the server.
         *
         * Data properties:
         *
         *  - `changes` – `{ReadableStream=}` - 
         */
        "createChangeStream": {
          url: urlBase + "/nettests/change-stream",
          method: "POST"
        },
      }
    );



        /**
         * @ngdoc method
         * @name lbServices.Nettest#updateOrCreate
         * @methodOf lbServices.Nettest
         *
         * @description
         *
         * Update an existing model instance or insert a new one into the data source.
         *
         * @param {Object=} parameters Request parameters.
         *
         *   This method does not accept any parameters.
         *   Supply an empty object or omit this argument altogether.
         *
         * @param {Object} postData Request data.
         *
         * This method expects a subset of model properties as request parameters.
         *
         * @param {function(Object,Object)=} successCb
         *   Success callback with two arguments: `value`, `responseHeaders`.
         *
         * @param {function(Object)=} errorCb Error callback with one argument:
         *   `httpResponse`.
         *
         * @returns {Object} An empty reference that will be
         *   populated with the actual data once the response is returned
         *   from the server.
         *
         * <em>
         * (The remote method definition does not provide any description.
         * This usually means the response is a `Nettest` object.)
         * </em>
         */
        R["updateOrCreate"] = R["upsert"];

        /**
         * @ngdoc method
         * @name lbServices.Nettest#update
         * @methodOf lbServices.Nettest
         *
         * @description
         *
         * Update instances of the model matched by where from the data source.
         *
         * @param {Object=} parameters Request parameters.
         *
         *  - `where` – `{object=}` - Criteria to match model instances
         *
         * @param {Object} postData Request data.
         *
         * This method expects a subset of model properties as request parameters.
         *
         * @param {function(Object,Object)=} successCb
         *   Success callback with two arguments: `value`, `responseHeaders`.
         *
         * @param {function(Object)=} errorCb Error callback with one argument:
         *   `httpResponse`.
         *
         * @returns {Object} An empty reference that will be
         *   populated with the actual data once the response is returned
         *   from the server.
         *
         * The number of instances updated
         */
        R["update"] = R["updateAll"];

        /**
         * @ngdoc method
         * @name lbServices.Nettest#destroyById
         * @methodOf lbServices.Nettest
         *
         * @description
         *
         * Delete a model instance by id from the data source.
         *
         * @param {Object=} parameters Request parameters.
         *
         *  - `id` – `{*}` - Model id
         *
         * @param {function(Object,Object)=} successCb
         *   Success callback with two arguments: `value`, `responseHeaders`.
         *
         * @param {function(Object)=} errorCb Error callback with one argument:
         *   `httpResponse`.
         *
         * @returns {Object} An empty reference that will be
         *   populated with the actual data once the response is returned
         *   from the server.
         *
         * <em>
         * (The remote method definition does not provide any description.
         * This usually means the response is a `Nettest` object.)
         * </em>
         */
        R["destroyById"] = R["deleteById"];

        /**
         * @ngdoc method
         * @name lbServices.Nettest#removeById
         * @methodOf lbServices.Nettest
         *
         * @description
         *
         * Delete a model instance by id from the data source.
         *
         * @param {Object=} parameters Request parameters.
         *
         *  - `id` – `{*}` - Model id
         *
         * @param {function(Object,Object)=} successCb
         *   Success callback with two arguments: `value`, `responseHeaders`.
         *
         * @param {function(Object)=} errorCb Error callback with one argument:
         *   `httpResponse`.
         *
         * @returns {Object} An empty reference that will be
         *   populated with the actual data once the response is returned
         *   from the server.
         *
         * <em>
         * (The remote method definition does not provide any description.
         * This usually means the response is a `Nettest` object.)
         * </em>
         */
        R["removeById"] = R["deleteById"];


    /**
    * @ngdoc property
    * @name lbServices.Nettest#modelName
    * @propertyOf lbServices.Nettest
    * @description
    * The name of the model represented by this $resource,
    * i.e. `Nettest`.
    */
    R.modelName = "Nettest";


    return R;
  }]);


module
  .factory('LoopBackAuth', function() {
    var props = ['accessTokenId', 'currentUserId'];
    var propsPrefix = '$LoopBack$';

    function LoopBackAuth() {
      var self = this;
      props.forEach(function(name) {
        self[name] = load(name);
      });
      this.rememberMe = undefined;
      this.currentUserData = null;
    }

    LoopBackAuth.prototype.save = function() {
      var self = this;
      var storage = this.rememberMe ? localStorage : sessionStorage;
      props.forEach(function(name) {
        save(storage, name, self[name]);
      });
    };

    LoopBackAuth.prototype.setUser = function(accessTokenId, userId, userData) {
      this.accessTokenId = accessTokenId;
      this.currentUserId = userId;
      this.currentUserData = userData;
    }

    LoopBackAuth.prototype.clearUser = function() {
      this.accessTokenId = null;
      this.currentUserId = null;
      this.currentUserData = null;
    }

    LoopBackAuth.prototype.clearStorage = function() {
      props.forEach(function(name) {
        save(sessionStorage, name, null);
        save(localStorage, name, null);
      });
    };

    return new LoopBackAuth();

    // Note: LocalStorage converts the value to string
    // We are using empty string as a marker for null/undefined values.
    function save(storage, name, value) {
      var key = propsPrefix + name;
      if (value == null) value = '';
      storage[key] = value;
    }

    function load(name) {
      var key = propsPrefix + name;
      return localStorage[key] || sessionStorage[key] || null;
    }
  })
  .config(['$httpProvider', function($httpProvider) {
    $httpProvider.interceptors.push('LoopBackAuthRequestInterceptor');
  }])
  .factory('LoopBackAuthRequestInterceptor', [ '$q', 'LoopBackAuth',
    function($q, LoopBackAuth) {
      return {
        'request': function(config) {

          // filter out non urlBase requests
          if (config.url.substr(0, urlBase.length) !== urlBase) {
            return config;
          }

          if (LoopBackAuth.accessTokenId) {
            config.headers[authHeader] = LoopBackAuth.accessTokenId;
          } else if (config.__isGetCurrentUser__) {
            // Return a stub 401 error for User.getCurrent() when
            // there is no user logged in
            var res = {
              body: { error: { status: 401 } },
              status: 401,
              config: config,
              headers: function() { return undefined; }
            };
            return $q.reject(res);
          }
          return config || $q.when(config);
        }
      }
    }])

  /**
   * @ngdoc object
   * @name lbServices.LoopBackResourceProvider
   * @header lbServices.LoopBackResourceProvider
   * @description
   * Use `LoopBackResourceProvider` to change the global configuration
   * settings used by all models. Note that the provider is available
   * to Configuration Blocks only, see
   * {@link https://docs.angularjs.org/guide/module#module-loading-dependencies Module Loading & Dependencies}
   * for more details.
   *
   * ## Example
   *
   * ```js
   * angular.module('app')
   *  .config(function(LoopBackResourceProvider) {
   *     LoopBackResourceProvider.setAuthHeader('X-Access-Token');
   *  });
   * ```
   */
  .provider('LoopBackResource', function LoopBackResourceProvider() {
    /**
     * @ngdoc method
     * @name lbServices.LoopBackResourceProvider#setAuthHeader
     * @methodOf lbServices.LoopBackResourceProvider
     * @param {string} header The header name to use, e.g. `X-Access-Token`
     * @description
     * Configure the REST transport to use a different header for sending
     * the authentication token. It is sent in the `Authorization` header
     * by default.
     */
    this.setAuthHeader = function(header) {
      authHeader = header;
    };

    /**
     * @ngdoc method
     * @name lbServices.LoopBackResourceProvider#setUrlBase
     * @methodOf lbServices.LoopBackResourceProvider
     * @param {string} url The URL to use, e.g. `/api` or `//example.com/api`.
     * @description
     * Change the URL of the REST API server. By default, the URL provided
     * to the code generator (`lb-ng` or `grunt-loopback-sdk-angular`) is used.
     */
    this.setUrlBase = function(url) {
      urlBase = url;
    };

    /**
     * @ngdoc method
     * @name lbServices.LoopBackResourceProvider#getUrlBase
     * @methodOf lbServices.LoopBackResourceProvider
     * @description
     * Get the URL of the REST API server. The URL provided
     * to the code generator (`lb-ng` or `grunt-loopback-sdk-angular`) is used.
     */
    this.getUrlBase = function() {
      return urlBase;
    };

    this.$get = ['$resource', function($resource) {
      return function(url, params, actions) {
        var resource = $resource(url, params, actions);

        // Angular always calls POST on $save()
        // This hack is based on
        // http://kirkbushell.me/angular-js-using-ng-resource-in-a-more-restful-manner/
        resource.prototype.$save = function(success, error) {
          // Fortunately, LoopBack provides a convenient `upsert` method
          // that exactly fits our needs.
          var result = resource.upsert.call(this, {}, this, success, error);
          return result.$promise || result;
        };
        return resource;
      };
    }];
  });

})(window, window.angular);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NjcmlwdHMvYXBwLmpzIiwiLi4vc2NyaXB0cy9jb250cm9sbGVycy9jb3VudHJ5LmpzIiwiLi4vc2NyaXB0cy9jb250cm9sbGVycy9leHBsb3JlLmpzIiwiLi4vc2NyaXB0cy9jb250cm9sbGVycy9ob21lLmpzIiwiLi4vc2NyaXB0cy9jb250cm9sbGVycy9tZWFzdXJlbWVudC5qcyIsIi4uL3NjcmlwdHMvY29udHJvbGxlcnMvbmV0dGVzdHMvYnJpZGdlLXJlYWNoYWJpbGl0eS5qcyIsIi4uL3NjcmlwdHMvY29udHJvbGxlcnMvbmV0dGVzdHMvaHR0cC1yZXF1ZXN0cy5qcyIsIi4uL3NjcmlwdHMvY29udHJvbGxlcnMvbmV0dGVzdHMvbmV0dGVzdHMuanMiLCIuLi9zY3JpcHRzL2NvbnRyb2xsZXJzL25ldHRlc3RzL3RjcC1jb25uZWN0LmpzIiwiLi4vc2NyaXB0cy9jb250cm9sbGVycy9vdmVydmlldy5qcyIsIi4uL3NjcmlwdHMvZGlyZWN0aXZlcy9kaXJlY3RpdmVzLmpzIiwiLi4vc2NyaXB0cy9zZXJ2aWNlcy9sYmNsaWVudC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxDQUFDLEdBQUcsQ0FBQyxNQUFNLEVBQUU7QUFDYjtBQUNBLEdBQUc7QUFDSCxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxRQUFRO0FBQ2xCLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFVBQVU7QUFDbkIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxXQUFXO0FBQ2YsQ0FBQyxDQUFDO0FBQ0YsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQztBQUNsQyxDQUFDLEVBQUU7QUFDSCxPQUFPO0FBQ1AsRUFBRSxDQUFDLE1BQU0sRUFBRSxVQUFVLEVBQUUsQ0FBQyxDQUFDO0FBQ3pCLElBQUksQ0FBQyxPQUFPLEVBQUU7QUFDZCxJQUFJLENBQUMsVUFBVSxFQUFFO0FBQ2pCLElBQUks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R0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDO0FBQ3hELFNBQVMsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsVUFBVSxDQUFDO0FBQ3JFLFNBQVMsQ0FBQztBQUNWLFNBQVMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUM7QUFDakQsU0FBUyxDQUFDO0FBQ1YsU0FBUyxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQztBQUNsRixTQUFTLENBQUM7QUFDVixTQUFTLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLFFBQVEsQ0FBQyxLQUFLLEVBQUUsTUFBTSxFQUFFLE1BQU0sR0FBRyxDQUFDLFNBQVM7QUFDOUQsU0FBUyxDQUFDLEdBQUcsT0FBTyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxlQUFlLEVBQUU7QUFDN0UsU0FBUyxDQUFDO0FBQ1YsU0FBUyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxRQUFRLENBQUMsTUFBTSxHQUFHLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUM7QUFDL0UsU0FBUyxDQUFDLEdBQUcsQ0FBQyxZQUFZLEVBQUU7QUFDNUIsU0FBUyxDQUFDO0FBQ1YsU0FBUyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxLQUFLLEVBQUUsTUFBTSxFQUFFLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxTQUFTLENB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TUFBTTtBQUN4QixTQUFTLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLFFBQVE7QUFDM0MsU0FBUyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsVUFBVSxDQUFDLE1BQU07QUFDdEMsU0FBUyxDQUFDO0FBQ1YsU0FBUyxDQUFDLENBQUMsQ0FBQyxXQUFXO0FBQ3ZCLFNBQVMsQ0FBQztBQUNWLFNBQVMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQztBQUM1RCxTQUFTLENBQUM7QUFDVixTQUFTLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLE1BQU0sRUFBRSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDO0FBQzFELFNBQVMsQ0FBQztBQUNWLFNBQVMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxFQUFFO0FBQ3JDLFNBQVMsQ0FBQztBQUNWLFNBQVMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsT0FBTztBQUN6RSxTQUFTLENBQUM7QUFDVixTQUFTLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsTUFBTSxHQUFHLENBQUMsU0FBUztBQUN0RCxTQUFTLENBQUMsR0FBRyxPQUFPLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLGVBQWUsRUFBRTtBQUM3RSxTQUFTLENBQUM7QUFDVixTQUFTLENBQUMs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QUFDLENBQUMsS0FBSyxDQUFDLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxTQUFTO0FBQ3RELFNBQVMsQ0FBQyxHQUFHLE9BQU8sQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsZUFBZSxFQUFFO0FBQzdFLFNBQVMsQ0FBQztBQUNWLFNBQVMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsUUFBUSxDQUFDLE1BQU0sR0FBRyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDO0FBQy9FLFNBQVMsQ0FBQyxHQUFHLENBQUMsWUFBWSxFQUFFO0FBQzVCLFNBQVMsQ0FBQztBQUNWLFNBQVMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFO0FBQzVELFNBQVMsQ0FBQyxHQUFHLFNBQVMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLFFBQVE7QUFDekUsU0FBUyxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUM7QUFDN0IsU0FBUyxDQUFDO0FBQ1YsU0FBUyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7QUFDZixTQUFTLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDO0FBQzFFLFNBQVMsQ0FBQyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FB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QUFDLE1BQU0sR0FBRyxDQUFDLFNBQVM7QUFDdEQsU0FBUyxDQUFDLEdBQUcsT0FBTyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxlQUFlLEVBQUU7QUFDN0UsU0FBUyxDQUFDO0FBQ1YsU0FBUyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxRQUFRLENBQUMsTUFBTSxHQUFHLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUM7QUFDL0UsU0FBUyxDQUFDLEdBQUcsQ0FBQyxZQUFZLEVBQUU7QUFDNUIsU0FBUyxDQUFDO0FBQ1YsU0FBUyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUU7QUFDNUQsU0FBUyxDQUFDLEdBQUcsU0FBUyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsUUFBUTtBQUN6RSxTQUFTLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQztBQUM3QixTQUFTLENBQUM7QUFDVixTQUFTLENBQUMsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDO0FBQzNCLFNBQVMsQ0FBQztBQUNWLFNBQVMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQztBQUN0QyxTQUFTLEVBQUU7QUFDWCxRQUFRLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQztBQUNsQixVQUFVLEdBQUcsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRSxPQUFPLENBQUMsS0FBSyxFQUFFO0FBQzFDLFVBQVUs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LENBQUM7QUFDckUsU0FBUyxDQUFDO0FBQ1YsU0FBUyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQztBQUNqRCxTQUFTLENBQUM7QUFDVixTQUFTLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUM7QUFDeEMsU0FBUyxDQUFDO0FBQ1YsU0FBUyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLE1BQU0sR0FBRyxDQUFDLFNBQVM7QUFDdEQsU0FBUyxDQUFDLEdBQUcsT0FBTyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxlQUFlLEVBQUU7QUFDN0UsU0FBUyxDQUFDO0FBQ1YsU0FBUyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxRQUFRLENBQUMsTUFBTSxHQUFHLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUM7QUFDL0UsU0FBUyxDQUFDLEdBQUcsQ0FBQyxZQUFZLEVBQUU7QUFDNUIsU0FBUyxDQUFDO0FBQ1YsU0FBUyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUU7QUFDNUQsU0FBUyxDQUFDLEdBQUcsU0FBUyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsUUFBUTtBQUN6RSxTQUFTLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQztBQUM3QixTQUFTLENBQUM7QUFDVixTQUFTLENBQUMsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDO0FBQzNCLFNBQVMsQ0FBQztBQUNWLFNBQVMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLGNBQWMsR0FBRyxDQUFDLENBQUMsQ0FBQztBQUNoRCxTQUFTLEVBQUU7QUFDWCxRQUFRLENBQUMsa0JBQWtCLEVBQUUsQ0FBQyxDQUFDO0FBQy9CLFVBQVUsR0FBRyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFFLE9BQU8sQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFO0FBQ2xELFVBQVUsTUFBTSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7QUFDeEIsUUFBUSxFQUFFO0FBQ1Y7QUFDQSxRQUFRLEdBQUc7QUFDWCxTQUFTLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxNQUFNO0FBQ3hCLFNBQVMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsY0FBYztBQUNqRCxTQUFTLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsTUFBTTtBQUN0QyxTQUFTLENBQUM7QUFDVixTQUFTLENBQUMsQ0FBQyxDQUFDLFdBQVc7QUFDdkIsU0FBUyxDQUFDO0FBQ1YsU0FBUyxDQUFDLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsSUFBSTtBQUNoRCxTQUFTLENBQUM7QUFDVixTQUFTLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLE1BQU0sRUFBRSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDO0FBQzFELFNBQVMsQ0FBQztBQUNWLFNBQVMsQ0FBQyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQztBQUN4RCxTQUFTLENBQUMsR0FBRyxNQUFNLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQztBQUNyRSxTQUFTLENBQUM7QUFDVixTQUFTLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLFFBQVEsQ0FBQyxLQUFLLEVBQUUsTUFBTSxFQUFFLE1BQU0sR0FBRyxDQUFDLFNBQVM7QUFDOUQsU0FBUyxDQUFDLEdBQUcsT0FBTyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxlQUFlLEVBQUU7QUFDN0UsU0FBUyxDQUFDO0FBQ1YsU0FBUyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxRQUFRLENBQUMsTUFBTSxHQUFHLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUM7QUFDL0UsU0FBUyxDQUFDLEdBQUcsQ0FBQyxZQUFZLEVBQUU7QUFDNUIsU0FBUyxDQUFDO0FBQ1YsU0FBUyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxLQUFLLEVBQUUsTUFBTSxFQUFFLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFO0FBQ3BFLFNBQVMsQ0FBQyxHQUFHLFNBQVMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLFFBQVE7QUFDekUsU0FBUyxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUM7QUFDN0IsU0FBUyxDQUFDO0FBQ1YsU0FBUyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7QUFDZixTQUFTLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENB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QUFDLENBQUMsV0FBVztBQUN2QixTQUFTLENBQUM7QUFDVixTQUFTLENBQUMsQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQztBQUMvRSxTQUFTLENBQUM7QUFDVixTQUFTLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLE1BQU0sRUFBRSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDO0FBQzFELFNBQVMsQ0FBQztBQUNWLFNBQVMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsU0FBUztBQUN2RSxTQUFTLENBQUM7QUFDVixTQUFTLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDO0FBQ2pELFNBQVMsQ0FBQztBQUNWLFNBQVMsQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUM7QUFDbEYsU0FBUyxDQUFDO0FBQ1YsU0FBUyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLE1BQU0sR0FBRyxDQUFDLFNBQVM7QUFDdEQsU0FBUyxDQUFDLEdBQUcsT0FBTyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxlQUFlLEVBQUU7QUFDN0UsU0FBUyxDQUFDO0FBQ1YsU0FBUyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxRQUFRLENBQUMsTUFBTSxHQUFHLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUM7QUFDL0UsU0FBUyxDQUFDLEdBQUcsQ0FBQyxZQUFZLEVBQUU7QUFDNUIsU0FBUyxDQUFDO0FBQ1YsU0FBUyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUU7QUFDNUQsU0FBUyxDQUFDLEdBQUcsU0FBUyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsUUFBUTtBQUN6RSxTQUFTLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQztBQUM3QixTQUFTLENBQUM7QUFDVixTQUFTLENBQUMsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxTQUFTLENBQUMsT0FBTztBQUMxQyxTQUFTLEVBQUU7QUFDWCxRQUFRLENBQUMsRUFBRSxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLFNBQVMsR0FBRztBQUNyQztBQUNBLFFBQVEsR0FBRztBQUNYLFNBQVMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLE1BQU07QUFDeEIsU0FBUyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxXQUFXO0FBQzlDLFNBQVMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxNQUFNO0FBQ3RDLFNBQVMsQ0FBQztBQUNWLFNBQVMsQ0FBQyxDQUFDLENBQUMsV0FBVztBQUN2QixTQUFTLENBQUM7QUFDVixTQUFTLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUM7QUFDOUQsU0FBUyxDQUFDO0FBQ1YsU0FBUyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQztBQUMxRCxTQUFTLENBQUM7QUFDVixTQUFTLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsRUFBRTtBQUNyQyxTQUFTLENBQUM7QUFDVixTQUFTLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsTUFBTSxHQUFHLENBQUMsU0FBUztBQUN0RCxTQUFTLENBQUMsR0FBRyxPQUFPLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLGVBQWUsRUFBRTtBQUM3RSxTQUFTLENBQUM7QUFDVixTQUFTLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLFFBQVEsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQztBQUMvRSxTQUFTLENBQUMsR0FBRyxDQUFDLFlBQVksRUFBRTtBQUM1QixTQUFTLENBQUM7QUFDVixTQUFTLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRTtBQUM1RCxTQUFTLENBQUMsR0FBRyxTQUFTLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxRQUFRO0FBQ3pFLFNBQVMsQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDO0FBQzdCLFNBQVMsQ0FBQztBQUNWLFNBQVMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO0FBQ2YsU0FBUyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQztBQUMxRSxTQUFTLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxNQUFNLEVBQUU7QUFDakUsU0FBUyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUM7QUFDaEIsU0FBUyxFQUFFO0FBQ1gsUUFBUSxDQUFDLEVBQUUsV0FBVyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxVQUFVLEdBQUc7QUFDM0M7QUFDQSxRQUFRLEdBQUc7QUFDWCxTQUFTLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxNQUFNO0FBQ3hCLFNBQVMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsVUFBVTtBQUM3QyxTQUFTLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsTUFBTTtBQUN0QyxTQUFTLENBQUM7QUFDVixTQUFTLENBQUMsQ0FBQyxDQUFDLFdBQVc7QUFDdkIsU0FBUyxDQUFDO0FBQ1YsU0FBUyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDO0FBQzlELFNBQVMsQ0FBQztBQUNWLFNBQVMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsTUFBTSxFQUFFLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUM7QUFDMUQsU0FBUyxDQUFDO0FBQ1YsU0FBUyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEVBQUU7QUFDckMsU0FBUyxDQUFDO0FBQ1YsU0FBUyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLE1BQU0sR0FBRyxDQUFDLFNBQVM7QUFDdEQsU0FBUyxDQUFDLEdBQUcsT0FBTyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxlQUFlLEVBQUU7QUFDN0UsU0FBUyxDQUFDO0FBQ1YsU0FBUyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxRQUFRLENBQUMsTUFBTSxHQUFHLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUM7QUFDL0UsU0FBUyxDQUFDLEdBQUcsQ0FBQyxZQUFZLEVBQUU7QUFDNUIsU0FBUyxDQUFDO0FBQ1YsU0FBUyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUU7QUFDNUQsU0FBUyxDQUFDLEdBQUcsU0FBUyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsUUFBUTtBQUN6RSxTQUFTLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQztBQUM3QixTQUFTLENBQUM7QUFDVixTQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztBQUNmLFNBQVMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxNQUFN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QU8sQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDO0FBQ2xGLFNBQVMsQ0FBQztBQUNWLFNBQVMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsTUFBTSxFQUFFLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUM7QUFDMUQsU0FBUyxDQUFDO0FBQ1YsU0FBUyxDQUFDLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDO0FBQ3hELFNBQVMsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsVUFBVSxDQUFDO0FBQ3JFLFNBQVMsQ0FBQztBQUNWLFNBQVMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUM7QUFDakQsU0FBUyxDQUFDO0FBQ1YsU0FBUyxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQztBQUNsRixTQUFTLENBQUM7QUFDVixTQUFTLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLFFBQVEsQ0FBQyxLQUFLLEVBQUUsTUFBTSxFQUFFLE1BQU0sR0FBRyxDQUFDLFNBQVM7QUFDOUQsU0FBUyxDQUFDLEdBQUcsT0FBTyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxlQUFlLEVBQUU7QUFDN0UsU0FBUyxDQUFDO0FBQ1YsU0FBUyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxRQUFRLENBQUMsTUFBTSxHQUFHLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUM7QUFDL0UsU0FBUyxDQUFDLEdBQUcsQ0FBQyxZQUFZLEVBQUU7QUFDNUIsU0FBUyxDQUFDO0FBQ1YsU0FBUyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxLQUFLLEVBQUUsTUFBTSxFQUFFLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFO0FBQ3BFLFNBQVMsQ0FBQyxHQUFHLFNBQVMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLFFBQVE7QUFDekUsU0FBUyxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUM7QUFDN0IsU0FBUyxDQUFDO0FBQ1YsU0FBUyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7QUFDZixTQUFTLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDO0FBQzFFLFNBQVMsQ0FBQyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLE1BQU0sRUFBRTtBQUNsRSxTQUFTLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQztBQUNoQixTQUFTLEVBQUU7QUFDWCxRQUFRLENBQUMsVUFBVSxFQUFFLENBQUMsQ0FBQztBQUN2QixVQUFVLE9BQU8sQ0FBQyxDQUFDLElBQUksQ0FBQztBQUN4QixVQUFVLEdBQUcsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRSxTQUFTLEVBQUU7QUFDdEMsVUFBVSxNQUFNLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztBQUN4QixRQUFRLEVBQUU7QUFDVjtBQUNBLFFBQVEsR0FBRztBQUNYLFNBQVMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLE1BQU07QUFDeEIsU0FBUyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxNQUFNO0FBQzFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxPQUFPO0FBQ3ZDLFNBQVMsQ0FBQztBQUNWLFNBQVMsQ0FBQyxDQUFDLENBQUMsV0FBVztBQUN2QixTQUFTLENBQUM7QUFDVixTQUFTLENBQUMsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDO0FBQ3RGLFNBQVMsQ0FBQztBQUNWLFNBQVMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsTUFBTSxFQUFFLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUM7QUFDMUQsU0FBUyxDQUFDO0FBQ1YsU0FBUyxDQUFDLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDO0FBQ3hELFNBQVMsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsVUFBVSxDQUFDO0FBQ3JFLFNBQVMsQ0FBQztBQUNWLFNBQVMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUM7QUFDakQsU0FBUyxDQUFDO0FBQ1YsU0FBUyxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQztBQUNsRixTQUFTLENBQUM7QUFDVixTQUFTLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsTUFBTSxHQUFHLENBQUMsU0FBUztBQUN0RCxTQUFTLENBQUMsR0FBRyxPQUFPLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLGVBQWUsRUFBRTtBQUM3RSxTQUFTLENBQUM7QUFDVixTQUFTLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLFFBQVEsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQztBQUMvRSxTQUFTLENBQUMsR0FBRyxDQUFDLFlBQVksRUFBRTtBQUM1QixTQUFTLENBQUM7QUFDVixTQUFTLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRTtBQUM1RCxTQUFTLENBQUMsR0FBRyxTQUFTLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxRQUFRO0FBQ3pFLFNBQVMsQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDO0FBQzdCLFNBQVMsQ0FBQztBQUNWLFNBQVMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO0FBQ2YsU0FBUyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQztBQUMxRSxTQUFTLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxNQUFNLEVBQUU7QUFDbEUsU0FBUyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUM7QUFDaEIsU0FBUyxFQUFFO0FBQ1gsUUFBUSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUM7QUFDbkIsVUFBVSxHQUFHLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUUsU0FBUyxFQUFFO0FBQ3RDLFVBQVUsTUFBTSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUM7QUFDdkIsUUFBUSxFQUFFO0FBQ1Y7QUFDQSxRQUFRLEdBQUc7QUFDWCxTQUFTLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxNQUFNO0FBQ3hCLFNBQVMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsTUFBTTtBQUMxQyxTQUFTLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsT0FBTztBQUN2QyxTQUFTLENBQUM7QUFDVixTQUFTLENBQUMsQ0FBQyxDQUFDLFdBQVc7QUFDdkIsU0FBUyxDQUFDO0FBQ1YsU0FBUyxDQUFDLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDO0FBQ3BFLFNBQVMsQ0FBQztBQUNWLFNBQVMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsTUFBTSxFQUFFLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUM7QUFDMUQsU0FBUyxDQUFDO0FBQ1YsU0FBUyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEVBQUU7QUFDckMsU0FBUyxDQUFDO0FBQ1YsU0FBUyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLE1BQU0sR0FBRyxDQUFDLFNBQVM7QUFDdEQsU0FBUyxDQUFDLEdBQUcsT0FBTyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxlQUFlLEVBQUU7QUFDN0UsU0FBUyxDQUFDO0FBQ1YsU0FBUyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxRQUFRLENBQUMsTUFBTSxHQUFHLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUM7QUFDL0UsU0FBUyxDQUFDLEdBQUcsQ0FBQyxZQUFZLEVBQUU7QUFDNUIsU0FBUyxDQUFDO0FBQ1YsU0FBUyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUU7QUFDNUQsU0FBUyxDQUFDLEdBQUcsU0FBUyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsUUFBUTtBQUN6RSxTQUFTLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQztBQUM3QixTQUFTLENBQUM7QUFDVixTQUFTLENBQUMsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDO0FBQzNCLFNBQVMsQ0FBQztBQUNWLFNBQVMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLE9BQU8sR0FBRyxDQUFDLENBQUMsQ0FBQztBQUN4QyxTQUFTLEVBQUU7QUFDWCxRQUFRLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQztBQUNuQixVQUFVLEdBQUcsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRSxTQUFTLEVBQUUsRUFBRSxDQUFDLE1BQU0sRUFBRTtBQUNqRCxVQUFVLE1BQU0sQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDO0FBQ3ZCLFFBQVEsRUFBRTtBQUNWO0FBQ0EsUUFBUSxHQUFHO0FBQ1gsU0FBUyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsTUFBTTtBQUN4QixTQUFTLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLFFBQVE7QUFDNUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsVUFBVSxDQUFDLE9BQU87QUFDdkMsU0FBUyxDQUFDO0FBQ1YsU0FBUyxDQUFDLENBQUMsQ0FBQyxXQUFXO0FBQ3ZCLFNBQVMsQ0FBQztBQUNWLFNBQVMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQztBQUM1RCxTQUFTLENBQUM7QUFDVixTQUFTLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLE1BQU0sRUFBRSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDO0FBQzFELFNBQVMsQ0FBQztBQUNWLFNBQVMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxFQUFFO0FBQ3JDLFNBQVMsQ0FBQztBQUNWLFNBQVMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsT0FBTztBQUN6RSxTQUFTLENBQUM7QUFDVixTQUFTLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsTUFBTSxHQUFHLENBQUMsU0FBUztBQUN0RCxTQUFTLENBQUMsR0FBRyxPQUFPLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLGVBQWUsRUFBRTtBQUM3RSxTQUFTLENBQUM7QUFDVixTQUFTLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLFFBQVEsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQztBQUMvRSxTQUFTLENBQUMsR0FBRyxDQUFDLFlBQVksRUFBRTtBQUM1QixTQUFTLENBQUM7QUFDVixTQUFTLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRTtBQUM1RCxTQUFTLENBQUMsR0FBRyxTQUFTLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxRQUFRO0FBQ3pFLFNBQVMsQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDO0FBQzdCLFNBQVMsQ0FBQztBQUNWLFNBQVMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO0FBQ2YsU0FBUyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQztBQUMxRSxTQUFTLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxNQUFNLEVBQUU7QUFDbEUsU0FBUyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUM7QUFDaEIsU0FBUyxFQUFFO0FBQ1gsUUFBUSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7QUFDckIsVUFBVSxHQUFHLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUUsU0FBUyxFQUFFLEVBQUUsRUFBRTtBQUMxQyxVQUFVLE1BQU0sQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDO0FBQ3ZCLFFBQVEsRUFBRTtBQUNWO0FBQ0EsUUFBUSxHQUFHO0FBQ1gsU0FBUyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsTUFBTTtBQUN4QixTQUFTLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLElBQUk7QUFDeEMsU0FBUyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsVUFBVSxDQUFDLE9BQU87QUFDdkMsU0FBUyxDQUFDO0FBQ1YsU0FBUyxDQUFDLENBQUMsQ0FBQyxXQUFXO0FBQ3ZCLFNBQVMsQ0FBQztBQUNWLFNBQVMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQztBQUNsRixTQUFTLENBQUM7QUFDVixTQUFTLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLE1BQU0sRUFBRSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDO0FBQzFELFNBQVMsQ0FBQztBQUNWLFNBQVMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEdBQUcsQ0FBQyxLQUFLO0FBQ3ZHLFNBQVMsQ0FBQztBQUNWLFNBQVMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsUUFBUSxDQUFDLEtBQUssRUFBRSxNQUFNLEVBQUUsTUFBTSxHQUFHLENBQUMsU0FBUztBQUM5RCxTQUFTLENBQUMsR0FBRyxPQUFPLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLGVBQWUsRUFBRTtBQUM3RSxTQUFTLENBQUM7QUFDVixTQUFTLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLFFBQVEsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQztBQUMvRSxTQUFTLENBQUMsR0FBRyxDQUFDLFlBQVksRUFBRTtBQUM1QixTQUFTLENBQUM7QUFDVixTQUFTLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLEtBQUssRUFBRSxNQUFNLEVBQUUsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUU7QUFDcEUsU0FBUyxDQUFDLEdBQUcsU0FBUyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsUUFBUTtBQUN6RSxTQUFTLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQztBQUM3QixTQUFTLENBQUM7QUFDVixTQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztBQUNmLFNBQVMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUM7QUFDMUUsU0FBUyxDQUFDLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsTUFBTSxFQUFFO0FBQ2xFLFNBQVMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDO0FBQ2hCLFNBQVMsRUFBRTtBQUNYLFFBQVEsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDO0FBQ2pCLFVBQVUsT0FBTyxDQUFDLENBQUMsSUFBSSxDQUFDO0FBQ3hCLFVBQVUsR0FBRyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFFLFNBQVMsRUFBRTtBQUN0QyxVQUFVLE1BQU0sQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDO0FBQ3ZCLFFBQVEsRUFBRTtBQUNWO0FBQ0EsUUFBUSxHQUFHO0FBQ1gsU0FBUyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsTUFBTTtBQUN4QixTQUFTLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLE9BQU87QUFDM0MsU0FBUyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsVUFBVSxDQUFDLE9BQU87QUFDdkMsU0FBUyxDQUFDO0FBQ1YsU0FBUyxDQUFDLENBQUMsQ0FBQyxXQUFXO0FBQ3ZCLFNBQVMsQ0FBQztBQUNWLFNBQVMsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQztBQUNuRixTQUFTLENBQUM7QUFDVixTQUFTLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLE1BQU0sRUFBRSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDO0FBQzFELFNBQVMsQ0FBQztBQUNWLFNBQVMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEdBQUcsQ0FBQyxLQUFLO0FBQ3ZHLFNBQVMsQ0FBQztBQUNWLFNBQVMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxTQUFTO0FBQ3RELFNBQVMsQ0FBQyxHQUFHLE9BQU8sQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsZUFBZSxFQUFFO0FBQzdFLFNBQVMsQ0FBQztBQUNWLFNBQVMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsUUFBUSxDQUFDLE1BQU0sR0FBRyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDO0FBQy9FLFNBQVMsQ0FBQyxHQUFHLENBQUMsWUFBWSxFQUFFO0FBQzVCLFNBQVMsQ0FBQztBQUNWLFNBQVMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFO0FBQzVELFNBQVMsQ0FBQyxHQUFHLFNBQVMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLFFBQVE7QUFDekUsU0FBUyxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUM7QUFDN0IsU0FBUyxDQUFDO0FBQ1YsU0FBUyxDQUFD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RSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDO0FBQzFELFNBQVMsQ0FBQztBQUNWLFNBQVMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxFQUFFO0FBQ3JDLFNBQVMsQ0FBQztBQUNWLFNBQVMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxTQUFTO0FBQ3RELFNBQVMsQ0FBQyxHQUFHLE9BQU8sQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsZUFBZSxFQUFFO0FBQzdFLFNBQVMsQ0FBQztBQUNWLFNBQVMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsUUFBUSxDQUFDLE1BQU0sR0FBRyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDO0FBQy9FLFNBQVMsQ0FBQyxHQUFHLENBQUMsWUFBWSxFQUFFO0FBQzVCLFNBQVMsQ0FBQztBQUNWLFNBQVMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFO0FBQzVELFNBQVMsQ0FBQyxHQUFHLFNBQVMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLFFBQVE7QUFDekUsU0FBUyxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUM7QUFDN0IsU0FBUyxDQUFDO0FBQ1YsU0FBUyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7QUFDZixTQUFTLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDO0FBQzFFLFNBQVMsQ0FBQyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLE1BQU0sRUFBRTtBQUNsRSxTQUFTLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQztBQUNoQixTQUFTLEVBQUU7QUFDWCxRQUFRLENBQUMsVUFBVSxFQUFFLENBQUMsQ0FBQztBQUN2QixVQUFVLEdBQUcsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRSxTQUFTLEVBQUUsRUFBRSxFQUFFO0FBQzFDLFVBQVUsTUFBTSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUM7QUFDMUIsUUFBUSxFQUFFO0FBQ1Y7QUFDQSxRQUFRLEdBQUc7QUFDWCxTQUFTLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxNQUFNO0FBQ3hCLFNBQVMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsS0FBSztBQUN6QyxTQUFTLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsT0FBTztBQUN2QyxTQUFTLENBQUM7QUFDVixTQUFTLENBQUMsQ0FBQyxDQUFDLFdBQVc7QUFDdkIsU0FBUyxDQUFDO0FBQ1YsU0FBUyxDQUFDLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUM7QUFDOUUsU0FBUyxDQUFDO0FBQ1YsU0FBUyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQztBQUMxRCxTQUFTLENBQUM7QUFDVixTQUFTLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLFNBQVM7QUFDdkUsU0FBUyxDQUFDO0FBQ1YsU0FBUyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLE1BQU0sR0FBRyxDQUFDLFNBQVM7QUFDdEQsU0FBUyxDQUFDLEdBQUcsT0FBTyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxlQUFlLEVBQUU7QUFDN0UsU0FBUyxDQUFDO0FBQ1YsU0FBUyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxRQUFRLENBQUMsTUFBTSxHQUFHLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUM7QUFDL0UsU0FBUyxDQUFDLEdBQUcsQ0FBQyxZQUFZLEVBQUU7QUFDNUIsU0FBUyxDQUFDO0FBQ1YsU0FBUyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUU7QUFDNUQsU0FBUyxDQUFDLEdBQUcsU0FBUyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsUUFBUTtBQUN6RSxTQUFTLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQztBQUM3QixTQUFTLENBQUM7QUFDVixTQUFTLENBQUMsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDO0FBQzNCLFNBQVMsQ0FB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QUFDLFVBQVUsQ0FBQztBQUMxRCxTQUFTLENBQUM7QUFDVixTQUFTLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUM7QUFDeEQsU0FBUyxDQUFDLEdBQUcsTUFBTSxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUM7QUFDckUsU0FBUyxDQUFDO0FBQ1YsU0FBUyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQztBQUNqRCxTQUFTLENBQUM7QUFDVixTQUFTLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUM7QUFDeEMsU0FBUyxDQUFDO0FBQ1YsU0FBUyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLE1BQU0sR0FBRyxDQUFDLFNBQVM7QUFDdEQsU0FBUyxDQUFDLEdBQUcsT0FBTyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxlQUFlLEVBQUU7QUFDN0UsU0FBUyxDQUFDO0FBQ1YsU0FBUyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxRQUFRLENBQUMsTUFBTSxHQUFHLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUM7QUFDL0UsU0FBUyxDQUFDLEdBQUcsQ0FBQyxZQUFZLEVBQUU7QUFDNUIsU0FBUyxDQUFDO0FBQ1YsU0FBUyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLENB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QUFTLENBQUMsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxTQUFTLENBQUMsT0FBTztBQUMxQyxTQUFTLEVBQUU7QUFDWCxRQUFRLENBQUMsRUFBRSxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLFNBQVMsR0FBRztBQUNyQztBQUNBLFFBQVEsR0FBRztBQUNYLFNBQVMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLE1BQU07QUFDeEIsU0FBUyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxXQUFXO0FBQy9DLFNBQVMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxPQUFPO0FBQ3ZDLFNBQVMsQ0FBQztBQUNWLFNBQVMsQ0FBQyxDQUFDLENBQUMsV0FBVztBQUN2QixTQUFTLENBQUM7QUFDVixTQUFTLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUM7QUFDOUQsU0FBUyxDQUFDO0FBQ1YsU0FBUyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQztBQUMxRCxTQUFTLENBQUM7QUFDVixTQUFTLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsRUFBRTtBQUNyQyxTQUFTLENBQUM7QUFDVixTQUFTLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsTUFBTSxHQUFHLENBQUMsU0FBUztBQUN0RCxTQUFTLENBQUMsR0FBRyxPQUFPLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxD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Q0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQztBQUNsRixTQUFTLENBQUM7QUFDVixTQUFTLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLE1BQU0sRUFBRSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDO0FBQzFELFNBQVMsQ0FBQztBQUNWLFNBQVMsQ0FBQyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQztBQUN4RCxTQUFTLENBQUMsR0FBRyxNQUFNLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQztBQUNyRSxTQUFTLENBQUM7QUFDVixTQUFTLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDO0FBQ2pELFNBQVMsQ0FBQztBQUNWLFNBQVMsQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUM7QUFDbEYsU0FBUyxDQUFDO0FBQ1YsU0FBUyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLE1BQU0sR0FBRyxDQUFDLFNBQVM7QUFDdEQsU0FBUyxDQUFDLEdBQUcsT0FBTyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxlQUFlLEVBQUU7QUFDN0UsU0FBUyxDQUFDO0FBQ1YsU0FBUyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxRQUFRLENBQUMsTUFBTSxHQUFHLENBQUMsT0FBTyxDQUFDLEtB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QUN2QixTQUFTLENBQUM7QUFDVixTQUFTLENBQUMsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUM7QUFDcEUsU0FBUyxDQUFDO0FBQ1YsU0FBUyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQztBQUMxRCxTQUFTLENBQUM7QUFDVixTQUFTLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsRUFBRTtBQUNyQyxTQUFTLENBQUM7QUFDVixTQUFTLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsTUFBTSxHQUFHLENBQUMsU0FBUztBQUN0RCxTQUFTLENBQUMsR0FBRyxPQUFPLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLGVBQWUsRUFBRTtBQUM3RSxTQUFTLENBQUM7QUFDVixTQUFTLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLFFBQVEsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQztBQUMvRSxTQUFTLENBQUMsR0FBRyxDQUFDLFlBQVksRUFBRTtBQUM1QixTQUFTLENBQUM7QUFDVixTQUFTLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRTtBQUM1RCxTQUFTLENBQUMsR0FBRyxTQUFTLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxRQUFRO0FBQ3pFLFNBQVMsQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDO0FBQzdCLFNBQVMsQ0FBQztBQUNWLFNBQVMsQ0FBQyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUM7QUFDM0IsU0FBUyxDQUFDO0FBQ1YsU0FBUyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsT0FBTyxHQUFHLENBQUMsQ0FBQyxDQUFDO0FBQ3hDLFNBQVMsRUFBRTtBQUNYLFFBQVEsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDO0FBQ25CLFVBQVUsR0FBRyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFFLFFBQVEsRUFBRSxFQUFFLENBQUMsTUFBTSxFQUFFO0FBQ2hELFVBQVUsTUFBTSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUM7QUFDdkIsUUFBUSxFQUFFO0FBQ1Y7QUFDQSxRQUFRLEdBQUc7QUFDWCxTQUFTLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxNQUFNO0FBQ3hCLFNBQVMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsUUFBUTtBQUM1QyxTQUFTLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsT0FBTztBQUN2QyxTQUFTLENBQUM7QUFDVixTQUFTLENBQUMsQ0FBQyxDQUFDLFdBQVc7QUFDdkIsU0FBUyxDQUFDO0FBQ1YsU0FBUyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDO0FBQzVELFNBQVMsQ0FBQztBQUNWLFNBQVMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsTUFBTSxFQUFFLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUM7QUFDMUQsU0FBUyxDQUFDO0FBQ1YsU0FBUyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEVBQUU7QUFDckMsU0FBUyxDQUFDO0FBQ1YsU0FBUyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxPQUFPO0FBQ3pFLFNBQVMsQ0FBQztBQUNWLFNBQVMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxTQUFTO0FBQ3RELFNBQVMsQ0FBQyxHQUFHLE9BQU8sQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsZUFBZSxFQUFFO0FBQzdFLFNBQVMsQ0FBQztBQUNWLFNBQVMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsUUFBUSxDQUFDLE1BQU0sR0FBRyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDO0FBQy9FLFNBQVMsQ0FBQyxHQUFHLENBQUMsWUFBWSxFQUFFO0FBQzVCLFNBQVMsQ0FBQztBQUNWLFNBQVMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFO0FBQzVELFNBQVMsQ0FBQyxHQUFHLFNBQVMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLFFBQVE7QUFDekUsU0FBUyxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUM7QUFDN0IsU0FBUyxDQUFDO0FBQ1YsU0FBUyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7QUFDZixTQUFTLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDO0FBQzFFLFNBQVMsQ0FBQyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLE1BQU0sRUFBRTtBQUNsRSxTQUFTLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQztBQUNoQixTQUFTLEVBQUU7QUFDWCxRQUFRLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztBQUNyQixVQUFVLEdBQUcsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRSxRQUFRLEVBQUUsRUFBRSxFQUFFO0FBQ3pDLFVBQVUsTUFBTSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUM7QUFDdkIsUUFBUSxFQUFFO0FBQ1Y7QUFDQSxRQUFRLEdBQUc7QUFDWCxTQUFTLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxNQUFNO0FBQ3hCLFNBQVMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsSUFBSTtBQUN4QyxTQUFTLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsT0FBTztBQUN2QyxTQUFTLENBQUM7QUFDVixTQUFTLENBQUMsQ0FBQyxDQUFDLFdBQVc7QUFDdkIsU0FBUyxDQUFDO0FBQ1YsU0FBUyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDO0FBQ2xGLFNBQVMsQ0FBQztBQUNWLFNBQVMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsTUFBTSxFQUFFLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUM7QUFDMUQsU0FBUyxDQUFDO0FBQ1YsU0FBUyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsR0FBRyxDQUFDLEtBQUs7QUFDdkcsU0FBUyxDQUFDO0FBQ1YsU0FBUyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxRQUFRLENBQUMsS0FBSyxFQUFFLE1BQU0sRUFBRSxNQUFNLEdBQUcsQ0FBQyxTQUFTO0FBQzlELFNBQVMsQ0FBQyxHQUFHLE9BQU8sQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsZUFBZSxFQUFFO0FBQzdFLFNBQVMsQ0FBQztBQUNWLFNBQVMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsUUFBUSxDQUFDLE1BQU0sR0FBRyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDO0FBQy9FLFNBQVMsQ0FBQyxHQUFHLENBQUMsWUFBWSxFQUFFO0FBQzVCLFNBQVMsQ0FBQztBQUNWLFNBQVMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsS0FBSyxFQUFFLE1BQU0sRUFBRSxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRTtBQUNwRSxTQUFTLENBQUMsR0FBRyxTQUFTLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxRQUFRO0FBQ3pFLFNBQVMsQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDO0FBQzdCLFNBQVMsQ0FBQztBQUNWLFNBQVMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO0FBQ2YsU0FBUyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQztBQUMxRSxTQUFTLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxNQUFNLEVBQUU7QUFDbEUsU0FBUyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUM7QUFDaEIsU0FBUyxFQUFFO0FBQ1gsUUFBUSxDQUFDLElBQUksRUFBRSxDQUFDLENBQUM7QUFDakIsVUFBVSxPQUFPLENBQUMsQ0FBQyxJQUFJLENBQUM7QUFDeEIsVUFBVSxHQUFHLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUUsUUFBUSxFQUFFO0FBQ3JDLFVBQVUsTUFBTSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUM7QUFDdkIsUUFBUSxFQUFFO0FBQ1Y7QUFDQSxRQUFRLEdBQUc7QUFDWCxTQUFTLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxNQUFNO0FBQ3hCLFNBQVMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsT0FBTztBQUMzQyxTQUFTLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsT0FBTztBQUN2QyxTQUFTLENBQUM7QUFDVixTQUFTLENBQUMsQ0FBQyxDQUFDLFdBQVc7QUFDdkIsU0FBUyxDQUFDO0FBQ1YsU0FBUyxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDO0FBQ25GLFNBQVMsQ0FBQztBQUNWLFNBQVMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsTUFBTSxFQUFFLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUM7QUFDMUQsU0FBUyxDQUFDO0FBQ1YsU0FBUyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsR0FBRyxDQUFDLEtBQUs7QUFDdkcsU0FBUyxDQUFDO0FBQ1YsU0FBUyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLE1BQU0sR0FBRyxDQUFDLFNBQVM7QUFDdEQsU0FBUyxDQUFDLEdBQUcsT0FBTyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxlQUFlLEVBQUU7QUFDN0UsU0FBUyxDQUFDO0FBQ1YsU0FBUyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxRQUFRLENBQUMsTUFBTSxHQUFHLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUM7QUFDL0UsU0FBUyxDQUFDLEdBQUcsQ0FBQyxZQUFZLEVBQUU7QUFDNUIsU0FBUyxDQUFDO0FB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QUMsVUFBVTtBQUM5QyxTQUFTLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsT0FBTztBQUN2QyxTQUFTLENBQUM7QUFDVixTQUFTLENBQUMsQ0FBQyxDQUFDLFdBQVc7QUFDdkIsU0FBUyxDQUFDO0FBQ1YsU0FBUyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDO0FBQzlELFNBQVMsQ0FBQztBQUNWLFNBQVMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsTUFBTSxFQUFFLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUM7QUFDMUQsU0FBUyxDQUFDO0FBQ1YsU0FBUyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEVBQUU7QUFDckMsU0FBUyxDQUFDO0FBQ1YsU0FBUyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLE1BQU0sR0FBRyxDQUFDLFNBQVM7QUFDdEQsU0FBUyxDQUFDLEdBQUcsT0FBTyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxlQUFlLEVBQUU7QUFDN0UsU0FBUyxDQUFDO0FBQ1YsU0FBUyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxRQUFRLENBQUMsTUFBTSxHQUFHLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUM7QUFDL0UsU0FBUyxDQUFDLEdBQUcsQ0FBQyxZQUFZLEVBQUU7QUFDNUIsU0FBUyxDQUFDO0FBQ1YsU0FBUyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxNQUFNLENB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QyxNQUFNLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUM7QUFDbEYsU0FBUyxDQUFDO0FBQ1YsU0FBUyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLE1BQU0sR0FBRyxDQUFDLFNBQVM7QUFDdEQsU0FBUyxDQUFDLEdBQUcsT0FBTyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxlQUFlLEVBQUU7QUFDN0UsU0FBUyxDQUFDO0FBQ1YsU0FBUyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxRQUFRLENBQUMsTUFBTSxHQUFHLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUM7QUFDL0UsU0FBUyxDQUFDLEdBQUcsQ0FBQyxZQUFZLEVBQUU7QUFDNUIsU0FBUyxDQUFDO0FBQ1YsU0FBUyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUU7QUFDNUQsU0FBUyxDQUFDLEdBQUcsU0FBUyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsUUFBUTtBQUN6RSxTQUFTLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQztBQUM3QixTQUFTLENBQUM7QUFDVixTQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztBQUNmLFNBQVMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLEdBQUcs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QUUsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDO0FBQy9FLEtBQUssRUFBRTtBQUNQLElBQUksSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7QUFDckMsTUFBTSxPQUFPLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQztBQUNwQixJQUFJLEVBQUU7QUFDTjtBQUNBLElBQUksR0FBRztBQUNQLEtBQUssQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLE1BQU07QUFDcEIsS0FBSyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLHdCQUF3QixDQUFDLFVBQVU7QUFDM0QsS0FBSyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsVUFBVSxDQUFDLHdCQUF3QjtBQUNwRCxLQUFLLENBQUMsQ0FBQyxDQUFDLFdBQVc7QUFDbkIsS0FBSyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsUUFBUTtBQUMzRCxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsT0FBTyxFQUFFLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQztBQUMvRSxLQUFLLEVBQUU7QUFDUCxJQUFJLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7QUFDbEMsTUFBTSxNQUFNLENBQUMsT0FBTyxDQUFDO0FBQ3JCLElBQUksRUFBRTtBQUNOO0FBQ0EsSUFBSSxJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLFFBQVEsRUFBRSxDQUFDLFFBQVEsRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFDO0FBQ25ELE1BQU0sTUFBTSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO0FBQzdDLFFBQVEsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsT0FBTyxFQUFFO0FBQ3ZEO0FBQ0EsUUFBUSxFQUFFLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUksRUFBRTtBQUMvQyxRQUFRLEVBQUUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsRUFBRTtBQUNoQyxRQUFRLEVBQUUsQ0FBQyxJQUFJLEdBQUcsV0FBVyxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUM7QUFDdkYsUUFBUSxRQUFRLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7QUFDN0QsVUFBVSxFQUFFLENBQUMsV0FBVyxDQUFDLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsTUFBTTtBQUN4RSxVQUFVLEVBQUUsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDO0FBQ3pDLFVBQVUsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLEtBQUssRUFBRTtBQUM1RSxVQUFVLE1BQU0sQ0FBQyxNQUFNLEVBQUUsT0FBTyxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUM7QUFDM0MsUUFBUSxFQUFFO0FBQ1YsUUFBUSxNQUFNLENBQUMsUUFBUSxDQUFDO0FBQ3hCLE1BQU0sRUFBRTtBQUNSLElBQUksR0FBRztBQUNQLEVBQUUsR0FBRztBQUNMO0FBQ0EsR0FBRyxNQUFNLENBQUMsQ0FBQyxNQUFNLENBQUMsT0FBTyxFQUFFIiwiZmlsZSI6Im1haW4uanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG5cbi8qKlxuICogQG5nZG9jIG92ZXJ2aWV3XG4gKiBAbmFtZSBvb25pQVBJQXBwXG4gKiBAZGVzY3JpcHRpb25cbiAqXG4gKiBNYWluIG1vZHVsZSBvZiB0aGUgYXBwbGljYXRpb24uXG4gKi9cbmFuZ3VsYXJcbiAgLm1vZHVsZSgnb29uaUFQSUFwcCcsIFtcbiAgICAnbmdSb3V0ZScsXG4gICAgJ2xiU2VydmljZXMnLFxuICAgICduZ1Jlc291cmNlJyxcbiAgICAnZGF0YW1hcHMnLFxuICAgICdhbmd1bGFyVHlwZXdyaXRlJyxcbiAgICAndWkuZ3JpZCcsXG4gICAgJ3VpLmdyaWQucGFnaW5hdGlvbicsXG4gICAgJ2lzby0zMTY2LWNvdW50cnktY29kZXMnLFxuICAgICdqc29uRm9ybWF0dGVyJ1xuICBdKVxuICAuY29uZmlnKGZ1bmN0aW9uICgkcm91dGVQcm92aWRlciwgJGxvY2F0aW9uUHJvdmlkZXIpIHtcbiAgICBPYmplY3Qua2V5cyh3aW5kb3cuQ09ORklHLnJvdXRlcylcbiAgICAgIC5mb3JFYWNoKGZ1bmN0aW9uKHJvdXRlKSB7XG4gICAgICAgIHZhciByb3V0ZURlZiA9IHdpbmRvdy5DT05GSUcucm91dGVzW3JvdXRlXTtcbiAgICAgICAgJHJvdXRlUHJvdmlkZXIud2hlbihyb3V0ZSwgcm91dGVEZWYpO1xuICAgICAgfSk7XG5cbiAgICAkcm91dGVQcm92aWRlclxuICAgICAgLm90aGVyd2lzZSh7XG4gICAgICAgIHJlZGlyZWN0VG86ICcvJ1xuICAgICAgfSk7XG5cbiAgICAkbG9jYXRpb25Qcm92aWRlci5odG1sNU1vZGUodHJ1ZSk7XG4gIH0pXG4gIC8vIFRoaW5ncyB0byBydW4gYmVmb3JlIHRoZSBhcHAgbG9hZHM7XG4gIC5ydW4oZnVuY3Rpb24oJHJvb3RTY29wZSwgJGxvY2F0aW9uKSB7XG5cbiAgICAkcm9vdFNjb3BlLiRsb2NhdGlvbiA9ICRsb2NhdGlvbjtcblxuICAgICRyb290U2NvcGUubG9hZGluZ19waHJhc2VzID0gW1xuICAgICAgXCJIYWNraW5nIHNvbWUgcGxhbmV0XCIsXG4gICAgICBcIkV4dHJhY3Rpbmcgc3F1YXJlIHJvb3Qgb2YgaVwiLFxuICAgICAgXCJNb2RpZnlpbmcgdGhlIHNwYWNlIHRpbWUgY29udGludXVtXCIsXG4gICAgICBcIkFkanVzdGluZyB1bHRyYSBzcGVlZCB2YXJpYWJsZSB0byBiZSBub21pbmFsXCIsXG4gICAgICBcIlBlcmZvcm1pbmcgYSBzYWZldHkgbWVldGluZ1wiXG4gICAgXTtcbiAgfSk7XG4iLCIndXNlIHN0cmljdCc7XG5cbi8qKlxuICogQG5nZG9jIGZ1bmN0aW9uXG4gKiBAbmFtZSBvb25pQVBJQXBwLmNvbnRyb2xsZXI6Q291bnRyeVZpZXdDdHJsXG4gKiBAZGVzY3JpcHRpb25cbiAqICMgQ291bnRyeVZpZXdDdHJsXG4gKiBDb250cm9sbGVyIG9mIHRoZSBvb25pQVBJQXBwXG4gKi9cblxuYW5ndWxhci5tb2R1bGUoJ29vbmlBUElBcHAnKVxuICAuY29udHJvbGxlcignQ291bnRyeURldGFpbFZpZXdDdHJsJywgZnVuY3Rpb24gKCRxLCAkc2NvcGUsIFJlcG9ydCwgJHJvdXRlUGFyYW1zLCBJU08zMTY2KSB7XG5cbiAgICAkc2NvcGUuY291bnRyeUNvZGUgPSAkcm91dGVQYXJhbXMuaWQ7XG4gICAgJHNjb3BlLmNvdW50cnlOYW1lID0gSVNPMzE2Ni5nZXRDb3VudHJ5TmFtZSgkc2NvcGUuY291bnRyeUNvZGUpO1xuXG4gICAgLy8gWFhYIHNob3VsZCB1c2UgZXh0ZXJuYWwgcGFnaW5hdGlvbiBmZWF0dXJlIG9mIHVpIGdyaWRcbiAgICAvLyBodHRwOi8vdWktZ3JpZC5pbmZvL2RvY3MvIy90dXRvcmlhbC8zMTRfZXh0ZXJuYWxfcGFnaW5hdGlvblxuXG4gICAgJHNjb3BlLmxvYWRNZWFzdXJlbWVudHMgPSBmdW5jdGlvbihxdWVyeU9wdGlvbnMpIHtcbiAgICAgIHZhciBkZWZlcnJlZCA9ICRxLmRlZmVyKCk7XG5cbiAgICAgIHZhciBxdWVyeSA9IHtcbiAgICAgICAgICBmaWx0ZXI6IHtcbiAgICAgICAgICAgICAgZmllbGRzOiB7XG4gICAgICAgICAgICAgICAgICAndGVzdF9uYW1lJzogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICdpbnB1dCc6IHRydWUsXG4gICAgICAgICAgICAgICAgICAncHJvYmVfY2MnOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgJ3Rlc3Rfc3RhcnRfdGltZSc6IHRydWUsXG4gICAgICAgICAgICAgICAgICAnaWQnOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgJ3Byb2JlX2Fzbic6IHRydWVcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgd2hlcmU6IHtcbiAgICAgICAgICAgICAgICAgICdwcm9iZV9jYyc6ICRzY29wZS5jb3VudHJ5Q29kZVxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICBvZmZzZXQ6IHF1ZXJ5T3B0aW9ucy5wYWdlTnVtYmVyICogcXVlcnlPcHRpb25zLnBhZ2VTaXplLFxuICAgICAgICAgICAgICBsaW1pdDogcXVlcnlPcHRpb25zLnBhZ2VTaXplXG4gICAgICAgICAgfVxuICAgICAgfVxuICAgICAgUmVwb3J0LmZpbmQocXVlcnksIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgZGVmZXJyZWQucmVzb2x2ZShkYXRhKTtcbiAgICAgIH0pO1xuXG4gICAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbiAgICB9XG5cbn0pXG4iLCIndXNlIHN0cmljdCc7XG5cbi8qKlxuICogQG5nZG9jIGZ1bmN0aW9uXG4gKiBAbmFtZSBvb25pQVBJQXBwLmNvbnRyb2xsZXI6RXhwbG9yZVZpZXdDdHJsXG4gKiBAZGVzY3JpcHRpb25cbiAqICMgRXhwbG9yZVZpZXdDdHJsXG4gKiBDb250cm9sbGVyIG9mIHRoZSBvb25pQVBJQXBwXG4gKi9cblxuYW5ndWxhci5tb2R1bGUoJ29vbmlBUElBcHAnKVxuICAuY29udHJvbGxlcignRXhwbG9yZVZpZXdDdHJsJywgZnVuY3Rpb24gKCRxLCAkc2NvcGUsICRhbmNob3JTY3JvbGwsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJGxvY2F0aW9uLCBSZXBvcnQsIE5ldHRlc3QsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHJvdXRlUGFyYW1zLCB1aUdyaWRDb25zdGFudHMpIHtcblxuICAgICRzY29wZS5sb2FkTWVhc3VyZW1lbnRzID0gZnVuY3Rpb24ocXVlcnlPcHRpb25zKSB7XG4gICAgICB2YXIgZGVmZXJyZWQgPSAkcS5kZWZlcigpO1xuXG4gICAgICB2YXIgcXVlcnkgPSB7XG4gICAgICAgICAgZmlsdGVyOiB7XG4gICAgICAgICAgICAgIGZpZWxkczoge1xuICAgICAgICAgICAgICAgICAgJ3Rlc3RfbmFtZSc6IHRydWUsXG4gICAgICAgICAgICAgICAgICAncHJvYmVfY2MnOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgJ2lucHV0JzogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICd0ZXN0X3N0YXJ0X3RpbWUnOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgJ2lkJzogdHJ1ZVxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICB3aGVyZTogcXVlcnlPcHRpb25zLndoZXJlLFxuICAgICAgICAgICAgICBvcmRlcjogcXVlcnlPcHRpb25zLm9yZGVyLFxuICAgICAgICAgICAgICBvZmZzZXQ6IHF1ZXJ5T3B0aW9ucy5wYWdlTnVtYmVyICogcXVlcnlPcHRpb25zLnBhZ2VTaXplLFxuICAgICAgICAgICAgICBsaW1pdDogcXVlcnlPcHRpb25zLnBhZ2VTaXplXG4gICAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBSZXBvcnQuZmluZChxdWVyeSwgZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKGRhdGEpO1xuICAgICAgfSk7XG5cbiAgICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xuICAgIH1cblxufSk7XG4iLCIndXNlIHN0cmljdCc7XG5cbi8qKlxuICogQG5nZG9jIGZ1bmN0aW9uXG4gKiBAbmFtZSBvb25pQVBJQXBwLmNvbnRyb2xsZXI6SG9tZUN0cmxcbiAqIEBkZXNjcmlwdGlvblxuICogIyBIb21lQ3RybFxuICogQ29udHJvbGxlciBvZiB0aGUgb29uaUFQSUFwcFxuICovXG5cbmFuZ3VsYXIubW9kdWxlKCdvb25pQVBJQXBwJylcbiAgLmNvbnRyb2xsZXIoJ0hvbWVDdHJsJywgZnVuY3Rpb24gKCRxLCAkc2NvcGUsICRhbmNob3JTY3JvbGwsICRsb2NhdGlvbiwgUmVwb3J0LCBDb3VudHJ5LCAkcm9vdFNjb3BlKSB7XG5cbiAgICAvLyAkcm9vdFNjb3BlLiRsb2NhdGlvbiA9ICRsb2NhdGlvblxuXG4gICAgJHJvb3RTY29wZS5sb2FkZWQgPSBmYWxzZTtcblxuICAgICRzY29wZS5jb3VudHJpZXMgPSB7XG4gICAgICBhbHBoYTM6IHt9LFxuICAgICAgYWxwaGEyOiB7fVxuICAgIH07XG5cbiAgICAkc2NvcGUuY29sdW1uRGVmcyA9IFt7XG4gICAgICAgIG5hbWU6ICdDb3VudHJ5IENvZGUnLFxuICAgICAgICBmaWVsZDonYWxwaGEyJ1xuICAgIH0sXG4gICAge1xuICAgICAgICBuYW1lOiAnQ291bnRyeSBOYW1lJyxcbiAgICAgICAgZmllbGQ6J25hbWUnXG4gICAgfSxcbiAgICB7XG4gICAgICAgIG5hbWU6ICdDb3VudCcsXG4gICAgICAgIGZpZWxkOidjb3VudCdcbiAgICB9XVxuXG4gICAgdmFyIHdvcmxkTWFwID0ge1xuICAgICAgICBzY29wZTogJ3dvcmxkJyxcbiAgICAgICAgcmVzcG9uc2l2ZTogdHJ1ZSxcbiAgICAgICAgZ2VvZ3JhcGh5Q29uZmlnOiB7XG4gICAgICAgICAgICBib3JkZXJDb2xvcjogJyM2MzYzNjMnLFxuICAgICAgICAgICAgYm9yZGVyV2lkdGg6IDFcbiAgICAgICAgfSxcbiAgICAgICAgZmlsbHM6IHtcbiAgICAgICAgICAgICdISUdIJzogY29sb3JicmV3ZXIuUHVCdVs0XVszXSxcbiAgICAgICAgICAgICdNRURJVU0nOiBjb2xvcmJyZXdlci5QdUJ1WzRdWzJdLFxuICAgICAgICAgICAgJ0xPVyc6IGNvbG9yYnJld2VyLlB1QnVbNF1bMV0sXG4gICAgICAgICAgICAnZGVmYXVsdEZpbGwnOiBjb2xvcmJyZXdlci5QdUJ1WzRdWzBdXG4gICAgICAgIH0sXG4gICAgICAgIGRhdGE6IHt9LFxuICAgICAgICBnZW9ncmFwaHlDb25maWc6IHtcbiAgICAgICAgICAgIHBvcHVwVGVtcGxhdGU6IGZ1bmN0aW9uKGdlbywgZGF0YSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBbJzxkaXYgY2xhc3M9XCJob3ZlcmluZm9cIj48c3Ryb25nPicsXG4gICAgICAgICAgICAgICAgICAgICAgICAnTnVtYmVyIG9mIHJlcG9ydHMgJyArIGRhdGEucmVwb3J0Q291bnRyeSxcbiAgICAgICAgICAgICAgICAgICAgICAgICc6ICcgKyBkYXRhLnJlcG9ydENvdW50LFxuICAgICAgICAgICAgICAgICAgICAgICAgJzwvc3Ryb25nPjwvZGl2PiddLmpvaW4oJycpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGhpZ2hsaWdodEZpbGxDb2xvcjogJyMyNjI5MkMnLFxuICAgICAgICAgICAgaGlnaGxpZ2h0Qm9yZGVyQ29sb3I6ICcjQjRCNEI0JyxcbiAgICAgICAgICAgIGhpZ2hsaWdodEJvcmRlcldpZHRoOiAxLFxuICAgICAgICAgICAgaGlnaGxpZ2h0Qm9yZGVyT3BhY2l0eTogMVxuICAgICAgICB9XG4gICAgfTtcblxuICAgICRzY29wZS5sb2FkUmVwb3J0cyA9IGZ1bmN0aW9uKHF1ZXJ5T3B0aW9ucykge1xuICAgICAgdmFyIGRlZmVycmVkID0gJHEuZGVmZXIoKTtcbiAgICAgIFJlcG9ydC5jb3VudEJ5Q291bnRyeShmdW5jdGlvbihyZXBvcnRfY291bnRzKSB7XG4gICAgICAgICAgJHNjb3BlLnJlcG9ydHNCeUNvdW50cnkgPSByZXBvcnRfY291bnRzO1xuICAgICAgICAgIGFuZ3VsYXIuZm9yRWFjaChyZXBvcnRfY291bnRzLCBmdW5jdGlvbihjb3VudHJ5KXtcbiAgICAgICAgICAgICAgd29ybGRNYXAuZGF0YVtjb3VudHJ5LmFscGhhM10gPSB7XG4gICAgICAgICAgICAgICAgICByZXBvcnRDb3VudDogY291bnRyeS5jb3VudCxcbiAgICAgICAgICAgICAgICAgIHJlcG9ydENvdW50cnk6IGNvdW50cnkubmFtZSxcbiAgICAgICAgICAgICAgICAgIGFscGhhMjogY291bnRyeS5hbHBoYTJcbiAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgaWYgKGNvdW50cnkuY291bnQgPCAxMDApIHtcbiAgICAgICAgICAgICAgICAgIHdvcmxkTWFwLmRhdGFbY291bnRyeS5hbHBoYTNdW1wiZmlsbEtleVwiXSA9IFwiTE9XXCI7XG4gICAgICAgICAgICAgIH0gZWxzZSBpZiAoY291bnRyeS5jb3VudCA8IDEwMDApIHtcbiAgICAgICAgICAgICAgICAgIHdvcmxkTWFwLmRhdGFbY291bnRyeS5hbHBoYTNdW1wiZmlsbEtleVwiXSA9IFwiTUVESVVNXCI7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICB3b3JsZE1hcC5kYXRhW2NvdW50cnkuYWxwaGEzXVtcImZpbGxLZXlcIl0gPSBcIkhJR0hcIjtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgIH0pXG4gICAgICAgICAgJHNjb3BlLndvcmxkTWFwID0gd29ybGRNYXA7XG4gICAgICAgICAgJHJvb3RTY29wZS5sb2FkZWQgPSB0cnVlO1xuICAgICAgICAgIGRlZmVycmVkLnJlc29sdmUoJHNjb3BlLnJlcG9ydHNCeUNvdW50cnkpO1xuICAgICAgfSk7XG4gICAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbiAgICB9XG5cbiAgICAkc2NvcGUubWFwX2NsaWNrZWQgPSBmdW5jdGlvbihnZW8pIHtcbiAgICAgIHZhciBjb3VudHJ5X2NvZGUgPSAkc2NvcGUud29ybGRNYXAuZGF0YVtnZW8uaWRdLmFscGhhMjtcbiAgICAgICRsb2NhdGlvbi5wYXRoKCcvY291bnRyeS8nICsgY291bnRyeV9jb2RlKTtcbiAgICB9O1xuXG4gICAgJHNjb3BlLnZpZXdDb3VudHJ5ID0gZnVuY3Rpb24ocm93KSB7XG4gICAgICBjb25zb2xlLmxvZyhcInZpZXdpbmcgY291bnRyeVwiLCByb3cuZW50aXRyeSlcbiAgICAgICRsb2NhdGlvbi5wYXRoKCcvY291bnRyeS8nICsgcm93LmVudGl0eS5hbHBoYTIpO1xuICAgIH1cbn0pO1xuXG4iLCIndXNlIHN0cmljdCc7XG5cbi8qKlxuICogQG5nZG9jIGZ1bmN0aW9uXG4gKiBAbmFtZSBvb25pQVBJQXBwLmNvbnRyb2xsZXI6TWVhc3VyZW1lbnREZXRhaWxWaWV3Q3RybFxuICogQGRlc2NyaXB0aW9uXG4gKiAjIFJlcG9ydERldGFpbFZpZXdDdHJsXG4gKiBDb250cm9sbGVyIG9mIHRoZSBvb25pQVBJQXBwXG4gKi9cblxuYW5ndWxhci5tb2R1bGUoJ29vbmlBUElBcHAnKVxuICAuY29udHJvbGxlcignTWVhc3VyZW1lbnREZXRhaWxWaWV3Q3RybCcsIGZ1bmN0aW9uICgkcSwgJHNjb3BlLCAkYW5jaG9yU2Nyb2xsLCAkbG9jYXRpb24sIFJlcG9ydCwgQ291bnRyeSwgJHJvdXRlUGFyYW1zKSB7XG5cbiAgICAkc2NvcGUubWVhc3VyZW1lbnRJZCA9ICRyb3V0ZVBhcmFtcy5pZDtcbiAgICAkc2NvcGUubWVhc3VyZW1lbnRJbnB1dCA9ICRyb3V0ZVBhcmFtcy5pbnB1dDtcblxuICAgICRzY29wZS5sb2FkZWQgPSBmYWxzZTtcbiAgICAvLyBYWFggc2hvdWxkIHVzZSBleHRlcm5hbCBwYWdpbmF0aW9uIGZlYXR1cmUgb2YgdWkgZ3JpZFxuICAgIC8vIGh0dHA6Ly91aS1ncmlkLmluZm8vZG9jcy8jL3R1dG9yaWFsLzMxNF9leHRlcm5hbF9wYWdpbmF0aW9uXG4gICAgJHNjb3BlLnBhZ2VOdW1iZXIgPSAwO1xuICAgICRzY29wZS5wYWdlU2l6ZSA9IDEwMDtcblxuICAgIHZhciBxdWVyeSA9IHtcbiAgICAgICAgZmlsdGVyOiB7XG4gICAgICAgICAgICB3aGVyZToge1xuICAgICAgICAgICAgICAgICdpZCc6ICRzY29wZS5tZWFzdXJlbWVudElkLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG9mZnNldDogJHNjb3BlLnBhZ2VOdW1iZXIgKiAkc2NvcGUucGFnZVNpemUsXG4gICAgICAgICAgICBsaW1pdDogJHNjb3BlLnBhZ2VTaXplXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBsb2FkaW5nX3N1Y2Nlc3MoZGF0YSkge1xuICAgICAgY29uc29sZS5sb2coJ3N1Y2Nlc3MnKTtcbiAgICAgICRzY29wZS5yZXBvcnQgPSBkYXRhWzBdO1xuICAgICAgJHNjb3BlLmxvYWRlZCA9IHRydWU7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbG9hZGluZ19mYWlsdXJlKCkge1xuICAgICAgY29uc29sZS5sb2coJ2hpJyk7XG4gICAgICAkc2NvcGUubG9hZGVkID0gdHJ1ZTtcbiAgICAgICRzY29wZS5ub3RfZm91bmQgPSB0cnVlO1xuICAgIH1cblxuICAgIGlmICgkc2NvcGUubWVhc3VyZW1lbnRJbnB1dCAhPSB1bmRlZmluZWQpIHtcbiAgICAgICAgcXVlcnlbJ2ZpbHRlciddWyd3aGVyZSddWydpbnB1dCddID0gJHNjb3BlLm1lYXN1cmVtZW50SW5wdXQ7XG4gICAgICAgICRzY29wZS5tZWFzdXJlbWVudCA9IFJlcG9ydC5maW5kKHF1ZXJ5LCBsb2FkaW5nX3N1Y2Nlc3MsIGxvYWRpbmdfZmFpbHVyZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgJHNjb3BlLm1lYXN1cmVtZW50cyA9IFJlcG9ydC5maW5kKHF1ZXJ5LCBsb2FkaW5nX3N1Y2Nlc3MsIGxvYWRpbmdfZmFpbHVyZSk7XG4gICAgfVxuXG59KTtcbiIsImFuZ3VsYXIubW9kdWxlKCdvb25pQVBJQXBwJylcbi5jb250cm9sbGVyKCdCcmlkZ2VSZWFjaGFiaWxpdHlWaWV3Q3RybCcsIGZ1bmN0aW9uICgkc2NvcGUsICRsb2NhdGlvbil7XG4gIGFuZ3VsYXIuZm9yRWFjaCgkc2NvcGUucmVwb3J0LnRlc3Rfa2V5cy5yZXF1ZXN0cywgZnVuY3Rpb24ocmVxdWVzdCl7XG4gICAgaWYgKHJlcXVlc3QucmVxdWVzdC50b3IgPT09IHRydWUgfHwgcmVxdWVzdC5yZXF1ZXN0LmlzX3RvciA9PT0gdHJ1ZSkge1xuICAgICAgJHNjb3BlLmNvbnRyb2wgPSByZXF1ZXN0LnJlc3BvbnNlO1xuICAgIH0gZWxzZSB7XG5cbiAgICAgICRzY29wZS5leHBlcmltZW50ID0gcmVxdWVzdC5yZXNwb25zZTtcbiAgICAgIGNvbnNvbGUubG9nKCRzY29wZS5leHBlcmltZW50KTtcbiAgICB9XG4gIH0pXG59KTtcbiIsImFuZ3VsYXIubW9kdWxlKCdvb25pQVBJQXBwJylcbi5jb250cm9sbGVyKCdIVFRQUmVxdWVzdHNWaWV3Q3RybCcsIGZ1bmN0aW9uICgkc2NvcGUsICRsb2NhdGlvbil7XG4gIGFuZ3VsYXIuZm9yRWFjaCgkc2NvcGUucmVwb3J0LnRlc3Rfa2V5cy5yZXF1ZXN0cywgZnVuY3Rpb24ocmVxdWVzdCl7XG4gICAgaWYgKHJlcXVlc3QucmVxdWVzdC50b3IgPT09IHRydWUgfHwgcmVxdWVzdC5yZXF1ZXN0LmlzX3RvciA9PT0gdHJ1ZSkge1xuICAgICAgJHNjb3BlLmNvbnRyb2wgPSByZXF1ZXN0LnJlc3BvbnNlO1xuICAgIH0gZWxzZSB7XG5cbiAgICAgICRzY29wZS5leHBlcmltZW50ID0gcmVxdWVzdC5yZXNwb25zZTtcbiAgICAgIGNvbnNvbGUubG9nKCRzY29wZS5leHBlcmltZW50KTtcbiAgICB9XG4gIH0pXG59KTtcbiIsIid1c2Ugc3RyaWN0JztcblxuLy8gVGhlIGlkZWEgYmVoaW5kIHRoaXMgZmlsZSBpcyB0byBrZWVwIGEgcGxhY2UgZm9yIGFsbCBzcGVjaWZpYyBuZXR0ZXN0XG4vLyBjb250cm9sbGVycyBpbiBvbmUgcGxhY2UsIGFzIGxvbmcgYXMgdGhleSBkb24ndCBoYXZlIGFueSBzcGVjaWZpY1xuLy8gZnVuY3Rpb25hbGl0eVxuXG5hbmd1bGFyLm1vZHVsZSgnb29uaUFQSUFwcCcpXG4uY29udHJvbGxlcignTmV0dGVzdERlZmF1bHRWaWV3Q3RybCcsIGZ1bmN0aW9uICgkc2NvcGUsICRsb2NhdGlvbil7XG4gIGFuZ3VsYXIuZm9yRWFjaCgkc2NvcGUucmVwb3J0LnRlc3Rfa2V5cy5yZXF1ZXN0cywgZnVuY3Rpb24ocmVxdWVzdCl7XG4gICAgaWYgKHJlcXVlc3QucmVxdWVzdC50b3IgPT09IHRydWUgfHwgcmVxdWVzdC5yZXF1ZXN0LmlzX3RvciA9PT0gdHJ1ZSkge1xuICAgICAgJHNjb3BlLmNvbnRyb2wgPSByZXF1ZXN0LnJlc3BvbnNlO1xuICAgIH0gZWxzZSB7XG5cbiAgICAgICRzY29wZS5leHBlcmltZW50ID0gcmVxdWVzdC5yZXNwb25zZTtcbiAgICAgIGNvbnNvbGUubG9nKCRzY29wZS5leHBlcmltZW50KTtcbiAgICB9XG4gIH0pXG59KTtcblxuIiwiYW5ndWxhci5tb2R1bGUoJ29vbmlBUElBcHAnKVxuLmNvbnRyb2xsZXIoJ1RDUENvbm5lY3RWaWV3Q3RybCcsIGZ1bmN0aW9uICgkc2NvcGUsICRsb2NhdGlvbil7XG4gIGFuZ3VsYXIuZm9yRWFjaCgkc2NvcGUucmVwb3J0LnRlc3Rfa2V5cy5yZXF1ZXN0cywgZnVuY3Rpb24ocmVxdWVzdCl7XG4gICAgaWYgKHJlcXVlc3QucmVxdWVzdC50b3IgPT09IHRydWUgfHwgcmVxdWVzdC5yZXF1ZXN0LmlzX3RvciA9PT0gdHJ1ZSkge1xuICAgICAgJHNjb3BlLmNvbnRyb2wgPSByZXF1ZXN0LnJlc3BvbnNlO1xuICAgIH0gZWxzZSB7XG5cbiAgICAgICRzY29wZS5leHBlcmltZW50ID0gcmVxdWVzdC5yZXNwb25zZTtcbiAgICAgIGNvbnNvbGUubG9nKCRzY29wZS5leHBlcmltZW50KTtcbiAgICB9XG4gIH0pXG59KTtcbiIsIid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiBAbmdkb2MgZnVuY3Rpb25cbiAqIEBuYW1lIG9vbmlBUElBcHAuY29udHJvbGxlcjpPdmVydmlld0N0cmxcbiAqIEBkZXNjcmlwdGlvblxuICogIyBPdmVydmlld0N0cmxcbiAqIENvbnRyb2xsZXIgb2YgdGhlIG9vbmlBUElBcHBcbiAqL1xuXG5hbmd1bGFyLm1vZHVsZSgnb29uaUFQSUFwcCcpXG4gIC5jb250cm9sbGVyKCdPdmVydmlld0N0cmwnLCBmdW5jdGlvbiAoJHJvb3RTY29wZSwgJGxvY2F0aW9uKSB7XG5cbn0pO1xuIiwiLyoqXG4gKiBAbmdkb2MgZnVuY3Rpb25cbiAqIEBuYW1lIG9vbmlBUElBcHAuZGlyZWN0aXZlOm9vbmlHcmlkV3JhcHBlclxuICogQGRlc2NyaXB0aW9uXG4gKiAjIG9vbmlSZXBvcnRzVGFibGVSb3dcbiAqIEEgZGlyZWN0aXZlIHRoYXQgZGlzcGxheXMgYSBVSSBHcmlkIGFjY29yZGluZyB0byBPT05JIHN0YW5kYXJkcy5cbiAqL1xuXG5hbmd1bGFyLm1vZHVsZSgnb29uaUFQSUFwcCcpXG4uZGlyZWN0aXZlKCdvb25pR3JpZFdyYXBwZXInLFxuICBmdW5jdGlvbiAoJGxvY2F0aW9uLCAkZmlsdGVyLCBSZXBvcnQsIENvdW50cnksIE5ldHRlc3QsIHVpR3JpZENvbnN0YW50cyApIHtcbiAgICByZXR1cm4ge1xuICAgICAgcmVzdHJpY3Q6ICdBJyxcbiAgICAgIHNjb3BlOiB7XG4gICAgICAgIGdldERhdGFGdW5jdGlvbjogJz0nLFxuICAgICAgICBxdWVyeU9wdGlvbnM6ICc9PycsIC8vIFRPRE86IHN0aWxsIG5lZWQgdG8gaW1wbGVtZW50IHRoaXNcbiAgICAgICAgdmlld1Jvd09iamVjdEZ1bmN0aW9uOiAnPT8nLCAvLyBUT0RPOiBzdGlsbCBuZWVkIHRvIGltcGxlbWVudCB0aGlzXG4gICAgICAgIGN1c3RvbUNvbHVtbkRlZnM6ICc9PydcbiAgICAgIH0sXG4gICAgICBsaW5rOiBmdW5jdGlvbiAoJHNjb3BlLCAkZWxlbWVudCwgJGF0dHJzKSB7XG5cbiAgICAgICAgJHNjb3BlLmdyaWRPcHRpb25zID0ge307XG4gICAgICAgICRzY29wZS5xdWVyeU9wdGlvbnMgPSB7fTtcbiAgICAgICAgJHNjb3BlLnF1ZXJ5T3B0aW9ucy5wYWdlTnVtYmVyID0gMDtcbiAgICAgICAgJHNjb3BlLnF1ZXJ5T3B0aW9ucy5wYWdlU2l6ZSA9IDEwMDtcblxuICAgICAgICAkc2NvcGUucXVlcnlPcHRpb25zLm9yZGVyID0gXCJ0ZXN0X3N0YXJ0X3RpbWUgREVTQ1wiO1xuICAgICAgICAkc2NvcGUucXVlcnlPcHRpb25zLndoZXJlID0ge307XG5cbiAgICAgICAgJHNjb3BlLmlucHV0RmlsdGVyID0gXCJcIjtcbiAgICAgICAgJHNjb3BlLnRlc3ROYW1lRmlsdGVyID0gXCJcIjtcbiAgICAgICAgJHNjb3BlLmNvdW50cnlDb2RlRmlsdGVyID0gXCJcIjtcbiAgICAgICAgJHNjb3BlLm5ldHRlc3RzID0gTmV0dGVzdC5maW5kKCk7XG5cbiAgICAgICAgaWYgKCRzY29wZS5jdXN0b21Db2x1bW5EZWZzICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAkc2NvcGUuZ3JpZE9wdGlvbnMuY29sdW1uRGVmcyA9ICRzY29wZS5jdXN0b21Db2x1bW5EZWZzO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICRzY29wZS5ncmlkT3B0aW9ucy5jb2x1bW5EZWZzID0gW1xuICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICBuYW1lOiAnQ291bnRyeSBjb2RlJyxcbiAgICAgICAgICAgICAgICAgIGZpZWxkOidwcm9iZV9jYydcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgbmFtZTogJ0FTTicsXG4gICAgICAgICAgICAgICAgICBmaWVsZDoncHJvYmVfYXNuJ1xuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICBuYW1lOiAnVGVzdCBuYW1lJyxcbiAgICAgICAgICAgICAgICAgIGZpZWxkOid0ZXN0X25hbWUnXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgIG5hbWU6ICdJbnB1dCcsXG4gICAgICAgICAgICAgICAgICBmaWVsZDonaW5wdXQnXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgIG5hbWU6ICdTdGFydCB0aW1lJyxcbiAgICAgICAgICAgICAgICAgIGZpZWxkOid0ZXN0X3N0YXJ0X3RpbWUnXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgIGZpZWxkOiAnaWQnLFxuICAgICAgICAgICAgICAgICAgdmlzaWJsZTogZmFsc2VcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgIF07XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoJHNjb3BlLnZpZXdSb3dPYmplY3RGdW5jdGlvbiAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgJHNjb3BlLnZpZXdSb3dPYmplY3QgPSAkc2NvcGUudmlld1Jvd09iamVjdEZ1bmN0aW9uXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgJHNjb3BlLnZpZXdSb3dPYmplY3QgPSBmdW5jdGlvbihyb3cpIHtcbiAgICAgICAgICAgICAgdmFyIHJlcG9ydCA9IHJvdy5lbnRpdHk7XG4gICAgICAgICAgICAgIGlmIChyZXBvcnQuaW5wdXQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgJGxvY2F0aW9uLnBhdGgoJy9tZWFzdXJlbWVudC8nICsgcmVwb3J0LmlkKTtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICRsb2NhdGlvbi5wYXRoKCcvbWVhc3VyZW1lbnQvJyArIHJlcG9ydC5pZClcbiAgICAgICAgICAgICAgICAgICAgICAuc2VhcmNoKHtpbnB1dDogcmVwb3J0LmlucHV0fSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAkc2NvcGUucm93VGVtcGxhdGUgPSAnL3ZpZXdzL2RpcmVjdGl2ZXMvcm93LXRlbXBsYXRlLmh0bWwnXG5cbiAgICAgICAgdmFyIGFzc2lnbkRhdGEgPSBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgJHNjb3BlLmdyaWRPcHRpb25zLmRhdGEgPSBkYXRhO1xuICAgICAgICB9XG5cbiAgICAgICAgJHNjb3BlLmZpbHRlck1lYXN1cmVtZW50cyA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgJHNjb3BlLnF1ZXJ5T3B0aW9ucy53aGVyZSA9IHt9O1xuICAgICAgICAgICAgaWYgKCRzY29wZS5pbnB1dEZpbHRlci5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgJHNjb3BlLnF1ZXJ5T3B0aW9ucy53aGVyZVsnaW5wdXQnXSA9ICRzY29wZS5pbnB1dEZpbHRlcjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICgkc2NvcGUudGVzdE5hbWVGaWx0ZXIubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICRzY29wZS5xdWVyeU9wdGlvbnMud2hlcmVbJ3Rlc3RfbmFtZSddID0gJHNjb3BlLnRlc3ROYW1lRmlsdGVyO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKCRzY29wZS5jb3VudHJ5Q29kZUZpbHRlci5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgJHNjb3BlLnF1ZXJ5T3B0aW9ucy53aGVyZVsncHJvYmVfY2MnXSA9ICRzY29wZS5jb3VudHJ5Q29kZUZpbHRlcjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgICRzY29wZS5nZXREYXRhRnVuY3Rpb24oJHNjb3BlLnF1ZXJ5T3B0aW9ucykudGhlbihhc3NpZ25EYXRhKTtcbiAgICAgICAgfVxuXG4gICAgICAgICRzY29wZS5ncmlkT3B0aW9ucy5yb3dUZW1wbGF0ZSA9ICRzY29wZS5yb3dUZW1wbGF0ZTtcbiAgICAgICAgJHNjb3BlLmdyaWRPcHRpb25zLnVzZUV4dGVybmFsUGFnaW5hdGlvbiA9IHRydWU7XG4gICAgICAgICRzY29wZS5ncmlkT3B0aW9ucy51c2VFeHRlcm5hbFNvcnRpbmcgPSB0cnVlO1xuICAgICAgICAkc2NvcGUuZ3JpZE9wdGlvbnMucGFnaW5hdGlvblBhZ2VTaXplID0gJHNjb3BlLnF1ZXJ5T3B0aW9ucy5wYWdlU2l6ZTtcbiAgICAgICAgJHNjb3BlLmdyaWRPcHRpb25zLnBhZ2luYXRpb25QYWdlU2l6ZXMgPSBbNTAsIDEwMCwgMTUwXTtcblxuICAgICAgICAkc2NvcGUuZ3JpZE9wdGlvbnMub25SZWdpc3RlckFwaSA9IGZ1bmN0aW9uKGdyaWRBcGkpIHtcbiAgICAgICAgICAgICRzY29wZS5ncmlkQXBpID0gZ3JpZEFwaTtcbiAgICAgICAgICAgICRzY29wZS5ncmlkQXBpLmNvcmUub24uc29ydENoYW5nZWQoJHNjb3BlLCBmdW5jdGlvbihncmlkLCBzb3J0Q29sdW1ucykge1xuICAgICAgICAgICAgICAgICRzY29wZS5xdWVyeU9wdGlvbnMub3JkZXIgPSBzb3J0Q29sdW1uc1swXS5maWVsZCArIFwiIFwiICsgc29ydENvbHVtbnNbMF0uc29ydC5kaXJlY3Rpb24udG9VcHBlckNhc2UoKTtcbiAgICAgICAgICAgICAgICAkc2NvcGUuZ2V0RGF0YUZ1bmN0aW9uKCRzY29wZS5xdWVyeU9wdGlvbnMpLnRoZW4oYXNzaWduRGF0YSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGdyaWRBcGkucGFnaW5hdGlvbi5vbi5wYWdpbmF0aW9uQ2hhbmdlZCgkc2NvcGUsIGZ1bmN0aW9uIChuZXdQYWdlLCBwYWdlU2l6ZSkge1xuICAgICAgICAgICAgICAgICRzY29wZS5xdWVyeU9wdGlvbnMucGFnZU51bWJlciA9IG5ld1BhZ2U7XG4gICAgICAgICAgICAgICAgJHNjb3BlLnF1ZXJ5T3B0aW9ucy5wYWdlU2l6ZSA9IHBhZ2VTaXplO1xuICAgICAgICAgICAgICAgICRzY29wZS5nZXREYXRhRnVuY3Rpb24oJHNjb3BlLnF1ZXJ5T3B0aW9ucykudGhlbihhc3NpZ25EYXRhKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cblxuICAgICAgICAkc2NvcGUuZ2V0RGF0YUZ1bmN0aW9uKCRzY29wZS5xdWVyeU9wdGlvbnMpLnRoZW4oYXNzaWduRGF0YSk7XG5cbiAgICAgIH0sXG4gICAgICB0ZW1wbGF0ZVVybDogJ3ZpZXdzL2RpcmVjdGl2ZXMvb29uaS1ncmlkLXdyYXBwZXItZGlyZWN0aXZlLmh0bWwnLFxuICAgIH07XG59KVxuIiwiKGZ1bmN0aW9uKHdpbmRvdywgYW5ndWxhciwgdW5kZWZpbmVkKSB7J3VzZSBzdHJpY3QnO1xuXG52YXIgdXJsQmFzZSA9IFwiL2FwaVwiO1xudmFyIGF1dGhIZWFkZXIgPSAnYXV0aG9yaXphdGlvbic7XG5cbi8qKlxuICogQG5nZG9jIG92ZXJ2aWV3XG4gKiBAbmFtZSBsYlNlcnZpY2VzXG4gKiBAbW9kdWxlXG4gKiBAZGVzY3JpcHRpb25cbiAqXG4gKiBUaGUgYGxiU2VydmljZXNgIG1vZHVsZSBwcm92aWRlcyBzZXJ2aWNlcyBmb3IgaW50ZXJhY3Rpbmcgd2l0aFxuICogdGhlIG1vZGVscyBleHBvc2VkIGJ5IHRoZSBMb29wQmFjayBzZXJ2ZXIgdmlhIHRoZSBSRVNUIEFQSS5cbiAqXG4gKi9cbnZhciBtb2R1bGUgPSBhbmd1bGFyLm1vZHVsZShcImxiU2VydmljZXNcIiwgWyduZ1Jlc291cmNlJ10pO1xuXG4vKipcbiAqIEBuZ2RvYyBvYmplY3RcbiAqIEBuYW1lIGxiU2VydmljZXMuUmVwb3J0XG4gKiBAaGVhZGVyIGxiU2VydmljZXMuUmVwb3J0XG4gKiBAb2JqZWN0XG4gKlxuICogQGRlc2NyaXB0aW9uXG4gKlxuICogQSAkcmVzb3VyY2Ugb2JqZWN0IGZvciBpbnRlcmFjdGluZyB3aXRoIHRoZSBgUmVwb3J0YCBtb2RlbC5cbiAqXG4gKiAjIyBFeGFtcGxlXG4gKlxuICogU2VlXG4gKiB7QGxpbmsgaHR0cDovL2RvY3MuYW5ndWxhcmpzLm9yZy9hcGkvbmdSZXNvdXJjZS4kcmVzb3VyY2UjZXhhbXBsZSAkcmVzb3VyY2V9XG4gKiBmb3IgYW4gZXhhbXBsZSBvZiB1c2luZyB0aGlzIG9iamVjdC5cbiAqXG4gKi9cbm1vZHVsZS5mYWN0b3J5KFxuICBcIlJlcG9ydFwiLFxuICBbJ0xvb3BCYWNrUmVzb3VyY2UnLCAnTG9vcEJhY2tBdXRoJywgJyRpbmplY3RvcicsIGZ1bmN0aW9uKFJlc291cmNlLCBMb29wQmFja0F1dGgsICRpbmplY3Rvcikge1xuICAgIHZhciBSID0gUmVzb3VyY2UoXG4gICAgICB1cmxCYXNlICsgXCIvcmVwb3J0cy86aWRcIixcbiAgICAgIHsgJ2lkJzogJ0BpZCcgfSxcbiAgICAgIHtcblxuICAgICAgICAvLyBJTlRFUk5BTC4gVXNlIFJlcG9ydC5jb3VudHJ5KCkgaW5zdGVhZC5cbiAgICAgICAgXCJwcm90b3R5cGUkX19nZXRfX2NvdW50cnlcIjoge1xuICAgICAgICAgIHVybDogdXJsQmFzZSArIFwiL3JlcG9ydHMvOmlkL2NvdW50cnlcIixcbiAgICAgICAgICBtZXRob2Q6IFwiR0VUXCJcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogQG5nZG9jIG1ldGhvZFxuICAgICAgICAgKiBAbmFtZSBsYlNlcnZpY2VzLlJlcG9ydCNjcmVhdGVcbiAgICAgICAgICogQG1ldGhvZE9mIGxiU2VydmljZXMuUmVwb3J0XG4gICAgICAgICAqXG4gICAgICAgICAqIEBkZXNjcmlwdGlvblxuICAgICAgICAgKlxuICAgICAgICAgKiBDcmVhdGUgYSBuZXcgaW5zdGFuY2Ugb2YgdGhlIG1vZGVsIGFuZCBwZXJzaXN0IGl0IGludG8gdGhlIGRhdGEgc291cmNlLlxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdD19IHBhcmFtZXRlcnMgUmVxdWVzdCBwYXJhbWV0ZXJzLlxuICAgICAgICAgKlxuICAgICAgICAgKiAgIFRoaXMgbWV0aG9kIGRvZXMgbm90IGFjY2VwdCBhbnkgcGFyYW1ldGVycy5cbiAgICAgICAgICogICBTdXBwbHkgYW4gZW1wdHkgb2JqZWN0IG9yIG9taXQgdGhpcyBhcmd1bWVudCBhbHRvZ2V0aGVyLlxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gcG9zdERhdGEgUmVxdWVzdCBkYXRhLlxuICAgICAgICAgKlxuICAgICAgICAgKiBUaGlzIG1ldGhvZCBleHBlY3RzIGEgc3Vic2V0IG9mIG1vZGVsIHByb3BlcnRpZXMgYXMgcmVxdWVzdCBwYXJhbWV0ZXJzLlxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0ge2Z1bmN0aW9uKE9iamVjdCxPYmplY3QpPX0gc3VjY2Vzc0NiXG4gICAgICAgICAqICAgU3VjY2VzcyBjYWxsYmFjayB3aXRoIHR3byBhcmd1bWVudHM6IGB2YWx1ZWAsIGByZXNwb25zZUhlYWRlcnNgLlxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0ge2Z1bmN0aW9uKE9iamVjdCk9fSBlcnJvckNiIEVycm9yIGNhbGxiYWNrIHdpdGggb25lIGFyZ3VtZW50OlxuICAgICAgICAgKiAgIGBodHRwUmVzcG9uc2VgLlxuICAgICAgICAgKlxuICAgICAgICAgKiBAcmV0dXJucyB7T2JqZWN0fSBBbiBlbXB0eSByZWZlcmVuY2UgdGhhdCB3aWxsIGJlXG4gICAgICAgICAqICAgcG9wdWxhdGVkIHdpdGggdGhlIGFjdHVhbCBkYXRhIG9uY2UgdGhlIHJlc3BvbnNlIGlzIHJldHVybmVkXG4gICAgICAgICAqICAgZnJvbSB0aGUgc2VydmVyLlxuICAgICAgICAgKlxuICAgICAgICAgKiA8ZW0+XG4gICAgICAgICAqIChUaGUgcmVtb3RlIG1ldGhvZCBkZWZpbml0aW9uIGRvZXMgbm90IHByb3ZpZGUgYW55IGRlc2NyaXB0aW9uLlxuICAgICAgICAgKiBUaGlzIHVzdWFsbHkgbWVhbnMgdGhlIHJlc3BvbnNlIGlzIGEgYFJlcG9ydGAgb2JqZWN0LilcbiAgICAgICAgICogPC9lbT5cbiAgICAgICAgICovXG4gICAgICAgIFwiY3JlYXRlXCI6IHtcbiAgICAgICAgICB1cmw6IHVybEJhc2UgKyBcIi9yZXBvcnRzXCIsXG4gICAgICAgICAgbWV0aG9kOiBcIlBPU1RcIlxuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAbmdkb2MgbWV0aG9kXG4gICAgICAgICAqIEBuYW1lIGxiU2VydmljZXMuUmVwb3J0I2NyZWF0ZU1hbnlcbiAgICAgICAgICogQG1ldGhvZE9mIGxiU2VydmljZXMuUmVwb3J0XG4gICAgICAgICAqXG4gICAgICAgICAqIEBkZXNjcmlwdGlvblxuICAgICAgICAgKlxuICAgICAgICAgKiBDcmVhdGUgYSBuZXcgaW5zdGFuY2Ugb2YgdGhlIG1vZGVsIGFuZCBwZXJzaXN0IGl0IGludG8gdGhlIGRhdGEgc291cmNlLlxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdD19IHBhcmFtZXRlcnMgUmVxdWVzdCBwYXJhbWV0ZXJzLlxuICAgICAgICAgKlxuICAgICAgICAgKiAgIFRoaXMgbWV0aG9kIGRvZXMgbm90IGFjY2VwdCBhbnkgcGFyYW1ldGVycy5cbiAgICAgICAgICogICBTdXBwbHkgYW4gZW1wdHkgb2JqZWN0IG9yIG9taXQgdGhpcyBhcmd1bWVudCBhbHRvZ2V0aGVyLlxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gcG9zdERhdGEgUmVxdWVzdCBkYXRhLlxuICAgICAgICAgKlxuICAgICAgICAgKiBUaGlzIG1ldGhvZCBleHBlY3RzIGEgc3Vic2V0IG9mIG1vZGVsIHByb3BlcnRpZXMgYXMgcmVxdWVzdCBwYXJhbWV0ZXJzLlxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0ge2Z1bmN0aW9uKEFycmF5LjxPYmplY3Q+LE9iamVjdCk9fSBzdWNjZXNzQ2JcbiAgICAgICAgICogICBTdWNjZXNzIGNhbGxiYWNrIHdpdGggdHdvIGFyZ3VtZW50czogYHZhbHVlYCwgYHJlc3BvbnNlSGVhZGVyc2AuXG4gICAgICAgICAqXG4gICAgICAgICAqIEBwYXJhbSB7ZnVuY3Rpb24oT2JqZWN0KT19IGVycm9yQ2IgRXJyb3IgY2FsbGJhY2sgd2l0aCBvbmUgYXJndW1lbnQ6XG4gICAgICAgICAqICAgYGh0dHBSZXNwb25zZWAuXG4gICAgICAgICAqXG4gICAgICAgICAqIEByZXR1cm5zIHtBcnJheS48T2JqZWN0Pn0gQW4gZW1wdHkgcmVmZXJlbmNlIHRoYXQgd2lsbCBiZVxuICAgICAgICAgKiAgIHBvcHVsYXRlZCB3aXRoIHRoZSBhY3R1YWwgZGF0YSBvbmNlIHRoZSByZXNwb25zZSBpcyByZXR1cm5lZFxuICAgICAgICAgKiAgIGZyb20gdGhlIHNlcnZlci5cbiAgICAgICAgICpcbiAgICAgICAgICogPGVtPlxuICAgICAgICAgKiAoVGhlIHJlbW90ZSBtZXRob2QgZGVmaW5pdGlvbiBkb2VzIG5vdCBwcm92aWRlIGFueSBkZXNjcmlwdGlvbi5cbiAgICAgICAgICogVGhpcyB1c3VhbGx5IG1lYW5zIHRoZSByZXNwb25zZSBpcyBhIGBSZXBvcnRgIG9iamVjdC4pXG4gICAgICAgICAqIDwvZW0+XG4gICAgICAgICAqL1xuICAgICAgICBcImNyZWF0ZU1hbnlcIjoge1xuICAgICAgICAgIGlzQXJyYXk6IHRydWUsXG4gICAgICAgICAgdXJsOiB1cmxCYXNlICsgXCIvcmVwb3J0c1wiLFxuICAgICAgICAgIG1ldGhvZDogXCJQT1NUXCJcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogQG5nZG9jIG1ldGhvZFxuICAgICAgICAgKiBAbmFtZSBsYlNlcnZpY2VzLlJlcG9ydCN1cHNlcnRcbiAgICAgICAgICogQG1ldGhvZE9mIGxiU2VydmljZXMuUmVwb3J0XG4gICAgICAgICAqXG4gICAgICAgICAqIEBkZXNjcmlwdGlvblxuICAgICAgICAgKlxuICAgICAgICAgKiBVcGRhdGUgYW4gZXhpc3RpbmcgbW9kZWwgaW5zdGFuY2Ugb3IgaW5zZXJ0IGEgbmV3IG9uZSBpbnRvIHRoZSBkYXRhIHNvdXJjZS5cbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHtPYmplY3Q9fSBwYXJhbWV0ZXJzIFJlcXVlc3QgcGFyYW1ldGVycy5cbiAgICAgICAgICpcbiAgICAgICAgICogICBUaGlzIG1ldGhvZCBkb2VzIG5vdCBhY2NlcHQgYW55IHBhcmFtZXRlcnMuXG4gICAgICAgICAqICAgU3VwcGx5IGFuIGVtcHR5IG9iamVjdCBvciBvbWl0IHRoaXMgYXJndW1lbnQgYWx0b2dldGhlci5cbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IHBvc3REYXRhIFJlcXVlc3QgZGF0YS5cbiAgICAgICAgICpcbiAgICAgICAgICogVGhpcyBtZXRob2QgZXhwZWN0cyBhIHN1YnNldCBvZiBtb2RlbCBwcm9wZXJ0aWVzIGFzIHJlcXVlc3QgcGFyYW1ldGVycy5cbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHtmdW5jdGlvbihPYmplY3QsT2JqZWN0KT19IHN1Y2Nlc3NDYlxuICAgICAgICAgKiAgIFN1Y2Nlc3MgY2FsbGJhY2sgd2l0aCB0d28gYXJndW1lbnRzOiBgdmFsdWVgLCBgcmVzcG9uc2VIZWFkZXJzYC5cbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHtmdW5jdGlvbihPYmplY3QpPX0gZXJyb3JDYiBFcnJvciBjYWxsYmFjayB3aXRoIG9uZSBhcmd1bWVudDpcbiAgICAgICAgICogICBgaHR0cFJlc3BvbnNlYC5cbiAgICAgICAgICpcbiAgICAgICAgICogQHJldHVybnMge09iamVjdH0gQW4gZW1wdHkgcmVmZXJlbmNlIHRoYXQgd2lsbCBiZVxuICAgICAgICAgKiAgIHBvcHVsYXRlZCB3aXRoIHRoZSBhY3R1YWwgZGF0YSBvbmNlIHRoZSByZXNwb25zZSBpcyByZXR1cm5lZFxuICAgICAgICAgKiAgIGZyb20gdGhlIHNlcnZlci5cbiAgICAgICAgICpcbiAgICAgICAgICogPGVtPlxuICAgICAgICAgKiAoVGhlIHJlbW90ZSBtZXRob2QgZGVmaW5pdGlvbiBkb2VzIG5vdCBwcm92aWRlIGFueSBkZXNjcmlwdGlvbi5cbiAgICAgICAgICogVGhpcyB1c3VhbGx5IG1lYW5zIHRoZSByZXNwb25zZSBpcyBhIGBSZXBvcnRgIG9iamVjdC4pXG4gICAgICAgICAqIDwvZW0+XG4gICAgICAgICAqL1xuICAgICAgICBcInVwc2VydFwiOiB7XG4gICAgICAgICAgdXJsOiB1cmxCYXNlICsgXCIvcmVwb3J0c1wiLFxuICAgICAgICAgIG1ldGhvZDogXCJQVVRcIlxuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAbmdkb2MgbWV0aG9kXG4gICAgICAgICAqIEBuYW1lIGxiU2VydmljZXMuUmVwb3J0I2V4aXN0c1xuICAgICAgICAgKiBAbWV0aG9kT2YgbGJTZXJ2aWNlcy5SZXBvcnRcbiAgICAgICAgICpcbiAgICAgICAgICogQGRlc2NyaXB0aW9uXG4gICAgICAgICAqXG4gICAgICAgICAqIENoZWNrIHdoZXRoZXIgYSBtb2RlbCBpbnN0YW5jZSBleGlzdHMgaW4gdGhlIGRhdGEgc291cmNlLlxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdD19IHBhcmFtZXRlcnMgUmVxdWVzdCBwYXJhbWV0ZXJzLlxuICAgICAgICAgKlxuICAgICAgICAgKiAgLSBgaWRgIOKAkyBgeyp9YCAtIE1vZGVsIGlkXG4gICAgICAgICAqXG4gICAgICAgICAqIEBwYXJhbSB7ZnVuY3Rpb24oT2JqZWN0LE9iamVjdCk9fSBzdWNjZXNzQ2JcbiAgICAgICAgICogICBTdWNjZXNzIGNhbGxiYWNrIHdpdGggdHdvIGFyZ3VtZW50czogYHZhbHVlYCwgYHJlc3BvbnNlSGVhZGVyc2AuXG4gICAgICAgICAqXG4gICAgICAgICAqIEBwYXJhbSB7ZnVuY3Rpb24oT2JqZWN0KT19IGVycm9yQ2IgRXJyb3IgY2FsbGJhY2sgd2l0aCBvbmUgYXJndW1lbnQ6XG4gICAgICAgICAqICAgYGh0dHBSZXNwb25zZWAuXG4gICAgICAgICAqXG4gICAgICAgICAqIEByZXR1cm5zIHtPYmplY3R9IEFuIGVtcHR5IHJlZmVyZW5jZSB0aGF0IHdpbGwgYmVcbiAgICAgICAgICogICBwb3B1bGF0ZWQgd2l0aCB0aGUgYWN0dWFsIGRhdGEgb25jZSB0aGUgcmVzcG9uc2UgaXMgcmV0dXJuZWRcbiAgICAgICAgICogICBmcm9tIHRoZSBzZXJ2ZXIuXG4gICAgICAgICAqXG4gICAgICAgICAqIERhdGEgcHJvcGVydGllczpcbiAgICAgICAgICpcbiAgICAgICAgICogIC0gYGV4aXN0c2Ag4oCTIGB7Ym9vbGVhbj19YCAtIFxuICAgICAgICAgKi9cbiAgICAgICAgXCJleGlzdHNcIjoge1xuICAgICAgICAgIHVybDogdXJsQmFzZSArIFwiL3JlcG9ydHMvOmlkL2V4aXN0c1wiLFxuICAgICAgICAgIG1ldGhvZDogXCJHRVRcIlxuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAbmdkb2MgbWV0aG9kXG4gICAgICAgICAqIEBuYW1lIGxiU2VydmljZXMuUmVwb3J0I2ZpbmRCeUlkXG4gICAgICAgICAqIEBtZXRob2RPZiBsYlNlcnZpY2VzLlJlcG9ydFxuICAgICAgICAgKlxuICAgICAgICAgKiBAZGVzY3JpcHRpb25cbiAgICAgICAgICpcbiAgICAgICAgICogRmluZCBhIG1vZGVsIGluc3RhbmNlIGJ5IGlkIGZyb20gdGhlIGRhdGEgc291cmNlLlxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdD19IHBhcmFtZXRlcnMgUmVxdWVzdCBwYXJhbWV0ZXJzLlxuICAgICAgICAgKlxuICAgICAgICAgKiAgLSBgaWRgIOKAkyBgeyp9YCAtIE1vZGVsIGlkXG4gICAgICAgICAqXG4gICAgICAgICAqICAtIGBmaWx0ZXJgIOKAkyBge29iamVjdD19YCAtIEZpbHRlciBkZWZpbmluZyBmaWVsZHMgYW5kIGluY2x1ZGVcbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHtmdW5jdGlvbihPYmplY3QsT2JqZWN0KT19IHN1Y2Nlc3NDYlxuICAgICAgICAgKiAgIFN1Y2Nlc3MgY2FsbGJhY2sgd2l0aCB0d28gYXJndW1lbnRzOiBgdmFsdWVgLCBgcmVzcG9uc2VIZWFkZXJzYC5cbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHtmdW5jdGlvbihPYmplY3QpPX0gZXJyb3JDYiBFcnJvciBjYWxsYmFjayB3aXRoIG9uZSBhcmd1bWVudDpcbiAgICAgICAgICogICBgaHR0cFJlc3BvbnNlYC5cbiAgICAgICAgICpcbiAgICAgICAgICogQHJldHVybnMge09iamVjdH0gQW4gZW1wdHkgcmVmZXJlbmNlIHRoYXQgd2lsbCBiZVxuICAgICAgICAgKiAgIHBvcHVsYXRlZCB3aXRoIHRoZSBhY3R1YWwgZGF0YSBvbmNlIHRoZSByZXNwb25zZSBpcyByZXR1cm5lZFxuICAgICAgICAgKiAgIGZyb20gdGhlIHNlcnZlci5cbiAgICAgICAgICpcbiAgICAgICAgICogPGVtPlxuICAgICAgICAgKiAoVGhlIHJlbW90ZSBtZXRob2QgZGVmaW5pdGlvbiBkb2VzIG5vdCBwcm92aWRlIGFueSBkZXNjcmlwdGlvbi5cbiAgICAgICAgICogVGhpcyB1c3VhbGx5IG1lYW5zIHRoZSByZXNwb25zZSBpcyBhIGBSZXBvcnRgIG9iamVjdC4pXG4gICAgICAgICAqIDwvZW0+XG4gICAgICAgICAqL1xuICAgICAgICBcImZpbmRCeUlkXCI6IHtcbiAgICAgICAgICB1cmw6IHVybEJhc2UgKyBcIi9yZXBvcnRzLzppZFwiLFxuICAgICAgICAgIG1ldGhvZDogXCJHRVRcIlxuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAbmdkb2MgbWV0aG9kXG4gICAgICAgICAqIEBuYW1lIGxiU2VydmljZXMuUmVwb3J0I2ZpbmRcbiAgICAgICAgICogQG1ldGhvZE9mIGxiU2VydmljZXMuUmVwb3J0XG4gICAgICAgICAqXG4gICAgICAgICAqIEBkZXNjcmlwdGlvblxuICAgICAgICAgKlxuICAgICAgICAgKiBGaW5kIGFsbCBpbnN0YW5jZXMgb2YgdGhlIG1vZGVsIG1hdGNoZWQgYnkgZmlsdGVyIGZyb20gdGhlIGRhdGEgc291cmNlLlxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdD19IHBhcmFtZXRlcnMgUmVxdWVzdCBwYXJhbWV0ZXJzLlxuICAgICAgICAgKlxuICAgICAgICAgKiAgLSBgZmlsdGVyYCDigJMgYHtvYmplY3Q9fWAgLSBGaWx0ZXIgZGVmaW5pbmcgZmllbGRzLCB3aGVyZSwgaW5jbHVkZSwgb3JkZXIsIG9mZnNldCwgYW5kIGxpbWl0XG4gICAgICAgICAqXG4gICAgICAgICAqIEBwYXJhbSB7ZnVuY3Rpb24oQXJyYXkuPE9iamVjdD4sT2JqZWN0KT19IHN1Y2Nlc3NDYlxuICAgICAgICAgKiAgIFN1Y2Nlc3MgY2FsbGJhY2sgd2l0aCB0d28gYXJndW1lbnRzOiBgdmFsdWVgLCBgcmVzcG9uc2VIZWFkZXJzYC5cbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHtmdW5jdGlvbihPYmplY3QpPX0gZXJyb3JDYiBFcnJvciBjYWxsYmFjayB3aXRoIG9uZSBhcmd1bWVudDpcbiAgICAgICAgICogICBgaHR0cFJlc3BvbnNlYC5cbiAgICAgICAgICpcbiAgICAgICAgICogQHJldHVybnMge0FycmF5LjxPYmplY3Q+fSBBbiBlbXB0eSByZWZlcmVuY2UgdGhhdCB3aWxsIGJlXG4gICAgICAgICAqICAgcG9wdWxhdGVkIHdpdGggdGhlIGFjdHVhbCBkYXRhIG9uY2UgdGhlIHJlc3BvbnNlIGlzIHJldHVybmVkXG4gICAgICAgICAqICAgZnJvbSB0aGUgc2VydmVyLlxuICAgICAgICAgKlxuICAgICAgICAgKiA8ZW0+XG4gICAgICAgICAqIChUaGUgcmVtb3RlIG1ldGhvZCBkZWZpbml0aW9uIGRvZXMgbm90IHByb3ZpZGUgYW55IGRlc2NyaXB0aW9uLlxuICAgICAgICAgKiBUaGlzIHVzdWFsbHkgbWVhbnMgdGhlIHJlc3BvbnNlIGlzIGEgYFJlcG9ydGAgb2JqZWN0LilcbiAgICAgICAgICogPC9lbT5cbiAgICAgICAgICovXG4gICAgICAgIFwiZmluZFwiOiB7XG4gICAgICAgICAgaXNBcnJheTogdHJ1ZSxcbiAgICAgICAgICB1cmw6IHVybEJhc2UgKyBcIi9yZXBvcnRzXCIsXG4gICAgICAgICAgbWV0aG9kOiBcIkdFVFwiXG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEBuZ2RvYyBtZXRob2RcbiAgICAgICAgICogQG5hbWUgbGJTZXJ2aWNlcy5SZXBvcnQjZmluZE9uZVxuICAgICAgICAgKiBAbWV0aG9kT2YgbGJTZXJ2aWNlcy5SZXBvcnRcbiAgICAgICAgICpcbiAgICAgICAgICogQGRlc2NyaXB0aW9uXG4gICAgICAgICAqXG4gICAgICAgICAqIEZpbmQgZmlyc3QgaW5zdGFuY2Ugb2YgdGhlIG1vZGVsIG1hdGNoZWQgYnkgZmlsdGVyIGZyb20gdGhlIGRhdGEgc291cmNlLlxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdD19IHBhcmFtZXRlcnMgUmVxdWVzdCBwYXJhbWV0ZXJzLlxuICAgICAgICAgKlxuICAgICAgICAgKiAgLSBgZmlsdGVyYCDigJMgYHtvYmplY3Q9fWAgLSBGaWx0ZXIgZGVmaW5pbmcgZmllbGRzLCB3aGVyZSwgaW5jbHVkZSwgb3JkZXIsIG9mZnNldCwgYW5kIGxpbWl0XG4gICAgICAgICAqXG4gICAgICAgICAqIEBwYXJhbSB7ZnVuY3Rpb24oT2JqZWN0LE9iamVjdCk9fSBzdWNjZXNzQ2JcbiAgICAgICAgICogICBTdWNjZXNzIGNhbGxiYWNrIHdpdGggdHdvIGFyZ3VtZW50czogYHZhbHVlYCwgYHJlc3BvbnNlSGVhZGVyc2AuXG4gICAgICAgICAqXG4gICAgICAgICAqIEBwYXJhbSB7ZnVuY3Rpb24oT2JqZWN0KT19IGVycm9yQ2IgRXJyb3IgY2FsbGJhY2sgd2l0aCBvbmUgYXJndW1lbnQ6XG4gICAgICAgICAqICAgYGh0dHBSZXNwb25zZWAuXG4gICAgICAgICAqXG4gICAgICAgICAqIEByZXR1cm5zIHtPYmplY3R9IEFuIGVtcHR5IHJlZmVyZW5jZSB0aGF0IHdpbGwgYmVcbiAgICAgICAgICogICBwb3B1bGF0ZWQgd2l0aCB0aGUgYWN0dWFsIGRhdGEgb25jZSB0aGUgcmVzcG9uc2UgaXMgcmV0dXJuZWRcbiAgICAgICAgICogICBmcm9tIHRoZSBzZXJ2ZXIuXG4gICAgICAgICAqXG4gICAgICAgICAqIDxlbT5cbiAgICAgICAgICogKFRoZSByZW1vdGUgbWV0aG9kIGRlZmluaXRpb24gZG9lcyBub3QgcHJvdmlkZSBhbnkgZGVzY3JpcHRpb24uXG4gICAgICAgICAqIFRoaXMgdXN1YWxseSBtZWFucyB0aGUgcmVzcG9uc2UgaXMgYSBgUmVwb3J0YCBvYmplY3QuKVxuICAgICAgICAgKiA8L2VtPlxuICAgICAgICAgKi9cbiAgICAgICAgXCJmaW5kT25lXCI6IHtcbiAgICAgICAgICB1cmw6IHVybEJhc2UgKyBcIi9yZXBvcnRzL2ZpbmRPbmVcIixcbiAgICAgICAgICBtZXRob2Q6IFwiR0VUXCJcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogQG5nZG9jIG1ldGhvZFxuICAgICAgICAgKiBAbmFtZSBsYlNlcnZpY2VzLlJlcG9ydCN1cGRhdGVBbGxcbiAgICAgICAgICogQG1ldGhvZE9mIGxiU2VydmljZXMuUmVwb3J0XG4gICAgICAgICAqXG4gICAgICAgICAqIEBkZXNjcmlwdGlvblxuICAgICAgICAgKlxuICAgICAgICAgKiBVcGRhdGUgaW5zdGFuY2VzIG9mIHRoZSBtb2RlbCBtYXRjaGVkIGJ5IHdoZXJlIGZyb20gdGhlIGRhdGEgc291cmNlLlxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdD19IHBhcmFtZXRlcnMgUmVxdWVzdCBwYXJhbWV0ZXJzLlxuICAgICAgICAgKlxuICAgICAgICAgKiAgLSBgd2hlcmVgIOKAkyBge29iamVjdD19YCAtIENyaXRlcmlhIHRvIG1hdGNoIG1vZGVsIGluc3RhbmNlc1xuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gcG9zdERhdGEgUmVxdWVzdCBkYXRhLlxuICAgICAgICAgKlxuICAgICAgICAgKiBUaGlzIG1ldGhvZCBleHBlY3RzIGEgc3Vic2V0IG9mIG1vZGVsIHByb3BlcnRpZXMgYXMgcmVxdWVzdCBwYXJhbWV0ZXJzLlxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0ge2Z1bmN0aW9uKE9iamVjdCxPYmplY3QpPX0gc3VjY2Vzc0NiXG4gICAgICAgICAqICAgU3VjY2VzcyBjYWxsYmFjayB3aXRoIHR3byBhcmd1bWVudHM6IGB2YWx1ZWAsIGByZXNwb25zZUhlYWRlcnNgLlxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0ge2Z1bmN0aW9uKE9iamVjdCk9fSBlcnJvckNiIEVycm9yIGNhbGxiYWNrIHdpdGggb25lIGFyZ3VtZW50OlxuICAgICAgICAgKiAgIGBodHRwUmVzcG9uc2VgLlxuICAgICAgICAgKlxuICAgICAgICAgKiBAcmV0dXJucyB7T2JqZWN0fSBBbiBlbXB0eSByZWZlcmVuY2UgdGhhdCB3aWxsIGJlXG4gICAgICAgICAqICAgcG9wdWxhdGVkIHdpdGggdGhlIGFjdHVhbCBkYXRhIG9uY2UgdGhlIHJlc3BvbnNlIGlzIHJldHVybmVkXG4gICAgICAgICAqICAgZnJvbSB0aGUgc2VydmVyLlxuICAgICAgICAgKlxuICAgICAgICAgKiBUaGUgbnVtYmVyIG9mIGluc3RhbmNlcyB1cGRhdGVkXG4gICAgICAgICAqL1xuICAgICAgICBcInVwZGF0ZUFsbFwiOiB7XG4gICAgICAgICAgdXJsOiB1cmxCYXNlICsgXCIvcmVwb3J0cy91cGRhdGVcIixcbiAgICAgICAgICBtZXRob2Q6IFwiUE9TVFwiXG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEBuZ2RvYyBtZXRob2RcbiAgICAgICAgICogQG5hbWUgbGJTZXJ2aWNlcy5SZXBvcnQjZGVsZXRlQnlJZFxuICAgICAgICAgKiBAbWV0aG9kT2YgbGJTZXJ2aWNlcy5SZXBvcnRcbiAgICAgICAgICpcbiAgICAgICAgICogQGRlc2NyaXB0aW9uXG4gICAgICAgICAqXG4gICAgICAgICAqIERlbGV0ZSBhIG1vZGVsIGluc3RhbmNlIGJ5IGlkIGZyb20gdGhlIGRhdGEgc291cmNlLlxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdD19IHBhcmFtZXRlcnMgUmVxdWVzdCBwYXJhbWV0ZXJzLlxuICAgICAgICAgKlxuICAgICAgICAgKiAgLSBgaWRgIOKAkyBgeyp9YCAtIE1vZGVsIGlkXG4gICAgICAgICAqXG4gICAgICAgICAqIEBwYXJhbSB7ZnVuY3Rpb24oT2JqZWN0LE9iamVjdCk9fSBzdWNjZXNzQ2JcbiAgICAgICAgICogICBTdWNjZXNzIGNhbGxiYWNrIHdpdGggdHdvIGFyZ3VtZW50czogYHZhbHVlYCwgYHJlc3BvbnNlSGVhZGVyc2AuXG4gICAgICAgICAqXG4gICAgICAgICAqIEBwYXJhbSB7ZnVuY3Rpb24oT2JqZWN0KT19IGVycm9yQ2IgRXJyb3IgY2FsbGJhY2sgd2l0aCBvbmUgYXJndW1lbnQ6XG4gICAgICAgICAqICAgYGh0dHBSZXNwb25zZWAuXG4gICAgICAgICAqXG4gICAgICAgICAqIEByZXR1cm5zIHtPYmplY3R9IEFuIGVtcHR5IHJlZmVyZW5jZSB0aGF0IHdpbGwgYmVcbiAgICAgICAgICogICBwb3B1bGF0ZWQgd2l0aCB0aGUgYWN0dWFsIGRhdGEgb25jZSB0aGUgcmVzcG9uc2UgaXMgcmV0dXJuZWRcbiAgICAgICAgICogICBmcm9tIHRoZSBzZXJ2ZXIuXG4gICAgICAgICAqXG4gICAgICAgICAqIDxlbT5cbiAgICAgICAgICogKFRoZSByZW1vdGUgbWV0aG9kIGRlZmluaXRpb24gZG9lcyBub3QgcHJvdmlkZSBhbnkgZGVzY3JpcHRpb24uXG4gICAgICAgICAqIFRoaXMgdXN1YWxseSBtZWFucyB0aGUgcmVzcG9uc2UgaXMgYSBgUmVwb3J0YCBvYmplY3QuKVxuICAgICAgICAgKiA8L2VtPlxuICAgICAgICAgKi9cbiAgICAgICAgXCJkZWxldGVCeUlkXCI6IHtcbiAgICAgICAgICB1cmw6IHVybEJhc2UgKyBcIi9yZXBvcnRzLzppZFwiLFxuICAgICAgICAgIG1ldGhvZDogXCJERUxFVEVcIlxuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAbmdkb2MgbWV0aG9kXG4gICAgICAgICAqIEBuYW1lIGxiU2VydmljZXMuUmVwb3J0I2NvdW50XG4gICAgICAgICAqIEBtZXRob2RPZiBsYlNlcnZpY2VzLlJlcG9ydFxuICAgICAgICAgKlxuICAgICAgICAgKiBAZGVzY3JpcHRpb25cbiAgICAgICAgICpcbiAgICAgICAgICogQ291bnQgaW5zdGFuY2VzIG9mIHRoZSBtb2RlbCBtYXRjaGVkIGJ5IHdoZXJlIGZyb20gdGhlIGRhdGEgc291cmNlLlxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdD19IHBhcmFtZXRlcnMgUmVxdWVzdCBwYXJhbWV0ZXJzLlxuICAgICAgICAgKlxuICAgICAgICAgKiAgLSBgd2hlcmVgIOKAkyBge29iamVjdD19YCAtIENyaXRlcmlhIHRvIG1hdGNoIG1vZGVsIGluc3RhbmNlc1xuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0ge2Z1bmN0aW9uKE9iamVjdCxPYmplY3QpPX0gc3VjY2Vzc0NiXG4gICAgICAgICAqICAgU3VjY2VzcyBjYWxsYmFjayB3aXRoIHR3byBhcmd1bWVudHM6IGB2YWx1ZWAsIGByZXNwb25zZUhlYWRlcnNgLlxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0ge2Z1bmN0aW9uKE9iamVjdCk9fSBlcnJvckNiIEVycm9yIGNhbGxiYWNrIHdpdGggb25lIGFyZ3VtZW50OlxuICAgICAgICAgKiAgIGBodHRwUmVzcG9uc2VgLlxuICAgICAgICAgKlxuICAgICAgICAgKiBAcmV0dXJucyB7T2JqZWN0fSBBbiBlbXB0eSByZWZlcmVuY2UgdGhhdCB3aWxsIGJlXG4gICAgICAgICAqICAgcG9wdWxhdGVkIHdpdGggdGhlIGFjdHVhbCBkYXRhIG9uY2UgdGhlIHJlc3BvbnNlIGlzIHJldHVybmVkXG4gICAgICAgICAqICAgZnJvbSB0aGUgc2VydmVyLlxuICAgICAgICAgKlxuICAgICAgICAgKiBEYXRhIHByb3BlcnRpZXM6XG4gICAgICAgICAqXG4gICAgICAgICAqICAtIGBjb3VudGAg4oCTIGB7bnVtYmVyPX1gIC0gXG4gICAgICAgICAqL1xuICAgICAgICBcImNvdW50XCI6IHtcbiAgICAgICAgICB1cmw6IHVybEJhc2UgKyBcIi9yZXBvcnRzL2NvdW50XCIsXG4gICAgICAgICAgbWV0aG9kOiBcIkdFVFwiXG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEBuZ2RvYyBtZXRob2RcbiAgICAgICAgICogQG5hbWUgbGJTZXJ2aWNlcy5SZXBvcnQjcHJvdG90eXBlJHVwZGF0ZUF0dHJpYnV0ZXNcbiAgICAgICAgICogQG1ldGhvZE9mIGxiU2VydmljZXMuUmVwb3J0XG4gICAgICAgICAqXG4gICAgICAgICAqIEBkZXNjcmlwdGlvblxuICAgICAgICAgKlxuICAgICAgICAgKiBVcGRhdGUgYXR0cmlidXRlcyBmb3IgYSBtb2RlbCBpbnN0YW5jZSBhbmQgcGVyc2lzdCBpdCBpbnRvIHRoZSBkYXRhIHNvdXJjZS5cbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHtPYmplY3Q9fSBwYXJhbWV0ZXJzIFJlcXVlc3QgcGFyYW1ldGVycy5cbiAgICAgICAgICpcbiAgICAgICAgICogIC0gYGlkYCDigJMgYHsqfWAgLSBQZXJzaXN0ZWRNb2RlbCBpZFxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gcG9zdERhdGEgUmVxdWVzdCBkYXRhLlxuICAgICAgICAgKlxuICAgICAgICAgKiBUaGlzIG1ldGhvZCBleHBlY3RzIGEgc3Vic2V0IG9mIG1vZGVsIHByb3BlcnRpZXMgYXMgcmVxdWVzdCBwYXJhbWV0ZXJzLlxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0ge2Z1bmN0aW9uKE9iamVjdCxPYmplY3QpPX0gc3VjY2Vzc0NiXG4gICAgICAgICAqICAgU3VjY2VzcyBjYWxsYmFjayB3aXRoIHR3byBhcmd1bWVudHM6IGB2YWx1ZWAsIGByZXNwb25zZUhlYWRlcnNgLlxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0ge2Z1bmN0aW9uKE9iamVjdCk9fSBlcnJvckNiIEVycm9yIGNhbGxiYWNrIHdpdGggb25lIGFyZ3VtZW50OlxuICAgICAgICAgKiAgIGBodHRwUmVzcG9uc2VgLlxuICAgICAgICAgKlxuICAgICAgICAgKiBAcmV0dXJucyB7T2JqZWN0fSBBbiBlbXB0eSByZWZlcmVuY2UgdGhhdCB3aWxsIGJlXG4gICAgICAgICAqICAgcG9wdWxhdGVkIHdpdGggdGhlIGFjdHVhbCBkYXRhIG9uY2UgdGhlIHJlc3BvbnNlIGlzIHJldHVybmVkXG4gICAgICAgICAqICAgZnJvbSB0aGUgc2VydmVyLlxuICAgICAgICAgKlxuICAgICAgICAgKiA8ZW0+XG4gICAgICAgICAqIChUaGUgcmVtb3RlIG1ldGhvZCBkZWZpbml0aW9uIGRvZXMgbm90IHByb3ZpZGUgYW55IGRlc2NyaXB0aW9uLlxuICAgICAgICAgKiBUaGlzIHVzdWFsbHkgbWVhbnMgdGhlIHJlc3BvbnNlIGlzIGEgYFJlcG9ydGAgb2JqZWN0LilcbiAgICAgICAgICogPC9lbT5cbiAgICAgICAgICovXG4gICAgICAgIFwicHJvdG90eXBlJHVwZGF0ZUF0dHJpYnV0ZXNcIjoge1xuICAgICAgICAgIHVybDogdXJsQmFzZSArIFwiL3JlcG9ydHMvOmlkXCIsXG4gICAgICAgICAgbWV0aG9kOiBcIlBVVFwiXG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEBuZ2RvYyBtZXRob2RcbiAgICAgICAgICogQG5hbWUgbGJTZXJ2aWNlcy5SZXBvcnQjY3JlYXRlQ2hhbmdlU3RyZWFtXG4gICAgICAgICAqIEBtZXRob2RPZiBsYlNlcnZpY2VzLlJlcG9ydFxuICAgICAgICAgKlxuICAgICAgICAgKiBAZGVzY3JpcHRpb25cbiAgICAgICAgICpcbiAgICAgICAgICogQ3JlYXRlIGEgY2hhbmdlIHN0cmVhbS5cbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHtPYmplY3Q9fSBwYXJhbWV0ZXJzIFJlcXVlc3QgcGFyYW1ldGVycy5cbiAgICAgICAgICpcbiAgICAgICAgICogICBUaGlzIG1ldGhvZCBkb2VzIG5vdCBhY2NlcHQgYW55IHBhcmFtZXRlcnMuXG4gICAgICAgICAqICAgU3VwcGx5IGFuIGVtcHR5IG9iamVjdCBvciBvbWl0IHRoaXMgYXJndW1lbnQgYWx0b2dldGhlci5cbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IHBvc3REYXRhIFJlcXVlc3QgZGF0YS5cbiAgICAgICAgICpcbiAgICAgICAgICogIC0gYG9wdGlvbnNgIOKAkyBge29iamVjdD19YCAtIFxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0ge2Z1bmN0aW9uKE9iamVjdCxPYmplY3QpPX0gc3VjY2Vzc0NiXG4gICAgICAgICAqICAgU3VjY2VzcyBjYWxsYmFjayB3aXRoIHR3byBhcmd1bWVudHM6IGB2YWx1ZWAsIGByZXNwb25zZUhlYWRlcnNgLlxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0ge2Z1bmN0aW9uKE9iamVjdCk9fSBlcnJvckNiIEVycm9yIGNhbGxiYWNrIHdpdGggb25lIGFyZ3VtZW50OlxuICAgICAgICAgKiAgIGBodHRwUmVzcG9uc2VgLlxuICAgICAgICAgKlxuICAgICAgICAgKiBAcmV0dXJucyB7T2JqZWN0fSBBbiBlbXB0eSByZWZlcmVuY2UgdGhhdCB3aWxsIGJlXG4gICAgICAgICAqICAgcG9wdWxhdGVkIHdpdGggdGhlIGFjdHVhbCBkYXRhIG9uY2UgdGhlIHJlc3BvbnNlIGlzIHJldHVybmVkXG4gICAgICAgICAqICAgZnJvbSB0aGUgc2VydmVyLlxuICAgICAgICAgKlxuICAgICAgICAgKiBEYXRhIHByb3BlcnRpZXM6XG4gICAgICAgICAqXG4gICAgICAgICAqICAtIGBjaGFuZ2VzYCDigJMgYHtSZWFkYWJsZVN0cmVhbT19YCAtIFxuICAgICAgICAgKi9cbiAgICAgICAgXCJjcmVhdGVDaGFuZ2VTdHJlYW1cIjoge1xuICAgICAgICAgIHVybDogdXJsQmFzZSArIFwiL3JlcG9ydHMvY2hhbmdlLXN0cmVhbVwiLFxuICAgICAgICAgIG1ldGhvZDogXCJQT1NUXCJcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogQG5nZG9jIG1ldGhvZFxuICAgICAgICAgKiBAbmFtZSBsYlNlcnZpY2VzLlJlcG9ydCNjb3VudEJ5Q291bnRyeVxuICAgICAgICAgKiBAbWV0aG9kT2YgbGJTZXJ2aWNlcy5SZXBvcnRcbiAgICAgICAgICpcbiAgICAgICAgICogQGRlc2NyaXB0aW9uXG4gICAgICAgICAqXG4gICAgICAgICAqIEdldCBudW1iZXIgb2YgcmVwb3J0cyBieSBjb3VudHJ5IGNvZGVcbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHtPYmplY3Q9fSBwYXJhbWV0ZXJzIFJlcXVlc3QgcGFyYW1ldGVycy5cbiAgICAgICAgICpcbiAgICAgICAgICogICBUaGlzIG1ldGhvZCBkb2VzIG5vdCBhY2NlcHQgYW55IHBhcmFtZXRlcnMuXG4gICAgICAgICAqICAgU3VwcGx5IGFuIGVtcHR5IG9iamVjdCBvciBvbWl0IHRoaXMgYXJndW1lbnQgYWx0b2dldGhlci5cbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHtmdW5jdGlvbihBcnJheS48T2JqZWN0PixPYmplY3QpPX0gc3VjY2Vzc0NiXG4gICAgICAgICAqICAgU3VjY2VzcyBjYWxsYmFjayB3aXRoIHR3byBhcmd1bWVudHM6IGB2YWx1ZWAsIGByZXNwb25zZUhlYWRlcnNgLlxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0ge2Z1bmN0aW9uKE9iamVjdCk9fSBlcnJvckNiIEVycm9yIGNhbGxiYWNrIHdpdGggb25lIGFyZ3VtZW50OlxuICAgICAgICAgKiAgIGBodHRwUmVzcG9uc2VgLlxuICAgICAgICAgKlxuICAgICAgICAgKiBAcmV0dXJucyB7QXJyYXkuPE9iamVjdD59IEFuIGVtcHR5IHJlZmVyZW5jZSB0aGF0IHdpbGwgYmVcbiAgICAgICAgICogICBwb3B1bGF0ZWQgd2l0aCB0aGUgYWN0dWFsIGRhdGEgb25jZSB0aGUgcmVzcG9uc2UgaXMgcmV0dXJuZWRcbiAgICAgICAgICogICBmcm9tIHRoZSBzZXJ2ZXIuXG4gICAgICAgICAqXG4gICAgICAgICAqIDxlbT5cbiAgICAgICAgICogKFRoZSByZW1vdGUgbWV0aG9kIGRlZmluaXRpb24gZG9lcyBub3QgcHJvdmlkZSBhbnkgZGVzY3JpcHRpb24uXG4gICAgICAgICAqIFRoaXMgdXN1YWxseSBtZWFucyB0aGUgcmVzcG9uc2UgaXMgYSBgUmVwb3J0YCBvYmplY3QuKVxuICAgICAgICAgKiA8L2VtPlxuICAgICAgICAgKi9cbiAgICAgICAgXCJjb3VudEJ5Q291bnRyeVwiOiB7XG4gICAgICAgICAgaXNBcnJheTogdHJ1ZSxcbiAgICAgICAgICB1cmw6IHVybEJhc2UgKyBcIi9yZXBvcnRzL2NvdW50QnlDb3VudHJ5XCIsXG4gICAgICAgICAgbWV0aG9kOiBcIkdFVFwiXG4gICAgICAgIH0sXG4gICAgICB9XG4gICAgKTtcblxuXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEBuZ2RvYyBtZXRob2RcbiAgICAgICAgICogQG5hbWUgbGJTZXJ2aWNlcy5SZXBvcnQjdXBkYXRlT3JDcmVhdGVcbiAgICAgICAgICogQG1ldGhvZE9mIGxiU2VydmljZXMuUmVwb3J0XG4gICAgICAgICAqXG4gICAgICAgICAqIEBkZXNjcmlwdGlvblxuICAgICAgICAgKlxuICAgICAgICAgKiBVcGRhdGUgYW4gZXhpc3RpbmcgbW9kZWwgaW5zdGFuY2Ugb3IgaW5zZXJ0IGEgbmV3IG9uZSBpbnRvIHRoZSBkYXRhIHNvdXJjZS5cbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHtPYmplY3Q9fSBwYXJhbWV0ZXJzIFJlcXVlc3QgcGFyYW1ldGVycy5cbiAgICAgICAgICpcbiAgICAgICAgICogICBUaGlzIG1ldGhvZCBkb2VzIG5vdCBhY2NlcHQgYW55IHBhcmFtZXRlcnMuXG4gICAgICAgICAqICAgU3VwcGx5IGFuIGVtcHR5IG9iamVjdCBvciBvbWl0IHRoaXMgYXJndW1lbnQgYWx0b2dldGhlci5cbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IHBvc3REYXRhIFJlcXVlc3QgZGF0YS5cbiAgICAgICAgICpcbiAgICAgICAgICogVGhpcyBtZXRob2QgZXhwZWN0cyBhIHN1YnNldCBvZiBtb2RlbCBwcm9wZXJ0aWVzIGFzIHJlcXVlc3QgcGFyYW1ldGVycy5cbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHtmdW5jdGlvbihPYmplY3QsT2JqZWN0KT19IHN1Y2Nlc3NDYlxuICAgICAgICAgKiAgIFN1Y2Nlc3MgY2FsbGJhY2sgd2l0aCB0d28gYXJndW1lbnRzOiBgdmFsdWVgLCBgcmVzcG9uc2VIZWFkZXJzYC5cbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHtmdW5jdGlvbihPYmplY3QpPX0gZXJyb3JDYiBFcnJvciBjYWxsYmFjayB3aXRoIG9uZSBhcmd1bWVudDpcbiAgICAgICAgICogICBgaHR0cFJlc3BvbnNlYC5cbiAgICAgICAgICpcbiAgICAgICAgICogQHJldHVybnMge09iamVjdH0gQW4gZW1wdHkgcmVmZXJlbmNlIHRoYXQgd2lsbCBiZVxuICAgICAgICAgKiAgIHBvcHVsYXRlZCB3aXRoIHRoZSBhY3R1YWwgZGF0YSBvbmNlIHRoZSByZXNwb25zZSBpcyByZXR1cm5lZFxuICAgICAgICAgKiAgIGZyb20gdGhlIHNlcnZlci5cbiAgICAgICAgICpcbiAgICAgICAgICogPGVtPlxuICAgICAgICAgKiAoVGhlIHJlbW90ZSBtZXRob2QgZGVmaW5pdGlvbiBkb2VzIG5vdCBwcm92aWRlIGFueSBkZXNjcmlwdGlvbi5cbiAgICAgICAgICogVGhpcyB1c3VhbGx5IG1lYW5zIHRoZSByZXNwb25zZSBpcyBhIGBSZXBvcnRgIG9iamVjdC4pXG4gICAgICAgICAqIDwvZW0+XG4gICAgICAgICAqL1xuICAgICAgICBSW1widXBkYXRlT3JDcmVhdGVcIl0gPSBSW1widXBzZXJ0XCJdO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAbmdkb2MgbWV0aG9kXG4gICAgICAgICAqIEBuYW1lIGxiU2VydmljZXMuUmVwb3J0I3VwZGF0ZVxuICAgICAgICAgKiBAbWV0aG9kT2YgbGJTZXJ2aWNlcy5SZXBvcnRcbiAgICAgICAgICpcbiAgICAgICAgICogQGRlc2NyaXB0aW9uXG4gICAgICAgICAqXG4gICAgICAgICAqIFVwZGF0ZSBpbnN0YW5jZXMgb2YgdGhlIG1vZGVsIG1hdGNoZWQgYnkgd2hlcmUgZnJvbSB0aGUgZGF0YSBzb3VyY2UuXG4gICAgICAgICAqXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0PX0gcGFyYW1ldGVycyBSZXF1ZXN0IHBhcmFtZXRlcnMuXG4gICAgICAgICAqXG4gICAgICAgICAqICAtIGB3aGVyZWAg4oCTIGB7b2JqZWN0PX1gIC0gQ3JpdGVyaWEgdG8gbWF0Y2ggbW9kZWwgaW5zdGFuY2VzXG4gICAgICAgICAqXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBwb3N0RGF0YSBSZXF1ZXN0IGRhdGEuXG4gICAgICAgICAqXG4gICAgICAgICAqIFRoaXMgbWV0aG9kIGV4cGVjdHMgYSBzdWJzZXQgb2YgbW9kZWwgcHJvcGVydGllcyBhcyByZXF1ZXN0IHBhcmFtZXRlcnMuXG4gICAgICAgICAqXG4gICAgICAgICAqIEBwYXJhbSB7ZnVuY3Rpb24oT2JqZWN0LE9iamVjdCk9fSBzdWNjZXNzQ2JcbiAgICAgICAgICogICBTdWNjZXNzIGNhbGxiYWNrIHdpdGggdHdvIGFyZ3VtZW50czogYHZhbHVlYCwgYHJlc3BvbnNlSGVhZGVyc2AuXG4gICAgICAgICAqXG4gICAgICAgICAqIEBwYXJhbSB7ZnVuY3Rpb24oT2JqZWN0KT19IGVycm9yQ2IgRXJyb3IgY2FsbGJhY2sgd2l0aCBvbmUgYXJndW1lbnQ6XG4gICAgICAgICAqICAgYGh0dHBSZXNwb25zZWAuXG4gICAgICAgICAqXG4gICAgICAgICAqIEByZXR1cm5zIHtPYmplY3R9IEFuIGVtcHR5IHJlZmVyZW5jZSB0aGF0IHdpbGwgYmVcbiAgICAgICAgICogICBwb3B1bGF0ZWQgd2l0aCB0aGUgYWN0dWFsIGRhdGEgb25jZSB0aGUgcmVzcG9uc2UgaXMgcmV0dXJuZWRcbiAgICAgICAgICogICBmcm9tIHRoZSBzZXJ2ZXIuXG4gICAgICAgICAqXG4gICAgICAgICAqIFRoZSBudW1iZXIgb2YgaW5zdGFuY2VzIHVwZGF0ZWRcbiAgICAgICAgICovXG4gICAgICAgIFJbXCJ1cGRhdGVcIl0gPSBSW1widXBkYXRlQWxsXCJdO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAbmdkb2MgbWV0aG9kXG4gICAgICAgICAqIEBuYW1lIGxiU2VydmljZXMuUmVwb3J0I2Rlc3Ryb3lCeUlkXG4gICAgICAgICAqIEBtZXRob2RPZiBsYlNlcnZpY2VzLlJlcG9ydFxuICAgICAgICAgKlxuICAgICAgICAgKiBAZGVzY3JpcHRpb25cbiAgICAgICAgICpcbiAgICAgICAgICogRGVsZXRlIGEgbW9kZWwgaW5zdGFuY2UgYnkgaWQgZnJvbSB0aGUgZGF0YSBzb3VyY2UuXG4gICAgICAgICAqXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0PX0gcGFyYW1ldGVycyBSZXF1ZXN0IHBhcmFtZXRlcnMuXG4gICAgICAgICAqXG4gICAgICAgICAqICAtIGBpZGAg4oCTIGB7Kn1gIC0gTW9kZWwgaWRcbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHtmdW5jdGlvbihPYmplY3QsT2JqZWN0KT19IHN1Y2Nlc3NDYlxuICAgICAgICAgKiAgIFN1Y2Nlc3MgY2FsbGJhY2sgd2l0aCB0d28gYXJndW1lbnRzOiBgdmFsdWVgLCBgcmVzcG9uc2VIZWFkZXJzYC5cbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHtmdW5jdGlvbihPYmplY3QpPX0gZXJyb3JDYiBFcnJvciBjYWxsYmFjayB3aXRoIG9uZSBhcmd1bWVudDpcbiAgICAgICAgICogICBgaHR0cFJlc3BvbnNlYC5cbiAgICAgICAgICpcbiAgICAgICAgICogQHJldHVybnMge09iamVjdH0gQW4gZW1wdHkgcmVmZXJlbmNlIHRoYXQgd2lsbCBiZVxuICAgICAgICAgKiAgIHBvcHVsYXRlZCB3aXRoIHRoZSBhY3R1YWwgZGF0YSBvbmNlIHRoZSByZXNwb25zZSBpcyByZXR1cm5lZFxuICAgICAgICAgKiAgIGZyb20gdGhlIHNlcnZlci5cbiAgICAgICAgICpcbiAgICAgICAgICogPGVtPlxuICAgICAgICAgKiAoVGhlIHJlbW90ZSBtZXRob2QgZGVmaW5pdGlvbiBkb2VzIG5vdCBwcm92aWRlIGFueSBkZXNjcmlwdGlvbi5cbiAgICAgICAgICogVGhpcyB1c3VhbGx5IG1lYW5zIHRoZSByZXNwb25zZSBpcyBhIGBSZXBvcnRgIG9iamVjdC4pXG4gICAgICAgICAqIDwvZW0+XG4gICAgICAgICAqL1xuICAgICAgICBSW1wiZGVzdHJveUJ5SWRcIl0gPSBSW1wiZGVsZXRlQnlJZFwiXTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogQG5nZG9jIG1ldGhvZFxuICAgICAgICAgKiBAbmFtZSBsYlNlcnZpY2VzLlJlcG9ydCNyZW1vdmVCeUlkXG4gICAgICAgICAqIEBtZXRob2RPZiBsYlNlcnZpY2VzLlJlcG9ydFxuICAgICAgICAgKlxuICAgICAgICAgKiBAZGVzY3JpcHRpb25cbiAgICAgICAgICpcbiAgICAgICAgICogRGVsZXRlIGEgbW9kZWwgaW5zdGFuY2UgYnkgaWQgZnJvbSB0aGUgZGF0YSBzb3VyY2UuXG4gICAgICAgICAqXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0PX0gcGFyYW1ldGVycyBSZXF1ZXN0IHBhcmFtZXRlcnMuXG4gICAgICAgICAqXG4gICAgICAgICAqICAtIGBpZGAg4oCTIGB7Kn1gIC0gTW9kZWwgaWRcbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHtmdW5jdGlvbihPYmplY3QsT2JqZWN0KT19IHN1Y2Nlc3NDYlxuICAgICAgICAgKiAgIFN1Y2Nlc3MgY2FsbGJhY2sgd2l0aCB0d28gYXJndW1lbnRzOiBgdmFsdWVgLCBgcmVzcG9uc2VIZWFkZXJzYC5cbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHtmdW5jdGlvbihPYmplY3QpPX0gZXJyb3JDYiBFcnJvciBjYWxsYmFjayB3aXRoIG9uZSBhcmd1bWVudDpcbiAgICAgICAgICogICBgaHR0cFJlc3BvbnNlYC5cbiAgICAgICAgICpcbiAgICAgICAgICogQHJldHVybnMge09iamVjdH0gQW4gZW1wdHkgcmVmZXJlbmNlIHRoYXQgd2lsbCBiZVxuICAgICAgICAgKiAgIHBvcHVsYXRlZCB3aXRoIHRoZSBhY3R1YWwgZGF0YSBvbmNlIHRoZSByZXNwb25zZSBpcyByZXR1cm5lZFxuICAgICAgICAgKiAgIGZyb20gdGhlIHNlcnZlci5cbiAgICAgICAgICpcbiAgICAgICAgICogPGVtPlxuICAgICAgICAgKiAoVGhlIHJlbW90ZSBtZXRob2QgZGVmaW5pdGlvbiBkb2VzIG5vdCBwcm92aWRlIGFueSBkZXNjcmlwdGlvbi5cbiAgICAgICAgICogVGhpcyB1c3VhbGx5IG1lYW5zIHRoZSByZXNwb25zZSBpcyBhIGBSZXBvcnRgIG9iamVjdC4pXG4gICAgICAgICAqIDwvZW0+XG4gICAgICAgICAqL1xuICAgICAgICBSW1wicmVtb3ZlQnlJZFwiXSA9IFJbXCJkZWxldGVCeUlkXCJdO1xuXG5cbiAgICAvKipcbiAgICAqIEBuZ2RvYyBwcm9wZXJ0eVxuICAgICogQG5hbWUgbGJTZXJ2aWNlcy5SZXBvcnQjbW9kZWxOYW1lXG4gICAgKiBAcHJvcGVydHlPZiBsYlNlcnZpY2VzLlJlcG9ydFxuICAgICogQGRlc2NyaXB0aW9uXG4gICAgKiBUaGUgbmFtZSBvZiB0aGUgbW9kZWwgcmVwcmVzZW50ZWQgYnkgdGhpcyAkcmVzb3VyY2UsXG4gICAgKiBpLmUuIGBSZXBvcnRgLlxuICAgICovXG4gICAgUi5tb2RlbE5hbWUgPSBcIlJlcG9ydFwiO1xuXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEBuZ2RvYyBtZXRob2RcbiAgICAgICAgICogQG5hbWUgbGJTZXJ2aWNlcy5SZXBvcnQjY291bnRyeVxuICAgICAgICAgKiBAbWV0aG9kT2YgbGJTZXJ2aWNlcy5SZXBvcnRcbiAgICAgICAgICpcbiAgICAgICAgICogQGRlc2NyaXB0aW9uXG4gICAgICAgICAqXG4gICAgICAgICAqIEZldGNoZXMgYmVsb25nc1RvIHJlbGF0aW9uIGNvdW50cnkuXG4gICAgICAgICAqXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0PX0gcGFyYW1ldGVycyBSZXF1ZXN0IHBhcmFtZXRlcnMuXG4gICAgICAgICAqXG4gICAgICAgICAqICAtIGBpZGAg4oCTIGB7Kn1gIC0gUGVyc2lzdGVkTW9kZWwgaWRcbiAgICAgICAgICpcbiAgICAgICAgICogIC0gYHJlZnJlc2hgIOKAkyBge2Jvb2xlYW49fWAgLSBcbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHtmdW5jdGlvbihPYmplY3QsT2JqZWN0KT19IHN1Y2Nlc3NDYlxuICAgICAgICAgKiAgIFN1Y2Nlc3MgY2FsbGJhY2sgd2l0aCB0d28gYXJndW1lbnRzOiBgdmFsdWVgLCBgcmVzcG9uc2VIZWFkZXJzYC5cbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHtmdW5jdGlvbihPYmplY3QpPX0gZXJyb3JDYiBFcnJvciBjYWxsYmFjayB3aXRoIG9uZSBhcmd1bWVudDpcbiAgICAgICAgICogICBgaHR0cFJlc3BvbnNlYC5cbiAgICAgICAgICpcbiAgICAgICAgICogQHJldHVybnMge09iamVjdH0gQW4gZW1wdHkgcmVmZXJlbmNlIHRoYXQgd2lsbCBiZVxuICAgICAgICAgKiAgIHBvcHVsYXRlZCB3aXRoIHRoZSBhY3R1YWwgZGF0YSBvbmNlIHRoZSByZXNwb25zZSBpcyByZXR1cm5lZFxuICAgICAgICAgKiAgIGZyb20gdGhlIHNlcnZlci5cbiAgICAgICAgICpcbiAgICAgICAgICogPGVtPlxuICAgICAgICAgKiAoVGhlIHJlbW90ZSBtZXRob2QgZGVmaW5pdGlvbiBkb2VzIG5vdCBwcm92aWRlIGFueSBkZXNjcmlwdGlvbi5cbiAgICAgICAgICogVGhpcyB1c3VhbGx5IG1lYW5zIHRoZSByZXNwb25zZSBpcyBhIGBDb3VudHJ5YCBvYmplY3QuKVxuICAgICAgICAgKiA8L2VtPlxuICAgICAgICAgKi9cbiAgICAgICAgUi5jb3VudHJ5ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgdmFyIFRhcmdldFJlc291cmNlID0gJGluamVjdG9yLmdldChcIkNvdW50cnlcIik7XG4gICAgICAgICAgdmFyIGFjdGlvbiA9IFRhcmdldFJlc291cmNlW1wiOjpnZXQ6OnJlcG9ydDo6Y291bnRyeVwiXTtcbiAgICAgICAgICByZXR1cm4gYWN0aW9uLmFwcGx5KFIsIGFyZ3VtZW50cyk7XG4gICAgICAgIH07XG5cbiAgICByZXR1cm4gUjtcbiAgfV0pO1xuXG4vKipcbiAqIEBuZ2RvYyBvYmplY3RcbiAqIEBuYW1lIGxiU2VydmljZXMuQ291bnRyeVxuICogQGhlYWRlciBsYlNlcnZpY2VzLkNvdW50cnlcbiAqIEBvYmplY3RcbiAqXG4gKiBAZGVzY3JpcHRpb25cbiAqXG4gKiBBICRyZXNvdXJjZSBvYmplY3QgZm9yIGludGVyYWN0aW5nIHdpdGggdGhlIGBDb3VudHJ5YCBtb2RlbC5cbiAqXG4gKiAjIyBFeGFtcGxlXG4gKlxuICogU2VlXG4gKiB7QGxpbmsgaHR0cDovL2RvY3MuYW5ndWxhcmpzLm9yZy9hcGkvbmdSZXNvdXJjZS4kcmVzb3VyY2UjZXhhbXBsZSAkcmVzb3VyY2V9XG4gKiBmb3IgYW4gZXhhbXBsZSBvZiB1c2luZyB0aGlzIG9iamVjdC5cbiAqXG4gKi9cbm1vZHVsZS5mYWN0b3J5KFxuICBcIkNvdW50cnlcIixcbiAgWydMb29wQmFja1Jlc291cmNlJywgJ0xvb3BCYWNrQXV0aCcsICckaW5qZWN0b3InLCBmdW5jdGlvbihSZXNvdXJjZSwgTG9vcEJhY2tBdXRoLCAkaW5qZWN0b3IpIHtcbiAgICB2YXIgUiA9IFJlc291cmNlKFxuICAgICAgdXJsQmFzZSArIFwiL2NvdW50cmllcy86aWRcIixcbiAgICAgIHsgJ2lkJzogJ0BpZCcgfSxcbiAgICAgIHtcblxuICAgICAgICAvKipcbiAgICAgICAgICogQG5nZG9jIG1ldGhvZFxuICAgICAgICAgKiBAbmFtZSBsYlNlcnZpY2VzLkNvdW50cnkjY3JlYXRlXG4gICAgICAgICAqIEBtZXRob2RPZiBsYlNlcnZpY2VzLkNvdW50cnlcbiAgICAgICAgICpcbiAgICAgICAgICogQGRlc2NyaXB0aW9uXG4gICAgICAgICAqXG4gICAgICAgICAqIENyZWF0ZSBhIG5ldyBpbnN0YW5jZSBvZiB0aGUgbW9kZWwgYW5kIHBlcnNpc3QgaXQgaW50byB0aGUgZGF0YSBzb3VyY2UuXG4gICAgICAgICAqXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0PX0gcGFyYW1ldGVycyBSZXF1ZXN0IHBhcmFtZXRlcnMuXG4gICAgICAgICAqXG4gICAgICAgICAqICAgVGhpcyBtZXRob2QgZG9lcyBub3QgYWNjZXB0IGFueSBwYXJhbWV0ZXJzLlxuICAgICAgICAgKiAgIFN1cHBseSBhbiBlbXB0eSBvYmplY3Qgb3Igb21pdCB0aGlzIGFyZ3VtZW50IGFsdG9nZXRoZXIuXG4gICAgICAgICAqXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBwb3N0RGF0YSBSZXF1ZXN0IGRhdGEuXG4gICAgICAgICAqXG4gICAgICAgICAqIFRoaXMgbWV0aG9kIGV4cGVjdHMgYSBzdWJzZXQgb2YgbW9kZWwgcHJvcGVydGllcyBhcyByZXF1ZXN0IHBhcmFtZXRlcnMuXG4gICAgICAgICAqXG4gICAgICAgICAqIEBwYXJhbSB7ZnVuY3Rpb24oT2JqZWN0LE9iamVjdCk9fSBzdWNjZXNzQ2JcbiAgICAgICAgICogICBTdWNjZXNzIGNhbGxiYWNrIHdpdGggdHdvIGFyZ3VtZW50czogYHZhbHVlYCwgYHJlc3BvbnNlSGVhZGVyc2AuXG4gICAgICAgICAqXG4gICAgICAgICAqIEBwYXJhbSB7ZnVuY3Rpb24oT2JqZWN0KT19IGVycm9yQ2IgRXJyb3IgY2FsbGJhY2sgd2l0aCBvbmUgYXJndW1lbnQ6XG4gICAgICAgICAqICAgYGh0dHBSZXNwb25zZWAuXG4gICAgICAgICAqXG4gICAgICAgICAqIEByZXR1cm5zIHtPYmplY3R9IEFuIGVtcHR5IHJlZmVyZW5jZSB0aGF0IHdpbGwgYmVcbiAgICAgICAgICogICBwb3B1bGF0ZWQgd2l0aCB0aGUgYWN0dWFsIGRhdGEgb25jZSB0aGUgcmVzcG9uc2UgaXMgcmV0dXJuZWRcbiAgICAgICAgICogICBmcm9tIHRoZSBzZXJ2ZXIuXG4gICAgICAgICAqXG4gICAgICAgICAqIDxlbT5cbiAgICAgICAgICogKFRoZSByZW1vdGUgbWV0aG9kIGRlZmluaXRpb24gZG9lcyBub3QgcHJvdmlkZSBhbnkgZGVzY3JpcHRpb24uXG4gICAgICAgICAqIFRoaXMgdXN1YWxseSBtZWFucyB0aGUgcmVzcG9uc2UgaXMgYSBgQ291bnRyeWAgb2JqZWN0LilcbiAgICAgICAgICogPC9lbT5cbiAgICAgICAgICovXG4gICAgICAgIFwiY3JlYXRlXCI6IHtcbiAgICAgICAgICB1cmw6IHVybEJhc2UgKyBcIi9jb3VudHJpZXNcIixcbiAgICAgICAgICBtZXRob2Q6IFwiUE9TVFwiXG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEBuZ2RvYyBtZXRob2RcbiAgICAgICAgICogQG5hbWUgbGJTZXJ2aWNlcy5Db3VudHJ5I2NyZWF0ZU1hbnlcbiAgICAgICAgICogQG1ldGhvZE9mIGxiU2VydmljZXMuQ291bnRyeVxuICAgICAgICAgKlxuICAgICAgICAgKiBAZGVzY3JpcHRpb25cbiAgICAgICAgICpcbiAgICAgICAgICogQ3JlYXRlIGEgbmV3IGluc3RhbmNlIG9mIHRoZSBtb2RlbCBhbmQgcGVyc2lzdCBpdCBpbnRvIHRoZSBkYXRhIHNvdXJjZS5cbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHtPYmplY3Q9fSBwYXJhbWV0ZXJzIFJlcXVlc3QgcGFyYW1ldGVycy5cbiAgICAgICAgICpcbiAgICAgICAgICogICBUaGlzIG1ldGhvZCBkb2VzIG5vdCBhY2NlcHQgYW55IHBhcmFtZXRlcnMuXG4gICAgICAgICAqICAgU3VwcGx5IGFuIGVtcHR5IG9iamVjdCBvciBvbWl0IHRoaXMgYXJndW1lbnQgYWx0b2dldGhlci5cbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IHBvc3REYXRhIFJlcXVlc3QgZGF0YS5cbiAgICAgICAgICpcbiAgICAgICAgICogVGhpcyBtZXRob2QgZXhwZWN0cyBhIHN1YnNldCBvZiBtb2RlbCBwcm9wZXJ0aWVzIGFzIHJlcXVlc3QgcGFyYW1ldGVycy5cbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHtmdW5jdGlvbihBcnJheS48T2JqZWN0PixPYmplY3QpPX0gc3VjY2Vzc0NiXG4gICAgICAgICAqICAgU3VjY2VzcyBjYWxsYmFjayB3aXRoIHR3byBhcmd1bWVudHM6IGB2YWx1ZWAsIGByZXNwb25zZUhlYWRlcnNgLlxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0ge2Z1bmN0aW9uKE9iamVjdCk9fSBlcnJvckNiIEVycm9yIGNhbGxiYWNrIHdpdGggb25lIGFyZ3VtZW50OlxuICAgICAgICAgKiAgIGBodHRwUmVzcG9uc2VgLlxuICAgICAgICAgKlxuICAgICAgICAgKiBAcmV0dXJucyB7QXJyYXkuPE9iamVjdD59IEFuIGVtcHR5IHJlZmVyZW5jZSB0aGF0IHdpbGwgYmVcbiAgICAgICAgICogICBwb3B1bGF0ZWQgd2l0aCB0aGUgYWN0dWFsIGRhdGEgb25jZSB0aGUgcmVzcG9uc2UgaXMgcmV0dXJuZWRcbiAgICAgICAgICogICBmcm9tIHRoZSBzZXJ2ZXIuXG4gICAgICAgICAqXG4gICAgICAgICAqIDxlbT5cbiAgICAgICAgICogKFRoZSByZW1vdGUgbWV0aG9kIGRlZmluaXRpb24gZG9lcyBub3QgcHJvdmlkZSBhbnkgZGVzY3JpcHRpb24uXG4gICAgICAgICAqIFRoaXMgdXN1YWxseSBtZWFucyB0aGUgcmVzcG9uc2UgaXMgYSBgQ291bnRyeWAgb2JqZWN0LilcbiAgICAgICAgICogPC9lbT5cbiAgICAgICAgICovXG4gICAgICAgIFwiY3JlYXRlTWFueVwiOiB7XG4gICAgICAgICAgaXNBcnJheTogdHJ1ZSxcbiAgICAgICAgICB1cmw6IHVybEJhc2UgKyBcIi9jb3VudHJpZXNcIixcbiAgICAgICAgICBtZXRob2Q6IFwiUE9TVFwiXG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEBuZ2RvYyBtZXRob2RcbiAgICAgICAgICogQG5hbWUgbGJTZXJ2aWNlcy5Db3VudHJ5I3Vwc2VydFxuICAgICAgICAgKiBAbWV0aG9kT2YgbGJTZXJ2aWNlcy5Db3VudHJ5XG4gICAgICAgICAqXG4gICAgICAgICAqIEBkZXNjcmlwdGlvblxuICAgICAgICAgKlxuICAgICAgICAgKiBVcGRhdGUgYW4gZXhpc3RpbmcgbW9kZWwgaW5zdGFuY2Ugb3IgaW5zZXJ0IGEgbmV3IG9uZSBpbnRvIHRoZSBkYXRhIHNvdXJjZS5cbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHtPYmplY3Q9fSBwYXJhbWV0ZXJzIFJlcXVlc3QgcGFyYW1ldGVycy5cbiAgICAgICAgICpcbiAgICAgICAgICogICBUaGlzIG1ldGhvZCBkb2VzIG5vdCBhY2NlcHQgYW55IHBhcmFtZXRlcnMuXG4gICAgICAgICAqICAgU3VwcGx5IGFuIGVtcHR5IG9iamVjdCBvciBvbWl0IHRoaXMgYXJndW1lbnQgYWx0b2dldGhlci5cbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IHBvc3REYXRhIFJlcXVlc3QgZGF0YS5cbiAgICAgICAgICpcbiAgICAgICAgICogVGhpcyBtZXRob2QgZXhwZWN0cyBhIHN1YnNldCBvZiBtb2RlbCBwcm9wZXJ0aWVzIGFzIHJlcXVlc3QgcGFyYW1ldGVycy5cbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHtmdW5jdGlvbihPYmplY3QsT2JqZWN0KT19IHN1Y2Nlc3NDYlxuICAgICAgICAgKiAgIFN1Y2Nlc3MgY2FsbGJhY2sgd2l0aCB0d28gYXJndW1lbnRzOiBgdmFsdWVgLCBgcmVzcG9uc2VIZWFkZXJzYC5cbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHtmdW5jdGlvbihPYmplY3QpPX0gZXJyb3JDYiBFcnJvciBjYWxsYmFjayB3aXRoIG9uZSBhcmd1bWVudDpcbiAgICAgICAgICogICBgaHR0cFJlc3BvbnNlYC5cbiAgICAgICAgICpcbiAgICAgICAgICogQHJldHVybnMge09iamVjdH0gQW4gZW1wdHkgcmVmZXJlbmNlIHRoYXQgd2lsbCBiZVxuICAgICAgICAgKiAgIHBvcHVsYXRlZCB3aXRoIHRoZSBhY3R1YWwgZGF0YSBvbmNlIHRoZSByZXNwb25zZSBpcyByZXR1cm5lZFxuICAgICAgICAgKiAgIGZyb20gdGhlIHNlcnZlci5cbiAgICAgICAgICpcbiAgICAgICAgICogPGVtPlxuICAgICAgICAgKiAoVGhlIHJlbW90ZSBtZXRob2QgZGVmaW5pdGlvbiBkb2VzIG5vdCBwcm92aWRlIGFueSBkZXNjcmlwdGlvbi5cbiAgICAgICAgICogVGhpcyB1c3VhbGx5IG1lYW5zIHRoZSByZXNwb25zZSBpcyBhIGBDb3VudHJ5YCBvYmplY3QuKVxuICAgICAgICAgKiA8L2VtPlxuICAgICAgICAgKi9cbiAgICAgICAgXCJ1cHNlcnRcIjoge1xuICAgICAgICAgIHVybDogdXJsQmFzZSArIFwiL2NvdW50cmllc1wiLFxuICAgICAgICAgIG1ldGhvZDogXCJQVVRcIlxuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAbmdkb2MgbWV0aG9kXG4gICAgICAgICAqIEBuYW1lIGxiU2VydmljZXMuQ291bnRyeSNleGlzdHNcbiAgICAgICAgICogQG1ldGhvZE9mIGxiU2VydmljZXMuQ291bnRyeVxuICAgICAgICAgKlxuICAgICAgICAgKiBAZGVzY3JpcHRpb25cbiAgICAgICAgICpcbiAgICAgICAgICogQ2hlY2sgd2hldGhlciBhIG1vZGVsIGluc3RhbmNlIGV4aXN0cyBpbiB0aGUgZGF0YSBzb3VyY2UuXG4gICAgICAgICAqXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0PX0gcGFyYW1ldGVycyBSZXF1ZXN0IHBhcmFtZXRlcnMuXG4gICAgICAgICAqXG4gICAgICAgICAqICAtIGBpZGAg4oCTIGB7Kn1gIC0gTW9kZWwgaWRcbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHtmdW5jdGlvbihPYmplY3QsT2JqZWN0KT19IHN1Y2Nlc3NDYlxuICAgICAgICAgKiAgIFN1Y2Nlc3MgY2FsbGJhY2sgd2l0aCB0d28gYXJndW1lbnRzOiBgdmFsdWVgLCBgcmVzcG9uc2VIZWFkZXJzYC5cbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHtmdW5jdGlvbihPYmplY3QpPX0gZXJyb3JDYiBFcnJvciBjYWxsYmFjayB3aXRoIG9uZSBhcmd1bWVudDpcbiAgICAgICAgICogICBgaHR0cFJlc3BvbnNlYC5cbiAgICAgICAgICpcbiAgICAgICAgICogQHJldHVybnMge09iamVjdH0gQW4gZW1wdHkgcmVmZXJlbmNlIHRoYXQgd2lsbCBiZVxuICAgICAgICAgKiAgIHBvcHVsYXRlZCB3aXRoIHRoZSBhY3R1YWwgZGF0YSBvbmNlIHRoZSByZXNwb25zZSBpcyByZXR1cm5lZFxuICAgICAgICAgKiAgIGZyb20gdGhlIHNlcnZlci5cbiAgICAgICAgICpcbiAgICAgICAgICogRGF0YSBwcm9wZXJ0aWVzOlxuICAgICAgICAgKlxuICAgICAgICAgKiAgLSBgZXhpc3RzYCDigJMgYHtib29sZWFuPX1gIC0gXG4gICAgICAgICAqL1xuICAgICAgICBcImV4aXN0c1wiOiB7XG4gICAgICAgICAgdXJsOiB1cmxCYXNlICsgXCIvY291bnRyaWVzLzppZC9leGlzdHNcIixcbiAgICAgICAgICBtZXRob2Q6IFwiR0VUXCJcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogQG5nZG9jIG1ldGhvZFxuICAgICAgICAgKiBAbmFtZSBsYlNlcnZpY2VzLkNvdW50cnkjZmluZEJ5SWRcbiAgICAgICAgICogQG1ldGhvZE9mIGxiU2VydmljZXMuQ291bnRyeVxuICAgICAgICAgKlxuICAgICAgICAgKiBAZGVzY3JpcHRpb25cbiAgICAgICAgICpcbiAgICAgICAgICogRmluZCBhIG1vZGVsIGluc3RhbmNlIGJ5IGlkIGZyb20gdGhlIGRhdGEgc291cmNlLlxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdD19IHBhcmFtZXRlcnMgUmVxdWVzdCBwYXJhbWV0ZXJzLlxuICAgICAgICAgKlxuICAgICAgICAgKiAgLSBgaWRgIOKAkyBgeyp9YCAtIE1vZGVsIGlkXG4gICAgICAgICAqXG4gICAgICAgICAqICAtIGBmaWx0ZXJgIOKAkyBge29iamVjdD19YCAtIEZpbHRlciBkZWZpbmluZyBmaWVsZHMgYW5kIGluY2x1ZGVcbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHtmdW5jdGlvbihPYmplY3QsT2JqZWN0KT19IHN1Y2Nlc3NDYlxuICAgICAgICAgKiAgIFN1Y2Nlc3MgY2FsbGJhY2sgd2l0aCB0d28gYXJndW1lbnRzOiBgdmFsdWVgLCBgcmVzcG9uc2VIZWFkZXJzYC5cbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHtmdW5jdGlvbihPYmplY3QpPX0gZXJyb3JDYiBFcnJvciBjYWxsYmFjayB3aXRoIG9uZSBhcmd1bWVudDpcbiAgICAgICAgICogICBgaHR0cFJlc3BvbnNlYC5cbiAgICAgICAgICpcbiAgICAgICAgICogQHJldHVybnMge09iamVjdH0gQW4gZW1wdHkgcmVmZXJlbmNlIHRoYXQgd2lsbCBiZVxuICAgICAgICAgKiAgIHBvcHVsYXRlZCB3aXRoIHRoZSBhY3R1YWwgZGF0YSBvbmNlIHRoZSByZXNwb25zZSBpcyByZXR1cm5lZFxuICAgICAgICAgKiAgIGZyb20gdGhlIHNlcnZlci5cbiAgICAgICAgICpcbiAgICAgICAgICogPGVtPlxuICAgICAgICAgKiAoVGhlIHJlbW90ZSBtZXRob2QgZGVmaW5pdGlvbiBkb2VzIG5vdCBwcm92aWRlIGFueSBkZXNjcmlwdGlvbi5cbiAgICAgICAgICogVGhpcyB1c3VhbGx5IG1lYW5zIHRoZSByZXNwb25zZSBpcyBhIGBDb3VudHJ5YCBvYmplY3QuKVxuICAgICAgICAgKiA8L2VtPlxuICAgICAgICAgKi9cbiAgICAgICAgXCJmaW5kQnlJZFwiOiB7XG4gICAgICAgICAgdXJsOiB1cmxCYXNlICsgXCIvY291bnRyaWVzLzppZFwiLFxuICAgICAgICAgIG1ldGhvZDogXCJHRVRcIlxuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAbmdkb2MgbWV0aG9kXG4gICAgICAgICAqIEBuYW1lIGxiU2VydmljZXMuQ291bnRyeSNmaW5kXG4gICAgICAgICAqIEBtZXRob2RPZiBsYlNlcnZpY2VzLkNvdW50cnlcbiAgICAgICAgICpcbiAgICAgICAgICogQGRlc2NyaXB0aW9uXG4gICAgICAgICAqXG4gICAgICAgICAqIEZpbmQgYWxsIGluc3RhbmNlcyBvZiB0aGUgbW9kZWwgbWF0Y2hlZCBieSBmaWx0ZXIgZnJvbSB0aGUgZGF0YSBzb3VyY2UuXG4gICAgICAgICAqXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0PX0gcGFyYW1ldGVycyBSZXF1ZXN0IHBhcmFtZXRlcnMuXG4gICAgICAgICAqXG4gICAgICAgICAqICAtIGBmaWx0ZXJgIOKAkyBge29iamVjdD19YCAtIEZpbHRlciBkZWZpbmluZyBmaWVsZHMsIHdoZXJlLCBpbmNsdWRlLCBvcmRlciwgb2Zmc2V0LCBhbmQgbGltaXRcbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHtmdW5jdGlvbihBcnJheS48T2JqZWN0PixPYmplY3QpPX0gc3VjY2Vzc0NiXG4gICAgICAgICAqICAgU3VjY2VzcyBjYWxsYmFjayB3aXRoIHR3byBhcmd1bWVudHM6IGB2YWx1ZWAsIGByZXNwb25zZUhlYWRlcnNgLlxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0ge2Z1bmN0aW9uKE9iamVjdCk9fSBlcnJvckNiIEVycm9yIGNhbGxiYWNrIHdpdGggb25lIGFyZ3VtZW50OlxuICAgICAgICAgKiAgIGBodHRwUmVzcG9uc2VgLlxuICAgICAgICAgKlxuICAgICAgICAgKiBAcmV0dXJucyB7QXJyYXkuPE9iamVjdD59IEFuIGVtcHR5IHJlZmVyZW5jZSB0aGF0IHdpbGwgYmVcbiAgICAgICAgICogICBwb3B1bGF0ZWQgd2l0aCB0aGUgYWN0dWFsIGRhdGEgb25jZSB0aGUgcmVzcG9uc2UgaXMgcmV0dXJuZWRcbiAgICAgICAgICogICBmcm9tIHRoZSBzZXJ2ZXIuXG4gICAgICAgICAqXG4gICAgICAgICAqIDxlbT5cbiAgICAgICAgICogKFRoZSByZW1vdGUgbWV0aG9kIGRlZmluaXRpb24gZG9lcyBub3QgcHJvdmlkZSBhbnkgZGVzY3JpcHRpb24uXG4gICAgICAgICAqIFRoaXMgdXN1YWxseSBtZWFucyB0aGUgcmVzcG9uc2UgaXMgYSBgQ291bnRyeWAgb2JqZWN0LilcbiAgICAgICAgICogPC9lbT5cbiAgICAgICAgICovXG4gICAgICAgIFwiZmluZFwiOiB7XG4gICAgICAgICAgaXNBcnJheTogdHJ1ZSxcbiAgICAgICAgICB1cmw6IHVybEJhc2UgKyBcIi9jb3VudHJpZXNcIixcbiAgICAgICAgICBtZXRob2Q6IFwiR0VUXCJcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogQG5nZG9jIG1ldGhvZFxuICAgICAgICAgKiBAbmFtZSBsYlNlcnZpY2VzLkNvdW50cnkjZmluZE9uZVxuICAgICAgICAgKiBAbWV0aG9kT2YgbGJTZXJ2aWNlcy5Db3VudHJ5XG4gICAgICAgICAqXG4gICAgICAgICAqIEBkZXNjcmlwdGlvblxuICAgICAgICAgKlxuICAgICAgICAgKiBGaW5kIGZpcnN0IGluc3RhbmNlIG9mIHRoZSBtb2RlbCBtYXRjaGVkIGJ5IGZpbHRlciBmcm9tIHRoZSBkYXRhIHNvdXJjZS5cbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHtPYmplY3Q9fSBwYXJhbWV0ZXJzIFJlcXVlc3QgcGFyYW1ldGVycy5cbiAgICAgICAgICpcbiAgICAgICAgICogIC0gYGZpbHRlcmAg4oCTIGB7b2JqZWN0PX1gIC0gRmlsdGVyIGRlZmluaW5nIGZpZWxkcywgd2hlcmUsIGluY2x1ZGUsIG9yZGVyLCBvZmZzZXQsIGFuZCBsaW1pdFxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0ge2Z1bmN0aW9uKE9iamVjdCxPYmplY3QpPX0gc3VjY2Vzc0NiXG4gICAgICAgICAqICAgU3VjY2VzcyBjYWxsYmFjayB3aXRoIHR3byBhcmd1bWVudHM6IGB2YWx1ZWAsIGByZXNwb25zZUhlYWRlcnNgLlxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0ge2Z1bmN0aW9uKE9iamVjdCk9fSBlcnJvckNiIEVycm9yIGNhbGxiYWNrIHdpdGggb25lIGFyZ3VtZW50OlxuICAgICAgICAgKiAgIGBodHRwUmVzcG9uc2VgLlxuICAgICAgICAgKlxuICAgICAgICAgKiBAcmV0dXJucyB7T2JqZWN0fSBBbiBlbXB0eSByZWZlcmVuY2UgdGhhdCB3aWxsIGJlXG4gICAgICAgICAqICAgcG9wdWxhdGVkIHdpdGggdGhlIGFjdHVhbCBkYXRhIG9uY2UgdGhlIHJlc3BvbnNlIGlzIHJldHVybmVkXG4gICAgICAgICAqICAgZnJvbSB0aGUgc2VydmVyLlxuICAgICAgICAgKlxuICAgICAgICAgKiA8ZW0+XG4gICAgICAgICAqIChUaGUgcmVtb3RlIG1ldGhvZCBkZWZpbml0aW9uIGRvZXMgbm90IHByb3ZpZGUgYW55IGRlc2NyaXB0aW9uLlxuICAgICAgICAgKiBUaGlzIHVzdWFsbHkgbWVhbnMgdGhlIHJlc3BvbnNlIGlzIGEgYENvdW50cnlgIG9iamVjdC4pXG4gICAgICAgICAqIDwvZW0+XG4gICAgICAgICAqL1xuICAgICAgICBcImZpbmRPbmVcIjoge1xuICAgICAgICAgIHVybDogdXJsQmFzZSArIFwiL2NvdW50cmllcy9maW5kT25lXCIsXG4gICAgICAgICAgbWV0aG9kOiBcIkdFVFwiXG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEBuZ2RvYyBtZXRob2RcbiAgICAgICAgICogQG5hbWUgbGJTZXJ2aWNlcy5Db3VudHJ5I3VwZGF0ZUFsbFxuICAgICAgICAgKiBAbWV0aG9kT2YgbGJTZXJ2aWNlcy5Db3VudHJ5XG4gICAgICAgICAqXG4gICAgICAgICAqIEBkZXNjcmlwdGlvblxuICAgICAgICAgKlxuICAgICAgICAgKiBVcGRhdGUgaW5zdGFuY2VzIG9mIHRoZSBtb2RlbCBtYXRjaGVkIGJ5IHdoZXJlIGZyb20gdGhlIGRhdGEgc291cmNlLlxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdD19IHBhcmFtZXRlcnMgUmVxdWVzdCBwYXJhbWV0ZXJzLlxuICAgICAgICAgKlxuICAgICAgICAgKiAgLSBgd2hlcmVgIOKAkyBge29iamVjdD19YCAtIENyaXRlcmlhIHRvIG1hdGNoIG1vZGVsIGluc3RhbmNlc1xuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gcG9zdERhdGEgUmVxdWVzdCBkYXRhLlxuICAgICAgICAgKlxuICAgICAgICAgKiBUaGlzIG1ldGhvZCBleHBlY3RzIGEgc3Vic2V0IG9mIG1vZGVsIHByb3BlcnRpZXMgYXMgcmVxdWVzdCBwYXJhbWV0ZXJzLlxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0ge2Z1bmN0aW9uKE9iamVjdCxPYmplY3QpPX0gc3VjY2Vzc0NiXG4gICAgICAgICAqICAgU3VjY2VzcyBjYWxsYmFjayB3aXRoIHR3byBhcmd1bWVudHM6IGB2YWx1ZWAsIGByZXNwb25zZUhlYWRlcnNgLlxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0ge2Z1bmN0aW9uKE9iamVjdCk9fSBlcnJvckNiIEVycm9yIGNhbGxiYWNrIHdpdGggb25lIGFyZ3VtZW50OlxuICAgICAgICAgKiAgIGBodHRwUmVzcG9uc2VgLlxuICAgICAgICAgKlxuICAgICAgICAgKiBAcmV0dXJucyB7T2JqZWN0fSBBbiBlbXB0eSByZWZlcmVuY2UgdGhhdCB3aWxsIGJlXG4gICAgICAgICAqICAgcG9wdWxhdGVkIHdpdGggdGhlIGFjdHVhbCBkYXRhIG9uY2UgdGhlIHJlc3BvbnNlIGlzIHJldHVybmVkXG4gICAgICAgICAqICAgZnJvbSB0aGUgc2VydmVyLlxuICAgICAgICAgKlxuICAgICAgICAgKiBUaGUgbnVtYmVyIG9mIGluc3RhbmNlcyB1cGRhdGVkXG4gICAgICAgICAqL1xuICAgICAgICBcInVwZGF0ZUFsbFwiOiB7XG4gICAgICAgICAgdXJsOiB1cmxCYXNlICsgXCIvY291bnRyaWVzL3VwZGF0ZVwiLFxuICAgICAgICAgIG1ldGhvZDogXCJQT1NUXCJcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogQG5nZG9jIG1ldGhvZFxuICAgICAgICAgKiBAbmFtZSBsYlNlcnZpY2VzLkNvdW50cnkjZGVsZXRlQnlJZFxuICAgICAgICAgKiBAbWV0aG9kT2YgbGJTZXJ2aWNlcy5Db3VudHJ5XG4gICAgICAgICAqXG4gICAgICAgICAqIEBkZXNjcmlwdGlvblxuICAgICAgICAgKlxuICAgICAgICAgKiBEZWxldGUgYSBtb2RlbCBpbnN0YW5jZSBieSBpZCBmcm9tIHRoZSBkYXRhIHNvdXJjZS5cbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHtPYmplY3Q9fSBwYXJhbWV0ZXJzIFJlcXVlc3QgcGFyYW1ldGVycy5cbiAgICAgICAgICpcbiAgICAgICAgICogIC0gYGlkYCDigJMgYHsqfWAgLSBNb2RlbCBpZFxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0ge2Z1bmN0aW9uKE9iamVjdCxPYmplY3QpPX0gc3VjY2Vzc0NiXG4gICAgICAgICAqICAgU3VjY2VzcyBjYWxsYmFjayB3aXRoIHR3byBhcmd1bWVudHM6IGB2YWx1ZWAsIGByZXNwb25zZUhlYWRlcnNgLlxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0ge2Z1bmN0aW9uKE9iamVjdCk9fSBlcnJvckNiIEVycm9yIGNhbGxiYWNrIHdpdGggb25lIGFyZ3VtZW50OlxuICAgICAgICAgKiAgIGBodHRwUmVzcG9uc2VgLlxuICAgICAgICAgKlxuICAgICAgICAgKiBAcmV0dXJucyB7T2JqZWN0fSBBbiBlbXB0eSByZWZlcmVuY2UgdGhhdCB3aWxsIGJlXG4gICAgICAgICAqICAgcG9wdWxhdGVkIHdpdGggdGhlIGFjdHVhbCBkYXRhIG9uY2UgdGhlIHJlc3BvbnNlIGlzIHJldHVybmVkXG4gICAgICAgICAqICAgZnJvbSB0aGUgc2VydmVyLlxuICAgICAgICAgKlxuICAgICAgICAgKiA8ZW0+XG4gICAgICAgICAqIChUaGUgcmVtb3RlIG1ldGhvZCBkZWZpbml0aW9uIGRvZXMgbm90IHByb3ZpZGUgYW55IGRlc2NyaXB0aW9uLlxuICAgICAgICAgKiBUaGlzIHVzdWFsbHkgbWVhbnMgdGhlIHJlc3BvbnNlIGlzIGEgYENvdW50cnlgIG9iamVjdC4pXG4gICAgICAgICAqIDwvZW0+XG4gICAgICAgICAqL1xuICAgICAgICBcImRlbGV0ZUJ5SWRcIjoge1xuICAgICAgICAgIHVybDogdXJsQmFzZSArIFwiL2NvdW50cmllcy86aWRcIixcbiAgICAgICAgICBtZXRob2Q6IFwiREVMRVRFXCJcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogQG5nZG9jIG1ldGhvZFxuICAgICAgICAgKiBAbmFtZSBsYlNlcnZpY2VzLkNvdW50cnkjY291bnRcbiAgICAgICAgICogQG1ldGhvZE9mIGxiU2VydmljZXMuQ291bnRyeVxuICAgICAgICAgKlxuICAgICAgICAgKiBAZGVzY3JpcHRpb25cbiAgICAgICAgICpcbiAgICAgICAgICogQ291bnQgaW5zdGFuY2VzIG9mIHRoZSBtb2RlbCBtYXRjaGVkIGJ5IHdoZXJlIGZyb20gdGhlIGRhdGEgc291cmNlLlxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdD19IHBhcmFtZXRlcnMgUmVxdWVzdCBwYXJhbWV0ZXJzLlxuICAgICAgICAgKlxuICAgICAgICAgKiAgLSBgd2hlcmVgIOKAkyBge29iamVjdD19YCAtIENyaXRlcmlhIHRvIG1hdGNoIG1vZGVsIGluc3RhbmNlc1xuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0ge2Z1bmN0aW9uKE9iamVjdCxPYmplY3QpPX0gc3VjY2Vzc0NiXG4gICAgICAgICAqICAgU3VjY2VzcyBjYWxsYmFjayB3aXRoIHR3byBhcmd1bWVudHM6IGB2YWx1ZWAsIGByZXNwb25zZUhlYWRlcnNgLlxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0ge2Z1bmN0aW9uKE9iamVjdCk9fSBlcnJvckNiIEVycm9yIGNhbGxiYWNrIHdpdGggb25lIGFyZ3VtZW50OlxuICAgICAgICAgKiAgIGBodHRwUmVzcG9uc2VgLlxuICAgICAgICAgKlxuICAgICAgICAgKiBAcmV0dXJucyB7T2JqZWN0fSBBbiBlbXB0eSByZWZlcmVuY2UgdGhhdCB3aWxsIGJlXG4gICAgICAgICAqICAgcG9wdWxhdGVkIHdpdGggdGhlIGFjdHVhbCBkYXRhIG9uY2UgdGhlIHJlc3BvbnNlIGlzIHJldHVybmVkXG4gICAgICAgICAqICAgZnJvbSB0aGUgc2VydmVyLlxuICAgICAgICAgKlxuICAgICAgICAgKiBEYXRhIHByb3BlcnRpZXM6XG4gICAgICAgICAqXG4gICAgICAgICAqICAtIGBjb3VudGAg4oCTIGB7bnVtYmVyPX1gIC0gXG4gICAgICAgICAqL1xuICAgICAgICBcImNvdW50XCI6IHtcbiAgICAgICAgICB1cmw6IHVybEJhc2UgKyBcIi9jb3VudHJpZXMvY291bnRcIixcbiAgICAgICAgICBtZXRob2Q6IFwiR0VUXCJcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogQG5nZG9jIG1ldGhvZFxuICAgICAgICAgKiBAbmFtZSBsYlNlcnZpY2VzLkNvdW50cnkjcHJvdG90eXBlJHVwZGF0ZUF0dHJpYnV0ZXNcbiAgICAgICAgICogQG1ldGhvZE9mIGxiU2VydmljZXMuQ291bnRyeVxuICAgICAgICAgKlxuICAgICAgICAgKiBAZGVzY3JpcHRpb25cbiAgICAgICAgICpcbiAgICAgICAgICogVXBkYXRlIGF0dHJpYnV0ZXMgZm9yIGEgbW9kZWwgaW5zdGFuY2UgYW5kIHBlcnNpc3QgaXQgaW50byB0aGUgZGF0YSBzb3VyY2UuXG4gICAgICAgICAqXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0PX0gcGFyYW1ldGVycyBSZXF1ZXN0IHBhcmFtZXRlcnMuXG4gICAgICAgICAqXG4gICAgICAgICAqICAtIGBpZGAg4oCTIGB7Kn1gIC0gUGVyc2lzdGVkTW9kZWwgaWRcbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IHBvc3REYXRhIFJlcXVlc3QgZGF0YS5cbiAgICAgICAgICpcbiAgICAgICAgICogVGhpcyBtZXRob2QgZXhwZWN0cyBhIHN1YnNldCBvZiBtb2RlbCBwcm9wZXJ0aWVzIGFzIHJlcXVlc3QgcGFyYW1ldGVycy5cbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHtmdW5jdGlvbihPYmplY3QsT2JqZWN0KT19IHN1Y2Nlc3NDYlxuICAgICAgICAgKiAgIFN1Y2Nlc3MgY2FsbGJhY2sgd2l0aCB0d28gYXJndW1lbnRzOiBgdmFsdWVgLCBgcmVzcG9uc2VIZWFkZXJzYC5cbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHtmdW5jdGlvbihPYmplY3QpPX0gZXJyb3JDYiBFcnJvciBjYWxsYmFjayB3aXRoIG9uZSBhcmd1bWVudDpcbiAgICAgICAgICogICBgaHR0cFJlc3BvbnNlYC5cbiAgICAgICAgICpcbiAgICAgICAgICogQHJldHVybnMge09iamVjdH0gQW4gZW1wdHkgcmVmZXJlbmNlIHRoYXQgd2lsbCBiZVxuICAgICAgICAgKiAgIHBvcHVsYXRlZCB3aXRoIHRoZSBhY3R1YWwgZGF0YSBvbmNlIHRoZSByZXNwb25zZSBpcyByZXR1cm5lZFxuICAgICAgICAgKiAgIGZyb20gdGhlIHNlcnZlci5cbiAgICAgICAgICpcbiAgICAgICAgICogPGVtPlxuICAgICAgICAgKiAoVGhlIHJlbW90ZSBtZXRob2QgZGVmaW5pdGlvbiBkb2VzIG5vdCBwcm92aWRlIGFueSBkZXNjcmlwdGlvbi5cbiAgICAgICAgICogVGhpcyB1c3VhbGx5IG1lYW5zIHRoZSByZXNwb25zZSBpcyBhIGBDb3VudHJ5YCBvYmplY3QuKVxuICAgICAgICAgKiA8L2VtPlxuICAgICAgICAgKi9cbiAgICAgICAgXCJwcm90b3R5cGUkdXBkYXRlQXR0cmlidXRlc1wiOiB7XG4gICAgICAgICAgdXJsOiB1cmxCYXNlICsgXCIvY291bnRyaWVzLzppZFwiLFxuICAgICAgICAgIG1ldGhvZDogXCJQVVRcIlxuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAbmdkb2MgbWV0aG9kXG4gICAgICAgICAqIEBuYW1lIGxiU2VydmljZXMuQ291bnRyeSNjcmVhdGVDaGFuZ2VTdHJlYW1cbiAgICAgICAgICogQG1ldGhvZE9mIGxiU2VydmljZXMuQ291bnRyeVxuICAgICAgICAgKlxuICAgICAgICAgKiBAZGVzY3JpcHRpb25cbiAgICAgICAgICpcbiAgICAgICAgICogQ3JlYXRlIGEgY2hhbmdlIHN0cmVhbS5cbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHtPYmplY3Q9fSBwYXJhbWV0ZXJzIFJlcXVlc3QgcGFyYW1ldGVycy5cbiAgICAgICAgICpcbiAgICAgICAgICogICBUaGlzIG1ldGhvZCBkb2VzIG5vdCBhY2NlcHQgYW55IHBhcmFtZXRlcnMuXG4gICAgICAgICAqICAgU3VwcGx5IGFuIGVtcHR5IG9iamVjdCBvciBvbWl0IHRoaXMgYXJndW1lbnQgYWx0b2dldGhlci5cbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IHBvc3REYXRhIFJlcXVlc3QgZGF0YS5cbiAgICAgICAgICpcbiAgICAgICAgICogIC0gYG9wdGlvbnNgIOKAkyBge29iamVjdD19YCAtIFxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0ge2Z1bmN0aW9uKE9iamVjdCxPYmplY3QpPX0gc3VjY2Vzc0NiXG4gICAgICAgICAqICAgU3VjY2VzcyBjYWxsYmFjayB3aXRoIHR3byBhcmd1bWVudHM6IGB2YWx1ZWAsIGByZXNwb25zZUhlYWRlcnNgLlxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0ge2Z1bmN0aW9uKE9iamVjdCk9fSBlcnJvckNiIEVycm9yIGNhbGxiYWNrIHdpdGggb25lIGFyZ3VtZW50OlxuICAgICAgICAgKiAgIGBodHRwUmVzcG9uc2VgLlxuICAgICAgICAgKlxuICAgICAgICAgKiBAcmV0dXJucyB7T2JqZWN0fSBBbiBlbXB0eSByZWZlcmVuY2UgdGhhdCB3aWxsIGJlXG4gICAgICAgICAqICAgcG9wdWxhdGVkIHdpdGggdGhlIGFjdHVhbCBkYXRhIG9uY2UgdGhlIHJlc3BvbnNlIGlzIHJldHVybmVkXG4gICAgICAgICAqICAgZnJvbSB0aGUgc2VydmVyLlxuICAgICAgICAgKlxuICAgICAgICAgKiBEYXRhIHByb3BlcnRpZXM6XG4gICAgICAgICAqXG4gICAgICAgICAqICAtIGBjaGFuZ2VzYCDigJMgYHtSZWFkYWJsZVN0cmVhbT19YCAtIFxuICAgICAgICAgKi9cbiAgICAgICAgXCJjcmVhdGVDaGFuZ2VTdHJlYW1cIjoge1xuICAgICAgICAgIHVybDogdXJsQmFzZSArIFwiL2NvdW50cmllcy9jaGFuZ2Utc3RyZWFtXCIsXG4gICAgICAgICAgbWV0aG9kOiBcIlBPU1RcIlxuICAgICAgICB9LFxuXG4gICAgICAgIC8vIElOVEVSTkFMLiBVc2UgUmVwb3J0LmNvdW50cnkoKSBpbnN0ZWFkLlxuICAgICAgICBcIjo6Z2V0OjpyZXBvcnQ6OmNvdW50cnlcIjoge1xuICAgICAgICAgIHVybDogdXJsQmFzZSArIFwiL3JlcG9ydHMvOmlkL2NvdW50cnlcIixcbiAgICAgICAgICBtZXRob2Q6IFwiR0VUXCJcbiAgICAgICAgfSxcbiAgICAgIH1cbiAgICApO1xuXG5cblxuICAgICAgICAvKipcbiAgICAgICAgICogQG5nZG9jIG1ldGhvZFxuICAgICAgICAgKiBAbmFtZSBsYlNlcnZpY2VzLkNvdW50cnkjdXBkYXRlT3JDcmVhdGVcbiAgICAgICAgICogQG1ldGhvZE9mIGxiU2VydmljZXMuQ291bnRyeVxuICAgICAgICAgKlxuICAgICAgICAgKiBAZGVzY3JpcHRpb25cbiAgICAgICAgICpcbiAgICAgICAgICogVXBkYXRlIGFuIGV4aXN0aW5nIG1vZGVsIGluc3RhbmNlIG9yIGluc2VydCBhIG5ldyBvbmUgaW50byB0aGUgZGF0YSBzb3VyY2UuXG4gICAgICAgICAqXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0PX0gcGFyYW1ldGVycyBSZXF1ZXN0IHBhcmFtZXRlcnMuXG4gICAgICAgICAqXG4gICAgICAgICAqICAgVGhpcyBtZXRob2QgZG9lcyBub3QgYWNjZXB0IGFueSBwYXJhbWV0ZXJzLlxuICAgICAgICAgKiAgIFN1cHBseSBhbiBlbXB0eSBvYmplY3Qgb3Igb21pdCB0aGlzIGFyZ3VtZW50IGFsdG9nZXRoZXIuXG4gICAgICAgICAqXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBwb3N0RGF0YSBSZXF1ZXN0IGRhdGEuXG4gICAgICAgICAqXG4gICAgICAgICAqIFRoaXMgbWV0aG9kIGV4cGVjdHMgYSBzdWJzZXQgb2YgbW9kZWwgcHJvcGVydGllcyBhcyByZXF1ZXN0IHBhcmFtZXRlcnMuXG4gICAgICAgICAqXG4gICAgICAgICAqIEBwYXJhbSB7ZnVuY3Rpb24oT2JqZWN0LE9iamVjdCk9fSBzdWNjZXNzQ2JcbiAgICAgICAgICogICBTdWNjZXNzIGNhbGxiYWNrIHdpdGggdHdvIGFyZ3VtZW50czogYHZhbHVlYCwgYHJlc3BvbnNlSGVhZGVyc2AuXG4gICAgICAgICAqXG4gICAgICAgICAqIEBwYXJhbSB7ZnVuY3Rpb24oT2JqZWN0KT19IGVycm9yQ2IgRXJyb3IgY2FsbGJhY2sgd2l0aCBvbmUgYXJndW1lbnQ6XG4gICAgICAgICAqICAgYGh0dHBSZXNwb25zZWAuXG4gICAgICAgICAqXG4gICAgICAgICAqIEByZXR1cm5zIHtPYmplY3R9IEFuIGVtcHR5IHJlZmVyZW5jZSB0aGF0IHdpbGwgYmVcbiAgICAgICAgICogICBwb3B1bGF0ZWQgd2l0aCB0aGUgYWN0dWFsIGRhdGEgb25jZSB0aGUgcmVzcG9uc2UgaXMgcmV0dXJuZWRcbiAgICAgICAgICogICBmcm9tIHRoZSBzZXJ2ZXIuXG4gICAgICAgICAqXG4gICAgICAgICAqIDxlbT5cbiAgICAgICAgICogKFRoZSByZW1vdGUgbWV0aG9kIGRlZmluaXRpb24gZG9lcyBub3QgcHJvdmlkZSBhbnkgZGVzY3JpcHRpb24uXG4gICAgICAgICAqIFRoaXMgdXN1YWxseSBtZWFucyB0aGUgcmVzcG9uc2UgaXMgYSBgQ291bnRyeWAgb2JqZWN0LilcbiAgICAgICAgICogPC9lbT5cbiAgICAgICAgICovXG4gICAgICAgIFJbXCJ1cGRhdGVPckNyZWF0ZVwiXSA9IFJbXCJ1cHNlcnRcIl07XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEBuZ2RvYyBtZXRob2RcbiAgICAgICAgICogQG5hbWUgbGJTZXJ2aWNlcy5Db3VudHJ5I3VwZGF0ZVxuICAgICAgICAgKiBAbWV0aG9kT2YgbGJTZXJ2aWNlcy5Db3VudHJ5XG4gICAgICAgICAqXG4gICAgICAgICAqIEBkZXNjcmlwdGlvblxuICAgICAgICAgKlxuICAgICAgICAgKiBVcGRhdGUgaW5zdGFuY2VzIG9mIHRoZSBtb2RlbCBtYXRjaGVkIGJ5IHdoZXJlIGZyb20gdGhlIGRhdGEgc291cmNlLlxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdD19IHBhcmFtZXRlcnMgUmVxdWVzdCBwYXJhbWV0ZXJzLlxuICAgICAgICAgKlxuICAgICAgICAgKiAgLSBgd2hlcmVgIOKAkyBge29iamVjdD19YCAtIENyaXRlcmlhIHRvIG1hdGNoIG1vZGVsIGluc3RhbmNlc1xuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gcG9zdERhdGEgUmVxdWVzdCBkYXRhLlxuICAgICAgICAgKlxuICAgICAgICAgKiBUaGlzIG1ldGhvZCBleHBlY3RzIGEgc3Vic2V0IG9mIG1vZGVsIHByb3BlcnRpZXMgYXMgcmVxdWVzdCBwYXJhbWV0ZXJzLlxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0ge2Z1bmN0aW9uKE9iamVjdCxPYmplY3QpPX0gc3VjY2Vzc0NiXG4gICAgICAgICAqICAgU3VjY2VzcyBjYWxsYmFjayB3aXRoIHR3byBhcmd1bWVudHM6IGB2YWx1ZWAsIGByZXNwb25zZUhlYWRlcnNgLlxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0ge2Z1bmN0aW9uKE9iamVjdCk9fSBlcnJvckNiIEVycm9yIGNhbGxiYWNrIHdpdGggb25lIGFyZ3VtZW50OlxuICAgICAgICAgKiAgIGBodHRwUmVzcG9uc2VgLlxuICAgICAgICAgKlxuICAgICAgICAgKiBAcmV0dXJucyB7T2JqZWN0fSBBbiBlbXB0eSByZWZlcmVuY2UgdGhhdCB3aWxsIGJlXG4gICAgICAgICAqICAgcG9wdWxhdGVkIHdpdGggdGhlIGFjdHVhbCBkYXRhIG9uY2UgdGhlIHJlc3BvbnNlIGlzIHJldHVybmVkXG4gICAgICAgICAqICAgZnJvbSB0aGUgc2VydmVyLlxuICAgICAgICAgKlxuICAgICAgICAgKiBUaGUgbnVtYmVyIG9mIGluc3RhbmNlcyB1cGRhdGVkXG4gICAgICAgICAqL1xuICAgICAgICBSW1widXBkYXRlXCJdID0gUltcInVwZGF0ZUFsbFwiXTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogQG5nZG9jIG1ldGhvZFxuICAgICAgICAgKiBAbmFtZSBsYlNlcnZpY2VzLkNvdW50cnkjZGVzdHJveUJ5SWRcbiAgICAgICAgICogQG1ldGhvZE9mIGxiU2VydmljZXMuQ291bnRyeVxuICAgICAgICAgKlxuICAgICAgICAgKiBAZGVzY3JpcHRpb25cbiAgICAgICAgICpcbiAgICAgICAgICogRGVsZXRlIGEgbW9kZWwgaW5zdGFuY2UgYnkgaWQgZnJvbSB0aGUgZGF0YSBzb3VyY2UuXG4gICAgICAgICAqXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0PX0gcGFyYW1ldGVycyBSZXF1ZXN0IHBhcmFtZXRlcnMuXG4gICAgICAgICAqXG4gICAgICAgICAqICAtIGBpZGAg4oCTIGB7Kn1gIC0gTW9kZWwgaWRcbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHtmdW5jdGlvbihPYmplY3QsT2JqZWN0KT19IHN1Y2Nlc3NDYlxuICAgICAgICAgKiAgIFN1Y2Nlc3MgY2FsbGJhY2sgd2l0aCB0d28gYXJndW1lbnRzOiBgdmFsdWVgLCBgcmVzcG9uc2VIZWFkZXJzYC5cbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHtmdW5jdGlvbihPYmplY3QpPX0gZXJyb3JDYiBFcnJvciBjYWxsYmFjayB3aXRoIG9uZSBhcmd1bWVudDpcbiAgICAgICAgICogICBgaHR0cFJlc3BvbnNlYC5cbiAgICAgICAgICpcbiAgICAgICAgICogQHJldHVybnMge09iamVjdH0gQW4gZW1wdHkgcmVmZXJlbmNlIHRoYXQgd2lsbCBiZVxuICAgICAgICAgKiAgIHBvcHVsYXRlZCB3aXRoIHRoZSBhY3R1YWwgZGF0YSBvbmNlIHRoZSByZXNwb25zZSBpcyByZXR1cm5lZFxuICAgICAgICAgKiAgIGZyb20gdGhlIHNlcnZlci5cbiAgICAgICAgICpcbiAgICAgICAgICogPGVtPlxuICAgICAgICAgKiAoVGhlIHJlbW90ZSBtZXRob2QgZGVmaW5pdGlvbiBkb2VzIG5vdCBwcm92aWRlIGFueSBkZXNjcmlwdGlvbi5cbiAgICAgICAgICogVGhpcyB1c3VhbGx5IG1lYW5zIHRoZSByZXNwb25zZSBpcyBhIGBDb3VudHJ5YCBvYmplY3QuKVxuICAgICAgICAgKiA8L2VtPlxuICAgICAgICAgKi9cbiAgICAgICAgUltcImRlc3Ryb3lCeUlkXCJdID0gUltcImRlbGV0ZUJ5SWRcIl07XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEBuZ2RvYyBtZXRob2RcbiAgICAgICAgICogQG5hbWUgbGJTZXJ2aWNlcy5Db3VudHJ5I3JlbW92ZUJ5SWRcbiAgICAgICAgICogQG1ldGhvZE9mIGxiU2VydmljZXMuQ291bnRyeVxuICAgICAgICAgKlxuICAgICAgICAgKiBAZGVzY3JpcHRpb25cbiAgICAgICAgICpcbiAgICAgICAgICogRGVsZXRlIGEgbW9kZWwgaW5zdGFuY2UgYnkgaWQgZnJvbSB0aGUgZGF0YSBzb3VyY2UuXG4gICAgICAgICAqXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0PX0gcGFyYW1ldGVycyBSZXF1ZXN0IHBhcmFtZXRlcnMuXG4gICAgICAgICAqXG4gICAgICAgICAqICAtIGBpZGAg4oCTIGB7Kn1gIC0gTW9kZWwgaWRcbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHtmdW5jdGlvbihPYmplY3QsT2JqZWN0KT19IHN1Y2Nlc3NDYlxuICAgICAgICAgKiAgIFN1Y2Nlc3MgY2FsbGJhY2sgd2l0aCB0d28gYXJndW1lbnRzOiBgdmFsdWVgLCBgcmVzcG9uc2VIZWFkZXJzYC5cbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHtmdW5jdGlvbihPYmplY3QpPX0gZXJyb3JDYiBFcnJvciBjYWxsYmFjayB3aXRoIG9uZSBhcmd1bWVudDpcbiAgICAgICAgICogICBgaHR0cFJlc3BvbnNlYC5cbiAgICAgICAgICpcbiAgICAgICAgICogQHJldHVybnMge09iamVjdH0gQW4gZW1wdHkgcmVmZXJlbmNlIHRoYXQgd2lsbCBiZVxuICAgICAgICAgKiAgIHBvcHVsYXRlZCB3aXRoIHRoZSBhY3R1YWwgZGF0YSBvbmNlIHRoZSByZXNwb25zZSBpcyByZXR1cm5lZFxuICAgICAgICAgKiAgIGZyb20gdGhlIHNlcnZlci5cbiAgICAgICAgICpcbiAgICAgICAgICogPGVtPlxuICAgICAgICAgKiAoVGhlIHJlbW90ZSBtZXRob2QgZGVmaW5pdGlvbiBkb2VzIG5vdCBwcm92aWRlIGFueSBkZXNjcmlwdGlvbi5cbiAgICAgICAgICogVGhpcyB1c3VhbGx5IG1lYW5zIHRoZSByZXNwb25zZSBpcyBhIGBDb3VudHJ5YCBvYmplY3QuKVxuICAgICAgICAgKiA8L2VtPlxuICAgICAgICAgKi9cbiAgICAgICAgUltcInJlbW92ZUJ5SWRcIl0gPSBSW1wiZGVsZXRlQnlJZFwiXTtcblxuXG4gICAgLyoqXG4gICAgKiBAbmdkb2MgcHJvcGVydHlcbiAgICAqIEBuYW1lIGxiU2VydmljZXMuQ291bnRyeSNtb2RlbE5hbWVcbiAgICAqIEBwcm9wZXJ0eU9mIGxiU2VydmljZXMuQ291bnRyeVxuICAgICogQGRlc2NyaXB0aW9uXG4gICAgKiBUaGUgbmFtZSBvZiB0aGUgbW9kZWwgcmVwcmVzZW50ZWQgYnkgdGhpcyAkcmVzb3VyY2UsXG4gICAgKiBpLmUuIGBDb3VudHJ5YC5cbiAgICAqL1xuICAgIFIubW9kZWxOYW1lID0gXCJDb3VudHJ5XCI7XG5cblxuICAgIHJldHVybiBSO1xuICB9XSk7XG5cbi8qKlxuICogQG5nZG9jIG9iamVjdFxuICogQG5hbWUgbGJTZXJ2aWNlcy5OZXR0ZXN0XG4gKiBAaGVhZGVyIGxiU2VydmljZXMuTmV0dGVzdFxuICogQG9iamVjdFxuICpcbiAqIEBkZXNjcmlwdGlvblxuICpcbiAqIEEgJHJlc291cmNlIG9iamVjdCBmb3IgaW50ZXJhY3Rpbmcgd2l0aCB0aGUgYE5ldHRlc3RgIG1vZGVsLlxuICpcbiAqICMjIEV4YW1wbGVcbiAqXG4gKiBTZWVcbiAqIHtAbGluayBodHRwOi8vZG9jcy5hbmd1bGFyanMub3JnL2FwaS9uZ1Jlc291cmNlLiRyZXNvdXJjZSNleGFtcGxlICRyZXNvdXJjZX1cbiAqIGZvciBhbiBleGFtcGxlIG9mIHVzaW5nIHRoaXMgb2JqZWN0LlxuICpcbiAqL1xubW9kdWxlLmZhY3RvcnkoXG4gIFwiTmV0dGVzdFwiLFxuICBbJ0xvb3BCYWNrUmVzb3VyY2UnLCAnTG9vcEJhY2tBdXRoJywgJyRpbmplY3RvcicsIGZ1bmN0aW9uKFJlc291cmNlLCBMb29wQmFja0F1dGgsICRpbmplY3Rvcikge1xuICAgIHZhciBSID0gUmVzb3VyY2UoXG4gICAgICB1cmxCYXNlICsgXCIvbmV0dGVzdHMvOmlkXCIsXG4gICAgICB7ICdpZCc6ICdAaWQnIH0sXG4gICAgICB7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEBuZ2RvYyBtZXRob2RcbiAgICAgICAgICogQG5hbWUgbGJTZXJ2aWNlcy5OZXR0ZXN0I2NyZWF0ZVxuICAgICAgICAgKiBAbWV0aG9kT2YgbGJTZXJ2aWNlcy5OZXR0ZXN0XG4gICAgICAgICAqXG4gICAgICAgICAqIEBkZXNjcmlwdGlvblxuICAgICAgICAgKlxuICAgICAgICAgKiBDcmVhdGUgYSBuZXcgaW5zdGFuY2Ugb2YgdGhlIG1vZGVsIGFuZCBwZXJzaXN0IGl0IGludG8gdGhlIGRhdGEgc291cmNlLlxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdD19IHBhcmFtZXRlcnMgUmVxdWVzdCBwYXJhbWV0ZXJzLlxuICAgICAgICAgKlxuICAgICAgICAgKiAgIFRoaXMgbWV0aG9kIGRvZXMgbm90IGFjY2VwdCBhbnkgcGFyYW1ldGVycy5cbiAgICAgICAgICogICBTdXBwbHkgYW4gZW1wdHkgb2JqZWN0IG9yIG9taXQgdGhpcyBhcmd1bWVudCBhbHRvZ2V0aGVyLlxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gcG9zdERhdGEgUmVxdWVzdCBkYXRhLlxuICAgICAgICAgKlxuICAgICAgICAgKiBUaGlzIG1ldGhvZCBleHBlY3RzIGEgc3Vic2V0IG9mIG1vZGVsIHByb3BlcnRpZXMgYXMgcmVxdWVzdCBwYXJhbWV0ZXJzLlxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0ge2Z1bmN0aW9uKE9iamVjdCxPYmplY3QpPX0gc3VjY2Vzc0NiXG4gICAgICAgICAqICAgU3VjY2VzcyBjYWxsYmFjayB3aXRoIHR3byBhcmd1bWVudHM6IGB2YWx1ZWAsIGByZXNwb25zZUhlYWRlcnNgLlxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0ge2Z1bmN0aW9uKE9iamVjdCk9fSBlcnJvckNiIEVycm9yIGNhbGxiYWNrIHdpdGggb25lIGFyZ3VtZW50OlxuICAgICAgICAgKiAgIGBodHRwUmVzcG9uc2VgLlxuICAgICAgICAgKlxuICAgICAgICAgKiBAcmV0dXJucyB7T2JqZWN0fSBBbiBlbXB0eSByZWZlcmVuY2UgdGhhdCB3aWxsIGJlXG4gICAgICAgICAqICAgcG9wdWxhdGVkIHdpdGggdGhlIGFjdHVhbCBkYXRhIG9uY2UgdGhlIHJlc3BvbnNlIGlzIHJldHVybmVkXG4gICAgICAgICAqICAgZnJvbSB0aGUgc2VydmVyLlxuICAgICAgICAgKlxuICAgICAgICAgKiA8ZW0+XG4gICAgICAgICAqIChUaGUgcmVtb3RlIG1ldGhvZCBkZWZpbml0aW9uIGRvZXMgbm90IHByb3ZpZGUgYW55IGRlc2NyaXB0aW9uLlxuICAgICAgICAgKiBUaGlzIHVzdWFsbHkgbWVhbnMgdGhlIHJlc3BvbnNlIGlzIGEgYE5ldHRlc3RgIG9iamVjdC4pXG4gICAgICAgICAqIDwvZW0+XG4gICAgICAgICAqL1xuICAgICAgICBcImNyZWF0ZVwiOiB7XG4gICAgICAgICAgdXJsOiB1cmxCYXNlICsgXCIvbmV0dGVzdHNcIixcbiAgICAgICAgICBtZXRob2Q6IFwiUE9TVFwiXG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEBuZ2RvYyBtZXRob2RcbiAgICAgICAgICogQG5hbWUgbGJTZXJ2aWNlcy5OZXR0ZXN0I2NyZWF0ZU1hbnlcbiAgICAgICAgICogQG1ldGhvZE9mIGxiU2VydmljZXMuTmV0dGVzdFxuICAgICAgICAgKlxuICAgICAgICAgKiBAZGVzY3JpcHRpb25cbiAgICAgICAgICpcbiAgICAgICAgICogQ3JlYXRlIGEgbmV3IGluc3RhbmNlIG9mIHRoZSBtb2RlbCBhbmQgcGVyc2lzdCBpdCBpbnRvIHRoZSBkYXRhIHNvdXJjZS5cbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHtPYmplY3Q9fSBwYXJhbWV0ZXJzIFJlcXVlc3QgcGFyYW1ldGVycy5cbiAgICAgICAgICpcbiAgICAgICAgICogICBUaGlzIG1ldGhvZCBkb2VzIG5vdCBhY2NlcHQgYW55IHBhcmFtZXRlcnMuXG4gICAgICAgICAqICAgU3VwcGx5IGFuIGVtcHR5IG9iamVjdCBvciBvbWl0IHRoaXMgYXJndW1lbnQgYWx0b2dldGhlci5cbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IHBvc3REYXRhIFJlcXVlc3QgZGF0YS5cbiAgICAgICAgICpcbiAgICAgICAgICogVGhpcyBtZXRob2QgZXhwZWN0cyBhIHN1YnNldCBvZiBtb2RlbCBwcm9wZXJ0aWVzIGFzIHJlcXVlc3QgcGFyYW1ldGVycy5cbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHtmdW5jdGlvbihBcnJheS48T2JqZWN0PixPYmplY3QpPX0gc3VjY2Vzc0NiXG4gICAgICAgICAqICAgU3VjY2VzcyBjYWxsYmFjayB3aXRoIHR3byBhcmd1bWVudHM6IGB2YWx1ZWAsIGByZXNwb25zZUhlYWRlcnNgLlxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0ge2Z1bmN0aW9uKE9iamVjdCk9fSBlcnJvckNiIEVycm9yIGNhbGxiYWNrIHdpdGggb25lIGFyZ3VtZW50OlxuICAgICAgICAgKiAgIGBodHRwUmVzcG9uc2VgLlxuICAgICAgICAgKlxuICAgICAgICAgKiBAcmV0dXJucyB7QXJyYXkuPE9iamVjdD59IEFuIGVtcHR5IHJlZmVyZW5jZSB0aGF0IHdpbGwgYmVcbiAgICAgICAgICogICBwb3B1bGF0ZWQgd2l0aCB0aGUgYWN0dWFsIGRhdGEgb25jZSB0aGUgcmVzcG9uc2UgaXMgcmV0dXJuZWRcbiAgICAgICAgICogICBmcm9tIHRoZSBzZXJ2ZXIuXG4gICAgICAgICAqXG4gICAgICAgICAqIDxlbT5cbiAgICAgICAgICogKFRoZSByZW1vdGUgbWV0aG9kIGRlZmluaXRpb24gZG9lcyBub3QgcHJvdmlkZSBhbnkgZGVzY3JpcHRpb24uXG4gICAgICAgICAqIFRoaXMgdXN1YWxseSBtZWFucyB0aGUgcmVzcG9uc2UgaXMgYSBgTmV0dGVzdGAgb2JqZWN0LilcbiAgICAgICAgICogPC9lbT5cbiAgICAgICAgICovXG4gICAgICAgIFwiY3JlYXRlTWFueVwiOiB7XG4gICAgICAgICAgaXNBcnJheTogdHJ1ZSxcbiAgICAgICAgICB1cmw6IHVybEJhc2UgKyBcIi9uZXR0ZXN0c1wiLFxuICAgICAgICAgIG1ldGhvZDogXCJQT1NUXCJcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogQG5nZG9jIG1ldGhvZFxuICAgICAgICAgKiBAbmFtZSBsYlNlcnZpY2VzLk5ldHRlc3QjdXBzZXJ0XG4gICAgICAgICAqIEBtZXRob2RPZiBsYlNlcnZpY2VzLk5ldHRlc3RcbiAgICAgICAgICpcbiAgICAgICAgICogQGRlc2NyaXB0aW9uXG4gICAgICAgICAqXG4gICAgICAgICAqIFVwZGF0ZSBhbiBleGlzdGluZyBtb2RlbCBpbnN0YW5jZSBvciBpbnNlcnQgYSBuZXcgb25lIGludG8gdGhlIGRhdGEgc291cmNlLlxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdD19IHBhcmFtZXRlcnMgUmVxdWVzdCBwYXJhbWV0ZXJzLlxuICAgICAgICAgKlxuICAgICAgICAgKiAgIFRoaXMgbWV0aG9kIGRvZXMgbm90IGFjY2VwdCBhbnkgcGFyYW1ldGVycy5cbiAgICAgICAgICogICBTdXBwbHkgYW4gZW1wdHkgb2JqZWN0IG9yIG9taXQgdGhpcyBhcmd1bWVudCBhbHRvZ2V0aGVyLlxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gcG9zdERhdGEgUmVxdWVzdCBkYXRhLlxuICAgICAgICAgKlxuICAgICAgICAgKiBUaGlzIG1ldGhvZCBleHBlY3RzIGEgc3Vic2V0IG9mIG1vZGVsIHByb3BlcnRpZXMgYXMgcmVxdWVzdCBwYXJhbWV0ZXJzLlxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0ge2Z1bmN0aW9uKE9iamVjdCxPYmplY3QpPX0gc3VjY2Vzc0NiXG4gICAgICAgICAqICAgU3VjY2VzcyBjYWxsYmFjayB3aXRoIHR3byBhcmd1bWVudHM6IGB2YWx1ZWAsIGByZXNwb25zZUhlYWRlcnNgLlxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0ge2Z1bmN0aW9uKE9iamVjdCk9fSBlcnJvckNiIEVycm9yIGNhbGxiYWNrIHdpdGggb25lIGFyZ3VtZW50OlxuICAgICAgICAgKiAgIGBodHRwUmVzcG9uc2VgLlxuICAgICAgICAgKlxuICAgICAgICAgKiBAcmV0dXJucyB7T2JqZWN0fSBBbiBlbXB0eSByZWZlcmVuY2UgdGhhdCB3aWxsIGJlXG4gICAgICAgICAqICAgcG9wdWxhdGVkIHdpdGggdGhlIGFjdHVhbCBkYXRhIG9uY2UgdGhlIHJlc3BvbnNlIGlzIHJldHVybmVkXG4gICAgICAgICAqICAgZnJvbSB0aGUgc2VydmVyLlxuICAgICAgICAgKlxuICAgICAgICAgKiA8ZW0+XG4gICAgICAgICAqIChUaGUgcmVtb3RlIG1ldGhvZCBkZWZpbml0aW9uIGRvZXMgbm90IHByb3ZpZGUgYW55IGRlc2NyaXB0aW9uLlxuICAgICAgICAgKiBUaGlzIHVzdWFsbHkgbWVhbnMgdGhlIHJlc3BvbnNlIGlzIGEgYE5ldHRlc3RgIG9iamVjdC4pXG4gICAgICAgICAqIDwvZW0+XG4gICAgICAgICAqL1xuICAgICAgICBcInVwc2VydFwiOiB7XG4gICAgICAgICAgdXJsOiB1cmxCYXNlICsgXCIvbmV0dGVzdHNcIixcbiAgICAgICAgICBtZXRob2Q6IFwiUFVUXCJcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogQG5nZG9jIG1ldGhvZFxuICAgICAgICAgKiBAbmFtZSBsYlNlcnZpY2VzLk5ldHRlc3QjZXhpc3RzXG4gICAgICAgICAqIEBtZXRob2RPZiBsYlNlcnZpY2VzLk5ldHRlc3RcbiAgICAgICAgICpcbiAgICAgICAgICogQGRlc2NyaXB0aW9uXG4gICAgICAgICAqXG4gICAgICAgICAqIENoZWNrIHdoZXRoZXIgYSBtb2RlbCBpbnN0YW5jZSBleGlzdHMgaW4gdGhlIGRhdGEgc291cmNlLlxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdD19IHBhcmFtZXRlcnMgUmVxdWVzdCBwYXJhbWV0ZXJzLlxuICAgICAgICAgKlxuICAgICAgICAgKiAgLSBgaWRgIOKAkyBgeyp9YCAtIE1vZGVsIGlkXG4gICAgICAgICAqXG4gICAgICAgICAqIEBwYXJhbSB7ZnVuY3Rpb24oT2JqZWN0LE9iamVjdCk9fSBzdWNjZXNzQ2JcbiAgICAgICAgICogICBTdWNjZXNzIGNhbGxiYWNrIHdpdGggdHdvIGFyZ3VtZW50czogYHZhbHVlYCwgYHJlc3BvbnNlSGVhZGVyc2AuXG4gICAgICAgICAqXG4gICAgICAgICAqIEBwYXJhbSB7ZnVuY3Rpb24oT2JqZWN0KT19IGVycm9yQ2IgRXJyb3IgY2FsbGJhY2sgd2l0aCBvbmUgYXJndW1lbnQ6XG4gICAgICAgICAqICAgYGh0dHBSZXNwb25zZWAuXG4gICAgICAgICAqXG4gICAgICAgICAqIEByZXR1cm5zIHtPYmplY3R9IEFuIGVtcHR5IHJlZmVyZW5jZSB0aGF0IHdpbGwgYmVcbiAgICAgICAgICogICBwb3B1bGF0ZWQgd2l0aCB0aGUgYWN0dWFsIGRhdGEgb25jZSB0aGUgcmVzcG9uc2UgaXMgcmV0dXJuZWRcbiAgICAgICAgICogICBmcm9tIHRoZSBzZXJ2ZXIuXG4gICAgICAgICAqXG4gICAgICAgICAqIERhdGEgcHJvcGVydGllczpcbiAgICAgICAgICpcbiAgICAgICAgICogIC0gYGV4aXN0c2Ag4oCTIGB7Ym9vbGVhbj19YCAtIFxuICAgICAgICAgKi9cbiAgICAgICAgXCJleGlzdHNcIjoge1xuICAgICAgICAgIHVybDogdXJsQmFzZSArIFwiL25ldHRlc3RzLzppZC9leGlzdHNcIixcbiAgICAgICAgICBtZXRob2Q6IFwiR0VUXCJcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogQG5nZG9jIG1ldGhvZFxuICAgICAgICAgKiBAbmFtZSBsYlNlcnZpY2VzLk5ldHRlc3QjZmluZEJ5SWRcbiAgICAgICAgICogQG1ldGhvZE9mIGxiU2VydmljZXMuTmV0dGVzdFxuICAgICAgICAgKlxuICAgICAgICAgKiBAZGVzY3JpcHRpb25cbiAgICAgICAgICpcbiAgICAgICAgICogRmluZCBhIG1vZGVsIGluc3RhbmNlIGJ5IGlkIGZyb20gdGhlIGRhdGEgc291cmNlLlxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdD19IHBhcmFtZXRlcnMgUmVxdWVzdCBwYXJhbWV0ZXJzLlxuICAgICAgICAgKlxuICAgICAgICAgKiAgLSBgaWRgIOKAkyBgeyp9YCAtIE1vZGVsIGlkXG4gICAgICAgICAqXG4gICAgICAgICAqICAtIGBmaWx0ZXJgIOKAkyBge29iamVjdD19YCAtIEZpbHRlciBkZWZpbmluZyBmaWVsZHMgYW5kIGluY2x1ZGVcbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHtmdW5jdGlvbihPYmplY3QsT2JqZWN0KT19IHN1Y2Nlc3NDYlxuICAgICAgICAgKiAgIFN1Y2Nlc3MgY2FsbGJhY2sgd2l0aCB0d28gYXJndW1lbnRzOiBgdmFsdWVgLCBgcmVzcG9uc2VIZWFkZXJzYC5cbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHtmdW5jdGlvbihPYmplY3QpPX0gZXJyb3JDYiBFcnJvciBjYWxsYmFjayB3aXRoIG9uZSBhcmd1bWVudDpcbiAgICAgICAgICogICBgaHR0cFJlc3BvbnNlYC5cbiAgICAgICAgICpcbiAgICAgICAgICogQHJldHVybnMge09iamVjdH0gQW4gZW1wdHkgcmVmZXJlbmNlIHRoYXQgd2lsbCBiZVxuICAgICAgICAgKiAgIHBvcHVsYXRlZCB3aXRoIHRoZSBhY3R1YWwgZGF0YSBvbmNlIHRoZSByZXNwb25zZSBpcyByZXR1cm5lZFxuICAgICAgICAgKiAgIGZyb20gdGhlIHNlcnZlci5cbiAgICAgICAgICpcbiAgICAgICAgICogPGVtPlxuICAgICAgICAgKiAoVGhlIHJlbW90ZSBtZXRob2QgZGVmaW5pdGlvbiBkb2VzIG5vdCBwcm92aWRlIGFueSBkZXNjcmlwdGlvbi5cbiAgICAgICAgICogVGhpcyB1c3VhbGx5IG1lYW5zIHRoZSByZXNwb25zZSBpcyBhIGBOZXR0ZXN0YCBvYmplY3QuKVxuICAgICAgICAgKiA8L2VtPlxuICAgICAgICAgKi9cbiAgICAgICAgXCJmaW5kQnlJZFwiOiB7XG4gICAgICAgICAgdXJsOiB1cmxCYXNlICsgXCIvbmV0dGVzdHMvOmlkXCIsXG4gICAgICAgICAgbWV0aG9kOiBcIkdFVFwiXG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEBuZ2RvYyBtZXRob2RcbiAgICAgICAgICogQG5hbWUgbGJTZXJ2aWNlcy5OZXR0ZXN0I2ZpbmRcbiAgICAgICAgICogQG1ldGhvZE9mIGxiU2VydmljZXMuTmV0dGVzdFxuICAgICAgICAgKlxuICAgICAgICAgKiBAZGVzY3JpcHRpb25cbiAgICAgICAgICpcbiAgICAgICAgICogRmluZCBhbGwgaW5zdGFuY2VzIG9mIHRoZSBtb2RlbCBtYXRjaGVkIGJ5IGZpbHRlciBmcm9tIHRoZSBkYXRhIHNvdXJjZS5cbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHtPYmplY3Q9fSBwYXJhbWV0ZXJzIFJlcXVlc3QgcGFyYW1ldGVycy5cbiAgICAgICAgICpcbiAgICAgICAgICogIC0gYGZpbHRlcmAg4oCTIGB7b2JqZWN0PX1gIC0gRmlsdGVyIGRlZmluaW5nIGZpZWxkcywgd2hlcmUsIGluY2x1ZGUsIG9yZGVyLCBvZmZzZXQsIGFuZCBsaW1pdFxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0ge2Z1bmN0aW9uKEFycmF5LjxPYmplY3Q+LE9iamVjdCk9fSBzdWNjZXNzQ2JcbiAgICAgICAgICogICBTdWNjZXNzIGNhbGxiYWNrIHdpdGggdHdvIGFyZ3VtZW50czogYHZhbHVlYCwgYHJlc3BvbnNlSGVhZGVyc2AuXG4gICAgICAgICAqXG4gICAgICAgICAqIEBwYXJhbSB7ZnVuY3Rpb24oT2JqZWN0KT19IGVycm9yQ2IgRXJyb3IgY2FsbGJhY2sgd2l0aCBvbmUgYXJndW1lbnQ6XG4gICAgICAgICAqICAgYGh0dHBSZXNwb25zZWAuXG4gICAgICAgICAqXG4gICAgICAgICAqIEByZXR1cm5zIHtBcnJheS48T2JqZWN0Pn0gQW4gZW1wdHkgcmVmZXJlbmNlIHRoYXQgd2lsbCBiZVxuICAgICAgICAgKiAgIHBvcHVsYXRlZCB3aXRoIHRoZSBhY3R1YWwgZGF0YSBvbmNlIHRoZSByZXNwb25zZSBpcyByZXR1cm5lZFxuICAgICAgICAgKiAgIGZyb20gdGhlIHNlcnZlci5cbiAgICAgICAgICpcbiAgICAgICAgICogPGVtPlxuICAgICAgICAgKiAoVGhlIHJlbW90ZSBtZXRob2QgZGVmaW5pdGlvbiBkb2VzIG5vdCBwcm92aWRlIGFueSBkZXNjcmlwdGlvbi5cbiAgICAgICAgICogVGhpcyB1c3VhbGx5IG1lYW5zIHRoZSByZXNwb25zZSBpcyBhIGBOZXR0ZXN0YCBvYmplY3QuKVxuICAgICAgICAgKiA8L2VtPlxuICAgICAgICAgKi9cbiAgICAgICAgXCJmaW5kXCI6IHtcbiAgICAgICAgICBpc0FycmF5OiB0cnVlLFxuICAgICAgICAgIHVybDogdXJsQmFzZSArIFwiL25ldHRlc3RzXCIsXG4gICAgICAgICAgbWV0aG9kOiBcIkdFVFwiXG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEBuZ2RvYyBtZXRob2RcbiAgICAgICAgICogQG5hbWUgbGJTZXJ2aWNlcy5OZXR0ZXN0I2ZpbmRPbmVcbiAgICAgICAgICogQG1ldGhvZE9mIGxiU2VydmljZXMuTmV0dGVzdFxuICAgICAgICAgKlxuICAgICAgICAgKiBAZGVzY3JpcHRpb25cbiAgICAgICAgICpcbiAgICAgICAgICogRmluZCBmaXJzdCBpbnN0YW5jZSBvZiB0aGUgbW9kZWwgbWF0Y2hlZCBieSBmaWx0ZXIgZnJvbSB0aGUgZGF0YSBzb3VyY2UuXG4gICAgICAgICAqXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0PX0gcGFyYW1ldGVycyBSZXF1ZXN0IHBhcmFtZXRlcnMuXG4gICAgICAgICAqXG4gICAgICAgICAqICAtIGBmaWx0ZXJgIOKAkyBge29iamVjdD19YCAtIEZpbHRlciBkZWZpbmluZyBmaWVsZHMsIHdoZXJlLCBpbmNsdWRlLCBvcmRlciwgb2Zmc2V0LCBhbmQgbGltaXRcbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHtmdW5jdGlvbihPYmplY3QsT2JqZWN0KT19IHN1Y2Nlc3NDYlxuICAgICAgICAgKiAgIFN1Y2Nlc3MgY2FsbGJhY2sgd2l0aCB0d28gYXJndW1lbnRzOiBgdmFsdWVgLCBgcmVzcG9uc2VIZWFkZXJzYC5cbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHtmdW5jdGlvbihPYmplY3QpPX0gZXJyb3JDYiBFcnJvciBjYWxsYmFjayB3aXRoIG9uZSBhcmd1bWVudDpcbiAgICAgICAgICogICBgaHR0cFJlc3BvbnNlYC5cbiAgICAgICAgICpcbiAgICAgICAgICogQHJldHVybnMge09iamVjdH0gQW4gZW1wdHkgcmVmZXJlbmNlIHRoYXQgd2lsbCBiZVxuICAgICAgICAgKiAgIHBvcHVsYXRlZCB3aXRoIHRoZSBhY3R1YWwgZGF0YSBvbmNlIHRoZSByZXNwb25zZSBpcyByZXR1cm5lZFxuICAgICAgICAgKiAgIGZyb20gdGhlIHNlcnZlci5cbiAgICAgICAgICpcbiAgICAgICAgICogPGVtPlxuICAgICAgICAgKiAoVGhlIHJlbW90ZSBtZXRob2QgZGVmaW5pdGlvbiBkb2VzIG5vdCBwcm92aWRlIGFueSBkZXNjcmlwdGlvbi5cbiAgICAgICAgICogVGhpcyB1c3VhbGx5IG1lYW5zIHRoZSByZXNwb25zZSBpcyBhIGBOZXR0ZXN0YCBvYmplY3QuKVxuICAgICAgICAgKiA8L2VtPlxuICAgICAgICAgKi9cbiAgICAgICAgXCJmaW5kT25lXCI6IHtcbiAgICAgICAgICB1cmw6IHVybEJhc2UgKyBcIi9uZXR0ZXN0cy9maW5kT25lXCIsXG4gICAgICAgICAgbWV0aG9kOiBcIkdFVFwiXG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEBuZ2RvYyBtZXRob2RcbiAgICAgICAgICogQG5hbWUgbGJTZXJ2aWNlcy5OZXR0ZXN0I3VwZGF0ZUFsbFxuICAgICAgICAgKiBAbWV0aG9kT2YgbGJTZXJ2aWNlcy5OZXR0ZXN0XG4gICAgICAgICAqXG4gICAgICAgICAqIEBkZXNjcmlwdGlvblxuICAgICAgICAgKlxuICAgICAgICAgKiBVcGRhdGUgaW5zdGFuY2VzIG9mIHRoZSBtb2RlbCBtYXRjaGVkIGJ5IHdoZXJlIGZyb20gdGhlIGRhdGEgc291cmNlLlxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdD19IHBhcmFtZXRlcnMgUmVxdWVzdCBwYXJhbWV0ZXJzLlxuICAgICAgICAgKlxuICAgICAgICAgKiAgLSBgd2hlcmVgIOKAkyBge29iamVjdD19YCAtIENyaXRlcmlhIHRvIG1hdGNoIG1vZGVsIGluc3RhbmNlc1xuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gcG9zdERhdGEgUmVxdWVzdCBkYXRhLlxuICAgICAgICAgKlxuICAgICAgICAgKiBUaGlzIG1ldGhvZCBleHBlY3RzIGEgc3Vic2V0IG9mIG1vZGVsIHByb3BlcnRpZXMgYXMgcmVxdWVzdCBwYXJhbWV0ZXJzLlxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0ge2Z1bmN0aW9uKE9iamVjdCxPYmplY3QpPX0gc3VjY2Vzc0NiXG4gICAgICAgICAqICAgU3VjY2VzcyBjYWxsYmFjayB3aXRoIHR3byBhcmd1bWVudHM6IGB2YWx1ZWAsIGByZXNwb25zZUhlYWRlcnNgLlxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0ge2Z1bmN0aW9uKE9iamVjdCk9fSBlcnJvckNiIEVycm9yIGNhbGxiYWNrIHdpdGggb25lIGFyZ3VtZW50OlxuICAgICAgICAgKiAgIGBodHRwUmVzcG9uc2VgLlxuICAgICAgICAgKlxuICAgICAgICAgKiBAcmV0dXJucyB7T2JqZWN0fSBBbiBlbXB0eSByZWZlcmVuY2UgdGhhdCB3aWxsIGJlXG4gICAgICAgICAqICAgcG9wdWxhdGVkIHdpdGggdGhlIGFjdHVhbCBkYXRhIG9uY2UgdGhlIHJlc3BvbnNlIGlzIHJldHVybmVkXG4gICAgICAgICAqICAgZnJvbSB0aGUgc2VydmVyLlxuICAgICAgICAgKlxuICAgICAgICAgKiBUaGUgbnVtYmVyIG9mIGluc3RhbmNlcyB1cGRhdGVkXG4gICAgICAgICAqL1xuICAgICAgICBcInVwZGF0ZUFsbFwiOiB7XG4gICAgICAgICAgdXJsOiB1cmxCYXNlICsgXCIvbmV0dGVzdHMvdXBkYXRlXCIsXG4gICAgICAgICAgbWV0aG9kOiBcIlBPU1RcIlxuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAbmdkb2MgbWV0aG9kXG4gICAgICAgICAqIEBuYW1lIGxiU2VydmljZXMuTmV0dGVzdCNkZWxldGVCeUlkXG4gICAgICAgICAqIEBtZXRob2RPZiBsYlNlcnZpY2VzLk5ldHRlc3RcbiAgICAgICAgICpcbiAgICAgICAgICogQGRlc2NyaXB0aW9uXG4gICAgICAgICAqXG4gICAgICAgICAqIERlbGV0ZSBhIG1vZGVsIGluc3RhbmNlIGJ5IGlkIGZyb20gdGhlIGRhdGEgc291cmNlLlxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdD19IHBhcmFtZXRlcnMgUmVxdWVzdCBwYXJhbWV0ZXJzLlxuICAgICAgICAgKlxuICAgICAgICAgKiAgLSBgaWRgIOKAkyBgeyp9YCAtIE1vZGVsIGlkXG4gICAgICAgICAqXG4gICAgICAgICAqIEBwYXJhbSB7ZnVuY3Rpb24oT2JqZWN0LE9iamVjdCk9fSBzdWNjZXNzQ2JcbiAgICAgICAgICogICBTdWNjZXNzIGNhbGxiYWNrIHdpdGggdHdvIGFyZ3VtZW50czogYHZhbHVlYCwgYHJlc3BvbnNlSGVhZGVyc2AuXG4gICAgICAgICAqXG4gICAgICAgICAqIEBwYXJhbSB7ZnVuY3Rpb24oT2JqZWN0KT19IGVycm9yQ2IgRXJyb3IgY2FsbGJhY2sgd2l0aCBvbmUgYXJndW1lbnQ6XG4gICAgICAgICAqICAgYGh0dHBSZXNwb25zZWAuXG4gICAgICAgICAqXG4gICAgICAgICAqIEByZXR1cm5zIHtPYmplY3R9IEFuIGVtcHR5IHJlZmVyZW5jZSB0aGF0IHdpbGwgYmVcbiAgICAgICAgICogICBwb3B1bGF0ZWQgd2l0aCB0aGUgYWN0dWFsIGRhdGEgb25jZSB0aGUgcmVzcG9uc2UgaXMgcmV0dXJuZWRcbiAgICAgICAgICogICBmcm9tIHRoZSBzZXJ2ZXIuXG4gICAgICAgICAqXG4gICAgICAgICAqIDxlbT5cbiAgICAgICAgICogKFRoZSByZW1vdGUgbWV0aG9kIGRlZmluaXRpb24gZG9lcyBub3QgcHJvdmlkZSBhbnkgZGVzY3JpcHRpb24uXG4gICAgICAgICAqIFRoaXMgdXN1YWxseSBtZWFucyB0aGUgcmVzcG9uc2UgaXMgYSBgTmV0dGVzdGAgb2JqZWN0LilcbiAgICAgICAgICogPC9lbT5cbiAgICAgICAgICovXG4gICAgICAgIFwiZGVsZXRlQnlJZFwiOiB7XG4gICAgICAgICAgdXJsOiB1cmxCYXNlICsgXCIvbmV0dGVzdHMvOmlkXCIsXG4gICAgICAgICAgbWV0aG9kOiBcIkRFTEVURVwiXG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEBuZ2RvYyBtZXRob2RcbiAgICAgICAgICogQG5hbWUgbGJTZXJ2aWNlcy5OZXR0ZXN0I2NvdW50XG4gICAgICAgICAqIEBtZXRob2RPZiBsYlNlcnZpY2VzLk5ldHRlc3RcbiAgICAgICAgICpcbiAgICAgICAgICogQGRlc2NyaXB0aW9uXG4gICAgICAgICAqXG4gICAgICAgICAqIENvdW50IGluc3RhbmNlcyBvZiB0aGUgbW9kZWwgbWF0Y2hlZCBieSB3aGVyZSBmcm9tIHRoZSBkYXRhIHNvdXJjZS5cbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHtPYmplY3Q9fSBwYXJhbWV0ZXJzIFJlcXVlc3QgcGFyYW1ldGVycy5cbiAgICAgICAgICpcbiAgICAgICAgICogIC0gYHdoZXJlYCDigJMgYHtvYmplY3Q9fWAgLSBDcml0ZXJpYSB0byBtYXRjaCBtb2RlbCBpbnN0YW5jZXNcbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHtmdW5jdGlvbihPYmplY3QsT2JqZWN0KT19IHN1Y2Nlc3NDYlxuICAgICAgICAgKiAgIFN1Y2Nlc3MgY2FsbGJhY2sgd2l0aCB0d28gYXJndW1lbnRzOiBgdmFsdWVgLCBgcmVzcG9uc2VIZWFkZXJzYC5cbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHtmdW5jdGlvbihPYmplY3QpPX0gZXJyb3JDYiBFcnJvciBjYWxsYmFjayB3aXRoIG9uZSBhcmd1bWVudDpcbiAgICAgICAgICogICBgaHR0cFJlc3BvbnNlYC5cbiAgICAgICAgICpcbiAgICAgICAgICogQHJldHVybnMge09iamVjdH0gQW4gZW1wdHkgcmVmZXJlbmNlIHRoYXQgd2lsbCBiZVxuICAgICAgICAgKiAgIHBvcHVsYXRlZCB3aXRoIHRoZSBhY3R1YWwgZGF0YSBvbmNlIHRoZSByZXNwb25zZSBpcyByZXR1cm5lZFxuICAgICAgICAgKiAgIGZyb20gdGhlIHNlcnZlci5cbiAgICAgICAgICpcbiAgICAgICAgICogRGF0YSBwcm9wZXJ0aWVzOlxuICAgICAgICAgKlxuICAgICAgICAgKiAgLSBgY291bnRgIOKAkyBge251bWJlcj19YCAtIFxuICAgICAgICAgKi9cbiAgICAgICAgXCJjb3VudFwiOiB7XG4gICAgICAgICAgdXJsOiB1cmxCYXNlICsgXCIvbmV0dGVzdHMvY291bnRcIixcbiAgICAgICAgICBtZXRob2Q6IFwiR0VUXCJcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogQG5nZG9jIG1ldGhvZFxuICAgICAgICAgKiBAbmFtZSBsYlNlcnZpY2VzLk5ldHRlc3QjcHJvdG90eXBlJHVwZGF0ZUF0dHJpYnV0ZXNcbiAgICAgICAgICogQG1ldGhvZE9mIGxiU2VydmljZXMuTmV0dGVzdFxuICAgICAgICAgKlxuICAgICAgICAgKiBAZGVzY3JpcHRpb25cbiAgICAgICAgICpcbiAgICAgICAgICogVXBkYXRlIGF0dHJpYnV0ZXMgZm9yIGEgbW9kZWwgaW5zdGFuY2UgYW5kIHBlcnNpc3QgaXQgaW50byB0aGUgZGF0YSBzb3VyY2UuXG4gICAgICAgICAqXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0PX0gcGFyYW1ldGVycyBSZXF1ZXN0IHBhcmFtZXRlcnMuXG4gICAgICAgICAqXG4gICAgICAgICAqICAtIGBpZGAg4oCTIGB7Kn1gIC0gUGVyc2lzdGVkTW9kZWwgaWRcbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IHBvc3REYXRhIFJlcXVlc3QgZGF0YS5cbiAgICAgICAgICpcbiAgICAgICAgICogVGhpcyBtZXRob2QgZXhwZWN0cyBhIHN1YnNldCBvZiBtb2RlbCBwcm9wZXJ0aWVzIGFzIHJlcXVlc3QgcGFyYW1ldGVycy5cbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHtmdW5jdGlvbihPYmplY3QsT2JqZWN0KT19IHN1Y2Nlc3NDYlxuICAgICAgICAgKiAgIFN1Y2Nlc3MgY2FsbGJhY2sgd2l0aCB0d28gYXJndW1lbnRzOiBgdmFsdWVgLCBgcmVzcG9uc2VIZWFkZXJzYC5cbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHtmdW5jdGlvbihPYmplY3QpPX0gZXJyb3JDYiBFcnJvciBjYWxsYmFjayB3aXRoIG9uZSBhcmd1bWVudDpcbiAgICAgICAgICogICBgaHR0cFJlc3BvbnNlYC5cbiAgICAgICAgICpcbiAgICAgICAgICogQHJldHVybnMge09iamVjdH0gQW4gZW1wdHkgcmVmZXJlbmNlIHRoYXQgd2lsbCBiZVxuICAgICAgICAgKiAgIHBvcHVsYXRlZCB3aXRoIHRoZSBhY3R1YWwgZGF0YSBvbmNlIHRoZSByZXNwb25zZSBpcyByZXR1cm5lZFxuICAgICAgICAgKiAgIGZyb20gdGhlIHNlcnZlci5cbiAgICAgICAgICpcbiAgICAgICAgICogPGVtPlxuICAgICAgICAgKiAoVGhlIHJlbW90ZSBtZXRob2QgZGVmaW5pdGlvbiBkb2VzIG5vdCBwcm92aWRlIGFueSBkZXNjcmlwdGlvbi5cbiAgICAgICAgICogVGhpcyB1c3VhbGx5IG1lYW5zIHRoZSByZXNwb25zZSBpcyBhIGBOZXR0ZXN0YCBvYmplY3QuKVxuICAgICAgICAgKiA8L2VtPlxuICAgICAgICAgKi9cbiAgICAgICAgXCJwcm90b3R5cGUkdXBkYXRlQXR0cmlidXRlc1wiOiB7XG4gICAgICAgICAgdXJsOiB1cmxCYXNlICsgXCIvbmV0dGVzdHMvOmlkXCIsXG4gICAgICAgICAgbWV0aG9kOiBcIlBVVFwiXG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEBuZ2RvYyBtZXRob2RcbiAgICAgICAgICogQG5hbWUgbGJTZXJ2aWNlcy5OZXR0ZXN0I2NyZWF0ZUNoYW5nZVN0cmVhbVxuICAgICAgICAgKiBAbWV0aG9kT2YgbGJTZXJ2aWNlcy5OZXR0ZXN0XG4gICAgICAgICAqXG4gICAgICAgICAqIEBkZXNjcmlwdGlvblxuICAgICAgICAgKlxuICAgICAgICAgKiBDcmVhdGUgYSBjaGFuZ2Ugc3RyZWFtLlxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdD19IHBhcmFtZXRlcnMgUmVxdWVzdCBwYXJhbWV0ZXJzLlxuICAgICAgICAgKlxuICAgICAgICAgKiAgIFRoaXMgbWV0aG9kIGRvZXMgbm90IGFjY2VwdCBhbnkgcGFyYW1ldGVycy5cbiAgICAgICAgICogICBTdXBwbHkgYW4gZW1wdHkgb2JqZWN0IG9yIG9taXQgdGhpcyBhcmd1bWVudCBhbHRvZ2V0aGVyLlxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gcG9zdERhdGEgUmVxdWVzdCBkYXRhLlxuICAgICAgICAgKlxuICAgICAgICAgKiAgLSBgb3B0aW9uc2Ag4oCTIGB7b2JqZWN0PX1gIC0gXG4gICAgICAgICAqXG4gICAgICAgICAqIEBwYXJhbSB7ZnVuY3Rpb24oT2JqZWN0LE9iamVjdCk9fSBzdWNjZXNzQ2JcbiAgICAgICAgICogICBTdWNjZXNzIGNhbGxiYWNrIHdpdGggdHdvIGFyZ3VtZW50czogYHZhbHVlYCwgYHJlc3BvbnNlSGVhZGVyc2AuXG4gICAgICAgICAqXG4gICAgICAgICAqIEBwYXJhbSB7ZnVuY3Rpb24oT2JqZWN0KT19IGVycm9yQ2IgRXJyb3IgY2FsbGJhY2sgd2l0aCBvbmUgYXJndW1lbnQ6XG4gICAgICAgICAqICAgYGh0dHBSZXNwb25zZWAuXG4gICAgICAgICAqXG4gICAgICAgICAqIEByZXR1cm5zIHtPYmplY3R9IEFuIGVtcHR5IHJlZmVyZW5jZSB0aGF0IHdpbGwgYmVcbiAgICAgICAgICogICBwb3B1bGF0ZWQgd2l0aCB0aGUgYWN0dWFsIGRhdGEgb25jZSB0aGUgcmVzcG9uc2UgaXMgcmV0dXJuZWRcbiAgICAgICAgICogICBmcm9tIHRoZSBzZXJ2ZXIuXG4gICAgICAgICAqXG4gICAgICAgICAqIERhdGEgcHJvcGVydGllczpcbiAgICAgICAgICpcbiAgICAgICAgICogIC0gYGNoYW5nZXNgIOKAkyBge1JlYWRhYmxlU3RyZWFtPX1gIC0gXG4gICAgICAgICAqL1xuICAgICAgICBcImNyZWF0ZUNoYW5nZVN0cmVhbVwiOiB7XG4gICAgICAgICAgdXJsOiB1cmxCYXNlICsgXCIvbmV0dGVzdHMvY2hhbmdlLXN0cmVhbVwiLFxuICAgICAgICAgIG1ldGhvZDogXCJQT1NUXCJcbiAgICAgICAgfSxcbiAgICAgIH1cbiAgICApO1xuXG5cblxuICAgICAgICAvKipcbiAgICAgICAgICogQG5nZG9jIG1ldGhvZFxuICAgICAgICAgKiBAbmFtZSBsYlNlcnZpY2VzLk5ldHRlc3QjdXBkYXRlT3JDcmVhdGVcbiAgICAgICAgICogQG1ldGhvZE9mIGxiU2VydmljZXMuTmV0dGVzdFxuICAgICAgICAgKlxuICAgICAgICAgKiBAZGVzY3JpcHRpb25cbiAgICAgICAgICpcbiAgICAgICAgICogVXBkYXRlIGFuIGV4aXN0aW5nIG1vZGVsIGluc3RhbmNlIG9yIGluc2VydCBhIG5ldyBvbmUgaW50byB0aGUgZGF0YSBzb3VyY2UuXG4gICAgICAgICAqXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0PX0gcGFyYW1ldGVycyBSZXF1ZXN0IHBhcmFtZXRlcnMuXG4gICAgICAgICAqXG4gICAgICAgICAqICAgVGhpcyBtZXRob2QgZG9lcyBub3QgYWNjZXB0IGFueSBwYXJhbWV0ZXJzLlxuICAgICAgICAgKiAgIFN1cHBseSBhbiBlbXB0eSBvYmplY3Qgb3Igb21pdCB0aGlzIGFyZ3VtZW50IGFsdG9nZXRoZXIuXG4gICAgICAgICAqXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBwb3N0RGF0YSBSZXF1ZXN0IGRhdGEuXG4gICAgICAgICAqXG4gICAgICAgICAqIFRoaXMgbWV0aG9kIGV4cGVjdHMgYSBzdWJzZXQgb2YgbW9kZWwgcHJvcGVydGllcyBhcyByZXF1ZXN0IHBhcmFtZXRlcnMuXG4gICAgICAgICAqXG4gICAgICAgICAqIEBwYXJhbSB7ZnVuY3Rpb24oT2JqZWN0LE9iamVjdCk9fSBzdWNjZXNzQ2JcbiAgICAgICAgICogICBTdWNjZXNzIGNhbGxiYWNrIHdpdGggdHdvIGFyZ3VtZW50czogYHZhbHVlYCwgYHJlc3BvbnNlSGVhZGVyc2AuXG4gICAgICAgICAqXG4gICAgICAgICAqIEBwYXJhbSB7ZnVuY3Rpb24oT2JqZWN0KT19IGVycm9yQ2IgRXJyb3IgY2FsbGJhY2sgd2l0aCBvbmUgYXJndW1lbnQ6XG4gICAgICAgICAqICAgYGh0dHBSZXNwb25zZWAuXG4gICAgICAgICAqXG4gICAgICAgICAqIEByZXR1cm5zIHtPYmplY3R9IEFuIGVtcHR5IHJlZmVyZW5jZSB0aGF0IHdpbGwgYmVcbiAgICAgICAgICogICBwb3B1bGF0ZWQgd2l0aCB0aGUgYWN0dWFsIGRhdGEgb25jZSB0aGUgcmVzcG9uc2UgaXMgcmV0dXJuZWRcbiAgICAgICAgICogICBmcm9tIHRoZSBzZXJ2ZXIuXG4gICAgICAgICAqXG4gICAgICAgICAqIDxlbT5cbiAgICAgICAgICogKFRoZSByZW1vdGUgbWV0aG9kIGRlZmluaXRpb24gZG9lcyBub3QgcHJvdmlkZSBhbnkgZGVzY3JpcHRpb24uXG4gICAgICAgICAqIFRoaXMgdXN1YWxseSBtZWFucyB0aGUgcmVzcG9uc2UgaXMgYSBgTmV0dGVzdGAgb2JqZWN0LilcbiAgICAgICAgICogPC9lbT5cbiAgICAgICAgICovXG4gICAgICAgIFJbXCJ1cGRhdGVPckNyZWF0ZVwiXSA9IFJbXCJ1cHNlcnRcIl07XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEBuZ2RvYyBtZXRob2RcbiAgICAgICAgICogQG5hbWUgbGJTZXJ2aWNlcy5OZXR0ZXN0I3VwZGF0ZVxuICAgICAgICAgKiBAbWV0aG9kT2YgbGJTZXJ2aWNlcy5OZXR0ZXN0XG4gICAgICAgICAqXG4gICAgICAgICAqIEBkZXNjcmlwdGlvblxuICAgICAgICAgKlxuICAgICAgICAgKiBVcGRhdGUgaW5zdGFuY2VzIG9mIHRoZSBtb2RlbCBtYXRjaGVkIGJ5IHdoZXJlIGZyb20gdGhlIGRhdGEgc291cmNlLlxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdD19IHBhcmFtZXRlcnMgUmVxdWVzdCBwYXJhbWV0ZXJzLlxuICAgICAgICAgKlxuICAgICAgICAgKiAgLSBgd2hlcmVgIOKAkyBge29iamVjdD19YCAtIENyaXRlcmlhIHRvIG1hdGNoIG1vZGVsIGluc3RhbmNlc1xuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gcG9zdERhdGEgUmVxdWVzdCBkYXRhLlxuICAgICAgICAgKlxuICAgICAgICAgKiBUaGlzIG1ldGhvZCBleHBlY3RzIGEgc3Vic2V0IG9mIG1vZGVsIHByb3BlcnRpZXMgYXMgcmVxdWVzdCBwYXJhbWV0ZXJzLlxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0ge2Z1bmN0aW9uKE9iamVjdCxPYmplY3QpPX0gc3VjY2Vzc0NiXG4gICAgICAgICAqICAgU3VjY2VzcyBjYWxsYmFjayB3aXRoIHR3byBhcmd1bWVudHM6IGB2YWx1ZWAsIGByZXNwb25zZUhlYWRlcnNgLlxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0ge2Z1bmN0aW9uKE9iamVjdCk9fSBlcnJvckNiIEVycm9yIGNhbGxiYWNrIHdpdGggb25lIGFyZ3VtZW50OlxuICAgICAgICAgKiAgIGBodHRwUmVzcG9uc2VgLlxuICAgICAgICAgKlxuICAgICAgICAgKiBAcmV0dXJucyB7T2JqZWN0fSBBbiBlbXB0eSByZWZlcmVuY2UgdGhhdCB3aWxsIGJlXG4gICAgICAgICAqICAgcG9wdWxhdGVkIHdpdGggdGhlIGFjdHVhbCBkYXRhIG9uY2UgdGhlIHJlc3BvbnNlIGlzIHJldHVybmVkXG4gICAgICAgICAqICAgZnJvbSB0aGUgc2VydmVyLlxuICAgICAgICAgKlxuICAgICAgICAgKiBUaGUgbnVtYmVyIG9mIGluc3RhbmNlcyB1cGRhdGVkXG4gICAgICAgICAqL1xuICAgICAgICBSW1widXBkYXRlXCJdID0gUltcInVwZGF0ZUFsbFwiXTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogQG5nZG9jIG1ldGhvZFxuICAgICAgICAgKiBAbmFtZSBsYlNlcnZpY2VzLk5ldHRlc3QjZGVzdHJveUJ5SWRcbiAgICAgICAgICogQG1ldGhvZE9mIGxiU2VydmljZXMuTmV0dGVzdFxuICAgICAgICAgKlxuICAgICAgICAgKiBAZGVzY3JpcHRpb25cbiAgICAgICAgICpcbiAgICAgICAgICogRGVsZXRlIGEgbW9kZWwgaW5zdGFuY2UgYnkgaWQgZnJvbSB0aGUgZGF0YSBzb3VyY2UuXG4gICAgICAgICAqXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0PX0gcGFyYW1ldGVycyBSZXF1ZXN0IHBhcmFtZXRlcnMuXG4gICAgICAgICAqXG4gICAgICAgICAqICAtIGBpZGAg4oCTIGB7Kn1gIC0gTW9kZWwgaWRcbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHtmdW5jdGlvbihPYmplY3QsT2JqZWN0KT19IHN1Y2Nlc3NDYlxuICAgICAgICAgKiAgIFN1Y2Nlc3MgY2FsbGJhY2sgd2l0aCB0d28gYXJndW1lbnRzOiBgdmFsdWVgLCBgcmVzcG9uc2VIZWFkZXJzYC5cbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHtmdW5jdGlvbihPYmplY3QpPX0gZXJyb3JDYiBFcnJvciBjYWxsYmFjayB3aXRoIG9uZSBhcmd1bWVudDpcbiAgICAgICAgICogICBgaHR0cFJlc3BvbnNlYC5cbiAgICAgICAgICpcbiAgICAgICAgICogQHJldHVybnMge09iamVjdH0gQW4gZW1wdHkgcmVmZXJlbmNlIHRoYXQgd2lsbCBiZVxuICAgICAgICAgKiAgIHBvcHVsYXRlZCB3aXRoIHRoZSBhY3R1YWwgZGF0YSBvbmNlIHRoZSByZXNwb25zZSBpcyByZXR1cm5lZFxuICAgICAgICAgKiAgIGZyb20gdGhlIHNlcnZlci5cbiAgICAgICAgICpcbiAgICAgICAgICogPGVtPlxuICAgICAgICAgKiAoVGhlIHJlbW90ZSBtZXRob2QgZGVmaW5pdGlvbiBkb2VzIG5vdCBwcm92aWRlIGFueSBkZXNjcmlwdGlvbi5cbiAgICAgICAgICogVGhpcyB1c3VhbGx5IG1lYW5zIHRoZSByZXNwb25zZSBpcyBhIGBOZXR0ZXN0YCBvYmplY3QuKVxuICAgICAgICAgKiA8L2VtPlxuICAgICAgICAgKi9cbiAgICAgICAgUltcImRlc3Ryb3lCeUlkXCJdID0gUltcImRlbGV0ZUJ5SWRcIl07XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEBuZ2RvYyBtZXRob2RcbiAgICAgICAgICogQG5hbWUgbGJTZXJ2aWNlcy5OZXR0ZXN0I3JlbW92ZUJ5SWRcbiAgICAgICAgICogQG1ldGhvZE9mIGxiU2VydmljZXMuTmV0dGVzdFxuICAgICAgICAgKlxuICAgICAgICAgKiBAZGVzY3JpcHRpb25cbiAgICAgICAgICpcbiAgICAgICAgICogRGVsZXRlIGEgbW9kZWwgaW5zdGFuY2UgYnkgaWQgZnJvbSB0aGUgZGF0YSBzb3VyY2UuXG4gICAgICAgICAqXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0PX0gcGFyYW1ldGVycyBSZXF1ZXN0IHBhcmFtZXRlcnMuXG4gICAgICAgICAqXG4gICAgICAgICAqICAtIGBpZGAg4oCTIGB7Kn1gIC0gTW9kZWwgaWRcbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHtmdW5jdGlvbihPYmplY3QsT2JqZWN0KT19IHN1Y2Nlc3NDYlxuICAgICAgICAgKiAgIFN1Y2Nlc3MgY2FsbGJhY2sgd2l0aCB0d28gYXJndW1lbnRzOiBgdmFsdWVgLCBgcmVzcG9uc2VIZWFkZXJzYC5cbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHtmdW5jdGlvbihPYmplY3QpPX0gZXJyb3JDYiBFcnJvciBjYWxsYmFjayB3aXRoIG9uZSBhcmd1bWVudDpcbiAgICAgICAgICogICBgaHR0cFJlc3BvbnNlYC5cbiAgICAgICAgICpcbiAgICAgICAgICogQHJldHVybnMge09iamVjdH0gQW4gZW1wdHkgcmVmZXJlbmNlIHRoYXQgd2lsbCBiZVxuICAgICAgICAgKiAgIHBvcHVsYXRlZCB3aXRoIHRoZSBhY3R1YWwgZGF0YSBvbmNlIHRoZSByZXNwb25zZSBpcyByZXR1cm5lZFxuICAgICAgICAgKiAgIGZyb20gdGhlIHNlcnZlci5cbiAgICAgICAgICpcbiAgICAgICAgICogPGVtPlxuICAgICAgICAgKiAoVGhlIHJlbW90ZSBtZXRob2QgZGVmaW5pdGlvbiBkb2VzIG5vdCBwcm92aWRlIGFueSBkZXNjcmlwdGlvbi5cbiAgICAgICAgICogVGhpcyB1c3VhbGx5IG1lYW5zIHRoZSByZXNwb25zZSBpcyBhIGBOZXR0ZXN0YCBvYmplY3QuKVxuICAgICAgICAgKiA8L2VtPlxuICAgICAgICAgKi9cbiAgICAgICAgUltcInJlbW92ZUJ5SWRcIl0gPSBSW1wiZGVsZXRlQnlJZFwiXTtcblxuXG4gICAgLyoqXG4gICAgKiBAbmdkb2MgcHJvcGVydHlcbiAgICAqIEBuYW1lIGxiU2VydmljZXMuTmV0dGVzdCNtb2RlbE5hbWVcbiAgICAqIEBwcm9wZXJ0eU9mIGxiU2VydmljZXMuTmV0dGVzdFxuICAgICogQGRlc2NyaXB0aW9uXG4gICAgKiBUaGUgbmFtZSBvZiB0aGUgbW9kZWwgcmVwcmVzZW50ZWQgYnkgdGhpcyAkcmVzb3VyY2UsXG4gICAgKiBpLmUuIGBOZXR0ZXN0YC5cbiAgICAqL1xuICAgIFIubW9kZWxOYW1lID0gXCJOZXR0ZXN0XCI7XG5cblxuICAgIHJldHVybiBSO1xuICB9XSk7XG5cblxubW9kdWxlXG4gIC5mYWN0b3J5KCdMb29wQmFja0F1dGgnLCBmdW5jdGlvbigpIHtcbiAgICB2YXIgcHJvcHMgPSBbJ2FjY2Vzc1Rva2VuSWQnLCAnY3VycmVudFVzZXJJZCddO1xuICAgIHZhciBwcm9wc1ByZWZpeCA9ICckTG9vcEJhY2skJztcblxuICAgIGZ1bmN0aW9uIExvb3BCYWNrQXV0aCgpIHtcbiAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgIHByb3BzLmZvckVhY2goZnVuY3Rpb24obmFtZSkge1xuICAgICAgICBzZWxmW25hbWVdID0gbG9hZChuYW1lKTtcbiAgICAgIH0pO1xuICAgICAgdGhpcy5yZW1lbWJlck1lID0gdW5kZWZpbmVkO1xuICAgICAgdGhpcy5jdXJyZW50VXNlckRhdGEgPSBudWxsO1xuICAgIH1cblxuICAgIExvb3BCYWNrQXV0aC5wcm90b3R5cGUuc2F2ZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgdmFyIHN0b3JhZ2UgPSB0aGlzLnJlbWVtYmVyTWUgPyBsb2NhbFN0b3JhZ2UgOiBzZXNzaW9uU3RvcmFnZTtcbiAgICAgIHByb3BzLmZvckVhY2goZnVuY3Rpb24obmFtZSkge1xuICAgICAgICBzYXZlKHN0b3JhZ2UsIG5hbWUsIHNlbGZbbmFtZV0pO1xuICAgICAgfSk7XG4gICAgfTtcblxuICAgIExvb3BCYWNrQXV0aC5wcm90b3R5cGUuc2V0VXNlciA9IGZ1bmN0aW9uKGFjY2Vzc1Rva2VuSWQsIHVzZXJJZCwgdXNlckRhdGEpIHtcbiAgICAgIHRoaXMuYWNjZXNzVG9rZW5JZCA9IGFjY2Vzc1Rva2VuSWQ7XG4gICAgICB0aGlzLmN1cnJlbnRVc2VySWQgPSB1c2VySWQ7XG4gICAgICB0aGlzLmN1cnJlbnRVc2VyRGF0YSA9IHVzZXJEYXRhO1xuICAgIH1cblxuICAgIExvb3BCYWNrQXV0aC5wcm90b3R5cGUuY2xlYXJVc2VyID0gZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLmFjY2Vzc1Rva2VuSWQgPSBudWxsO1xuICAgICAgdGhpcy5jdXJyZW50VXNlcklkID0gbnVsbDtcbiAgICAgIHRoaXMuY3VycmVudFVzZXJEYXRhID0gbnVsbDtcbiAgICB9XG5cbiAgICBMb29wQmFja0F1dGgucHJvdG90eXBlLmNsZWFyU3RvcmFnZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgcHJvcHMuZm9yRWFjaChmdW5jdGlvbihuYW1lKSB7XG4gICAgICAgIHNhdmUoc2Vzc2lvblN0b3JhZ2UsIG5hbWUsIG51bGwpO1xuICAgICAgICBzYXZlKGxvY2FsU3RvcmFnZSwgbmFtZSwgbnVsbCk7XG4gICAgICB9KTtcbiAgICB9O1xuXG4gICAgcmV0dXJuIG5ldyBMb29wQmFja0F1dGgoKTtcblxuICAgIC8vIE5vdGU6IExvY2FsU3RvcmFnZSBjb252ZXJ0cyB0aGUgdmFsdWUgdG8gc3RyaW5nXG4gICAgLy8gV2UgYXJlIHVzaW5nIGVtcHR5IHN0cmluZyBhcyBhIG1hcmtlciBmb3IgbnVsbC91bmRlZmluZWQgdmFsdWVzLlxuICAgIGZ1bmN0aW9uIHNhdmUoc3RvcmFnZSwgbmFtZSwgdmFsdWUpIHtcbiAgICAgIHZhciBrZXkgPSBwcm9wc1ByZWZpeCArIG5hbWU7XG4gICAgICBpZiAodmFsdWUgPT0gbnVsbCkgdmFsdWUgPSAnJztcbiAgICAgIHN0b3JhZ2Vba2V5XSA9IHZhbHVlO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGxvYWQobmFtZSkge1xuICAgICAgdmFyIGtleSA9IHByb3BzUHJlZml4ICsgbmFtZTtcbiAgICAgIHJldHVybiBsb2NhbFN0b3JhZ2Vba2V5XSB8fCBzZXNzaW9uU3RvcmFnZVtrZXldIHx8IG51bGw7XG4gICAgfVxuICB9KVxuICAuY29uZmlnKFsnJGh0dHBQcm92aWRlcicsIGZ1bmN0aW9uKCRodHRwUHJvdmlkZXIpIHtcbiAgICAkaHR0cFByb3ZpZGVyLmludGVyY2VwdG9ycy5wdXNoKCdMb29wQmFja0F1dGhSZXF1ZXN0SW50ZXJjZXB0b3InKTtcbiAgfV0pXG4gIC5mYWN0b3J5KCdMb29wQmFja0F1dGhSZXF1ZXN0SW50ZXJjZXB0b3InLCBbICckcScsICdMb29wQmFja0F1dGgnLFxuICAgIGZ1bmN0aW9uKCRxLCBMb29wQmFja0F1dGgpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgICdyZXF1ZXN0JzogZnVuY3Rpb24oY29uZmlnKSB7XG5cbiAgICAgICAgICAvLyBmaWx0ZXIgb3V0IG5vbiB1cmxCYXNlIHJlcXVlc3RzXG4gICAgICAgICAgaWYgKGNvbmZpZy51cmwuc3Vic3RyKDAsIHVybEJhc2UubGVuZ3RoKSAhPT0gdXJsQmFzZSkge1xuICAgICAgICAgICAgcmV0dXJuIGNvbmZpZztcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoTG9vcEJhY2tBdXRoLmFjY2Vzc1Rva2VuSWQpIHtcbiAgICAgICAgICAgIGNvbmZpZy5oZWFkZXJzW2F1dGhIZWFkZXJdID0gTG9vcEJhY2tBdXRoLmFjY2Vzc1Rva2VuSWQ7XG4gICAgICAgICAgfSBlbHNlIGlmIChjb25maWcuX19pc0dldEN1cnJlbnRVc2VyX18pIHtcbiAgICAgICAgICAgIC8vIFJldHVybiBhIHN0dWIgNDAxIGVycm9yIGZvciBVc2VyLmdldEN1cnJlbnQoKSB3aGVuXG4gICAgICAgICAgICAvLyB0aGVyZSBpcyBubyB1c2VyIGxvZ2dlZCBpblxuICAgICAgICAgICAgdmFyIHJlcyA9IHtcbiAgICAgICAgICAgICAgYm9keTogeyBlcnJvcjogeyBzdGF0dXM6IDQwMSB9IH0sXG4gICAgICAgICAgICAgIHN0YXR1czogNDAxLFxuICAgICAgICAgICAgICBjb25maWc6IGNvbmZpZyxcbiAgICAgICAgICAgICAgaGVhZGVyczogZnVuY3Rpb24oKSB7IHJldHVybiB1bmRlZmluZWQ7IH1cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICByZXR1cm4gJHEucmVqZWN0KHJlcyk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBjb25maWcgfHwgJHEud2hlbihjb25maWcpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfV0pXG5cbiAgLyoqXG4gICAqIEBuZ2RvYyBvYmplY3RcbiAgICogQG5hbWUgbGJTZXJ2aWNlcy5Mb29wQmFja1Jlc291cmNlUHJvdmlkZXJcbiAgICogQGhlYWRlciBsYlNlcnZpY2VzLkxvb3BCYWNrUmVzb3VyY2VQcm92aWRlclxuICAgKiBAZGVzY3JpcHRpb25cbiAgICogVXNlIGBMb29wQmFja1Jlc291cmNlUHJvdmlkZXJgIHRvIGNoYW5nZSB0aGUgZ2xvYmFsIGNvbmZpZ3VyYXRpb25cbiAgICogc2V0dGluZ3MgdXNlZCBieSBhbGwgbW9kZWxzLiBOb3RlIHRoYXQgdGhlIHByb3ZpZGVyIGlzIGF2YWlsYWJsZVxuICAgKiB0byBDb25maWd1cmF0aW9uIEJsb2NrcyBvbmx5LCBzZWVcbiAgICoge0BsaW5rIGh0dHBzOi8vZG9jcy5hbmd1bGFyanMub3JnL2d1aWRlL21vZHVsZSNtb2R1bGUtbG9hZGluZy1kZXBlbmRlbmNpZXMgTW9kdWxlIExvYWRpbmcgJiBEZXBlbmRlbmNpZXN9XG4gICAqIGZvciBtb3JlIGRldGFpbHMuXG4gICAqXG4gICAqICMjIEV4YW1wbGVcbiAgICpcbiAgICogYGBganNcbiAgICogYW5ndWxhci5tb2R1bGUoJ2FwcCcpXG4gICAqICAuY29uZmlnKGZ1bmN0aW9uKExvb3BCYWNrUmVzb3VyY2VQcm92aWRlcikge1xuICAgKiAgICAgTG9vcEJhY2tSZXNvdXJjZVByb3ZpZGVyLnNldEF1dGhIZWFkZXIoJ1gtQWNjZXNzLVRva2VuJyk7XG4gICAqICB9KTtcbiAgICogYGBgXG4gICAqL1xuICAucHJvdmlkZXIoJ0xvb3BCYWNrUmVzb3VyY2UnLCBmdW5jdGlvbiBMb29wQmFja1Jlc291cmNlUHJvdmlkZXIoKSB7XG4gICAgLyoqXG4gICAgICogQG5nZG9jIG1ldGhvZFxuICAgICAqIEBuYW1lIGxiU2VydmljZXMuTG9vcEJhY2tSZXNvdXJjZVByb3ZpZGVyI3NldEF1dGhIZWFkZXJcbiAgICAgKiBAbWV0aG9kT2YgbGJTZXJ2aWNlcy5Mb29wQmFja1Jlc291cmNlUHJvdmlkZXJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gaGVhZGVyIFRoZSBoZWFkZXIgbmFtZSB0byB1c2UsIGUuZy4gYFgtQWNjZXNzLVRva2VuYFxuICAgICAqIEBkZXNjcmlwdGlvblxuICAgICAqIENvbmZpZ3VyZSB0aGUgUkVTVCB0cmFuc3BvcnQgdG8gdXNlIGEgZGlmZmVyZW50IGhlYWRlciBmb3Igc2VuZGluZ1xuICAgICAqIHRoZSBhdXRoZW50aWNhdGlvbiB0b2tlbi4gSXQgaXMgc2VudCBpbiB0aGUgYEF1dGhvcml6YXRpb25gIGhlYWRlclxuICAgICAqIGJ5IGRlZmF1bHQuXG4gICAgICovXG4gICAgdGhpcy5zZXRBdXRoSGVhZGVyID0gZnVuY3Rpb24oaGVhZGVyKSB7XG4gICAgICBhdXRoSGVhZGVyID0gaGVhZGVyO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBAbmdkb2MgbWV0aG9kXG4gICAgICogQG5hbWUgbGJTZXJ2aWNlcy5Mb29wQmFja1Jlc291cmNlUHJvdmlkZXIjc2V0VXJsQmFzZVxuICAgICAqIEBtZXRob2RPZiBsYlNlcnZpY2VzLkxvb3BCYWNrUmVzb3VyY2VQcm92aWRlclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSB1cmwgVGhlIFVSTCB0byB1c2UsIGUuZy4gYC9hcGlgIG9yIGAvL2V4YW1wbGUuY29tL2FwaWAuXG4gICAgICogQGRlc2NyaXB0aW9uXG4gICAgICogQ2hhbmdlIHRoZSBVUkwgb2YgdGhlIFJFU1QgQVBJIHNlcnZlci4gQnkgZGVmYXVsdCwgdGhlIFVSTCBwcm92aWRlZFxuICAgICAqIHRvIHRoZSBjb2RlIGdlbmVyYXRvciAoYGxiLW5nYCBvciBgZ3J1bnQtbG9vcGJhY2stc2RrLWFuZ3VsYXJgKSBpcyB1c2VkLlxuICAgICAqL1xuICAgIHRoaXMuc2V0VXJsQmFzZSA9IGZ1bmN0aW9uKHVybCkge1xuICAgICAgdXJsQmFzZSA9IHVybDtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogQG5nZG9jIG1ldGhvZFxuICAgICAqIEBuYW1lIGxiU2VydmljZXMuTG9vcEJhY2tSZXNvdXJjZVByb3ZpZGVyI2dldFVybEJhc2VcbiAgICAgKiBAbWV0aG9kT2YgbGJTZXJ2aWNlcy5Mb29wQmFja1Jlc291cmNlUHJvdmlkZXJcbiAgICAgKiBAZGVzY3JpcHRpb25cbiAgICAgKiBHZXQgdGhlIFVSTCBvZiB0aGUgUkVTVCBBUEkgc2VydmVyLiBUaGUgVVJMIHByb3ZpZGVkXG4gICAgICogdG8gdGhlIGNvZGUgZ2VuZXJhdG9yIChgbGItbmdgIG9yIGBncnVudC1sb29wYmFjay1zZGstYW5ndWxhcmApIGlzIHVzZWQuXG4gICAgICovXG4gICAgdGhpcy5nZXRVcmxCYXNlID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gdXJsQmFzZTtcbiAgICB9O1xuXG4gICAgdGhpcy4kZ2V0ID0gWyckcmVzb3VyY2UnLCBmdW5jdGlvbigkcmVzb3VyY2UpIHtcbiAgICAgIHJldHVybiBmdW5jdGlvbih1cmwsIHBhcmFtcywgYWN0aW9ucykge1xuICAgICAgICB2YXIgcmVzb3VyY2UgPSAkcmVzb3VyY2UodXJsLCBwYXJhbXMsIGFjdGlvbnMpO1xuXG4gICAgICAgIC8vIEFuZ3VsYXIgYWx3YXlzIGNhbGxzIFBPU1Qgb24gJHNhdmUoKVxuICAgICAgICAvLyBUaGlzIGhhY2sgaXMgYmFzZWQgb25cbiAgICAgICAgLy8gaHR0cDovL2tpcmtidXNoZWxsLm1lL2FuZ3VsYXItanMtdXNpbmctbmctcmVzb3VyY2UtaW4tYS1tb3JlLXJlc3RmdWwtbWFubmVyL1xuICAgICAgICByZXNvdXJjZS5wcm90b3R5cGUuJHNhdmUgPSBmdW5jdGlvbihzdWNjZXNzLCBlcnJvcikge1xuICAgICAgICAgIC8vIEZvcnR1bmF0ZWx5LCBMb29wQmFjayBwcm92aWRlcyBhIGNvbnZlbmllbnQgYHVwc2VydGAgbWV0aG9kXG4gICAgICAgICAgLy8gdGhhdCBleGFjdGx5IGZpdHMgb3VyIG5lZWRzLlxuICAgICAgICAgIHZhciByZXN1bHQgPSByZXNvdXJjZS51cHNlcnQuY2FsbCh0aGlzLCB7fSwgdGhpcywgc3VjY2VzcywgZXJyb3IpO1xuICAgICAgICAgIHJldHVybiByZXN1bHQuJHByb21pc2UgfHwgcmVzdWx0O1xuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gcmVzb3VyY2U7XG4gICAgICB9O1xuICAgIH1dO1xuICB9KTtcblxufSkod2luZG93LCB3aW5kb3cuYW5ndWxhcik7XG4iXX0=