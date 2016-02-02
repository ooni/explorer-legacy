'use strict';

// The idea behind this file is to keep a place for all specific nettest
// controllers in one place, as long as they don't have any specific
// functionality

angular.module('ooniAPIApp')
.directive('ooniNettestDetails', function ($location) {
  return {
    restrict: 'A',
    scope: {
      report: '='
    },
    link: function($scope) {

      // Not sure if this is the best way to go about doing this.
      // It runs at all times.
      $scope.getContentUrl = function() {
        var nettestSlug = 'nettest';
        if ($scope.report !== undefined) {
          nettestSlug = $scope.report.test_name.replace('_', '-');
        }
        var url = '/views/nettests/' + nettestSlug + '.html';
        return url;
      }
    },
    template: '<div ng-include="getContentUrl()">fasdfdas</div>'
  }
})
.directive('ooniNettestSummary', function ($location) {
  return {
    restrict: 'A',
    scope: {
      report: '='
    },
    link: function($scope) {

      // Not sure if this is the best way to go about doing this.
      // It runs at all times.
      $scope.getContentUrl = function() {
        var nettestSlug = 'nettest';
        if ($scope.report !== undefined) {
          nettestSlug = $scope.report.test_name.replace('_', '-');
        }
        var url = '/views/nettests/' + nettestSlug + '-summary.html';
        return url;
      }
    },
    template: 'Build A Summary Template Directive',
    // template: '<div ng-include="getContentUrl()"></div>'
  }
});
;
