const rateLimit = require('express-rate-limit');
const config = require('../config/env');

/**
 * General-purpose limiter applied to all /api routes — protects
 * against brute-force and casual abuse without affecting normal use.
 */
const apiLimiter = rateLimit({
  windowMs: config.rateLimit.windowMinutes * 60 * 1000,
  max: config.rateLimit.maxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP. Please try again later.',
  },
});

/**
 * Stricter limiter specifically for the translation endpoint, since
 * each call consumes billed Google Cloud API quota — this is the
 * "API Rate Limiting" requirement tied directly to cost control, not
 * just abuse prevention.
 */
const translateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMinutes * 60 * 1000,
  max: config.rateLimit.translateMaxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => (req.user ? `user:${req.user.id}` : req.ip),
  message: {
    success: false,
    message: 'Translation limit reached. Please wait a few minutes before translating again.',
  },
});

/**
 * Tighter limiter for auth endpoints (login/register) to slow down
 * credential-stuffing / brute-force attempts.
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again in 15 minutes.',
  },
});

module.exports = { apiLimiter, translateLimiter, authLimiter };
