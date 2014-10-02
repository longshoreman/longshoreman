'use strict';

var redisCmd = require('./redis').redisCmd;

function notifyRouters(fn) {
  redisCmd('publish', 'updates', ''+new Date().getTime(), fn);
}

exports.notifyRouters = notifyRouters;
