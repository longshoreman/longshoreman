'use strict';

var redisCmd = require('./redis');

function notifyRouters(fn) {
  redisCmd('publish', 'updates', ''+new Date().getTime(), fn);
}

exports.notifyRouters = notifyRouters;
