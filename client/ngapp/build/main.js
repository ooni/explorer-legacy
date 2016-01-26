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
    'ui.codemirror',
    'iso-3166-country-codes',
    'jsonFormatter',
    'daterangepicker'
  ])
  .config(function ($routeProvider, $locationProvider) {
    Object.keys(window.CONFIG.routes)
      .forEach(function(route) {
        var routeDef = window.CONFIG.routes[route];
        $routeProvider.when(route, routeDef);
      });

    $routeProvider
      .otherwise({
        redirectTo: '/world'
      });

    $locationProvider.html5Mode(true);
  })
  // Things to run before the app loads;
  .run(function($rootScope, $location) {

    $rootScope.$location = $location;
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
  .controller('CountryDetailViewCtrl', function ($q, $scope, $rootScope, $filter, Report, $http, $routeParams, ISO3166) {
    $scope.loaded = false;

    $scope.countryCode = $routeParams.id;
    $scope.countryName = ISO3166.getCountryName($scope.countryCode);
    $scope.encodeInput = window.encodeURIComponent;

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
    });

    Report.vendors( {probe_cc: $scope.countryCode}, function(resp) {
      $scope.vendors = resp;
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

      console.log('query', query);

      if (queryOptions.order) {
        query.filter.order = queryOptions.order;
      }

      Report.find(query, function(data) {
        console.log('finding', data)
        deferred.resolve(data);
        $scope.loaded = true;
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
                                           $location, Nettest, Report,
                                           $routeParams, uiGridConstants,
                                           $rootScope) {

    $scope.loadMeasurements = function(queryOptions) {

      $scope.loaded = false;

      var deferred = $q.defer();
      var query = {
          filter: {
              fields: {
                  'test_name': true,
                  'probe_cc': true,
                  'probe_asn': true,
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

        $scope.loaded = true;
      });

      return deferred.promise;
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
  .controller('MeasurementDetailViewCtrl', function ($q, $scope, $anchorScroll, $rootScope, $location, Report, Nettest, Country, $routeParams, ISO3166) {

    $scope.measurementId = $routeParams.id;
    $scope.measurementInput = $routeParams.input;

    $rootScope.loaded = false;
    // XXX should use external pagination feature of ui grid
    // http://ui-grid.info/docs/#/tutorial/314_external_pagination
    $scope.pageNumber = 0;
    $scope.pageSize = 100;
    $scope.definitions = definitions;

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
      $scope.report = data[0];
      console.log(data[0]);


      $scope.nettest = Nettest.findOne({
        filter: {
          where: {
            name: $scope.report.test_name
          }
        }
      });

      $scope.countryName = ISO3166.getCountryName($scope.report.probe_cc);

      $rootScope.loaded = true;
    }

    function loading_failure() {
      $rootScope.loaded = true;
      $scope.not_found = true;
    }

    if ($scope.measurementInput !== undefined) {
        query['filter']['where']['input'] = $scope.measurementInput;
        $scope.measurement = Report.find(query, loading_success, loading_failure);
    } else {
        $scope.measurements = Report.find(query, loading_success, loading_failure);
    }

});


var definitions = {
  options: {
    description: "A dictionary containing the keys and values of options passed to the test",
  },
  probe_asn: {
    description: "The AS Number of the probe (prefixed by AS, ex. AS1234) or null if includeasn is set to false.",
  },
  probe_cc: {
    description: "The two letter country code of the probe or null if inlcudecc is set to false.",
  },
  as_number: {
    external_url: "https://en.wikipedia.org/wiki/Autonomous_system_%28Internet%29"
  },
  probe_ip: {
    description: "The IPv4 address of the probe or null if includeip is set to false.",
  },
  software_name: {
    description: "The name of the software that has generated such report (ex. ooniprobe).",
  },
  software_version: {
    description: "The version of the software that has generated such report (ex. 0.0.10).",
  },
  start_time: {
    description: "The time at which the test was started in seconds since epoch.",
  },
  test_name: {
    description: "The name of the test that such report is for (ex. HTTP Requests).",
  },
  test_version: {
    description: "The version of the test that such report is for (ex. 0.0.10).",
  },
  data_format: {
    description: "The version string of the data format being used by the test (ex. httpt-000)",
  },
  report_id: {
    description: "A 64 character mixed case string that is generated by the client used to identify the report.",
  },
  test_helpers: {
    description: "A dictionary with as keys the names of the options and values the addresses of the test helpers used",
  },
  test_input: {
    description: "The specific input for this test"
  }
}

;angular.module('ooniAPIApp')
.controller('HTTPRequestsViewCtrl', function ($scope, $location){

  angular.forEach($scope.report.test_keys.requests, function(request) {
    if (request.request.tor === true || request.request.tor.is_tor === true) {
      $scope.control = request;
    } else {
      $scope.experiment = request;
    }
  });

  $scope.experiment_body = null;
  if ($scope.experiment && $scope.experiment.response && $scope.experiment.response.body) {
    $scope.experiment_body = $scope.experiment.response.body;
  }
  $scope.body_length_match = 'unknown';
  if ($scope.report.test_keys.body_length_match == true) {
    $scope.body_length_match = 'true';
  } else if ($scope.report.test_keys.body_length_match == false) {
    $scope.body_length_match = 'false';
  }

  $scope.experiment_failure = $scope.experiment.failure || 'none';
  $scope.control_failure = $scope.control.failure || 'none';

  $scope.anomaly = false;
  if ($scope.body_length_match === 'false') {
    $scope.anomaly = true;
  }
  if ($scope.experiment_failure !== 'none' && $scope.control_failure === 'none') {
    $scope.anomaly = true;
  }

  $scope.header_names = [];
  if ($scope.control && $scope.control.response) {
      console.log($scope.control);
      for (var header_name in $scope.control.response.headers) {
          if ($scope.header_names.indexOf(header_name) == -1) {
              $scope.header_names.push(header_name);
          }
      }
  }

  if ($scope.experiment && $scope.experiment.response) {
      for (var header_name in $scope.experiment.response.headers) {
          if ($scope.header_names.indexOf(header_name) == -1) {
              $scope.header_names.push(header_name);
          }
      }
  }

  $scope.code_mirror_options = {
      lineWrapping : true,
      mode: 'xml',
      readOnly: 'nocursor'
  }

});
;'use strict';

// The idea behind this file is to keep a place for all specific nettest
// controllers in one place, as long as they don't have any specific
// functionality

angular.module('ooniAPIApp')
.directive('ooniNettestDetails', function ($location) {
  return {
    restrict: 'A',
    scope: {
      report: '='
    },
    link: function($scope) {

      // Not sure if this is the best way to go about doing this.
      // It runs at all times.
      $scope.getContentUrl = function() {
        var nettestSlug = 'nettest';
        if ($scope.report !== undefined) {
          nettestSlug = $scope.report.test_name.replace('_', '-');
        }
        var url = '/views/nettests/' + nettestSlug + '.html';
        return url;
      }
    },
    template: '<div ng-include="getContentUrl()">fasdfdas</div>'
  }
})
.directive('ooniNettestSummary', function ($location) {
  return {
    restrict: 'A',
    scope: {
      report: '='
    },
    link: function($scope) {

      // Not sure if this is the best way to go about doing this.
      // It runs at all times.
      $scope.getContentUrl = function() {
        var nettestSlug = 'nettest';
        if ($scope.report !== undefined) {
          nettestSlug = $scope.report.test_name.replace('_', '-');
        }
        var url = '/views/nettests/' + nettestSlug + '-summary.html';
        return url;
      }
    },
    template: 'Build A Summary Template Directive',
    // template: '<div ng-include="getContentUrl()"></div>'
  }
});
;
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
    $rootScope.loaded = true;
});
;'use strict';

/**
 * @ngdoc function
 * @name ooniAPIApp.controller:WorldCtrl
 * @description
 * # WorldCtrl
 * Controller of the ooniAPIApp
 */

angular.module('ooniAPIApp')
  .controller('WorldCtrl', function ($q, $scope, $anchorScroll, $location, Report, Country, $rootScope) {

    $scope.loaded = false;

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
        field:'count',
        sortingAlgorithm: function(a, b) {
            a = parseInt(a);
            b = parseInt(b);
            if (a > b) {
                return 1;
            } else if (a < b) {
                return -1;
            } else {
                return 0;
            }
        }
    }]

    $scope.worldMap = {
        scope: 'world',
        responsive: true,
        fills: {
            'HIGH': colorbrewer.PuBu[4][3],
            'MEDIUM': colorbrewer.PuBu[4][2],
            'LOW': colorbrewer.PuBu[4][1],
            'BLOCKPAGE': '#B83564',
            'defaultFill': colorbrewer.PuBu[4][0]
        },
        data: {},
        geographyConfig: {
            popupTemplate: function(geo, data) {
              var reportCount = data !== null ? data.reportCount : 0;
              return ['<div class="hoverinfo"><strong>',
                      'Number of measurements ' + geo.properties.name,
                      ': ' +  reportCount,
                      '</strong></div>'].join('');
            },
            highlightFillColor: '#26292C',
            highlightBorderColor: '#B4B4B4',
            highlightBorderWidth: 1,
            highlightBorderOpacity: 1,
            borderColor: '#636363',
            borderWidth: 1
        }
    };

    $scope.mapPlugins = {
        icons: function(layer, data, options) {
            var self = this;

            var icons = layer.selectAll('.icon')
                .data(data)

            icons.enter()
                .append('text')
                .attr('class', 'icon')
                .attr('font-family', 'FontAwesome')
                .attr('font-size', '0.6em')
                .attr('stroke', '#111')
                .attr('x', function(d) {
                    var lat_lon = alpha2_to_lat_lon[d.alpha2];
                    return self.latLngToXY(lat_lon[0], lat_lon[1] - 1)[0];
                })
                .attr('y', function(d) {
                    var lat_lon = alpha2_to_lat_lon[d.alpha2];
                    return self.latLngToXY(lat_lon[0], lat_lon[1] - 1)[1];
                })
                .attr('pointer-events', 'none')
                .attr('fill', '#cc0000')
                .text(function(d) {
                    var value = '';

                    if (d.vendor == true) {
                        value += '\uf275';
                    }
                    if (d.tampering == true) {
                         value += ' \uf071';
                    }
                    return value;
                });
        }
    }

    $scope.mapPluginData = {icons: []};

    Report.vendors(function(data){
        var country_vendors = {};
        data.forEach(function(item){
            country_vendors[item.probe_cc] = true;
        });
        for (var alpha2 in country_vendors) {
            $scope.mapPluginData.icons.push({
                alpha2: alpha2,
                vendor: true
            });
        }
    });

    $scope.loadReports = function(queryOptions) {
      var deferred = $q.defer();

      var query = {}
      if (queryOptions.order) {
        query.order = queryOptions.order;
      }

      Report.countByCountry(query, function(report_counts) {
        console.log('fetched report counts', report_counts)
          Report.blockpageDetected(function(blockpage_countries) {
            console.log('fetched blockpage countries', blockpage_countries)
              var alpha2WithBlockingDetected = [];
              angular.forEach(blockpage_countries, function(country) {
                alpha2WithBlockingDetected.push(country.probe_cc);
              });
              $scope.reportsByCountry = report_counts;
              angular.forEach(report_counts, function(country){
                  $scope.worldMap.data[country.alpha3] = {
                      reportCount: country.count,
                      reportCountry: country.name,
                      alpha2: country.alpha2
                  };
                  if (alpha2WithBlockingDetected.indexOf(country.alpha2) !== -1) {
                      $scope.worldMap.data[country.alpha3]["fillKey"] = "BLOCKPAGE";
                  } else if (country.count < 10000) {
                      $scope.worldMap.data[country.alpha3]["fillKey"] = "LOW";
                  } else if (country.count < 100000) {
                      $scope.worldMap.data[country.alpha3]["fillKey"] = "MEDIUM";
                  } else {
                      $scope.worldMap.data[country.alpha3]["fillKey"] = "HIGH";
                  }
              })
              $scope.loaded = true;
              deferred.resolve($scope.reportsByCountry);
          }, function(err, resp){
            console.log(err, resp);
          });
      });

      return deferred.promise;
    }

    $scope.map_clicked = function(geo) {
      if (typeof $scope.worldMap.data[geo.id] !== 'undefined') {
        var country_code = $scope.worldMap.data[geo.id].alpha2;
        $location.path('/country/' + country_code);
      }
    };

    $scope.viewCountry = function(row) {
      return '/country/' + row.entity.alpha2;
    }
});

var alpha2_to_lat_lon = {
 'AD': ['42.5000', '1.5000'],
 'AE': ['24.0000', '54.0000'],
 'AF': ['33.0000', '65.0000'],
 'AG': ['17.0500', '-61.8000'],
 'AI': ['18.2500', '-63.1667'],
 'AL': ['41.0000', '20.0000'],
 'AM': ['40.0000', '45.0000'],
 'AN': ['12.2500', '-68.7500'],
 'AO': ['-12.5000', '18.5000'],
 'AP': ['35.0000', '105.0000'],
 'AQ': ['-90.0000', '0.0000'],
 'AR': ['-34.0000', '-64.0000'],
 'AS': ['-14.3333', '-170.0000'],
 'AT': ['47.3333', '13.3333'],
 'AU': ['-27.0000', '133.0000'],
 'AW': ['12.5000', '-69.9667'],
 'AZ': ['40.5000', '47.5000'],
 'BA': ['44.0000', '18.0000'],
 'BB': ['13.1667', '-59.5333'],
 'BD': ['24.0000', '90.0000'],
 'BE': ['50.8333', '4.0000'],
 'BF': ['13.0000', '-2.0000'],
 'BG': ['43.0000', '25.0000'],
 'BH': ['26.0000', '50.5500'],
 'BI': ['-3.5000', '30.0000'],
 'BJ': ['9.5000', '2.2500'],
 'BM': ['32.3333', '-64.7500'],
 'BN': ['4.5000', '114.6667'],
 'BO': ['-17.0000', '-65.0000'],
 'BR': ['-10.0000', '-55.0000'],
 'BS': ['24.2500', '-76.0000'],
 'BT': ['27.5000', '90.5000'],
 'BV': ['-54.4333', '3.4000'],
 'BW': ['-22.0000', '24.0000'],
 'BY': ['53.0000', '28.0000'],
 'BZ': ['17.2500', '-88.7500'],
 'CA': ['60.0000', '-95.0000'],
 'CC': ['-12.5000', '96.8333'],
 'CD': ['0.0000', '25.0000'],
 'CF': ['7.0000', '21.0000'],
 'CG': ['-1.0000', '15.0000'],
 'CH': ['47.0000', '8.0000'],
 'CI': ['8.0000', '-5.0000'],
 'CK': ['-21.2333', '-159.7667'],
 'CL': ['-30.0000', '-71.0000'],
 'CM': ['6.0000', '12.0000'],
 'CN': ['35.0000', '105.0000'],
 'CO': ['4.0000', '-72.0000'],
 'CR': ['10.0000', '-84.0000'],
 'CU': ['21.5000', '-80.0000'],
 'CV': ['16.0000', '-24.0000'],
 'CX': ['-10.5000', '105.6667'],
 'CY': ['35.0000', '33.0000'],
 'CZ': ['49.7500', '15.5000'],
 'DE': ['51.0000', '9.0000'],
 'DJ': ['11.5000', '43.0000'],
 'DK': ['56.0000', '10.0000'],
 'DM': ['15.4167', '-61.3333'],
 'DO': ['19.0000', '-70.6667'],
 'DZ': ['28.0000', '3.0000'],
 'EC': ['-2.0000', '-77.5000'],
 'EE': ['59.0000', '26.0000'],
 'EG': ['27.0000', '30.0000'],
 'EH': ['24.5000', '-13.0000'],
 'ER': ['15.0000', '39.0000'],
 'ES': ['40.0000', '-4.0000'],
 'ET': ['8.0000', '38.0000'],
 'EU': ['47.0000', '8.0000'],
 'FI': ['64.0000', '26.0000'],
 'FJ': ['-18.0000', '175.0000'],
 'FK': ['-51.7500', '-59.0000'],
 'FM': ['6.9167', '158.2500'],
 'FO': ['62.0000', '-7.0000'],
 'FR': ['46.0000', '2.0000'],
 'GA': ['-1.0000', '11.7500'],
 'GB': ['54.0000', '-2.0000'],
 'GD': ['12.1167', '-61.6667'],
 'GE': ['42.0000', '43.5000'],
 'GF': ['4.0000', '-53.0000'],
 'GH': ['8.0000', '-2.0000'],
 'GI': ['36.1833', '-5.3667'],
 'GL': ['72.0000', '-40.0000'],
 'GM': ['13.4667', '-16.5667'],
 'GN': ['11.0000', '-10.0000'],
 'GP': ['16.2500', '-61.5833'],
 'GQ': ['2.0000', '10.0000'],
 'GR': ['39.0000', '22.0000'],
 'GS': ['-54.5000', '-37.0000'],
 'GT': ['15.5000', '-90.2500'],
 'GU': ['13.4667', '144.7833'],
 'GW': ['12.0000', '-15.0000'],
 'GY': ['5.0000', '-59.0000'],
 'HK': ['22.2500', '114.1667'],
 'HM': ['-53.1000', '72.5167'],
 'HN': ['15.0000', '-86.5000'],
 'HR': ['45.1667', '15.5000'],
 'HT': ['19.0000', '-72.4167'],
 'HU': ['47.0000', '20.0000'],
 'ID': ['-5.0000', '120.0000'],
 'IE': ['53.0000', '-8.0000'],
 'IL': ['31.5000', '34.7500'],
 'IN': ['20.0000', '77.0000'],
 'IO': ['-6.0000', '71.5000'],
 'IQ': ['33.0000', '44.0000'],
 'IR': ['32.0000', '53.0000'],
 'IS': ['65.0000', '-18.0000'],
 'IT': ['42.8333', '12.8333'],
 'JM': ['18.2500', '-77.5000'],
 'JO': ['31.0000', '36.0000'],
 'JP': ['36.0000', '138.0000'],
 'KE': ['1.0000', '38.0000'],
 'KG': ['41.0000', '75.0000'],
 'KH': ['13.0000', '105.0000'],
 'KI': ['1.4167', '173.0000'],
 'KM': ['-12.1667', '44.2500'],
 'KN': ['17.3333', '-62.7500'],
 'KP': ['40.0000', '127.0000'],
 'KR': ['37.0000', '127.5000'],
 'KW': ['29.3375', '47.6581'],
 'KY': ['19.5000', '-80.5000'],
 'KZ': ['48.0000', '68.0000'],
 'LA': ['18.0000', '105.0000'],
 'LB': ['33.8333', '35.8333'],
 'LC': ['13.8833', '-61.1333'],
 'LI': ['47.1667', '9.5333'],
 'LK': ['7.0000', '81.0000'],
 'LR': ['6.5000', '-9.5000'],
 'LS': ['-29.5000', '28.5000'],
 'LT': ['56.0000', '24.0000'],
 'LU': ['49.7500', '6.1667'],
 'LV': ['57.0000', '25.0000'],
 'LY': ['25.0000', '17.0000'],
 'MA': ['32.0000', '-5.0000'],
 'MC': ['43.7333', '7.4000'],
 'MD': ['47.0000', '29.0000'],
 'ME': ['42.0000', '19.0000'],
 'MG': ['-20.0000', '47.0000'],
 'MH': ['9.0000', '168.0000'],
 'MK': ['41.8333', '22.0000'],
 'ML': ['17.0000', '-4.0000'],
 'MM': ['22.0000', '98.0000'],
 'MN': ['46.0000', '105.0000'],
 'MO': ['22.1667', '113.5500'],
 'MP': ['15.2000', '145.7500'],
 'MQ': ['14.6667', '-61.0000'],
 'MR': ['20.0000', '-12.0000'],
 'MS': ['16.7500', '-62.2000'],
 'MT': ['35.8333', '14.5833'],
 'MU': ['-20.2833', '57.5500'],
 'MV': ['3.2500', '73.0000'],
 'MW': ['-13.5000', '34.0000'],
 'MX': ['23.0000', '-102.0000'],
 'MY': ['2.5000', '112.5000'],
 'MZ': ['-18.2500', '35.0000'],
 'NA': ['-22.0000', '17.0000'],
 'NC': ['-21.5000', '165.5000'],
 'NE': ['16.0000', '8.0000'],
 'NF': ['-29.0333', '167.9500'],
 'NG': ['10.0000', '8.0000'],
 'NI': ['13.0000', '-85.0000'],
 'NL': ['52.5000', '5.7500'],
 'NO': ['62.0000', '10.0000'],
 'NP': ['28.0000', '84.0000'],
 'NR': ['-0.5333', '166.9167'],
 'NU': ['-19.0333', '-169.8667'],
 'NZ': ['-41.0000', '174.0000'],
 'OM': ['21.0000', '57.0000'],
 'PA': ['9.0000', '-80.0000'],
 'PE': ['-10.0000', '-76.0000'],
 'PF': ['-15.0000', '-140.0000'],
 'PG': ['-6.0000', '147.0000'],
 'PH': ['13.0000', '122.0000'],
 'PK': ['30.0000', '70.0000'],
 'PL': ['52.0000', '20.0000'],
 'PM': ['46.8333', '-56.3333'],
 'PR': ['18.2500', '-66.5000'],
 'PS': ['32.0000', '35.2500'],
 'PT': ['39.5000', '-8.0000'],
 'PW': ['7.5000', '134.5000'],
 'PY': ['-23.0000', '-58.0000'],
 'QA': ['25.5000', '51.2500'],
 'RE': ['-21.1000', '55.6000'],
 'RO': ['46.0000', '25.0000'],
 'RS': ['44.0000', '21.0000'],
 'RU': ['60.0000', '100.0000'],
 'RW': ['-2.0000', '30.0000'],
 'SA': ['25.0000', '45.0000'],
 'SB': ['-8.0000', '159.0000'],
 'SC': ['-4.5833', '55.6667'],
 'SD': ['15.0000', '30.0000'],
 'SE': ['62.0000', '15.0000'],
 'SG': ['1.3667', '103.8000'],
 'SH': ['-15.9333', '-5.7000'],
 'SI': ['46.0000', '15.0000'],
 'SJ': ['78.0000', '20.0000'],
 'SK': ['48.6667', '19.5000'],
 'SL': ['8.5000', '-11.5000'],
 'SM': ['43.7667', '12.4167'],
 'SN': ['14.0000', '-14.0000'],
 'SO': ['10.0000', '49.0000'],
 'SR': ['4.0000', '-56.0000'],
 'ST': ['1.0000', '7.0000'],
 'SV': ['13.8333', '-88.9167'],
 'SY': ['35.0000', '38.0000'],
 'SZ': ['-26.5000', '31.5000'],
 'TC': ['21.7500', '-71.5833'],
 'TD': ['15.0000', '19.0000'],
 'TF': ['-43.0000', '67.0000'],
 'TG': ['8.0000', '1.1667'],
 'TH': ['15.0000', '100.0000'],
 'TJ': ['39.0000', '71.0000'],
 'TK': ['-9.0000', '-172.0000'],
 'TM': ['40.0000', '60.0000'],
 'TN': ['34.0000', '9.0000'],
 'TO': ['-20.0000', '-175.0000'],
 'TR': ['39.0000', '35.0000'],
 'TT': ['11.0000', '-61.0000'],
 'TV': ['-8.0000', '178.0000'],
 'TW': ['23.5000', '121.0000'],
 'TZ': ['-6.0000', '35.0000'],
 'UA': ['49.0000', '32.0000'],
 'UG': ['1.0000', '32.0000'],
 'UM': ['19.2833', '166.6000'],
 'US': ['38.0000', '-97.0000'],
 'UY': ['-33.0000', '-56.0000'],
 'UZ': ['41.0000', '64.0000'],
 'VA': ['41.9000', '12.4500'],
 'VC': ['13.2500', '-61.2000'],
 'VE': ['8.0000', '-66.0000'],
 'VG': ['18.5000', '-64.5000'],
 'VI': ['18.3333', '-64.8333'],
 'VN': ['16.0000', '106.0000'],
 'VU': ['-16.0000', '167.0000'],
 'WF': ['-13.3000', '-176.2000'],
 'WS': ['-13.5833', '-172.3333'],
 'YE': ['15.0000', '48.0000'],
 'YT': ['-12.8333', '45.1667'],
 'ZA': ['-29.0000', '24.0000'],
 'ZM': ['-15.0000', '30.0000'],
 'ZW': ['-20.0000', '30.0000']
}
;/**
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
        $scope.dateRangePicker = {}

        $scope.dateRangePicker.date = {
          startDate: null,
          endDate: null
        };

        $scope.dateRangePicker.options = {
          maxDate: moment(),
          autoUpdateInput: true,
          eventHandlers: {
            'cancel.daterangepicker': function(ev, picker) {
              $scope.dateRangePicker.date = {startDate: null, endDate: null}
            }
          }
        }

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
                  return '/measurement/' + report.id;
              } else {
                  return '/measurement/' + report.id + '?input=' + encodeURIComponent(report.input);
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

        $scope.page = 1;
        $scope.perPage = 11;

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
            .attr('x', barWidth * 2 + barWidth)
            .classed({'blocked': true})
            .attr('y', function(d) { return y(d.block_count) - 10; })
            .attr("dy", ".75em")
            .text(function(d) { return d.block_count; });

          // date
          barGroupEnter.append("text")
            .attr('class', 'date')
            // .attr("", barWidth * 2)
            // .attr("y", height )
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

            var margin = {top: 60, right: 30, bottom: 60, left: 0},
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
         * @name lbServices.Report#blockpageList
         * @methodOf lbServices.Report
         *
         * @description
         *
         * Returns the list of URLs that appear to be blocked in a given country
         *
         * @param {Object=} parameters Request parameters.
         *
         *  - `probe_cc` – `{string=}` - 
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
        "blockpageList": {
          isArray: true,
          url: urlBase + "/reports/blockpageList",
          method: "GET"
        },

        /**
         * @ngdoc method
         * @name lbServices.Report#vendors
         * @methodOf lbServices.Report
         *
         * @description
         *
         * Returns the identified vendors of censorship and surveillance equipment
         *
         * @param {Object=} parameters Request parameters.
         *
         *  - `probe_cc` – `{string=}` - 
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
        "vendors": {
          isArray: true,
          url: urlBase + "/reports/vendors",
          method: "GET"
        },

        /**
         * @ngdoc method
         * @name lbServices.Report#blockpageDetected
         * @methodOf lbServices.Report
         *
         * @description
         *
         * Returns the country codes where we detected the presence of a blockpage
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
        "blockpageDetected": {
          isArray: true,
          url: urlBase + "/reports/blockpageDetected",
          method: "GET"
        },

        /**
         * @ngdoc method
         * @name lbServices.Report#blockpageCount
         * @methodOf lbServices.Report
         *
         * @description
         *
         * Returns the number of blockpages detected per total
         *
         * @param {Object=} parameters Request parameters.
         *
         *  - `probe_cc` – `{string=}` - 
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
        "blockpageCount": {
          isArray: true,
          url: urlBase + "/reports/blockpageCount",
          method: "GET"
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
