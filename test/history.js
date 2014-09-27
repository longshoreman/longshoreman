var should  = require('should');
var history = require('../src/history');

var APP_NAME   = 'test';
var IMAGE_NAME = 'image';

describe('history', function() {

  beforeEach(function(done) {
    history.clearDeployments(APP_NAME, done);
  });

  describe('saveDeployment', function() {
    it('should save a new deployment record', function(done) {
      history.saveDeployment(APP_NAME, IMAGE_NAME, 1, function(err) {
        should.not.exist(err);
        history.loadMostRecentDeployment(APP_NAME, function(err, result) {
          should.not.exist(err);
          result.should.have.property('timestamp');
          result.should.have.property('app', APP_NAME);
          result.should.have.property('image', IMAGE_NAME);
          result.should.have.property('count', 1);
          done();
        });
      });
    });
  });

  describe('clearDeployments', function() {

    beforeEach(function(done) {
      history.saveDeployment(APP_NAME, IMAGE_NAME, 1, done);
    });

    it('should clear the deployment history', function(done) {
      history.clearDeployments(APP_NAME, function(err, result) {
        should.not.exist(err);
        history.loadDeployments(APP_NAME, function(err, all) {
          should.not.exist(err);
          all.should.be.empty;
          done();
        });
      });
    });
  });

  describe('loadMostRecentDeployment', function() {

    beforeEach(function(done) {
      history.saveDeployment(APP_NAME, IMAGE_NAME, 1, done);
    });

    it('should load the most recent deployment record', function(done) {
      history.loadMostRecentDeployment(APP_NAME, function(err, result) {
        should.not.exist(err);
        result.should.have.property('timestamp');
        result.should.have.property('app', APP_NAME);
        result.should.have.property('image', IMAGE_NAME);
        result.should.have.property('count', 1);
        done();
      });
    });

  });

  describe('loadDeployments', function() {
    beforeEach(function(done) {
      history.saveDeployment(APP_NAME, IMAGE_NAME, 1, done);
    });
    it('should load all deployment records', function(done) {
      history.loadDeployments(APP_NAME, function(err, results) {
        should.not.exist(err);
        results.should.have.length(1);
        done();
      });
    });
  });

});
