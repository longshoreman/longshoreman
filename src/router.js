'use strict';

var redis      = require('redis');
var async      = require('async');
var request    = require('request');
var express    = require('express');
var url        = require('url');
var http       = require('http');
var prettyjson = require('prettyjson');
var _          = require('lodash');

var PORT      = process.env.PORT || 3000;
var INSTANCES = {};
var ENVS      = {};
var UNHEALTHY = {};

function createRedisClient() {
  var client = redis.createClient(process.env.REDIS_PORT, process.env.REDIS_HOST);

  client.on('error', function(err) {
    console.log('Redis connection error. Aborting.');
    console.log(err);
    process.exit(1);
  });

  client.on('end', function() {
    console.log('Redis connection closed. Aborting.');
    process.exit(1);
  });

  return client;
}

function redisCmd() {
  var args = _.toArray(arguments);
  var cmd = args.shift();
  var client = createRedisClient();
  client[cmd].apply(client, args);
}

function loadAppInstances(app, fn) {
  redisCmd('smembers', app + ':instances', fn);
}

function loadApps(fn) {
  redisCmd('smembers', 'apps', fn);
}

function markHostHealth(app, host, healthy) {
  if (healthy) {
    delete UNHEALTHY[host];
  } else {
    console.log(('[' + app + '] Could not reach ' + host).red);
    UNHEALTHY[host] = 1;
  }
}

function subscribeToUpdates() {
  var client = createRedisClient();
  client.on('message', function(channel, message) {
    if (channel == 'updates') {
      initRoutingTable();
    }
  });
  client.subscribe('updates');
}

function healthCheckHost(app, host, fn) {
  request({
    url: 'http://' + host + '/ping',
    timeout: 5000,
  }, function(err, res) {
    if (err) {
      return fn(err);
    }
    markHostHealth(app, host, res.statusCode == 200);
    fn();
  }).on('error', function(err) {
    markHostHealth(app, host, false);
    fn();
  });
}

function healthCheckInstances(fn) {
  fn = fn || _.noop;
  var apps = Object.keys(INSTANCES);
  async.each(apps, function(app, fn) {
    async.eachLimit(INSTANCES[app], 5, function(host, fn) {
      healthCheckHost(app, host, fn);
    }, fn);
  }, fn);
}

function initRoutingTable(fn) {
  fn = fn || _.noop;
  loadApps(function(err, apps) {
    if (err) {
      return fn(err);
    }
    async.map(apps, function(app, fn) {
      loadAppInstances(app, function(err, instances) {
        if (err) {
          return fn(err);
        }
        INSTANCES[app] = instances;
        fn(null);
      });
    }, function(err, results) {
      if (err) {
        console.error(err);
        return fn(err);
      }
      console.log("\nLoading routing table.");
      console.log(prettyjson.render(INSTANCES) + "\n");
      fn(null, INSTANCES);
    });
  });
}

function selectAppInstance(app) {
  return _(INSTANCES[app]).difference(Object.keys(UNHEALTHY)).sample();
}

function proxy(req, res, hostname) {
  var parts = hostname.split(':');

  var options = {
    hostname: parts[0],
    port: parts[1],
    method: req.method,
    path: req.url,
    headers: req.headers,
  };

  var p = http.request(options, function(_res) {
    res.writeHead(_res.statusCode, _res.headers);
    _res.pipe(res, {end: true});
  });

  req.pipe(p, {end: true});
}

var router = express.Router();

router.use(function(req, res, next) {
  var app = req.get('host').split(':')[0];

  if (req.url == '/_ping') {
    res.status(200).end('pong');
    return;
  }

  if (!app) {
    res.status(400).end('Invalid hostname');
    return;
  }

  if (!INSTANCES[app]) {
    res.status(404).end('No backend found for ' + app);
    return;
  }

  if (_.isEmpty(INSTANCES[app])) {
    res.status(503).end('No available backend for ' + app);
    return;
  }

  var randomInstance = selectAppInstance(app);

  if (!randomInstance) {
    res.status(503).end('No available backend for ' + app);
    return;
  }

  proxy(req, res, randomInstance);
});

initRoutingTable();
subscribeToUpdates();

setInterval(healthCheckInstances, 10000);

module.exports = router;
