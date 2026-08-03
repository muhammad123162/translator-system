/**
 * Custom error class for expected/"operational" errors (bad input,
 * unauthorized, not found, etc.) as opposed to programming bugs.
 *
 * Distinguishing the two lets the global error handler decide what's
 * safe to show the client: an AppError's message is written for the
 * user; anything else gets a generic message so we never leak stack
 * traces or internal details in production.
 */
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
