const userModel = require('../models/userModel');
const authService = require('../services/authService');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/responseFormatter');

const getProfile = asyncHandler(async (req, res) => {
  return sendSuccess(res, { message: 'Profile retrieved.', data: { user: req.user } });
});

const updateProfile = asyncHandler(async (req, res) => {
  const { name, email } = req.body;
  const updated = await userModel.updateProfile(req.user.id, { name, email });
  return sendSuccess(res, { message: 'Profile updated.', data: { user: updated } });
});

const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  await authService.changePassword(req.user.id, currentPassword, newPassword);
  return sendSuccess(res, { message: 'Password changed successfully.' });
});

module.exports = { getProfile, updateProfile, changePassword };
