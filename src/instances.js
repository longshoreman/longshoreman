'use strict';

var async      = require('async');
var request    = require('request');
var _          = require('lodash');
var debug      = require('debug')('longshoreman');
var redisCmd   = require('./redis');
var routers    = require('./routers');
var hosts      = require('./hosts');
var history    = require('./history');
var envs       = require('./envs');
var containers = require('./containers');
var util       = require('./util');

function loadAppInstances(app, fn) {
  redisCmd('smembers', app + ':instances', fn);
}

function addAppInstance(app, instance, fn) {
  redisCmd('sadd', app + ':instances', instance, function(err, result) {
    if (err) {
      return fn(err);
    }
    routers.notifyRouters(fn);
  });
}

function removeAppInstance(app, instance, fn) {
  redisCmd('srem', app + ':instances', instance, function(err, result) {
    if (err) {
      return fn(err);
    }
    routers.notifyRouters(fn);
  });
}

function healthCheckInstance(hostname, port, fn) {
  var healthCheckUrl = 'http://' + hostname + ':' + port + '/ping';
  async.retry(10, function(fn) {
    request({
      url: healthCheckUrl,
      timeout: 5000,
    }, function(err, res) {
      if (err) {
        fn(null, false);
      } else {
        fn(null, res.statusCode == 200);
      }
    });
  }, fn);
}

function deployAppInstance(app, host, port, image, fn) {
  async.waterfall([
    function(fn) {
      debug('Pulling new tags for ' + image);
      hosts.pullDockerImage(host, image, fn);
    },
    function(status, fn) {
      debug('Loading app envs');
      envs.loadAppEnvs(app, fn);
    },
    function(envs, fn) {
      debug('Starting new container at ' + host + ':' + port);
      containers.runContainer(host, port, image, envs, fn);
    },
    function(container, fn) {
      debug('Checking host health');
      healthCheckInstance(host, port, fn);
    },
    function(success, fn) {
      if (false && !success) {
        fn(new Error('Failed to deploy new instance.'));
      } else {
        debug('Adding ' + host + ':' + port + ' to router');
        addAppInstance(app, host + ':' + port, fn);
      }
    }
  ], function(err, result) {
    if (err) {
      debug('Deploy failed. Rolling back.');
      debug(err);
      killAppInstance(app, host, port, function(_err) {
        if (_err) {
          return fn(new Error('Rollback failed. System may be in an invalid state.'));
        }
        fn(new Error('Deployment failed. Rolling back.'));
      });
    } else {
      fn(null);
    }
  });
}

function allocateContainers(count, fn) {

  containers.getContainerDistribution(function(err, dist) {

    if (err) {
      return fn(err);
    }

    var totalContainers = _.reduce(dist, function(sum, count, key) {
      return sum + count;
    });

    var hosts = _.keys(dist);
    var totalHosts = hosts.length;
    var idealCountPerHost = Math.ceil((totalContainers + count) / totalHosts);

    debug(count, dist, totalContainers, totalHosts, idealCountPerHost);

    var allocated = {};

    _.each(hosts, function(host) {
      allocated[host] = 0;
    });

    var n = 0;
    while (count > 0) {
      var host = hosts[n++ % totalHosts];
      var countForHost = dist[host];
      if (countForHost < idealCountPerHost) {
        allocated[host]++;
        count--;
      }
    }

    fn(null, allocated);
  });
}

function deployNewAppInstances(app, image, count, fn) {
  allocateContainers(count, function(err, allocated) {
    if (err) {
      return fn(err);
    }
    var _hosts = Object.keys(allocated);
    async.each(_hosts, function(host, fn) {
      async.times(allocated[host], function(n, fn) {
        hosts.findAvailablePort(host, function(err, port) {
          if (err) {
            fn(err);
          } else {
            deployAppInstance(app, host, port, image, fn);
          }
        });
      }, fn);
    }, function(err) {
      fn(err, allocated);
    });
  });
}

function killAppInstance(app, host, port, fn) {
  debug('Killing instance at ' + host + ':' + port);
  async.waterfall([
    function(fn) {
      containers.stopContainerByPort(host, port, fn);
    },
    function(result, fn) {
      removeAppInstance(app, host + ':' + port, fn);
    }
  ], fn);
}

function deployAppInstances(app, image, count, fn) {
  loadAppInstances(app, function(err, instances) {
    if (err) {
      return fn(err);
    }
    if (instances.length) {
      var cb = fn;
      fn = function(err) {
        if (err) {
          fn(err);
        } else {
          history.saveDeployment(app, image, count, _.noop);
          async.map(instances, function(instance, fn) {
            var parts = instance.split(':');
            killAppInstance(app, parts[0], parts[1], fn);
          }, cb);
        }
      };
    }
    deployNewAppInstances(app, image, count, fn);
  });
}

function killAppInstances(app, fn) {
  loadAppInstances(app, function(err, instances) {
    if (err) {
      return fn(err);
    }
    if (instances.length) {
      async.map(instances, function(instance, fn) {
        var parts = instance.split(':');
        var host  = parts[0];
        var port  = parts[1];
        killAppInstance(app, host, port, fn);
      }, fn);
    }
  });
}

exports.loadAppInstances = loadAppInstances;
exports.addAppInstance = addAppInstance;
exports.removeAppInstance = removeAppInstance;
exports.deployAppInstance = deployAppInstance;
exports.deployNewAppInstances = deployNewAppInstances;
exports.killAppInstance = killAppInstance;
exports.deployAppInstances = deployAppInstances;
exports.killAppInstance = killAppInstance;
exports.killAppInstances = killAppInstances;
exports.healthCheckInstance = healthCheckInstance;
exports.allocateContainers = allocateContainers;
