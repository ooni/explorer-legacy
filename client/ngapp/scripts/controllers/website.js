'use strict'

/**
 * @ngdoc function
 * @name ooniAPIApp.controller:WebsiteDetailViewCtrl
 * @description
 * # WebsiteDetailViewCtrl
 * Controller of the ooniAPIApp
 */

angular.module('ooniAPIApp')
  .controller('WebsiteDetailViewCtrl', function ($scope, Report, $http, $routeParams, ISO3166) {
    $scope.websiteUrl = $routeParams.id
    $scope.encodeInput = window.encodeURIComponent;

    Report.websiteMeasurements({website_url: $scope.websiteUrl}, function (resp) {
      $scope.measurementsByCountry = {}
      resp.forEach(function (measurement) {
        if ($scope.measurementsByCountry[measurement.probe_cc] !== undefined) {
          $scope.measurementsByCountry[measurement.probe_cc].measurements
            .push(measurement)
        } else {
          $scope.measurementsByCountry[measurement.probe_cc] = {
            measurements: [measurement],
            country: ISO3166.getCountryName(measurement.probe_cc)
          }
        }
      })
    }, function (err) {
      if (err) console.log('err', err)
    })

    Report.websiteDetails({website_url: $scope.websiteUrl}, function (resp) {
      $scope.details = resp[0]
      console.log($scope.details)
    }, function (err) {
      if (err) console.log('err', err)
    })

    // var alexaUrl = 'http://data.alexa.com/data?cli=10&data=snbamz&url=' + $scope.websiteUrl
  })
