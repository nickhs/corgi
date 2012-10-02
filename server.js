var winston = require('winston');
var request = require('request');
var express = require('express');

var settings = require('./settings');
var desk = require('./desk_client');

var app = express();
var open_cases = [];

app.use('/static', express['static'](__dirname + '/static'));

app.get('/', function(req, res) {
  res.sendfile(__dirname + '/index.html');
});

app.get('/cases', function(req, res) {
  res.json({cases: open_cases});
});

function kickstart() {
  app.listen(3000);
  winston.info('Started on :3000');

  var case_intv = setInterval(function() {
    desk.getOpenCases(updateCaseList);
  }, settings.refresh_rate);
}

function updateCaseList(response) {
  winston.info('updateCaseList running');
  var cases = response.results;
  open_cases = [];
  cases.forEach(function(item, idx) {
    var x = {};
    x.id = item['case'].id;
    x.preview = item['case'].preview;
    x.subject = item['case'].subject;
    x.date = item['case'].created_at;
    x.priority = item['case'].priority;

    open_cases.push(x);
  });
}

kickstart();
