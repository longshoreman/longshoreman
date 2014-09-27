/* jshint node: true */
'use strict';

var redis = require('redis');
var _     = require('lodash');

module.exports = function() {
  var args = _.toArray(arguments);
  var cmd = args.shift();
  var client = redis.createClient(process.env.REDIS_PORT, process.env.REDIS_HOST);
  client[cmd].apply(client, args);
};
