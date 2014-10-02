'use strict';

var redis = require('redis');
var _     = require('lodash');
var debug = require('debug')('longshoreman');

function createRedisClient() {
  var client = redis.createClient(process.env.REDIS_PORT, process.env.REDIS_HOST);

  client.on('error', function(err) {
    debug('Redis connection error. Aborting.');
    debug(err);
    process.exit(1);
  });

  client.on('end', function() {
    debug('Redis connection closed. Aborting.');
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

exports.redisCmd = redisCmd;
exports.createRedisClient = createRedisClient;
