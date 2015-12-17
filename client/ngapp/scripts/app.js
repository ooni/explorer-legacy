'use strict';

/**
 * @ngdoc overview
 * @name ooniAPIApp
 * @description
 *
 * Main module of the application.
 */
angular
  .module('ooniAPIApp', [
    'ngRoute',
    'lbServices',
    'ngResource',
    'datamaps',
    'angularTypewrite',
    'ui.grid',
    'ui.grid.pagination',
    'iso-3166-country-codes',
    'jsonFormatter'
  ])
  .config(function ($routeProvider, $locationProvider) {
    Object.keys(window.CONFIG.routes)
      .forEach(function(route) {
        var routeDef = window.CONFIG.routes[route];
        $routeProvider.when(route, routeDef);
      });

    $routeProvider
      .otherwise({
        redirectTo: '/'
      });

    $locationProvider.html5Mode(true);
  })
  // Things to run before the app loads;
  .run(function($rootScope, $location) {

    $rootScope.$location = $location;

    $rootScope.loading_phrases = [
      "Hacking some planet",
      "Extracting square root of i",
      "Modifying the space time continuum",
      "Adjusting ultra speed variable to be nominal",
      "Performing a safety meeting"
    ];
  });
