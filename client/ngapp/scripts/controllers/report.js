'use strict';

/**
 * @ngdoc function
 * @name ooniAPIApp.controller:ReportDetailViewCtrl
 * @description
 * # ReportDetailViewCtrl
 * Controller of the ooniAPIApp
 */

angular.module('ooniAPIApp')
  .controller('ReportDetailViewCtrl', function ($q, $scope, $anchorScroll, $location, Report, Country, HttpRequestsInteresting, $routeParams) {
    $scope.loading_phrases = [
      "Hacking some planet",
      "Extracting square root of i",
      "Modifying the space time continuum",
      "Adjusting ultra speed variable to be nominal",
      "Performing a safety meeting"
    ];
    $scope.reportId = $routeParams.id;
    $scope.loaded = false;
    $scope.report = Report.findOne({'id': $scope.reportId}, function(){
      $scope.loaded = true;
      console.log('success');
    }, function(error) {
      console.log('error', error)
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
