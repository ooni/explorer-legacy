module.exports = function(app) {
  var remotes = app.remotes(),
    StorageService = require('loopback-component-storage').StorageService,
    providers = null;

  try {
    providers = require('../providers-private.json');
  } catch(err) {
    providers = require('../providers.json');
  }

  var storageHandler = new StorageService({
    provider: 'amazon',
    key: providers.amazon.key,
    keyId: providers.amazon.keyId,
  });

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
    app.models.httpRequestsInteresting.findInteresting(ctx.args.country_code, undefined,
                                                       ["report_id"], undefined,
                                                       function(err, data) {
      ctx.result.reports.forEach(function(report, idx) {
        if (data[report.report_id]) {
           ctx.result.reports[idx]["interesting"] = data[report.report_id].length;
        }
      });
      next();
    });
  });

  app.get("/reportFiles/:year/:report_filename", function(req, res) {
    var container = "ooni-public",
      filename = "reports-sanitised/yaml/" + req.params.year + "/" + req.params.report_filename;
    storageHandler.download(container, filename, res, function(err, result) {
      if (err) {
        res.status(500).send(err);
      }
    });
  });
}
