'use strict';

var async     = require('async');
var apps      = require('./apps');
var instances = require('./instances');
var envs      = require('./envs');
var history   = require('./history');

function describe(fn) {
  var output = {};
  apps.loadApps(function(err, _apps) {
    async.each(_apps, function(app, fn) {
      output[app] = {};
      async.waterfall([
        function(fn) {
          instances.loadAppInstances(app, function(err, _instances) {
            output[app].instances = _instances;
            fn(err);
          });
        },
        function(fn) {
          envs.loadAppEnvs(app, function(err, _envs) {
            output[app].envs = _envs;
            fn(err);
          });
        },
        function(fn) {
          history.loadMostRecentDeployment(app, function(err, deployment) {
            output[app].image = deployment && deployment.image;
            fn(err);
          });
        }
      ], fn);
    }, function(err) {
      fn(err, output);
    });
  });
}

exports.describe = describe;
