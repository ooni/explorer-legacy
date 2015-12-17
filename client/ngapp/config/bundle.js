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
    "/report/:id": {
      "controller": "ReportDetailViewCtrl",
      "templateUrl": "/views/view-report.html"
    },
    "/country/:id": {
      "controller": "CountryDetailViewCtrl",
      "templateUrl": "/views/country-view.html"
    }
  }
};
