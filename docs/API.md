# API Documentation

Base URL (local): `http://localhost:5000/api`

## Response Envelope

Every endpoint returns the same JSON shape:

```json
{ "success": true, "message": "...", "data": { ... } }
{ "success": false, "message": "...", "errors": [ { "field": "email", "message": "..." } ] }
```

## Authentication

Protected routes require a JWT access token, sent either as:
- `Authorization: Bearer <token>` header, **or**
- an `accessToken` httpOnly cookie (set automatically on login/register)

---

## Auth Endpoints (`/api/auth`)

### `POST /api/auth/register`
Create a new account.

**Body:**
```json
{ "name": "Amina Yusuf", "email": "amina@example.com", "password": "Password1" }
```
- `password` must be 8+ characters and contain at least one number.

**Success (201):**
```json
{ "success": true, "message": "Account created successfully.",
  "data": { "user": { "id": 1, "name": "Amina Yusuf", "email": "amina@example.com", "role": "user" },
            "accessToken": "eyJ..." } }
```
**Errors:** `422` invalid input · `409` email already registered

---

### `POST /api/auth/login`
**Body:** `{ "email": "...", "password": "..." }`
**Success (200):** same shape as register.
**Errors:** `401` invalid credentials (same message for wrong email or wrong password — no user enumeration) · `403` account deactivated

---

### `POST /api/auth/logout`
Clears auth cookies. No body required. **Success (200).**

---

### `POST /api/auth/refresh`
Issues a new access token from a valid refresh token (read from cookie, or `{ "refreshToken": "..." }` in body).
**Success (200):** `{ "data": { "accessToken": "..." } }`
**Errors:** `401` invalid/expired refresh token

---

### `GET /api/auth/me`
*Requires auth.* Returns the current logged-in user.
**Success (200):** `{ "data": { "user": { ...no password field... } } }`

---

## Translation Endpoints (`/api/translations`)
*All routes below require auth.*

### `GET /api/translations/languages`
Returns the active supported languages (currently English, Hausa, Igbo, Yoruba).
```json
{ "data": { "languages": [ { "id": 1, "language_name": "English", "language_code": "en" }, ... ] } }
```

### `POST /api/translations/detect`
**Body:** `{ "text": "Sannu" }`
**Success (200):** `{ "data": { "languageCode": "ha", "confidence": 0.98 } }`

### `POST /api/translations`
Translate text and save it to history.

**Body:**
```json
{ "text": "Hello", "sourceLanguage": "auto", "targetLanguage": "ha" }
```
- `sourceLanguage` is optional; omit or use `"auto"` to auto-detect.
- `targetLanguage` and `sourceLanguage` (if provided) must be one of `en`, `ha`, `ig`, `yo` — any other value returns `422`.
- Source and target cannot be identical.
- `text` max length: 5000 characters.

**Success (201):**
```json
{ "data": {
    "translation": { "id": 12, "user_id": 1, "source_language": "en",
      "target_language": "ha", "original_text": "Hello",
      "translated_text": "Sannu", "is_favorite": 0, "created_at": "..." },
    "detectedSourceLanguage": "en" } }
```
**Errors:** `422` validation · `429` rate limit exceeded (30 translations / 15 min) · `502` Google API failure · `503` Google API quota exhausted

### `GET /api/translations/history`
Query params: `page` (default 1), `limit` (default 20, max 100), `q` (search text), `favorites` (`true`/`false`).
**Success (200):** `{ "data": { "rows": [...], "total": 42, "page": 1, "limit": 20 } }`

### `DELETE /api/translations/history/:id`
Deletes one entry (only if owned by the requesting user). `404` if not found/not owned.

### `DELETE /api/translations/history`
Clears **all** history for the requesting user.

### `PATCH /api/translations/history/:id/favorite`
Toggles the favorite flag on one entry.

### `GET /api/translations/stats`
Returns `{ totalTranslations, languagesUsed, totalCharacters }` for the current user.

---

## User Endpoints (`/api/users`)
*All routes require auth.*

### `GET /api/users/profile`
Returns the current user (same as `/api/auth/me`).

### `PUT /api/users/profile`
**Body:** `{ "name": "...", "email": "..." }`

### `PUT /api/users/profile/password`
**Body:** `{ "currentPassword": "...", "newPassword": "..." }`
`401` if `currentPassword` is wrong.

---

## Admin Endpoints (`/api/admin`)
*All routes require auth AND `role: admin`. Non-admins get `403`.*

### `GET /api/admin/dashboard`
Returns `{ totalUsers, totalTranslations, apiErrors, dailyVolume: [...], topLanguages: [...] }`.

### `GET /api/admin/users`
Query params: `page`, `limit`. Returns `{ rows: [...], total }`.

### `DELETE /api/admin/users/:id`
Deletes a user (cascades to their translation history). `400` if attempting to delete your own account while logged in.

### `PATCH /api/admin/users/:id/active`
**Body:** `{ "isActive": true|false }`

### `GET /api/admin/translation-logs`
Query params: `page`, `limit`. System-wide translation log with user names/emails.

### `GET /api/admin/languages`
Returns all languages (including inactive ones — unlike the public `/api/translations/languages`, which only returns active).

### `PATCH /api/admin/languages/:id/active`
**Body:** `{ "isActive": true|false }`

---

## Misc

### `GET /api/health`
No auth required. `{ "success": true, "message": "API is healthy." }` — useful for uptime checks.

---

## HTTP Status Code Summary

See [`../TESTING.md`](../TESTING.md#error-handling-reference) for the full
error-code reference table.