/**
 * Ensures every API response — success or failure — follows the same
 * envelope shape, so the frontend never has to guess where the
 * payload lives.
 *
 *   { success: true,  message, data }
 *   { success: false, message, errors }
 */
function sendSuccess(res, { statusCode = 200, message = 'OK', data = null } = {}) {
  return res.status(statusCode).json({ success: true, message, data });
}

function sendError(res, { statusCode = 500, message = 'Something went wrong', errors = null } = {}) {
  return res.status(statusCode).json({ success: false, message, errors });
}

module.exports = { sendSuccess, sendError };
