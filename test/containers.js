var _          = require('lodash');
var should     = require('should');
var async      = require('async');
var containers = require('../src/containers');

var DOCKER_HOST  = process.env.DOCKER_HOST;
var DOCKER_IMAGE = process.env.DOCKER_IMAGE;

describe('containers', function () {
  describe('createContainer', function() {

    var containerId = null;

    after(function(done) {
      containers.deleteContainer(DOCKER_HOST, containerId, done);
    });

    it('should create a new container', function(done) {
      var createOptions = {
        Image: DOCKER_IMAGE,
      };
      containers.createContainer(DOCKER_HOST, createOptions, function(err, result) {
        should.not.exist(err);
        result.should.have.property('Id');
        containerId = result.Id;
        done();
      });
    });
  });

  describe('startContainer', function() {

    var containerId = null;

    before(function(done) {
      var createOptions = {
        Image: DOCKER_IMAGE,
      };
      containers.createContainer(DOCKER_HOST, createOptions, function(err, result) {
        containerId = result.Id;
        done(err);
      });
    });

    after(function(done) {
      containers.deleteContainer(DOCKER_HOST, containerId, done);
    });

    it('should start the container and return status', function(done) {
      containers.startContainer(DOCKER_HOST, containerId, null, function(err) {
        should.not.exist(err);
        done();
      });
    });
  });

  describe('createAndStartContainer', function() {

    var containerId = null;

    after(function(done) {
      containers.deleteContainer(DOCKER_HOST, containerId, done);
    });

    it('should create a new container and start it', function(done) {
      var createOptions = {
        Image: DOCKER_IMAGE,
      };
      containers.createAndStartContainer(DOCKER_HOST, 9000, createOptions, function(err, result) {
        should.not.exist(err);
        containerId = result;
        done();
      });
    });
  });

  describe('loadContainers', function() {

    var containerId = null;

    before(function(done) {
      containers.runContainer(DOCKER_HOST, 3030, DOCKER_IMAGE, [], function(err, _containerId) {
        containerId = _containerId;
        done(err);
      });
    });

    after(function(done) {
      containers.deleteContainer(DOCKER_HOST, containerId, done);
    });

    it('should return a list of all containers', function(done) {
      containers.loadContainers(DOCKER_HOST, function(err, _containers) {
        should.not.exist(err);
        var match = _.find(_containers, {Id: containerId});
        match.should.have.property('Id', containerId);
        done();
      });
    });

  });

  describe('loadContainerByHostAndPort', function() {

    var containerId = null;

    before(function(done) {
      containers.runContainer(DOCKER_HOST, 3030, DOCKER_IMAGE, [], function(err, _containerId) {
        containerId = _containerId;
        done(err);
      });
    });

    after(function(done) {
      containers.deleteContainer(DOCKER_HOST, containerId, done);
    });

    it('should return the container', function(done) {
      containers.loadContainerByHostAndPort(DOCKER_HOST, 3030, function(err, container) {
        should.not.exist(err);
        container.should.have.property('Id', containerId);
        done();
      });
    });

  });

  describe('inspectContainer', function() {

    var containerId = null;

    before(function(done) {
      containers.runContainer(DOCKER_HOST, 3030, DOCKER_IMAGE, null, function(err, _containerId) {
        containerId = _containerId;
        done(err);
      });
    });

    after(function(done) {
      containers.deleteContainer(DOCKER_HOST, containerId, done);
    });

    it('should return details about the container', function(done) {
      containers.inspectContainer(DOCKER_HOST, containerId, function(err, details) {
        should.not.exist(err);
        details.should.have.property('Id', containerId);
        done();
      });
    });

  });

  describe('stopContainer', function() {

    var containerId = null;

    before(function(done) {
      containers.runContainer(DOCKER_HOST, 3030, DOCKER_IMAGE, null, function(err, _containerId) {
        containerId = _containerId;
        done(err);
      });
    });

    after(function(done) {
      containers.deleteContainer(DOCKER_HOST, containerId, done);
    });

    it('should stop the container', function(done) {
      containers.stopContainer(DOCKER_HOST, containerId, function(err) {
        should.not.exist(err);
        containers.inspectContainer(DOCKER_HOST, containerId, function(err, details) {
          should.not.exist(err);
          details.should.have.property('Id', containerId);
          details.should.have.property('State');
          details.State.should.have.property('Running', false);
          done();
        });
      });
    });

  });

  describe('killContainer', function() {

    var containerId = null;

    before(function(done) {
      containers.runContainer(DOCKER_HOST, 3030, DOCKER_IMAGE, null, function(err, _containerId) {
        containerId = _containerId;
        done(err);
      });
    });

    after(function(done) {
      containers.deleteContainer(DOCKER_HOST, containerId, done);
    });

    it('should kill the container', function(done) {
      containers.killContainer(DOCKER_HOST, containerId, function(err) {
        should.not.exist(err);
        containers.inspectContainer(DOCKER_HOST, containerId, function(err, details) {
          should.not.exist(err);
          details.should.have.property('Id', containerId);
          details.should.have.property('State');
          details.State.should.have.property('Running', false);
          done();
        });
      });
    });

  });

  describe('deleteContainer', function() {

    var containerId = null;

    before(function(done) {
      containers.runContainer(DOCKER_HOST, 3030, DOCKER_IMAGE, null, function(err, _containerId) {
        containerId = _containerId;
        done(err);
      });
    });

    it('should delete the container', function(done) {
      containers.deleteContainer(DOCKER_HOST, containerId, function(err) {
        should.not.exist(err);
        containers.inspectContainer(DOCKER_HOST, containerId, function(err, details) {
          should.exist(err);
          done();
        });
      });
    });

  });

  describe('countRunningContainers', function() {

    var containerIds = [];
    var n = 5;

    before(function(done) {
      async.times(n, function(i, fn) {
        containers.runContainer(DOCKER_HOST, 8000 + i, DOCKER_IMAGE, null, function(err, containerId) {
          containerIds.push(containerId);
          fn(err);
        });
      }, done);
    });

    after(function(done) {
      async.each(containerIds, function(containerId, fn) {
        containers.deleteContainer(DOCKER_HOST, containerId, fn);
      }, done);
    });

    it('should return the total running containers', function(done) {
      containers.countRunningContainers(DOCKER_HOST, function(err, count) {
        should.not.exist(err);
        count.should.eql(n);
        done();
      });
    });

  });

  describe('getContainerDistribution', function() {

    var containerIds = [];
    var n = 3;

    before(function(done) {
      async.times(n, function(i, fn) {
        containers.runContainer(DOCKER_HOST, 8000 + i, DOCKER_IMAGE, null, function(err, containerId) {
          containerIds.push(containerId);
          fn(err);
        });
      }, done);
    });

    after(function(done) {
      async.each(containerIds, function(containerId, fn) {
        containers.deleteContainer(DOCKER_HOST, containerId, fn);
      }, done);
    });

    it('should return the total running containers', function(done) {
      containers.getContainerDistribution(function(err, dist) {
        should.not.exist(err);
        var expected = {};
        expected[DOCKER_HOST] = 3;
        dist.should.eql(expected);
        done();
      });
    });

  });

});
