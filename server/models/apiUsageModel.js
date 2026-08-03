const { pool } = require('../config/db');

/**
 * Records each Google Translation API call — success or failure — so
 * the admin dashboard can report on usage volume and error rates
 * without depending on translation_history (which only exists for
 * successful, persisted translations).
 */
async function logUsage({ userId = null, characterCount = 0, status = 'success', errorMessage = null }) {
  await pool.query(
    `INSERT INTO api_usage_log (user_id, character_count, status, error_message)
     VALUES (:userId, :characterCount, :status, :errorMessage)`,
    { userId, characterCount, status, errorMessage }
  );
}

module.exports = { logUsage };
