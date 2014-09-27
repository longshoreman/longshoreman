var should = require('should');
var apps     = require('../src/apps');
var redisCmd = require('../src/redis');

describe('apps', function () {

  beforeEach(function(done) {
    redisCmd('sadd', 'apps', 'test', done);
  });

  describe('loadApps', function() {
    it('should return a list of apps', function(done) {
      apps.loadApps(function(err, _apps) {
        should.not.exist(err);
        _apps.should.containEql('test');
        done();
      });
    });
  });

  describe('addApp', function() {
    it('should add the app', function(done) {
      apps.addApp('another', function(err) {
        should.not.exist(err);
        apps.loadApps(function(err, _apps) {
          should.not.exist(err);
          _apps.should.containEql('another');
          done();
        });
      });
    });
  });

  describe('removeApp', function() {
    it('should remove the app', function(done) {
      apps.removeApp('test', function(err) {
        should.not.exist(err);
        apps.loadApps(function(err, _apps) {
          should.not.exist(err);
          _apps.should.not.containEql('test');
          done();
        });
      });
    });
  });

});
