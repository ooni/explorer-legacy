'use strict';

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

    var worldMap = {
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
                      'Number of reports ' + geo.properties.name,
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
                  worldMap.data[country.alpha3] = {
                      reportCount: country.count,
                      reportCountry: country.name,
                      alpha2: country.alpha2
                  };
                  if (alpha2WithBlockingDetected.indexOf(country.alpha2) !== -1) {
                      worldMap.data[country.alpha3]["fillKey"] = "BLOCKPAGE";
                  } else if (country.count < 10000) {
                      worldMap.data[country.alpha3]["fillKey"] = "LOW";
                  } else if (country.count < 100000) {
                      worldMap.data[country.alpha3]["fillKey"] = "MEDIUM";
                  } else {
                      worldMap.data[country.alpha3]["fillKey"] = "HIGH";
                  }
              })
              $scope.worldMap = worldMap;
              $scope.loaded = true;
              deferred.resolve($scope.reportsByCountry);
          }, function(err, resp){
            console.log(err, resp);
          });
      });

      return deferred.promise;
    }

    $scope.map_clicked = function(geo) {
      var country_code = $scope.worldMap.data[geo.id].alpha2;
      $location.path('/country/' + country_code);
    };

    $scope.viewCountry = function(row) {
      $scope.loaded = false;
      $location.path('/country/' + row.entity.alpha2);
    }
});

