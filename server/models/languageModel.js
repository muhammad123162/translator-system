const { pool } = require('../config/db');

async function findAllActive() {
  const [rows] = await pool.query(
    'SELECT id, language_name, language_code FROM languages WHERE is_active = 1 ORDER BY language_name ASC'
  );
  return rows;
}

async function findAll() {
  const [rows] = await pool.query('SELECT * FROM languages ORDER BY language_name ASC');
  return rows;
}

async function upsert({ languageName, languageCode }) {
  await pool.query(
    `INSERT INTO languages (language_name, language_code) VALUES (:languageName, :languageCode)
     ON DUPLICATE KEY UPDATE language_name = VALUES(language_name)`,
    { languageName, languageCode }
  );
}

async function setActive(id, isActive) {
  await pool.query('UPDATE languages SET is_active = :isActive WHERE id = :id', { id, isActive });
}

module.exports = { findAllActive, findAll, upsert, setActive };
