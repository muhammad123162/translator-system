const { pool } = require('../config/db');

/**
 * All queries here use mysql2 named placeholders (:param), which are
 * escaped by the driver — this is the primary SQL-injection defence
 * required by the spec. Raw string concatenation into SQL is never
 * used anywhere in this model.
 */

async function findByEmail(email) {
  const [rows] = await pool.query('SELECT * FROM users WHERE email = :email LIMIT 1', { email });
  return rows[0] || null;
}

async function findById(id) {
  const [rows] = await pool.query(
    'SELECT id, name, email, role, is_active, created_at, updated_at FROM users WHERE id = :id LIMIT 1',
    { id }
  );
  return rows[0] || null;
}

async function create({ name, email, passwordHash, role = 'user' }) {
  const [result] = await pool.query(
    'INSERT INTO users (name, email, password, role) VALUES (:name, :email, :password, :role)',
    { name, email, password: passwordHash, role }
  );
  return findById(result.insertId);
}

async function updateProfile(id, { name, email }) {
  await pool.query('UPDATE users SET name = :name, email = :email WHERE id = :id', { id, name, email });
  return findById(id);
}

async function updatePassword(id, passwordHash) {
  await pool.query('UPDATE users SET password = :password WHERE id = :id', { id, password: passwordHash });
}

async function findAll({ limit = 20, offset = 0 } = {}) {
  const [rows] = await pool.query(
    `SELECT id, name, email, role, is_active, created_at
     FROM users ORDER BY created_at DESC LIMIT :limit OFFSET :offset`,
    { limit, offset }
  );
  const [[{ total }]] = await pool.query('SELECT COUNT(*) AS total FROM users');
  return { rows, total };
}

async function deleteById(id) {
  const [result] = await pool.query('DELETE FROM users WHERE id = :id', { id });
  return result.affectedRows > 0;
}

async function setActive(id, isActive) {
  await pool.query('UPDATE users SET is_active = :isActive WHERE id = :id', { id, isActive });
}

module.exports = {
  findByEmail,
  findById,
  create,
  updateProfile,
  updatePassword,
  findAll,
  deleteById,
  setActive,
};
