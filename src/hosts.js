'use strict';

var request    = require('request');
var _          = require('lodash');
var redisCmd   = require('./redis');
var containers = require('./containers');
var util       = require('./util');

var PORT_RANGE  = _.range(8000, 8999);

function loadHosts(fn) {
  redisCmd('smembers', 'hosts', fn);
}

function addHost(host, fn) {
  redisCmd('sadd', 'hosts', host, fn);
}

function removeHost(host, fn) {
  redisCmd('srem', 'hosts', host, fn);
}

function loadPortsInUse(host, fn) {
  containers.loadContainers(host, function(err, containers) {
    if (err) {
      return fn(err);
    }
    var portsInUse = _.map(containers, function(container) {
      return container.Ports[0].PublicPort;
    });
    fn(null, portsInUse);
  });
}

function findAvailablePort(host, fn) {
  loadPortsInUse(host, function(err, portsInUse) {
    if (err) {
      return fn(err);
    }
    var port = _.sample(_.difference(PORT_RANGE, portsInUse));
    fn(null, port);
  });
}

function pullDockerImage(host, image, fn) {
  var parts = util.parseDockerImage(image);
  request({
    url: util.getDockerUrl(host, 'images/create'),
    method: 'post',
    qs: {
      fromImage: parts.name,
      tag: parts.tag,
    },
    json: true,
  }, function(err, res, body) {
    fn(err, body);
  });
}

exports.loadHosts = loadHosts;
exports.addHost = addHost;
exports.removeHost = removeHost;
exports.loadPortsInUse = loadPortsInUse;
exports.findAvailablePort = findAvailablePort;
exports.pullDockerImage = pullDockerImage;
