var request = require('request');
var settings = require('./settings');

var running = null;

function checkSite(cb) {
  if (running) {
    cb();
  }

  var opts = {
    url: settings.url,
    timeout: settings.site_timeout
  };

  running = true;
  request.get(opts, function(e, r, body) {
    running = false;
    if (!e && r.statusCode == 200) {
      cb('success');
    } else if (e.code == "ETIMEDOUT") {
      cb('timed');
    } else {
      cb('failed');
    }
  });
}

exports.checkSite = checkSite;
