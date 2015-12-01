var async = require('async');

module.exports = function(app) {
    function createFixtures() {
        var Report = app.models.Report,
        httpRequestsInteresting = app.models.httpRequestsInteresting;
        Report.create([
            {"id": "1", "backend_version": "0.1", "input_hashes": "", "options": "", "probe_asn": "AS1234", "probe_cc": "IT", "probe_ip": "127.0.2.1", "record_type": "header", "report_filename": "foo", "report_id": "1", "software_name": "something", "software_version": "0.2", "start_time": 1237821983, "test_name": "something", "test_version": "0.2", "data_format_version": "0.2", "test_helpers": "XXXX"}
        ]);
        httpRequestsInteresting.create([
            {"report_id": "1", "input": "google.com", "probe_cc": "IT", "probe_asn": "AS442", "start_time": 1238128378}
        ])
    }
    if (process.env.NODE_ENV == "development") {
         console.log("Inside dev environment");
         createFixtures();
    }
}
