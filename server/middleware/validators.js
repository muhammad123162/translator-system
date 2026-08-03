const { body, query, validationResult } = require('express-validator');
const { sendError } = require('../utils/responseFormatter');
const { SUPPORTED_LANGUAGE_CODES } = require('../config/constants');

/**
 * Runs after any validation chain below. Collects express-validator's
 * errors into our standard error envelope instead of leaking its raw
 * internal format to the client.
 */
function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, {
      statusCode: 422,
      message: 'Validation failed.',
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
}

// --- Auth ---
const registerValidation = [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters.'),
  body('email').trim().isEmail().withMessage('A valid email is required.').normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters.')
    .matches(/\d/)
    .withMessage('Password must contain at least one number.'),
  handleValidation,
];

const loginValidation = [
  body('email').trim().isEmail().withMessage('A valid email is required.').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required.'),
  handleValidation,
];

// --- Translation ---
// Project scope: translation is supported between English, Hausa,
// Igbo, and Yoruba only (see server/config/constants.js). Both
// source and target are checked against SUPPORTED_LANGUAGE_CODES so
// the API rejects any other code even if a request bypasses the UI
// dropdowns entirely.
//
// Google Translation API caps requests around 30k code points; we cap
// lower (5,000) to keep responses fast and costs predictable for a
// student-project deployment.
const translateValidation = [
  body('text')
    .trim()
    .notEmpty()
    .withMessage('Text to translate is required.')
    .isLength({ max: 5000 })
    .withMessage('Text must not exceed 5000 characters.'),
  body('targetLanguage')
    .trim()
    .notEmpty()
    .withMessage('Target language is required.')
    .isIn(SUPPORTED_LANGUAGE_CODES)
    .withMessage(`Target language must be one of: ${SUPPORTED_LANGUAGE_CODES.join(', ')}.`),
  body('sourceLanguage')
    .optional({ checkFalsy: true })
    .trim()
    .custom((value) => value === 'auto' || SUPPORTED_LANGUAGE_CODES.includes(value))
    .withMessage(`Source language must be "auto" or one of: ${SUPPORTED_LANGUAGE_CODES.join(', ')}.`),
  body().custom((value) => {
    if (value.sourceLanguage && value.sourceLanguage !== 'auto' && value.sourceLanguage === value.targetLanguage) {
      throw new Error('Source and target languages must be different.');
    }
    return true;
  }),
  handleValidation,
];

const historySearchValidation = [
  query('q').optional().trim().isLength({ max: 200 }),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  handleValidation,
];

module.exports = {
  handleValidation,
  registerValidation,
  loginValidation,
  translateValidation,
  historySearchValidation,
};
