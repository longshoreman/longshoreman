
var should = require('should');
var util   = require('../src/util');

describe('util', function() {

  describe('getUnixTimestamp', function() {
    it('should return the current timestamp', function() {
      var timestamp = util.getUnixTimestamp();
      timestamp.should.eql(Math.round(new Date().getTime() / 1000));
    });
  });

  describe('getDockerUrl', function() {
    it('should return the docker url', function() {
      var dockerUrl = util.getDockerUrl('localhost', 'containers/json');
      dockerUrl.should.eql('http://localhost:2375/containers/json');
    });
  });

  describe('parseDockerImage', function() {
    it('should parse out the docker image name and tag', function() {
      var image = util.parseDockerImage('longshoreman/router');
      image.should.have.property('user', 'longshoreman');
      image.should.have.property('repo', 'router');
      image.should.have.property('tag', null);
    });

    it('should handle image tag correctly', function() {
      var image = util.parseDockerImage('longshoreman/router:tag');
      image.should.have.property('user', 'longshoreman');
      image.should.have.property('repo', 'router');
      image.should.have.property('tag', 'tag');
    });
  });

  describe('isResponseOk', function() {
    it('should return true for ok response codes', function() {
      util.isResponseOk(200).should.be.ok;
    });
    it('should return false for error response codes', function() {
      util.isResponseOk(404).should.not.be.ok;
    });
  });

});
