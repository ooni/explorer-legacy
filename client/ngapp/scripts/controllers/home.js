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
      var country_code = $scope.countries.alpha3[geo.id].alpha2,
        from = $location.hash(),
        to = "reports-" + country_code;
      $location.hash(to);
      $anchorScroll();
      $location.hash(from);
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
                reportCount: country.name
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

/**
 * @ngdoc function
 * @name ooniAPIApp.directive:ooniCountriesTable
 * @description
 * # ooniCountriesTable
 * A table that wraps summaries of reports for each country
 */

.directive('ooniCountriesTable', ["$location", "$filter", "Report", "Country",
            "uiGridConstants",
  function ($location, $filter, Report, Country, uiGridConstants) {
    return {
      restrict: 'A',
      scope: {
        reportsByCountry: '='
      },
      link: function ($scope, $element, $attrs) {
        $scope.viewCountry = function(countryCode) {
          $location.path('/country/'+countryCode);
        };
      },
      templateUrl: 'views/directives/countries-table.html',
    };
}])

/**
 * @ngdoc function
 * @name ooniAPIApp.directive:ooniCountriesTableItem
 * @description
 * # ooniCountriesTableItem
 * The rows of a table that show summaries of the reports for each country
 */

.directive('ooniCountriesTableItem', ["$location", "$filter", "Report", "Country",
            "uiGridConstants",
  function ($location, $filter, Report, Country, uiGridConstants) {
    return {
      restrict: 'A',
      scope: {
        countryObj: '=ooniCountriesTableItem',
      },
      link: function ($scope, $element, $attrs) {

      },
      templateUrl: 'views/directives/countries-table-item.html',
    };
}]);
