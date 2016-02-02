window.CONFIG = {
  "routes": {
    "/overview/": {
      "controller": "OverviewCtrl",
      "templateUrl": "/views/overview.html"
    },
    "/world/": {
      "controller": "WorldCtrl",
      "templateUrl": "/views/world.html"
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
