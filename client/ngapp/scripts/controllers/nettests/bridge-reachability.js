angular.module('ooniAPIApp')
.controller('BridgeReachabilityViewCtrl', function ($scope, $location){
  angular.forEach($scope.report.test_keys.requests, function(request){
    if (request.request.tor === true || request.request.is_tor === true) {
      $scope.control = request.response;
    } else {

      $scope.experiment = request.response;
      console.log($scope.experiment);
    }
  })
});
