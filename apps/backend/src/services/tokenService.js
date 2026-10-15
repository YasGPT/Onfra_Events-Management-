'use strict';

const jwt = require('jsonwebtoken');
const env = require('../config/env');

// Claims kept minimal by design: sub, iss, aud, iat, exp only.
// Never add email, role lists, passwords, or tokens to the payload.
function signAccessToken(user) {
  return jwt.sign({}, env.jwtSecret, {
    algorithm: 'HS256',
    expiresIn: env.accessTokenTtl,
    issuer: env.jwtIssuer,
    audience: env.jwtAudience,
    subject: user.id,
  });
}

// Throws jwt.JsonWebTokenError / TokenExpiredError on any failure.
// algorithms is pinned: never accept whatever the token header claims.
function verifyAccessToken(token) {
  return jwt.verify(token, env.jwtSecret, {
    algorithms: ['HS256'],
    issuer: env.jwtIssuer,
    audience: env.jwtAudience,
  });
}

module.exports = { signAccessToken, verifyAccessToken };
