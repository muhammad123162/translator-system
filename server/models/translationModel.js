const { pool } = require('../config/db');

async function create({ userId, sourceLanguage, targetLanguage, originalText, translatedText }) {
  const [result] = await pool.query(
    `INSERT INTO translation_history
       (user_id, source_language, target_language, original_text, translated_text)
     VALUES (:userId, :sourceLanguage, :targetLanguage, :originalText, :translatedText)`,
    { userId, sourceLanguage, targetLanguage, originalText, translatedText }
  );
  const [rows] = await pool.query('SELECT * FROM translation_history WHERE id = :id', { id: result.insertId });
  return rows[0];
}

/**
 * Supports pagination and an optional free-text search across both
 * the original and translated text (the "Search translation history"
 * requirement).
 */
async function findByUser(userId, { page = 1, limit = 20, q = null, favoritesOnly = false } = {}) {
  const offset = (page - 1) * limit;
  const conditions = ['user_id = :userId'];
  const params = { userId, limit, offset };

  if (q) {
    conditions.push('(original_text LIKE :q OR translated_text LIKE :q)');
    params.q = `%${q}%`;
  }
  if (favoritesOnly) {
    conditions.push('is_favorite = 1');
  }

  const whereClause = conditions.join(' AND ');

  const [rows] = await pool.query(
    `SELECT * FROM translation_history WHERE ${whereClause}
     ORDER BY created_at DESC LIMIT :limit OFFSET :offset`,
    params
  );
  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total FROM translation_history WHERE ${whereClause}`,
    params
  );

  return { rows, total, page, limit };
}

async function findOwnedById(id, userId) {
  const [rows] = await pool.query(
    'SELECT * FROM translation_history WHERE id = :id AND user_id = :userId LIMIT 1',
    { id, userId }
  );
  return rows[0] || null;
}

async function deleteById(id, userId) {
  const [result] = await pool.query(
    'DELETE FROM translation_history WHERE id = :id AND user_id = :userId',
    { id, userId }
  );
  return result.affectedRows > 0;
}

async function deleteAllForUser(userId) {
  const [result] = await pool.query('DELETE FROM translation_history WHERE user_id = :userId', { userId });
  return result.affectedRows;
}

async function toggleFavorite(id, userId) {
  await pool.query(
    'UPDATE translation_history SET is_favorite = NOT is_favorite WHERE id = :id AND user_id = :userId',
    { id, userId }
  );
  return findOwnedById(id, userId);
}

/** Aggregate stats for the user's own profile page. */
async function statsForUser(userId) {
  const [[row]] = await pool.query(
    `SELECT COUNT(*) AS totalTranslations,
            COUNT(DISTINCT target_language) AS languagesUsed,
            SUM(CHAR_LENGTH(original_text)) AS totalCharacters
     FROM translation_history WHERE user_id = :userId`,
    { userId }
  );
  return row;
}

module.exports = {
  create,
  findByUser,
  findOwnedById,
  deleteById,
  deleteAllForUser,
  toggleFavorite,
  statsForUser,
};
