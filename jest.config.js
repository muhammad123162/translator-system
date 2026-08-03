module.exports = {
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/tests/env.setup.js'],
  testMatch: ['**/tests/**/*.test.js'],
  verbose: true,
  collectCoverageFrom: ['server/**/*.js', '!server/server.js'],
  coverageDirectory: '<rootDir>/coverage',
};
