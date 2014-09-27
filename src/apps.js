'use strict';

var redisCmd = require('./redis');

function loadApps(fn) {
  redisCmd('smembers', 'apps', fn);
}

function addApp(app, fn) {
  redisCmd('sadd', 'apps', app, fn);
}

function removeApp(app, fn) {
  redisCmd('srem', 'apps', app, fn);
}

exports.loadApps = loadApps;
exports.addApp = addApp;
exports.removeApp = removeApp;
