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
    $scope.measurementInput = $routeParams.input;

    $scope.loaded = false;
    // XXX should use external pagination feature of ui grid
    // http://ui-grid.info/docs/#/tutorial/314_external_pagination
    $scope.pageNumber = 0;
    $scope.pageSize = 100;

    var query = {
        filter: {
            where: {
                'id': $scope.reportId,
            },
            offset: $scope.pageNumber * $scope.pageSize,
            limit: $scope.pageSize
        }
    }

    function loading_success(data) {
        $scope.report = data[0];
        $scope.loaded = true;
    }

    function loading_failure() {
      $scope.loaded = true;
      $scope.not_found = true;
    }
    if ($scope.measurementInput != undefined) {
        query['filter']['where']['input'] = $scope.measurementInput;
        $scope.measurement = Report.find(query, loading_success, loading_failure);
    } else {
        $scope.measurements = Report.find(query, loading_success, loading_failure);
    }

});
