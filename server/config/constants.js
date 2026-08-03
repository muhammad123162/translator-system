/**
 * The project's supported language set. Kept in one place so the
 * validation layer (server/middleware/validators.js) and the
 * database seed (server/database/schema.sql) never drift apart.
 *
 * Scope: English acts as a common hub alongside three Nigerian
 * languages — Hausa, Igbo, and Yoruba — so translation can happen
 * directly between any two of the four (e.g. Hausa → Yoruba), not
 * only via English.
 */

const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'ha', name: 'Hausa' },
  { code: 'ig', name: 'Igbo' },
  { code: 'yo', name: 'Yoruba' },
];

const SUPPORTED_LANGUAGE_CODES = SUPPORTED_LANGUAGES.map((l) => l.code);

module.exports = { SUPPORTED_LANGUAGES, SUPPORTED_LANGUAGE_CODES };
