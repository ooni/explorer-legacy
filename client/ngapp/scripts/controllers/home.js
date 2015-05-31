'use strict';

/**
 * @ngdoc function
 * @name ooniAPIApp.controller:HomeCtrl
 * @description
 * # HomeCtrl
 * Controller of the ooniAPIApp
 */

angular.module('ooniAPIApp')
  .controller('HomeCtrl', function ($scope, Report) {
    $scope.reports_by_country = [];
 
    $scope.loaded = false;

    $scope.get_country = function(country_code) {
      return $scope.reports_by_country.countries[country_code];
    }

    $scope.reports_by_country = Report.listReportFiles({by: "probe_cc"}, function(reports_by_country) {
        var worldMap = {
          scope: 'world',
          element: d3.select(".worldMap").node(),
          responsive: true,
          geographyConfig: {
            highlighBorderColor: '#EAA9A8',
            highlighBorderWidth: 2
          },
          fills: {
            'HIGH': '#CC4731',
            'MEDIUM': '#306596',
            'LOW': '#667FAF',
            'defaultFill': '#DDDDDD'
          },
          data: {}
        }
  
        angular.forEach(reports_by_country.reports, function(reports, country_code) {
          var country = $scope.get_country(country_code);
          if (!country) {
            return;
          }

          worldMap.data[country.ISO.alpha3] = {
            reportCount: reports.length
          }
          if (reports.length < 100) {
            worldMap.data[country.ISO.alpha3]["fillKey"] = "LOW";
          } else if (reports.length < 1000) {
            worldMap.data[country.ISO.alpha3]["fillKey"] = "MEDIUM";
          } else {
            worldMap.data[country.ISO.alpha3]["fillKey"] = "HIGH";
          }
        });
        $scope.worldMap = new Datamap(worldMap);
        $scope.loaded = true;
    });
});
