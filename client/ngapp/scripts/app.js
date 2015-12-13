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
    'iso-3166-country-codes'
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
});
