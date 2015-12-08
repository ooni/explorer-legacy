'use strict';

/**
 * @ngdoc function
 * @name ooniAPIApp.controller:ExploreViewCtrl
 * @description
 * # ExploreViewCtrl
 * Controller of the ooniAPIApp
 */

angular.module('ooniAPIApp')
  .controller('ExploreViewCtrl', function ($q, $scope, $anchorScroll, $location, Report, Country, HttpRequestsInteresting, $routeParams) {

    Report.findReports({}, function(response) {
      $scope.reports = response.reports;
    });
});
