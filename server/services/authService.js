const bcrypt = require('bcrypt');
const userModel = require('../models/userModel');
const tokenService = require('./tokenService');
const AppError = require('../utils/AppError');
const config = require('../config/env');

/**
 * Business logic for authentication lives here, separate from
 * authController, so it can be reused (e.g. by an admin "create user"
 * flow later) and unit-tested without spinning up Express.
 */

async function register({ name, email, password }) {
  const existing = await userModel.findByEmail(email);
  if (existing) {
    throw new AppError('An account with this email already exists.', 409);
  }

  const passwordHash = await bcrypt.hash(password, config.bcrypt.saltRounds);
  const user = await userModel.create({ name, email, passwordHash });

  const accessToken = tokenService.signAccessToken(user);
  const refreshToken = tokenService.signRefreshToken(user);

  return { user, accessToken, refreshToken };
}

async function login({ email, password }) {
  const user = await userModel.findByEmail(email);

  // Deliberately identical error for "no such user" and "wrong password"
  // so the response doesn't reveal which emails are registered.
  if (!user) {
    throw new AppError('Invalid email or password.', 401);
  }

  if (!user.is_active) {
    throw new AppError('This account has been deactivated. Contact an administrator.', 403);
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new AppError('Invalid email or password.', 401);
  }

  const accessToken = tokenService.signAccessToken(user);
  const refreshToken = tokenService.signRefreshToken(user);

  const { password: _omit, ...safeUser } = user;
  return { user: safeUser, accessToken, refreshToken };
}

async function refreshAccessToken(refreshToken) {
  let payload;
  try {
    payload = tokenService.verifyRefreshToken(refreshToken);
  } catch (err) {
    throw new AppError('Invalid or expired refresh token. Please log in again.', 401);
  }

  const user = await userModel.findById(payload.id);
  if (!user || !user.is_active) {
    throw new AppError('Account no longer available.', 401);
  }

  return tokenService.signAccessToken(user);
}

async function changePassword(userId, currentPassword, newPassword) {
  const user = await userModel.findByEmail((await userModel.findById(userId)).email);
  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) {
    throw new AppError('Current password is incorrect.', 401);
  }
  const passwordHash = await bcrypt.hash(newPassword, config.bcrypt.saltRounds);
  await userModel.updatePassword(userId, passwordHash);
}

module.exports = { register, login, refreshAccessToken, changePassword };
