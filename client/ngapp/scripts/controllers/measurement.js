'use strict';

/**
 * @ngdoc function
 * @name ooniAPIApp.controller:MeasurementDetailViewCtrl
 * @description
 * # ReportDetailViewCtrl
 * Controller of the ooniAPIApp
 */

angular.module('ooniAPIApp')
  .controller('MeasurementDetailViewCtrl', function ($q, $scope, $anchorScroll, $location, Report, Country, $routeParams) {

    $scope.measurementId = $routeParams.id;
    $scope.measurementInput = $routeParams.input;

    $scope.loaded = false;
    // XXX should use external pagination feature of ui grid
    // http://ui-grid.info/docs/#/tutorial/314_external_pagination
    $scope.pageNumber = 0;
    $scope.pageSize = 100;

    var query = {
        filter: {
            where: {
                'id': $scope.measurementId,
            },
            offset: $scope.pageNumber * $scope.pageSize,
            limit: $scope.pageSize
        }
    }

    function loading_success(data) {
      console.log('success');
      $scope.report = data[0];
      $scope.loaded = true;
    }

    function loading_failure() {
      console.log('hi');
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
