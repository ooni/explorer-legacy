angular.module('ooniAPIApp')
.controller('HTTPRequestsViewCtrl', function ($scope, $location){

  angular.forEach($scope.report.test_keys.requests, function(request) {
    if (request.request.tor === true || request.request.tor.is_tor === true) {
      $scope.control = request;
    } else {
      $scope.experiment = request;
    }
  });

  $scope.experiment_body = null;
  if ($scope.experiment && $scope.experiment.response && $scope.experiment.response.body) {
    $scope.experiment_body = $scope.experiment.response.body;
  }
  $scope.body_length_match = 'unknown';
  if ($scope.report.test_keys.body_length_match == true) {
    $scope.body_length_match = 'true';
  } else if ($scope.report.test_keys.body_length_match == false) {
    $scope.body_length_match = 'false';
  }

  $scope.experiment_failure = $scope.experiment.failure || 'none';
  $scope.control_failure = $scope.control.failure || 'none';

  $scope.anomaly = false;
  if ($scope.body_length_match === 'false') {
    $scope.anomaly = true;
  }
  if ($scope.experiment_failure !== 'none' && $scope.control_failure === 'none') {
    $scope.anomaly = true;
  }

  $scope.header_names = [];
  if ($scope.control && $scope.control.response) {
      console.log($scope.control);
      for (var header_name in $scope.control.response.headers) {
          if ($scope.header_names.indexOf(header_name) == -1) {
              $scope.header_names.push(header_name);
          }
      }
  }

  if ($scope.experiment && $scope.experiment.response) {
      for (var header_name in $scope.experiment.response.headers) {
          if ($scope.header_names.indexOf(header_name) == -1) {
              $scope.header_names.push(header_name);
          }
      }
  }

  $scope.code_mirror_options = {
      lineWrapping : true,
      mode: 'xml',
      readOnly: 'nocursor'
  }

});
