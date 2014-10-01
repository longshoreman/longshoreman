'use strict';

var http       = require('http');
var express    = require('express');
var router     = require('./src/router');
var controller = require('./src/controller');
var redisCmd   = require('./src/redis');

http.globalAgent.maxSockets = Infinity;

var PORT = process.env.PORT || 3000;

var app = express();

app.use(function(req, res, next) {
  var hostname = req.get('host').split(':')[0];
  isControllerHost(hostname, function(err, _isControllerHost) {
    if (_isControllerHost) {
      controller(req, res, next);
    } else {
      router(req, res, next);
    }
  });
});

function isControllerHost(hostname, fn) {
  redisCmd('get', 'host', function(err, controllerHost) {
    fn(err, hostname == controllerHost);
  });
}

app.listen(PORT, function() {
  console.log('Listening on port ' + PORT);
});

process.on('uncaughtException', function(err) {
  console.log('Caught exception: ' + err, err.stack);
  process.exit(1);
});
