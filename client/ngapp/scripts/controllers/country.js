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

    var containerWidth = parseInt(d3.select('.container').style('width'), 10)

    Report.blockpageCount( {probe_cc: $scope.countryCode}, function(resp) {
      $scope.blockpageCount = resp;

      var margin = {top: 20, right: 30, bottom: 30, left: 40},
          width = containerWidth - margin.left - margin.right,
          height = 220 - margin.top - margin.bottom,
          groupWidth = width / $scope.blockpageCount.length,
          barWidth = groupWidth / 3;


      var y = d3.scale.linear()
          .domain([0, d3.max($scope.blockpageCount, function(d) {return d.total_count })])
          .range([height, 0]);

      console.log($scope.blockpageCount.length)

      var chart = d3.select('#blockpageCount-bar-chart')
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)

      var barGroup = chart.selectAll('g')
          .data($scope.blockpageCount)
        .enter().append('g')
          .attr('transform', function(d, i) {
            var eachBar = parseInt(groupWidth * i, 10)
            return "translate(" + (eachBar) + ",20)";
          })

      barGroup.append("rect")
        .attr('class', 'bar total')
        .attr('height', 0)
        .attr('x', groupWidth / 2)
        .attr('y', height)
        .attr('width', barWidth)
        .transition()
          .duration(1000)
          .attr('y', function(d) { return y(d.total_count); })
          .attr('height', function(d) { return height - y(d.total_count); })

      barGroup.append("rect")
        .attr('class', 'bar blocked')
        .attr('width', barWidth)
        .attr('x', groupWidth / 2)
        .attr('y', height)
        .attr('height', 0)
        .transition()
          .duration(1000)
          .attr('y', function(d) { return y(d.block_count); })
          .attr('height', function(d) { return height - y(d.block_count); })

      barGroup.append('text')
        .attr("x", barWidth * 2)
        .classed({'hidden': true, 'tooltip': true, 'total': true})
        .attr("y", function(d) { return y(d.total_count) - 20; })
        .attr("dy", ".75em")
        .text(function(d) { return d.total_count + ' measured'; });

      barGroup.append('text')
        .attr('x', barWidth * 2 + barWidth / 2 + 5)
        .classed({'hidden': true, 'tooltip': true})
        .attr('y', function(d) { return y(d.block_count) - 5; })
        .attr("dy", ".75em")
        .text(function(d) { return d.block_count + ' blocked'; });

      barGroup.append("text")
        .attr('class', 'date')
        .attr("x", barWidth * 2)
        .attr("y", height + margin.bottom / 2 )
        .attr("dy", ".75em")
        .text(function(d) { return $filter('date')(d.test_start_time, 'mediumDate'); });

      barGroup.on('mouseover', function() {
        d3.select(this).selectAll('.tooltip')
          .classed('hidden', false)
      })
      barGroup.on('mouseout', function() {
        d3.select(this).selectAll('.tooltip')
          .classed('hidden', true)
      })
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
