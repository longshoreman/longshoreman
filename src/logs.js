'use strict';

var request    = require('request');
var async      = require('async');
var debug      = require('debug')('longshoreman');
var containers = require('./containers');
var instances  = require('./instances');
var util       = require('./util');

function loadContainerLogs(host, containerId, fn) {
  request({
    url: util.getDockerUrl(host, 'containers/' + containerId + '/logs'),
    method: 'get',
    qs: {
      stdout: 1,
      stderr: 1,
    }
  }, function(err, res, body) {
    fn(err, body);
  });
}

function loadAppLogs(app, fn) {
  async.waterfall([
    function(fn) {
      instances.loadAppInstances(app, fn);
    },
    function(instances, fn) {
      async.map(instances, function(instance, fn) {
        var parts = instance.split(':');
        var host  = parts[0];
        var port  = parts[1];
        containers.loadContainerByHostAndPort(host, port, function(err, container) {
          if (err) {
            return fn(err);
          }
          debug('Loading logs for ' + instance);
          loadContainerLogs(host, container.Id, fn);
        });
      }, fn);
    },
  ], fn);
}

exports.loadContainerLogs = loadContainerLogs;
exports.loadAppLogs = loadAppLogs;
