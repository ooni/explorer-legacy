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
    'ui.codemirror',
    'iso-3166-country-codes',
    'jsonFormatter',
    'daterangepicker',
    'angular-inview'
  ])
  .config(function ($routeProvider, $locationProvider) {
    Object.keys(window.CONFIG.routes)
      .forEach(function(route) {
        var routeDef = window.CONFIG.routes[route];
        $routeProvider.when(route, routeDef);
      });

    $routeProvider
      .otherwise({
        redirectTo: '/world'
      });

    $locationProvider.html5Mode(true);
  })
  // Things to run before the app loads;
  .run(function ($rootScope, $location, $anchorScroll) {
    $rootScope.$location = $location;
  });
