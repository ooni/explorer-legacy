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

    $scope.reports_by_country = Report.listReportFiles({by: "probe_cc"});
    $scope.get_country = function(country_code) {
      return ISOCountryNames[country_code];
    }
});
