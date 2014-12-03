'use strict';

var express    = require('express');
var bodyParser = require('body-parser');
var validator  = require('express-validator');
var url        = require('url');
var _          = require('lodash');
var async      = require('async');
var debug      = require('debug')('longshoreman');
var token      = require('./token');
var service    = require('./service');
var apps       = require('./apps');
var hosts      = require('./hosts');
var instances  = require('./instances');
var history    = require('./history');
var logs       = require('./logs');
var envs       = require('./envs');

var router = express.Router();

router.use(bodyParser.urlencoded({extended: true}));
router.use(bodyParser.json());
router.use(validator());
router.use(authMiddleware);
router.use(function(req, res, next) {
  debug(req.originalUrl);
  debug(req.body);
  next();
});

function authMiddleware(req, res, next) {
  token.checkToken(req.headers['x-auth'], function(err, valid) {
    if (!valid) {
      res.json(401, {
        error: 'Invalid token',
      });
    }
    else {
      next();
    }
  });
}

router.get('/describe', function(req, res) {
  var output = {};
  service.describe(function(err, description) {
    if (err) {
      return res.json(500, {
        error: err.message,
      });
    }
    res.json({error: false, description: description});
  });
});

router.get('/apps', function(req, res) {
  apps.loadApps(function(err, _apps) {
    if (err) {
      return res.json(500, {
        error: err.message
      });
    }
    res.json({error: false, apps: _apps});
  });
});

router.post('/apps', function(req, res) {

  req.assert('app').notEmpty();

  var errors = req.validationErrors();
  if (errors) {
    return res.json({error: errors[0].msg});
  }

  apps.addApp(req.body.app, function(err) {
    if (err) {
      return res.json(500, {
        error: err.message
      });
    }
    res.json({error: false});
  });
});

router.delete('/apps/:app', function(req, res) {

  req.assert('app').notEmpty();

  var errors = req.validationErrors();
  if (errors) {
    return res.json({error: errors[0].msg});
  }

  apps.removeApp(req.params.app, function(err) {
    if (err) {
      return res.json(500, {
        error: err.message
      });
    }
    res.json({error: false});
  });
});

router.get('/hosts', function(req, res) {
  hosts.loadHosts(function(err, hosts) {
    if (err) {
      return res.json(500, {
        error: err.message
      });
    }
    res.json({error: false, hosts: hosts});
  });
});

router.post('/hosts', function(req, res) {

  req.assert('host').isIP();

  var errors = req.validationErrors();
  if (errors) {
    return res.json({error: errors[0].msg});
  }

  hosts.addHost(req.body.host, function(err) {
    if (err) {
      return res.json(500, {
        error: err.message
      });
    }
    res.json({error: false});
  });
});

router.delete('/hosts/:host', function(req, res) {
  req.assert('host').notEmpty();

  var errors = req.validationErrors();
  if (errors) {
    return res.json({error: errors[0].msg});
  }

  hosts.removeHost(req.params.host, function(err) {
    if (err) {
      return res.json(500, {
        error: err.message
      });
    }
    res.json({error: false});
  });
});

router.post('/:app/deploy', function(req, res) {

  req.assert('app').notEmpty();
  req.assert('image').notEmpty();

  var errors = req.validationErrors();
  if (errors) {
    return res.json({error: errors[0].msg});
  }

  var app   = req.params.app;
  var image = req.body.image;
  var count = parseInt(req.body.count, 10);
  if (isNaN(count)) {
    count = 2;
  }
  count = Math.min(count, 32);

  instances.deployAppInstances(app, image, count, function(err, result) {
    if (err) {
      return res.json(500, {
        error: err.message
      });
    }
    res.json({error: false});
  });
});

router.get('/:app/instances', function(req, res) {

  req.assert('app').notEmpty();

  var errors = req.validationErrors();
  if (errors) {
    return res.json({error: errors[0].msg});
  }

  instances.loadAppInstances(req.params.app, function(err, instances) {
    if (err) {
      return res.json(500, {
        error: err.message
      });
    }
    res.json({error: false, instances: instances});
  });
});

router.get('/:app/history', function(req, res) {

  req.assert('app').notEmpty();

  var errors = req.validationErrors();
  if (errors) {
    return res.json({error: errors[0].msg});
  }

  history.loadDeployments(req.params.app, function(err, deploys) {
    if (err) {
      return res.json(500, {
        error: err.message
      });
    }
    res.json({error: false, history: deploys});
  });
});

router.get('/:app/envs', function(req, res) {

  req.assert('app').notEmpty();

  var errors = req.validationErrors();
  if (errors) {
    return res.json({error: errors[0].msg});
  }

  envs.loadAppEnvs(req.params.app, function(err, envs) {
    if (err) {
      return res.json(500, {
        error: err.message
      });
    }
    res.json({error: false, envs: envs});
  });
});

router.post('/:app/envs', function(req, res) {

  req.assert('app').notEmpty();
  req.assert('env').notEmpty();

  var errors = req.validationErrors();
  if (errors) {
    return res.json({error: errors[0].msg});
  }

  envs.addAppEnv(req.params.app, req.body.env, function(err, result) {
    if (err) {
      return res.json(500, {
        error: err.message
      });
    }
    res.json({error: false});
  });
});

router.delete('/:app/envs/:env', function(req, res) {

  req.assert('app').notEmpty();
  req.assert('env').notEmpty();

  var errors = req.validationErrors();
  if (errors) {
    return res.json({error: errors[0].msg});
  }

  envs.removeAppEnv(req.params.app, req.params.env, function(err, result) {
    if (err) {
      return res.json(500, {
        error: err.message
      });
    }
    res.json({error: false});
  });
});

router.get('/:app/logs', function(req, res) {

  req.assert('app').notEmpty();

  var errors = req.validationErrors();
  if (errors) {
    return res.json({error: errors[0].msg});
  }

  logs.loadAppLogs(req.params.app, function(err, logs) {
    if (err) {
      return res.json(500, {
        error: err.message
      });
    }
    res.json({error: false, logs: logs});
  });
});

router.get('/:app/kill', function(req, res) {

  req.assert('app').notEmpty();

  var errors = req.validationErrors();
  if (errors) {
    return res.json({error: errors[0].msg});
  }

  instances.killAppInstances(req.params.app, function(err) {
    if (err) {
      return res.json(500, {
        error: err.message
      });
    }
    res.json({error: false});
  });
});

module.exports = router;
