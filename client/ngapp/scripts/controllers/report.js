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

    // XXX should use external pagination feature of ui grid
    // http://ui-grid.info/docs/#/tutorial/314_external_pagination
    $scope.pageNumber = 0;
    $scope.pageSize = 100;
    var query = {
        filter: {
            where: {
                'id': $scope.report_id
            },
            offset: $scope.pageNumber * $scope.pageSize,
            limit: $scope.pageSize
        }
    }
    $scope.measurements = Report.find(query);
});
