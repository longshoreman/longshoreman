'use strict';

var request = require('request');
var async   = require('async');

var DOCKER_PORT = 2375;

function getUnixTimestamp() {
  return Math.round(new Date().getTime() / 1000);
}

function getDockerUrl(host, path) {
  return 'http://' + host + ':' + DOCKER_PORT + '/' + path;
}

function parseDockerImage(image) {
  var parts = image.split('/');
  var result = {
    user: parts[0],
    repo: parts[1],
    tag: null,
  };
  if (result.repo.indexOf(':') > -1) {
    parts = result.repo.split(':');
    result.repo = parts[0];
    result.tag = parts[1];
  }
  result.name = result.user + '/' + result.repo;
  return result;
}

function isResponseOk(statusCode) {
  return statusCode >= 200 && statusCode <= 299;
}

exports.getUnixTimestamp = getUnixTimestamp;
exports.parseDockerImage = parseDockerImage;
exports.getDockerUrl = getDockerUrl;
exports.isResponseOk = isResponseOk;
