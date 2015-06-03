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
    
    $scope.loading_phrases = [
      "Hacking some planet",
      "Extracting square root of i",
      "Modifying the space time continium",
      "Adjusting ultra speed variable to be nominal",
      "Performing a safety meeting"
    ]

    Report.listReportFiles({by: "probe_cc"}, function(reports_by_country) {
        $scope.reports_by_country = reports_by_country;
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
        //$scope.worldMap = new Datamap(worldMap);
        $scope.worldMap = worldMap;
        $scope.loaded = true;
    });
});
