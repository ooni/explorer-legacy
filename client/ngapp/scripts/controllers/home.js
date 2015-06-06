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
    $scope.reports_by_country = [];
    $scope.countries_alpha3 = {};

    $scope.map_clicked = function(geo) {
      var country_code = $scope.countries.alpha3[geo.id].alpha2,
        from = $location.hash(),
        to = "reports-" + country_code;
      $location.hash(to);
      $anchorScroll();
      $location.hash(from);

      $scope.toggle_reports(country_code, true);
    }

    $scope.loaded = false;
    
    $scope.countries = {
      alpha3: {},
      alpha2: {}
    };
    $scope.get_country = function(country_code) {
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
    }
    
    $scope.loading_phrases = [
      "Hacking some planet",
      "Extracting square root of i",
      "Modifying the space time continium",
      "Adjusting ultra speed variable to be nominal",
      "Performing a safety meeting"
    ]
    
    $scope.toggle_reports = function(country_code, show) {
      if ($scope.reports_by_country[country_code].shown === true && !show) {
        $scope.reports_by_country[country_code].shown = false;
        delete $scope.reports_by_country[country_code].report_files;
      } else {
        Report.findReports({
          country_code: country_code,
          limit: 0,
          fields: ["report_filename", "start_time", "test_name", "probe_asn", "report_id"]
        }, function(result){
          $scope.reports_by_country[country_code].shown = true;
          $scope.reports_by_country[country_code].reports = result.reports;
        });
      }
    }

    Report.listReports({by: "probe_cc"}, function(reports_by_country) {
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

        var country_info = []
        angular.forEach(reports_by_country, function(reports, country_code) {
          var country = $scope.get_country(country_code);
          if (country) {
            country_info.push(country.$promise);
          }
        });
        $q.all(country_info).then(function() {
          angular.forEach(reports_by_country, function(reports, country_code) {
            var country = $scope.get_country(country_code);
            if (!country) {
              return;
            }
            worldMap.data[country.alpha3] = {
              reportCount: reports.county
            }
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
    });
});
