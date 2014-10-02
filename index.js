'use strict';

var http       = require('http');
var express    = require('express');
var debug      = require('debug')('longshoreman');
var router     = require('./src/router');
var controller = require('./src/controller');
var redisCmd   = require('./src/redis').redisCmd;

http.globalAgent.maxSockets = Infinity;

var PORT = process.env.PORT || 3000;

var app = express();

app.use(function(req, res, next) {
  var host = req.get('host');
  if (!host) {
    return res.status(400).send('No host header');
  }
  var hostname = host.split(':')[0];
  if (process.env.CONTROLLER_HOST == hostname) {
    controller(req, res, next);
  } else {
    router(req, res, next);
  }
});

app.listen(PORT, function() {
  debug('Listening on port ' + PORT);
});

process.on('uncaughtException', function(err) {
  debug('Caught exception: ' + err, err.stack);
  process.exit(1);
});
