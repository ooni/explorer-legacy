module.exports = function(app) {
  var remotes = app.remotes();
  remotes.after('report.listReports', function(ctx, next) {
    app.models.httpRequestsInteresting.listInteresting(ctx.args.by, function(err, data) {
      if (err) {
        throw err;
      }
      Object.keys(data).forEach(function(key) {
        ctx.result[key]["interesting"] = data[key]["count"];
      });
      next();
    });
  });
  remotes.after('report.findReports', function(ctx, next) {
    app.models.httpRequestsInteresting.findInteresting(ctx.args.country_code, ["report_id"],
                                                       function(err, data) {
      ctx.result.reports.forEach(function(report, idx) {
        if (data[report.report_id]) {
           ctx.result.reports[idx]["interesting"] = data[report.report_id].length;
        }
      });
      next();
    });
  });

}
