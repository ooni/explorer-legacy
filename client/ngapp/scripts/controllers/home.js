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
    Report.listReportFiles({
      by: "probe_cc"
    }, function(data, headers) {
      $scope.report_files = data;
    });
});
