var settings = require('./settings');

var request = require('request');
var winston = require('winston');

function getOpenCases(cb) {
  var url = settings.base_url + 'cases.json?status=open,new&count=100';
  get(url, cb);
}

function get(url, cb) {
  request.get({url: url, oauth: settings.oauth}, function(e, r, body) {
    if (e) {
      winston.warn('Failed to connect to desk.com: ' + e);
      cb();
    } else {
      body = JSON.parse(body);
      cb(body);
    }
  });
}

exports.getOpenCases = getOpenCases;
exports.get = get;
