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
    'ngResource',
    'lbServices',
    'datamaps',
    'angularTypewrite'
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
