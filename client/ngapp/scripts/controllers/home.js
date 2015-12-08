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
    $scope.reportsByCountry = [];
    $scope.reportsByCountryArray = [];
    $scope.countries_alpha3 = {};

    $scope.map_clicked = function(geo) {
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

    $scope.get_country = function(country_code) {
      if (country_code === undefined || country_code === null)
        return undefined


      if ($scope.countries.alpha2[country_code] === undefined) {
        $scope.countries.alpha2[country_code] = Country.getCountryInfo({country_code: country_code}, function(country) {
          if (country !== undefined) {
            $scope.countries.alpha3[country.alpha3] = country;
          }
          return country;
        });
      }
      if (country_code.length === 2) {
        return $scope.countries.alpha2[country_code];
      } else if (country_code.length === 3) {
        return $scope.countries.alpha3[country_code];
      }
    };

    Report.listReports({by: "probe_cc"}, function(reports_by_country) {

      $scope.reportsByCountry = reports_by_country;

      var country_info = [];

      angular.forEach($scope.reportsByCountry, function(reports, countryCode) {
        var country = $scope.get_country(countryCode);
        if (countryCode !== undefined && countryCode !== null && country !== undefined) {
          $scope.reportsByCountryArray.push({
            'country': country,
            'countryCode': countryCode,
            'reports': reports
          });

          country_info.push(country.$promise);
        }
      });

      $q.all(country_info).then(function() {
        angular.forEach($scope.reportsByCountry, function(reports, country_code) {
          var country = $scope.get_country(country_code);
          if (!country) {
            return;
          }
          worldMap.data[country.alpha3] = {
            reportCount: reports.county
          };
          if (reports.count < 100) {
            worldMap.data[country.alpha3]["fillKey"] = "LOW";
          } else if (reports.count < 1000) {
            worldMap.data[country.alpha3]["fillKey"] = "MEDIUM";
          } else {
            worldMap.data[country.alpha3]["fillKey"] = "HIGH";
          }
          $scope.worldMap = worldMap;
          $scope.loaded = true;
        });
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
    });
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
        reportsByCountryArray: '='
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
