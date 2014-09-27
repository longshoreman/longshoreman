'use strict';

var _        = require('lodash');
var async    = require('async');
var redisCmd = require('./redis');

function loadAppEnvs(app, fn) {
  redisCmd('smembers', app + ':envs', fn);
}

function addAppEnv(app, env, fn) {
  redisCmd('sadd', app + ':envs', env, fn);
}

function removeAppEnv(app, env, fn) {
  loadAppEnvs(app, function(err, envs) {
    if (err) {
      return fn(err);
    }
    var matches = _.filter(envs, function(e) {
      return new RegExp('^' + env).test(e);
    });
    async.map(matches, function(match, fn) {
      redisCmd('srem', app + ':envs', match, fn);
    }, fn);
  });
}

exports.loadAppEnvs = loadAppEnvs;
exports.addAppEnv = addAppEnv;
exports.removeAppEnv = removeAppEnv;
