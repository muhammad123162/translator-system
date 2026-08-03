const tokenService = require('../services/tokenService');
const userModel = require('../models/userModel');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Reads the access token from either the Authorization header
 * ("Bearer <token>") or the httpOnly cookie set at login, verifies
 * it, and attaches the corresponding user to req.user.
 *
 * We re-fetch the user (rather than trusting the token payload alone)
 * so a deactivated/deleted account is rejected immediately instead of
 * staying valid until the token naturally expires.
 */
const requireAuth = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization;
  const bearerToken = header && header.startsWith('Bearer ') ? header.split(' ')[1] : null;
  const token = bearerToken || req.cookies?.accessToken;

  if (!token) {
    throw new AppError('Authentication required. Please log in.', 401);
  }

  const payload = tokenService.verifyAccessToken(token);
  const user = await userModel.findById(payload.id);

  if (!user || !user.is_active) {
    throw new AppError('Account not found or deactivated.', 401);
  }

  req.user = user;
  next();
});

/**
 * Role-based authorization — used after requireAuth.
 * Usage: router.get('/admin/stats', requireAuth, requireRole('admin'), ...)
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action.', 403));
    }
    next();
  };
}

module.exports = { requireAuth, requireRole };
