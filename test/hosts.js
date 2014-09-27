var should     = require('should');
var hosts      = require('../src/hosts');
var containers = require('../src/containers');

var DOCKER_HOST  = process.env.DOCKER_HOST;
var DOCKER_IMAGE = process.env.DOCKER_IMAGE;

describe('hosts', function() {

  beforeEach(function(done) {
    hosts.addHost(DOCKER_HOST, done);
  });

  describe('loadHosts', function() {
    it('should load a list of host ips', function(done) {
      hosts.loadHosts(function(err, hosts) {
        should.not.exist(err);
        hosts.should.containEql(DOCKER_HOST);
        done();
      });
    });
  });

  describe('addHost', function() {
    it('should load a list of host ips', function(done) {
      hosts.addHost('127.0.0.1', function(err) {
        should.not.exist(err);
        hosts.loadHosts(function(err, hosts) {
          should.not.exist(err);
          hosts.should.containEql('127.0.0.1');
          done();
        });
      });
    });
  });

  describe('removeHosts', function() {
    it('should load a list of host ips', function(done) {
      hosts.removeHost('127.0.0.1', function(err) {
        should.not.exist(err);
        hosts.loadHosts(function(err, hosts) {
          should.not.exist(err);
          hosts.should.not.containEql('127.0.0.1');
          done();
        });
      });
    });
  });

  describe('loadPortsInUse', function() {
    var containerId = null;

    before(function(done) {
      containers.runContainer(DOCKER_HOST, 8000, DOCKER_IMAGE, null, function(err, _containerId) {
        containerId = _containerId;
        done(err);
      });
    });

    after(function(done) {
      containers.deleteContainer(DOCKER_HOST, containerId, done);
    });

    it('should return the used ports on this host', function(done) {
      hosts.loadPortsInUse(DOCKER_HOST, function(err, ports) {
        should.not.exist(err);
        ports.should.containEql(8000);
        done();
      });
    });
  });

  describe('findAvailablePort', function() {
    it('should return a free port', function(done) {
      hosts.findAvailablePort(DOCKER_HOST, function(err, port) {
        should.not.exist(err);
        port.should.be.within(8000, 8999);
        done();
      });
    });
  });

  describe.skip('pullDockerImage', function() {
    it('should download the image', function(done) {
      hosts.pullDockerImage(DOCKER_HOST, 'docker.wayfinder.co:443/wf-image', function(err, result) {
        should.not.exist(err);
        done();
      });
    });
  });

});
