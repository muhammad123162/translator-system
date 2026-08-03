/**
 * MySQL connection pool.
 *
 * A pool (rather than one-connection-per-request) is used so concurrent
 * requests reuse a small set of already-open connections instead of
 * paying the TCP/auth handshake cost every time — standard practice
 * for a production Node/MySQL backend.
 */

const mysql = require('mysql2/promise');
const config = require('./env');

const pool = mysql.createPool({
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
  waitForConnections: true,
  connectionLimit: config.db.connectionLimit,
  queueLimit: 0,
  namedPlaceholders: true,
  dateStrings: true,
});

/**
 * Quick startup check so a bad DB config fails at boot, not on the
 * first user request.
 */
async function verifyConnection() {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    console.log(`Connected to MySQL database "${config.db.database}"`);
  } catch (err) {
    console.error('Failed to connect to MySQL:', err.message);
    process.exit(1);
  }
}

module.exports = { pool, verifyConnection };
