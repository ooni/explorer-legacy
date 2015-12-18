window.CONFIG = {
  "routes": {
    "/": {
      "controller": "OverviewCtrl",
      "templateUrl": "/views/overview.html"
    },
    "/world/": {
      "controller": "HomeCtrl",
      "templateUrl": "/views/home.html"
    },
    "/explore/": {
      "controller": "ExploreViewCtrl",
      "templateUrl": "/views/explore.html"
    },
    "/measurement/:id": {
      "controller": "MeasurementDetailViewCtrl",
      "templateUrl": "/views/view-measurement.html"
    },
    "/country/:id": {
      "controller": "CountryDetailViewCtrl",
      "templateUrl": "/views/country-view.html"
    }
  }
};
