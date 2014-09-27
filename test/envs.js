var should   = require('should');
var envs     = require('../src/envs');
var redisCmd = require('../src/redis');

var APP_NAME = 'test';

describe('envs', function () {

  beforeEach(function(done) {
    redisCmd('sadd', 'test:envs', 'FOO=bar', done);
  });

  describe('loadAppEnvs', function() {
    it('should return a list of envs', function(done) {
      envs.loadAppEnvs(APP_NAME, function(err, _envs) {
        should.not.exist(err);
        _envs.should.containEql('FOO=bar');
        done();
      });
    });
  });

  describe('addAppEnv', function() {
    it('should add the env', function(done) {
      envs.addAppEnv(APP_NAME, 'BOO=baz', function(err) {
        should.not.exist(err);
        envs.loadAppEnvs(APP_NAME, function(err, _envs) {
          should.not.exist(err);
          _envs.should.containEql('BOO=baz');
          done();
        });
      });
    });
  });

  describe('removeAppEnv', function() {
    it('should remove the env', function(done) {
      envs.removeAppEnv(APP_NAME, 'BOO', function(err) {
        should.not.exist(err);
        envs.loadAppEnvs(APP_NAME, function(err, _envs) {
          should.not.exist(err);
          _envs.should.not.containEql('BOO=baz');
          done();
        });
      });
    });
  });

});
