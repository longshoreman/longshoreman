'use strict';

var http          = require('http');
var express       = require('express');
var debug         = require('debug')('longshoreman');
var router        = require('./src/router');
var controller    = require('./src/controller');
var redisCmd      = require('./src/redis').redisCmd;
var errorHandler  = require('errorhandler');

http.globalAgent.maxSockets = Infinity;

var PORT = process.env.PORT || 3000;

var app = express();

app.use(require('morgan')('dev'));

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

process.on('uncaughtException', function(err) {
  app.use(errorHandler({ dumpExceptions: true, showStack: true }));
  process.exit(1);
});

app.listen(PORT, function() {
  debug('Listening on port ' + PORT);
}).on('error', function(err) {
  if(err.code === "EADDRINUSE") {
    console.log("Another process is already listening on port: " + PORT)
  } else {
    console.log(err);
  }
  process.exit(1);
})
