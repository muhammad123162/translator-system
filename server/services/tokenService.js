const jwt = require('jsonwebtoken');
const config = require('../config/env');

/**
 * Short-lived access token: carries id/role, sent as a Bearer token
 * or httpOnly cookie, checked on every protected request.
 */
function signAccessToken(user) {
  return jwt.sign({ id: user.id, role: user.role }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
}

/**
 * Longer-lived refresh token, used only to mint a new access token
 * without forcing the user to re-enter credentials. Kept in a
 * separate secret so a leaked access token can't be used to forge one.
 */
function signRefreshToken(user) {
  return jwt.sign({ id: user.id }, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn,
  });
}

function verifyAccessToken(token) {
  return jwt.verify(token, config.jwt.secret);
}

function verifyRefreshToken(token) {
  return jwt.verify(token, config.jwt.refreshSecret);
}

module.exports = { signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken };
