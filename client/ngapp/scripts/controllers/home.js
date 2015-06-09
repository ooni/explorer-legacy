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
})
.controller('ReportListCtrl', ["$scope", "$location", "$filter", "Report", "Country",
            "uiGridConstants", function ($scope, $location, $filter, Report, Country,
                                         uiGridConstants) {
  $scope.shown = false;
  $scope.gridData = [];
  $scope.gridApi = null;
  $scope.columns = [];
  if ($scope.reports.interesting) {
    $scope.columns.push({"name": "anomalies", "field": "interesting"});
  }
  $scope.columns.push({"name": "date", "field": "date"});
  $scope.columns.push({"name": "testName", "field": "test_name"});
  $scope.columns.push({"name": "probeAsn", "field": "probe_asn"});
  $scope.columns.push({"name": "reportId", "field": "report_id"});
  $scope.columns.push({"name": "reportFilename", "field": "report_filename"});

  var rowTemplate = '<div>' +
                    '  <div ng-repeat="(colRenderIndex, col) in colContainer.renderedColumns track by col.colDef.name">' +
                    '    <div ng-click="grid.appScope.view_report(row)" class="ui-grid-cell" ng-if="col.colDef.name != \'reportFilename\'" ' +
                    '         ng-class="{ \'ui-grid-row-header-cell\': col.isRowHeader }"' +
                    '         ui-grid-cell></div>' +
                    '    <div class="ui-grid-cell" ng-if="col.colDef.name == \'reportFilename\'">' +
                    '      <a target="_self" href="{{grid.appScope.get_download_url(row)}}">download</a>' +
                    '    </div>' +
                    '  </div>' +
                    '</div>';

  $scope.gridOptions = {
    enableSorting: true,
    columnDefs: $scope.columns,
    data: 'gridData',
    rowTemplate: rowTemplate
  };

  $scope.view_report = function(row) {
    $location.path("/report/"+row.entity.report_id);
  }

  $scope.get_download_url = function(row) {
    return "/reportFiles/" + $filter('date')(row.entity.start_time * 1000, "yyyy-MM-dd") + '/' + row.entity.report_filename + '.gz';
  }

  $scope.toggle_reports = function(country_code, show) {
    if ($scope.shown === true && !show) {
      $scope.shown = false;
      delete $scope.gridData;
    } else {
      Report.findReports({
        country_code: country_code,
        limit: 0,
        fields: ["report_filename", "start_time", "test_name", "probe_asn", "report_id"]
      }, function(result) {
        $scope.shown = true;
        var anomalies = false;
        angular.forEach(result.reports, function(data) {
          var report = {}
          report["date"] = $filter('date')(data.start_time * 1000, "medium", "UTC");
          report["test_name"] = data.test_name;
          report["probe_asn"] = data.probe_asn;
          report["report_id"] = data.report_id;
          report["report_filename"] = data.report_filename;
          report["start_time"] = data.start_time;
          $scope.gridData.push(report)
        });
      });
    }
  }
}]);
