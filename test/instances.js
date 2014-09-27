
var should     = require('should');
var async      = require('async');
var _          = require('lodash');
var instances  = require('../src/instances');
var containers = require('../src/containers');
var hosts      = require('../src/hosts');

var DOCKER_HOST  = process.env.DOCKER_HOST;
var DOCKER_IMAGE = process.env.DOCKER_IMAGE;
var APP_NAME     = 'test';
var INSTANCE     = DOCKER_HOST + ':3000';

describe('instances', function() {

  describe('loadAppInstances', function() {

    before(function(done) {
      instances.addAppInstance(APP_NAME, INSTANCE, done);
    });

    after(function(done) {
      instances.removeAppInstance(APP_NAME, INSTANCE, done);
    });

    it('should return a list of instances', function(done) {
      instances.loadAppInstances(APP_NAME, function(err, _instances) {
        should.not.exist(err);
        _instances.should.containEql(INSTANCE);
        done();
      });
    });

  });

  describe('removeAppInstance', function() {

    before(function(done) {
      instances.addAppInstance(APP_NAME, INSTANCE, done);
    });

    it('should remove the instance', function(done) {
      instances.removeAppInstance(APP_NAME, INSTANCE, function(err) {
        should.not.exist(err);
        instances.loadAppInstances(APP_NAME, function(err, _instances) {
          should.not.exist(err);
          _instances.should.not.containEql(INSTANCE);
          done();
        });
      });
    });

  });

  describe('healthCheckInstance', function() {

    var containerId = null;

    before(function(done) {
      containers.runContainer(DOCKER_HOST, 3000, DOCKER_IMAGE, null, function(err, _containerId) {
        containerId = _containerId;
        setTimeout(function() {
          done(err);
        }, 1000); // waits for http-server to start
      });
    });

    after(function(done) {
      containers.deleteContainer(DOCKER_HOST, containerId, done);
    });

    it('should return true when checking healthy host', function(done) {
      instances.healthCheckInstance(DOCKER_HOST, 3000, function(err, healthy) {
        should.not.exist(err);
        healthy.should.be.ok;
        done();
      });
    });

  });

  describe('allocateContainers', function() {

    var containerIds = [];
    var n = 4;

    before(function(done) {
      async.times(n, function(i, fn) {
        containers.runContainer(DOCKER_HOST, 8000 + i, DOCKER_IMAGE, null, function(err, containerId) {
          containerIds.push(containerId);
          fn(err);
        });
      }, function(err) {
        if (err) {
          return done(err);
        }
        hosts.addHost('127.0.0.1', done);
      });
    });

    after(function(done) {
      async.each(containerIds, function(containerId, fn) {
        containers.deleteContainer(DOCKER_HOST, containerId, fn);
      }, function(err) {
        if (err) {
          return done(err);
        }
        hosts.removeHost('127.0.0.1', done);
      });
    });

    it('should return a list of instances', function(done) {
      instances.allocateContainers(20, function(err, allocated) {
        should.not.exist(err);
        allocated[DOCKER_HOST].should.eql(10);
        allocated['127.0.0.1'].should.eql(10);
        done();
      });
    });

  });

  describe('deployAppInstance', function() {

    var containerId = null;

    after(function(done) {
      containers.deleteContainer(DOCKER_HOST, containerId, done);
    });

    it('should deploy a new app instance', function(done) {
      instances.deployAppInstance(APP_NAME, DOCKER_HOST, 3000, DOCKER_IMAGE, function(err) {
        should.not.exist(err);
        containers.loadContainers(DOCKER_HOST, function(err, _containers) {
          should.not.exist(err);
          _containers.should.have.lengthOf(1);
          containerId = _containers[0].Id;
          done();
        });
      });
    });

  });

  describe('deployNewAppInstances', function() {

    var containerIds = [];

    after(function(done) {
      async.each(containerIds, function(containerId, fn) {
        containers.deleteContainer(DOCKER_HOST, containerId, fn);
      }, done);
    });

    it('should deploy a new app instance', function(done) {
      instances.deployNewAppInstances(APP_NAME, DOCKER_IMAGE, 2, function(err, launched) {
        should.not.exist(err);
        containers.loadContainers(DOCKER_HOST, function(err, _containers) {
          should.not.exist(err);
          _containers.should.have.lengthOf(2);
          containerIds = _.pluck(_containers, 'Id');
          done();
        });
      });
    });

  });

});
