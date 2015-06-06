'use strict';

/**
 * @ngdoc function
 * @name ooniAPIApp.controller:HomeCtrl
 * @description
 * # HomeCtrl
 * Controller of the ooniAPIApp
 */

angular.module('ooniAPIApp')
  .controller('ReportViewCtrl', function ($q, $scope, $anchorScroll, $location, Report, Country, HttpRequestsInteresting, $routeParams) {
    $scope.loading_phrases = [
      "Hacking some planet",
      "Extracting square root of i",
      "Modifying the space time continium",
      "Adjusting ultra speed variable to be nominal",
      "Performing a safety meeting"
    ];
    $scope.report_id = $routeParams.id;
 
    $scope.loaded = false;
    $scope.report = Report.findById({id: $scope.report_id}, function(){
      $scope.loaded = true;
    }, function() {
      $scope.loaded = true;
      $scope.not_found = true;
    });
    $scope.loaded_anomalies = false;

    $scope.anomalies = HttpRequestsInteresting.find({
      filter: {
        where: {
          report_id: $scope.report_id,
        },
        fields: {
          "report_id": true,
          "input": true,
          "start_time": true
        }
      }
    }, function(){
      $scope.loaded_anomalies = true;
    });
});
