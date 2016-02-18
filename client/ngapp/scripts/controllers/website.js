'use strict'

/**
 * @ngdoc function
 * @name ooniAPIApp.controller:WebsiteDetailViewCtrl
 * @description
 * # WebsiteDetailViewCtrl
 * Controller of the ooniAPIApp
 */

angular.module('ooniAPIApp')
  .controller('WebsiteDetailViewCtrl', function ($scope, Report, $http, $routeParams) {
    $scope.websiteUrl = $routeParams.id

    console.log($scope.websiteUrl)
    Report.website({website_url: $scope.websiteUrl}, function (resp) {
      $scope.measurements = resp
    }, function (err) {
      if (err) console.log(err)
    })

    var alexaUrl = 'http://data.alexa.com/data?cli=10&data=snbamz&url=' + $scope.websiteUrl

    $http.get(alexaUrl)
      .then(function (resp) {
        console.log(resp)
      })
  })
