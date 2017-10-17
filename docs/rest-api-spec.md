
# API outline

baseurl: /api/v2/

/api/v2/measurement
  ?probe_cc= &
   probe_asn= &
   test_name= &
   input= &
   start_date= &
   end_date= &
   order_by= &
   order= &
Range: 0-100


Returns:
[
    {
        'test_name': ,
        'probe_cc': ,
        'probe_asn': ,
        'input': ,
        'test_start_time': ,
        'report_id': ,
        'measurement_id'
    },
    ...
]

/api/v2/measurement/<int:measurement_id>/
# XXX this maybe should be dropped in the future and should anyways do a 301
# redirect to the above endpoint.
/api/v2/measurement/<str:report_id>?<str:input>

Returns:

{
    "id": "",
    "input": "",
    "options": "object",
    "probe_asn": "",
    "probe_cc": 0,
    "probe_ip": "",
    "software_name": "",
    "software_version": "",
    "report_filename": "",
    "test_start_time": "",
    "test_runtime": 0,
    "measurement_start_time": "",
    "test_name": "",
    "data_format_version": "",
    "test_helpers": "object",
    "test_keys": "object"
}

/api/v2/measurement-file
  ?probe_cc= &
   probe_asn= &
   test_name= &
   input= &
   start_date= &
   end_date= &
   order_by= &
   order= &

[
  {
    'test_start_time': '',
    'probe_cc': '',
    'probe_asn': '',
    'url': ''
  },
  ...
]

/api/v2/country/<str:iso_alpha2>/
/api/v2/country/<str:iso_alpha2>/measurement/count

## These apis should be private

/_api/v2/country/<str:iso_alpha2>/blocked-sites/dates

Returns:

[
  {
     'total_tested': 100,
     'total_blocked': 10,
     'timestamp': 'xx'
  }
]


/_api/v2/country/<str:iso_alpha2>/blocked-sites

Returns:

[
  {
    'url': ''
  }
]

/_api/v2/country/<str:iso_alpha2>/vendor

# Country page

$http.get('data/factbook/' + $scope.countryCode.toLowerCase() + '.json')
Country.findOne({
  filter: {
        where: {iso_alpha2: $scope.countryCode},
        include: ['censorship_methods']
  }
})


Report.blockpageCount({probe_cc: $scope.countryCode});
Report.blockpageList({probe_cc: $scope.countryCode})
Report.vendors({probe_cc: $scope.countryCode})
Report.count({where: {probe_cc: $scope.countryCode }})

Report.find({
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
    order: '',
    limit: queryOptions.pageSize
  }
});

# Explore page

// XXX what does total do?
Report.total(function (result) {
  Report.find(query
  });
})

# Highlights

None

# Measurement page

Report.asnName({asn: $scope.report.probe_asn}, function(result) {
});

Nettest.findOne({
  filter: {
    where: {
      name: $scope.report.test_name
    }
  }
});

Report.find(query, loading_success, loading_failure);

# Website page

Report.websiteMeasurements({website_url: $scope.websiteUrl});
Report.websiteDetails({website_url: $scope.websiteUrl});


# World page

Report.countByCountry(query, function(report_counts) {
Report.blockpageDetected(function(blockpage_countries) {

