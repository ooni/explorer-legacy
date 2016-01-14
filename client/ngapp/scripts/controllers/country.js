'use strict';

/**
 * @ngdoc function
 * @name ooniAPIApp.controller:CountryViewCtrl
 * @description
 * # CountryViewCtrl
 * Controller of the ooniAPIApp
 */

angular.module('ooniAPIApp')
  .controller('CountryDetailViewCtrl', function ($q, $scope, $rootScope, $filter, Report, $http, $routeParams, ISO3166) {
    $scope.loaded = false;

    $scope.countryCode = $routeParams.id;
    $scope.countryName = ISO3166.getCountryName($scope.countryCode);

    $http.get('bower_components/factbook-country-data/data/' + $scope.countryCode + '.json')
      .then(function(response) {
        $scope.countryDetails = response.data;
      }, function(error) {
        console.log('error', error)
      })

    Report.blockpageCount( {probe_cc: $scope.countryCode}, function(resp) {
      $scope.blockpageCount = resp;

      var margin = {top: 20, right: 30, bottom: 30, left: 40},
          width = 960 - margin.left - margin.right,
          height = 220 - margin.top - margin.bottom,
          barWidth = 40;

      var y = d3.scale.linear()
          .domain([0, d3.max($scope.blockpageCount, function(d) {return d.total_count })])
          .range([height, 0]);

      var chart = d3.select('#blockpageCount-bar-chart')
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)

      var barGroup = chart.selectAll('g')
          .data($scope.blockpageCount)
        .enter().append('g')
          .attr('transform', function(d, i) { return "translate(" + ((i * barWidth) * 3 + 40) + ",0)";})

      barGroup.append("rect")
        .attr('class', 'bar total')
        .attr('y', function(d) { return y(d.total_count); })
        .attr('height', function(d) { return height - y(d.total_count); })
        .attr('width', barWidth - 1);

      barGroup.append("rect")
        .attr('class', 'bar block')
        .attr('y', function(d) { return y(d.block_count); })
        .attr('height', function(d) { return height - y(d.block_count); })
        .attr('width', barWidth - 1);

      barGroup.append("text")
        .attr("x", barWidth)
        .attr("y", function(d) { return y(d.total_count) ; })
        .attr("dy", ".75em")
        .text(function(d) { return d.total_count + ' measured'; });

      barGroup.append("text")
        .attr("x", barWidth)
        .attr("y", function(d) { return y(d.block_count) ; })
        .attr("dy", ".75em")
        .text(function(d) { return d.block_count + ' blocked'; });

      barGroup.append("text")
        .attr('class', 'date')
        .attr("x", barWidth / 2)
        .attr("y", height + margin.bottom )
        .attr("dy", ".75em")
        .text(function(d) { return $filter('date')(d.test_start_time, 'mediumDate'); });

    });

    Report.blockpageList( {probe_cc: $scope.countryCode}, function(resp) {
      $scope.blockpageList = resp;

      console.log('blockpage list', resp)
    });

    Report.vendors( {probe_cc: $scope.countryCode}, function(resp) {
      $scope.vendors = resp;

      console.log('vendors', resp)
    });

    Report.count({where: {probe_cc: $scope.countryCode }}, function(count) {
      $scope.count = count.count;
    });

    // XXX should use external pagination feature of ui grid
    // http://ui-grid.info/docs/#/tutorial/314_external_pagination

    $scope.loadMeasurements = function(queryOptions) {
      var deferred = $q.defer();

      queryOptions.where['probe_cc'] = $scope.countryCode;
      var query = {
          filter: {
              fields: {
                  'test_name': true,
                  'input': true,
                  'probe_cc': true,
                  'test_start_time': true,
                  'id': true,
                  'probe_asn': true
              },
              where: queryOptions.where,
              offset: queryOptions.pageNumber * queryOptions.pageSize,
              limit: queryOptions.pageSize
          }
      }

      if (queryOptions.order) {
        query.filter.order = queryOptions.order;
      }

      Report.find(query, function(data) {
        deferred.resolve(data);
        $scope.loaded = true;
      });

      return deferred.promise;
    }

})
