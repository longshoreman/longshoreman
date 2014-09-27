'use strict';

var _        = require('lodash');
var util     = require('./util');
var redisCmd = require('./redis');

function saveDeployment(app, image, count, fn) {
  var hash = {
    timestamp: util.getUnixTimestamp(),
    app: app,
    image: image,
    count: count,
  };
  redisCmd('lpush', 'deployments:' + app, JSON.stringify(hash), fn);
}

function loadDeployments(app, fn) {
  redisCmd('lrange', 'deployments:' + app, 0, 100, function(err, results) {
    if (err) {
      return fn(err);
    }
    var deployments = _.map(results, function(item) {
      return JSON.parse(item);
    });
    fn(null, deployments);
  });
}

function loadMostRecentDeployment(app, fn) {
  redisCmd('lindex', 'deployments:' + app, 0, function(err, result) {
    fn(err, result && JSON.parse(result));
  });
}

function clearDeployments(app, fn) {
  redisCmd('del', 'deployments:' + app, fn);
}

exports.saveDeployment = saveDeployment;
exports.loadDeployments = loadDeployments;
exports.loadMostRecentDeployment = loadMostRecentDeployment;
exports.clearDeployments = clearDeployments;
