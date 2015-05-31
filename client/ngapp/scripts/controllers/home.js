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

    var data = Report.listReportFiles({
      by: "probe_cc"
    }, function(res, headers) {
        angular.forEach(data, function(reports, cc) {
          var report_files = [];
          // XXX ghetto hax
          if (cc[0] == "$")
            return;
          angular.forEach(reports, function(report) {
            report_files.push({
              report_filename: report.report_filename,
              date: report.report_filename !== undefined ? report.report_filename.split("-")[0] : "unknown"
            });
          });

          $scope.reports_by_country.push({
            country: ISOCountryNames[cc],
            country_code: cc,
            report_files: report_files
          })
      });
    });
});
