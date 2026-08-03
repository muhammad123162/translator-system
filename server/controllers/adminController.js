const { pool } = require('../config/db');
const userModel = require('../models/userModel');
const languageModel = require('../models/languageModel');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/responseFormatter');
const AppError = require('../utils/AppError');

const listUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const offset = (Number(page) - 1) * Number(limit);
  const { rows, total } = await userModel.findAll({ limit: Number(limit), offset });
  return sendSuccess(res, { message: 'Users retrieved.', data: { rows, total, page: Number(page), limit: Number(limit) } });
});

const deleteUser = asyncHandler(async (req, res) => {
  if (Number(req.params.id) === req.user.id) {
    throw new AppError('You cannot delete your own account while logged in.', 400);
  }
  const deleted = await userModel.deleteById(req.params.id);
  if (!deleted) throw new AppError('User not found.', 404);
  return sendSuccess(res, { message: 'User deleted.' });
});

const setUserActive = asyncHandler(async (req, res) => {
  await userModel.setActive(req.params.id, req.body.isActive);
  return sendSuccess(res, { message: 'User status updated.' });
});

/** Dashboard summary cards: totals + translations-per-day for a simple chart. */
const getDashboardStats = asyncHandler(async (req, res) => {
  const [[userCount]] = await pool.query('SELECT COUNT(*) AS total FROM users');
  const [[translationCount]] = await pool.query('SELECT COUNT(*) AS total FROM translation_history');
  const [[apiErrors]] = await pool.query(
    "SELECT COUNT(*) AS total FROM api_usage_log WHERE status = 'error'"
  );
  const [dailyVolume] = await pool.query(`
    SELECT DATE(created_at) AS date, COUNT(*) AS count
    FROM translation_history
    WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 13 DAY)
    GROUP BY DATE(created_at)
    ORDER BY date ASC
  `);
  const [topLanguages] = await pool.query(`
    SELECT target_language, COUNT(*) AS count
    FROM translation_history
    GROUP BY target_language
    ORDER BY count DESC LIMIT 5
  `);

  return sendSuccess(res, {
    message: 'Dashboard stats retrieved.',
    data: {
      totalUsers: userCount.total,
      totalTranslations: translationCount.total,
      apiErrors: apiErrors.total,
      dailyVolume,
      topLanguages,
    },
  });
});

const getTranslationLogs = asyncHandler(async (req, res) => {
  const { page = 1, limit = 25 } = req.query;
  const offset = (Number(page) - 1) * Number(limit);
  const [rows] = await pool.query(
    `SELECT th.id, th.source_language, th.target_language, th.created_at, u.name AS userName, u.email AS userEmail
     FROM translation_history th JOIN users u ON u.id = th.user_id
     ORDER BY th.created_at DESC LIMIT :limit OFFSET :offset`,
    { limit: Number(limit), offset }
  );
  const [[{ total }]] = await pool.query('SELECT COUNT(*) AS total FROM translation_history');
  return sendSuccess(res, { message: 'Logs retrieved.', data: { rows, total } });
});

const listLanguages = asyncHandler(async (req, res) => {
  const languages = await languageModel.findAll();
  return sendSuccess(res, { message: 'Languages retrieved.', data: { languages } });
});

const setLanguageActive = asyncHandler(async (req, res) => {
  await languageModel.setActive(req.params.id, req.body.isActive);
  return sendSuccess(res, { message: 'Language updated.' });
});

module.exports = {
  listUsers,
  deleteUser,
  setUserActive,
  getDashboardStats,
  getTranslationLogs,
  listLanguages,
  setLanguageActive,
};
