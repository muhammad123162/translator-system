const app = require('./app');
const config = require('./config/env');
const { verifyConnection } = require('./config/db');
const logger = require('./utils/logger');

/**
 * Boot sequence: verify the database is reachable BEFORE accepting
 * traffic, so the app never serves requests it can't actually fulfil.
 */
async function start() {
  await verifyConnection();

  const server = app.listen(config.port, () => {
    logger.info(`Server running in ${config.nodeEnv} mode on port ${config.port}`);
  });

  // Graceful shutdown — let in-flight requests finish before exiting.
  const shutdown = (signal) => {
    logger.info(`${signal} received. Shutting down gracefully...`);
    server.close(() => {
      logger.info('Server closed.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // Safety nets: log and exit cleanly rather than leaving the process
  // in an undefined state after an unhandled failure.
  process.on('unhandledRejection', (err) => {
    logger.error('Unhandled Rejection:', err);
    server.close(() => process.exit(1));
  });
  process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception:', err);
    process.exit(1);
  });
}

start();
