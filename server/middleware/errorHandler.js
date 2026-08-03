const logger = require('../utils/logger');
const { sendError } = require('../utils/responseFormatter');
const config = require('../config/env');

/**
 * Catches everything forwarded via next(err) — from asyncHandler,
 * validation middleware, or thrown AppErrors — and turns it into a
 * consistent JSON response.
 *
 * Must be registered LAST in app.js, after all routes.
 */
function errorHandler(err, req, res, next) {
  logger.error(err.stack || err.message);

  // Known/"operational" errors (AppError) carry a safe message and status.
  if (err.isOperational) {
    return sendError(res, { statusCode: err.statusCode, message: err.message });
  }

  // Common library-specific errors we can translate into clean messages.
  if (err.code === 'ER_DUP_ENTRY') {
    return sendError(res, { statusCode: 409, message: 'A record with these details already exists.' });
  }
  if (err.name === 'JsonWebTokenError') {
    return sendError(res, { statusCode: 401, message: 'Invalid authentication token.' });
  }
  if (err.name === 'TokenExpiredError') {
    return sendError(res, { statusCode: 401, message: 'Your session has expired. Please log in again.' });
  }

  // Anything unexpected: never leak internals in production.
  const message = config.isProduction ? 'An unexpected error occurred.' : err.message;
  return sendError(res, { statusCode: 500, message });
}

/**
 * Handles requests to routes that don't exist. Registered right
 * before errorHandler.
 */
function notFoundHandler(req, res) {
  return sendError(res, {
    statusCode: 404,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
}

module.exports = { errorHandler, notFoundHandler };
