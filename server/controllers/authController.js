const authService = require('../services/authService');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/responseFormatter');
const config = require('../config/env');

/**
 * httpOnly cookies keep tokens out of reach of JavaScript, which is
 * the primary mitigation against XSS-driven token theft. `secure` is
 * enabled in production so cookies only travel over HTTPS. `sameSite:
 * 'strict'` is the CSRF defence — cross-site requests won't carry the
 * cookie at all.
 */
const cookieOptions = {
  httpOnly: true,
  secure: config.isProduction,
  sameSite: 'strict',
};

const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const { user, accessToken, refreshToken } = await authService.register({ name, email, password });

  res
    .cookie('accessToken', accessToken, { ...cookieOptions, maxAge: 24 * 60 * 60 * 1000 })
    .cookie('refreshToken', refreshToken, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });

  const { password: _omit, ...safeUser } = user;
  return sendSuccess(res, {
    statusCode: 201,
    message: 'Account created successfully.',
    data: { user: safeUser, accessToken },
  });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const { user, accessToken, refreshToken } = await authService.login({ email, password });

  res
    .cookie('accessToken', accessToken, { ...cookieOptions, maxAge: 24 * 60 * 60 * 1000 })
    .cookie('refreshToken', refreshToken, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });

  return sendSuccess(res, { message: 'Logged in successfully.', data: { user, accessToken } });
});

const logout = asyncHandler(async (req, res) => {
  res.clearCookie('accessToken', cookieOptions).clearCookie('refreshToken', cookieOptions);
  return sendSuccess(res, { message: 'Logged out successfully.' });
});

const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken || req.body.refreshToken;
  const accessToken = await authService.refreshAccessToken(token);

  res.cookie('accessToken', accessToken, { ...cookieOptions, maxAge: 24 * 60 * 60 * 1000 });
  return sendSuccess(res, { message: 'Token refreshed.', data: { accessToken } });
});

const me = asyncHandler(async (req, res) => {
  return sendSuccess(res, { message: 'Current user retrieved.', data: { user: req.user } });
});

module.exports = { register, login, logout, refresh, me };
