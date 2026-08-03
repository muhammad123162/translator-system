# Database Documentation

Engine: **MySQL 8+ (InnoDB)**, charset **utf8mb4** (full Unicode support —
required since translated text may include characters outside the Basic
Multilingual Plane). The authoritative, fully-commented source is
[`server/database/schema.sql`](../server/database/schema.sql); this document
is a human-readable companion to it. See also the visual
[Entity Relationship Diagram](DIAGRAMS.md#3-entity-relationship-diagram-erd).

---

## Tables

### `users`

Stores every registered account — both regular users and administrators.

| Column | Type | Notes |
|---|---|---|
| `id` | `INT UNSIGNED` (PK, auto-increment) | |
| `name` | `VARCHAR(100)` | |
| `email` | `VARCHAR(150)` | Unique |
| `password` | `VARCHAR(255)` | bcrypt hash — **never** plain text |
| `role` | `ENUM('user','admin')` | Default `'user'` |
| `is_active` | `TINYINT(1)` | Default `1`. Deactivated users cannot log in |
| `created_at` | `TIMESTAMP` | Default current timestamp |
| `updated_at` | `TIMESTAMP` | Auto-updates on row change |

---

### `languages`

A reference/lookup table used to populate dropdowns and validate language
codes before they're sent to the Google Translation API.

| Column | Type | Notes |
|---|---|---|
| `id` | `INT UNSIGNED` (PK, auto-increment) | |
| `language_name` | `VARCHAR(100)` | e.g. "Hausa" |
| `language_code` | `VARCHAR(10)` | ISO 639-1 code, e.g. `ha`. Unique |
| `is_active` | `TINYINT(1)` | Toggle visibility without deleting the row |
| `created_at` | `TIMESTAMP` | |

**Design note:** this table is intentionally **not** foreign-keyed to
`translation_history`. Enforcing that FK would mean the API could never
translate into a language that hasn't been added to this lookup table yet —
language-code validity is instead enforced at the application layer
(`server/config/constants.js` + `server/middleware/validators.js`), keeping
the two concerns separate.

**Seeded rows:** English (`en`), Hausa (`ha`), Igbo (`ig`), Yoruba (`yo`) —
matching the project's current translation scope.

---

### `translation_history`

One row per translation a logged-in user performs.

| Column | Type | Notes |
|---|---|---|
| `id` | `INT UNSIGNED` (PK, auto-increment) | |
| `user_id` | `INT UNSIGNED` | FK → `users.id`, `ON DELETE CASCADE` |
| `source_language` | `VARCHAR(10)` | Language code, or the *detected* code if auto-detect was used |
| `target_language` | `VARCHAR(10)` | Language code |
| `original_text` | `TEXT` | |
| `translated_text` | `TEXT` | |
| `is_favorite` | `TINYINT(1)` | Default `0` |
| `created_at` | `TIMESTAMP` | |

**Indexes:**
- `idx_history_user_created (user_id, created_at DESC)` — speeds up the
  common "most recent translations for this user" query used on the
  Dashboard, Translator sidebar, and History page
- `idx_history_favorite (user_id, is_favorite)` — speeds up the
  "Favorites only" filter on the History page

**Cascade behavior:** deleting a user deletes their entire translation
history automatically (`ON DELETE CASCADE`) — this is what powers the admin
"Delete User" action.

---

### `api_usage_log`

Records every call to the Google Translation API — successful or failed —
independent of `translation_history` (which only holds successful,
persisted translations). This is what powers the admin dashboard's "API
Errors" stat and gives a true picture of API usage/cost, not just
successful outcomes.

| Column | Type | Notes |
|---|---|---|
| `id` | `INT UNSIGNED` (PK, auto-increment) | |
| `user_id` | `INT UNSIGNED`, nullable | FK → `users.id`, `ON DELETE SET NULL` (log survives user deletion) |
| `character_count` | `INT UNSIGNED` | Length of the text submitted |
| `status` | `ENUM('success','error')` | |
| `error_message` | `VARCHAR(255)`, nullable | Populated only when `status = 'error'` |
| `created_at` | `TIMESTAMP` | |

**Index:** `idx_usage_created (created_at)` — speeds up the admin
dashboard's 14-day volume chart query.

---

## Relationships Summary
users (1) ──< (many) translation_history [ON DELETE CASCADE]
users (1) ──< (many) api_usage_log [ON DELETE SET NULL]
languages (standalone lookup table)

## Seed Data

Running `schema.sql` seeds:
- The 4 supported languages (see `languages` table above)
- One placeholder admin account (`admin@translator.local`) — **its password
  hash is a non-functional placeholder and must be replaced** before it can
  actually be used to log in. See `DEPLOYMENT.md`'s post-deployment
  checklist, and the troubleshooting steps used during this project's own
  setup for generating a real bcrypt hash with:
```bash
  node -e "const bcrypt=require('bcrypt'); bcrypt.hash('YourNewPassword', 12).then(h => console.log(h))"
```
  then updating the row:
```sql
  UPDATE users SET password = '<paste the 60-character hash here>'
  WHERE email = 'admin@translator.local';
```

## Re-running the Schema

`schema.sql` is written with `CREATE TABLE IF NOT EXISTS` and
`INSERT ... ON DUPLICATE KEY UPDATE`, so it's safe to run more than once
against the same database — it won't error out or duplicate seed rows.