-- =====================================================================
-- Multi-Language Text Translator — Database Schema
-- Engine: InnoDB (foreign key + transaction support)
-- Charset: utf8mb4 (full Unicode — required since translated text may
--          contain characters outside the Basic Multilingual Plane,
--          e.g. some CJK extension characters and emoji)
-- =====================================================================

CREATE DATABASE IF NOT EXISTS translator_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE translator_db;

-- ---------------------------------------------------------------------
-- Table: users
-- Stores registered accounts for both regular users and administrators.
-- Passwords are never stored in plain text — the application layer
-- hashes them with bcrypt (cost factor 12) before insert.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name           VARCHAR(100)  NOT NULL,
  email          VARCHAR(150)  NOT NULL,
  password       VARCHAR(255)  NOT NULL COMMENT 'bcrypt hash, never plain text',
  role           ENUM('user', 'admin') NOT NULL DEFAULT 'user',
  is_active      TINYINT(1)    NOT NULL DEFAULT 1,
  created_at     TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
                               ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT uq_users_email UNIQUE (email)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Table: languages
-- Reference/lookup table used to populate source/target dropdowns and
-- to validate language codes before they are sent to the Google
-- Translation API. Intentionally NOT foreign-keyed to translation
-- history (see architecture notes) so the API can still service a
-- language pair even if it hasn't been added to this lookup table yet.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS languages (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  language_name  VARCHAR(100) NOT NULL,
  language_code  VARCHAR(10)  NOT NULL COMMENT 'ISO 639-1 code, e.g. en, fr, ha',
  is_active      TINYINT(1)   NOT NULL DEFAULT 1 COMMENT 'toggle without deleting',
  created_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT uq_languages_code UNIQUE (language_code)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Table: translation_history
-- One row per translation a logged-in user performs. Guest/anonymous
-- translation (if enabled later) would simply skip this insert.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS translation_history (
  id                INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id           INT UNSIGNED NOT NULL,
  source_language   VARCHAR(10)  NOT NULL COMMENT 'language_code, "auto" if detected',
  target_language   VARCHAR(10)  NOT NULL,
  original_text     TEXT         NOT NULL,
  translated_text   TEXT         NOT NULL,
  is_favorite       TINYINT(1)   NOT NULL DEFAULT 0,
  created_at        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_history_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  INDEX idx_history_user_created (user_id, created_at DESC),
  INDEX idx_history_favorite (user_id, is_favorite)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Table: api_usage_log
-- Lets the admin dashboard show translation volume / API consumption
-- over time without scanning translation_history for aggregates.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS api_usage_log (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id        INT UNSIGNED NULL,
  character_count INT UNSIGNED NOT NULL DEFAULT 0,
  status         ENUM('success', 'error') NOT NULL DEFAULT 'success',
  error_message  VARCHAR(255) NULL,
  created_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_usage_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE,

  INDEX idx_usage_created (created_at)
) ENGINE=InnoDB;

-- =====================================================================
-- Seed data: supported languages
-- Project scope: translation is supported between English and three
-- Nigerian languages — Hausa, Igbo, and Yoruba — directly (any pair,
-- not only via English). This list must stay in sync with
-- server/config/constants.js, which the API validates every
-- translation request against.
-- =====================================================================
INSERT INTO languages (language_name, language_code) VALUES
  ('English', 'en'),
  ('Hausa',   'ha'),
  ('Igbo',    'ig'),
  ('Yoruba',  'yo')
ON DUPLICATE KEY UPDATE language_name = VALUES(language_name);

-- =====================================================================
-- Seed data: one default administrator account
-- NOTE: This is a placeholder bcrypt hash for the password "Admin@123".
-- Change it immediately after first login — see README "First Run".
-- =====================================================================
INSERT INTO users (name, email, password, role) VALUES
  ('System Administrator', 'admin@translator.local',
   '$2b$12$replace.this.hash.at.setup.time.with.a.real.bcrypt.hash', 'admin')
ON DUPLICATE KEY UPDATE name = VALUES(name);
