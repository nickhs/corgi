var winston = require('winston');
winston.remove(winston.transports.Console);
winston.add(winston.transports.Console, {
  timestamp: true,
  colorize: true
});

var request = require('request');

var settings = require('./settings');
var desk = require('./desk_client');

var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
io.set('log level', 1);

var open_cases = [];
var week_count = 0;

app.use('/static', express['static'](__dirname + '/static'));

app.get('/', function(req, res) {
  res.sendfile(__dirname + '/index.html');
});

app.get('/cases/open', function(req, res) {
  res.json({cases: open_cases});
});

app.get('/cases/open/length', function(req, res) {
  res.json({length: open_cases.length});
});

function kickstart() {
  server.listen(3000);
  winston.info('Started on :3000');

  var case_intv = setInterval(function() {
    desk.getOpenCases(updateCaseList);
  }, settings.refresh_rate);
}

function updateCaseList(response) {
  // winston.info('updateCaseList running');
  var cases = response.results;
  var formatted_cases = [];
  cases.forEach(function(item, idx) {
    formatted_cases.push(formatResponse(item));
  });

  if (formatted_cases.length != open_cases.length) {
    haveNewItems(formatted_cases);
  } else {
    for (var i = 0; i < formatted_cases.length; i++) {
      if (formatted_cases[i].id != open_cases[i].id) {
        haveNewItems(formatted_cases);
        break;
      }
    }
  }
}

function haveNewItems(cases) {
  sendNewItems(cases);
  open_cases = cases;
  week_count += cases.length;
}

function formatResponse(item) {
  var x = {};
  x.id = item['case'].id;
  x.preview = item['case'].preview;
  x.subject = item['case'].subject;
  x.date = item['case'].updated_at;
  x.priority = item['case'].priority;
  return x;
}

function sendNewItems(items) {
  winston.info("sending items", items);
  io.sockets.emit('new_items', {cases: items});
  winston.info('count', items.length);
  io.sockets.emit('count', {count: items.length});
  io.sockets.emit('week_count', {count: week_count});
}

io.sockets.on('connection', function(socket) {
  sendNewItems(open_cases);
});

kickstart();
