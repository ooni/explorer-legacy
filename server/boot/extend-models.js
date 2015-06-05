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
}
