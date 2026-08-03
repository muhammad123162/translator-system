/**
 * Runs before the test framework loads any test file. Provides fake
 * (but well-formed) environment variables so server/config/env.js's
 * startup validation passes — tests never touch a real database or
 * real Google Cloud credentials; every test that needs those mocks
 * the relevant model/service module instead (see tests/integration).
 */
process.env.NODE_ENV = 'test';
process.env.PORT = '5001';
process.env.DB_HOST = 'localhost';
process.env.DB_USER = 'test_user';
process.env.DB_PASSWORD = 'test_password';
process.env.DB_NAME = 'translator_db_test';
process.env.JWT_SECRET = 'test_jwt_secret_key_for_unit_tests_only';
process.env.JWT_REFRESH_SECRET = 'test_jwt_refresh_secret_key_for_unit_tests_only';
process.env.GOOGLE_CLOUD_PROJECT_ID = 'test-project-id';
process.env.BCRYPT_SALT_ROUNDS = '4'; // low cost factor — faster tests, security irrelevant here
