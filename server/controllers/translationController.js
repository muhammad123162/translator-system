const translationService = require('../services/translationService');
const translationModel = require('../models/translationModel');
const languageModel = require('../models/languageModel');
const apiUsageModel = require('../models/apiUsageModel');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/responseFormatter');
const AppError = require('../utils/AppError');

/**
 * POST /api/translations
 * Translates text via Google Cloud Translation API, then persists the
 * result to translation_history for the logged-in user.
 */
const translate = asyncHandler(async (req, res) => {
  const { text, targetLanguage, sourceLanguage } = req.body;

  let translationResult;
  try {
    translationResult = await translationService.translateText(text, targetLanguage, sourceLanguage);
  } catch (err) {
    // Log the failed call before propagating the error, so failed
    // requests still show up in "API Errors" on the admin dashboard.
    await apiUsageModel.logUsage({
      userId: req.user.id,
      characterCount: text.length,
      status: 'error',
      errorMessage: err.message,
    });
    throw err;
  }

  const { translatedText, detectedSourceLanguage } = translationResult;

  await apiUsageModel.logUsage({
    userId: req.user.id,
    characterCount: text.length,
    status: 'success',
  });

  const record = await translationModel.create({
    userId: req.user.id,
    sourceLanguage: sourceLanguage && sourceLanguage !== 'auto' ? sourceLanguage : detectedSourceLanguage,
    targetLanguage,
    originalText: text,
    translatedText,
  });

  return sendSuccess(res, {
    statusCode: 201,
    message: 'Translation completed.',
    data: { translation: record, detectedSourceLanguage },
  });
});

/** POST /api/translations/detect */
const detect = asyncHandler(async (req, res) => {
  const { text } = req.body;
  if (!text || !text.trim()) {
    throw new AppError('Text is required for language detection.', 400);
  }
  const result = await translationService.detectLanguage(text);
  return sendSuccess(res, { message: 'Language detected.', data: result });
});

/** GET /api/translations/languages — dropdown data */
const listLanguages = asyncHandler(async (req, res) => {
  const languages = await languageModel.findAllActive();
  return sendSuccess(res, { message: 'Supported languages retrieved.', data: { languages } });
});

/** GET /api/translations/history */
const getHistory = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, q, favorites } = req.query;
  const result = await translationModel.findByUser(req.user.id, {
    page: Number(page),
    limit: Number(limit),
    q: q || null,
    favoritesOnly: favorites === 'true',
  });
  return sendSuccess(res, { message: 'Translation history retrieved.', data: result });
});

/** DELETE /api/translations/history/:id */
const deleteHistoryItem = asyncHandler(async (req, res) => {
  const deleted = await translationModel.deleteById(req.params.id, req.user.id);
  if (!deleted) {
    throw new AppError('Translation not found.', 404);
  }
  return sendSuccess(res, { message: 'Translation deleted.' });
});

/** DELETE /api/translations/history — clear all */
const clearHistory = asyncHandler(async (req, res) => {
  const count = await translationModel.deleteAllForUser(req.user.id);
  return sendSuccess(res, { message: `Deleted ${count} translation(s).` });
});

/** PATCH /api/translations/history/:id/favorite */
const toggleFavorite = asyncHandler(async (req, res) => {
  const existing = await translationModel.findOwnedById(req.params.id, req.user.id);
  if (!existing) {
    throw new AppError('Translation not found.', 404);
  }
  const updated = await translationModel.toggleFavorite(req.params.id, req.user.id);
  return sendSuccess(res, { message: 'Favorite status updated.', data: { translation: updated } });
});

/** GET /api/translations/stats — for the profile page */
const getStats = asyncHandler(async (req, res) => {
  const stats = await translationModel.statsForUser(req.user.id);
  return sendSuccess(res, { message: 'Stats retrieved.', data: stats });
});

module.exports = {
  translate,
  detect,
  listLanguages,
  getHistory,
  deleteHistoryItem,
  clearHistory,
  toggleFavorite,
  getStats,
};
