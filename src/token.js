var crypto   = require('crypto');
var redisCmd = require('./redis');

function createToken(fn) {
  var token = crypto
    .createHash('sha1')
    .update(''+new Date().getTime())
    .digest('hex');
  redisCmd('set', 'token', token, fn);
}

function getToken(fn) {
  redisCmd('get', 'token', function(err, token) {
    if (err) {
      return fn(err);
    }
    if (!token) {
      createToken(fn);
    }
    else {
      fn(null, token);
    }
  });
}

function checkToken(compare, fn) {
  getToken(function(err, token) {
    if (err) {
      return fn(err);
    }
    fn(null, token == compare);
  });
}

exports.checkToken = checkToken;
exports.getToken = getToken;
exports.createToken = createToken;
