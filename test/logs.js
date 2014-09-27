var should     = require('should');
var async      = require('async');
var logs       = require('../src/logs');
var containers = require('../src/containers');

var APP_NAME     = 'test';
var DOCKER_HOST  = process.env.DOCKER_HOST;
var DOCKER_IMAGE = process.env.DOCKER_IMAGE;

describe('logs', function () {

  var containerIds = [];
  var n = 2;

  beforeEach(function(done) {
    async.times(n, function(i, fn) {
      containers.runContainer(DOCKER_HOST, 8000 + i, DOCKER_IMAGE, null, function(err, containerId) {
        containerIds.push(containerId);
        fn(err);
      });
    }, function(err) {
      setTimeout(done, 2000);
    });
  });

  afterEach(function(done) {
    async.each(containerIds, function(containerId, fn) {
      containers.deleteContainer(DOCKER_HOST, containerId, fn);
    }, done);
  });

  describe('loadContainerLogs', function() {
    it('should return logs for a container', function(done) {
      logs.loadContainerLogs(DOCKER_HOST, containerIds[0], function(err, output) {
        should.not.exist(err);
        output.should.be.ok;
        done();
      });
    });
  });

});
