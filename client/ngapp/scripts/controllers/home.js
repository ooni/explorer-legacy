'use strict';

/**
 * @ngdoc function
 * @name ooniAPIApp.controller:HomeCtrl
 * @description
 * # HomeCtrl
 * Controller of the ooniAPIApp
 */

angular.module('ooniAPIApp')
  .controller('HomeCtrl', function ($q, $scope, $anchorScroll, $location, Report, Country) {

    $scope.map_clicked = function(geo) {
      // XXX add support for navigating to the country page
      var country_code = $scope.worldMap.data[geo.id].alpha2;
        // from = $location.hash(),
        // to = "reports-" + country_code;
      // $location.hash(to);
      // $anchorScroll();
      $location.path('/country/' + country_code);
    };

    $scope.loaded = false;

    $scope.countries = {
      alpha3: {},
      alpha2: {}
    };

    $scope.loading_phrases = [
      "Hacking some planet",
      "Extracting square root of i",
      "Modifying the space time continuum",
      "Adjusting ultra speed variable to be nominal",
      "Performing a safety meeting"
    ];

    var country_counts_promises = [];
    Report.countByCountry(function(report_counts) {
        $scope.reportsByCountry = report_counts;
        angular.forEach(report_counts, function(country){
            worldMap.data[country.alpha3] = {
                reportCount: country.name,
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
        $scope.loaded = true;
    });

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
    };
})

