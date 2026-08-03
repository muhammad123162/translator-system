# Testing Guide

This project uses **Jest** (test runner + assertions) and **Supertest** (HTTP
assertions against the Express app) for automated tests, plus a manual
checklist for System and User Acceptance Testing that can't be meaningfully
automated for a final-year demo.

## Running the automated suite

```bash
npm install
npm test
```

`npm test` runs `jest --runInBand`. Tests are single-threaded (`--runInBand`)
because several suites share an in-memory rate limiter — running them in
parallel workers would give each worker its own limiter state and mask real
issues.

**No live MySQL or Google Cloud credentials are required to run the suite.**
`tests/env.setup.js` supplies fake-but-well-formed environment variables so
`server/config/env.js`'s startup validation passes, and every test that would
otherwise touch the database or the Google Translation API mocks that layer
directly with `jest.mock(...)`. This keeps the suite fast, deterministic, and
runnable in any CI environment without provisioning infrastructure.

## Test layout

```
tests/
├── env.setup.js                     # fake env vars for the test process
├── unit/
│   ├── authService.test.js          # register/login business logic
│   ├── tokenService.test.js         # JWT sign/verify
│   └── utils.test.js                # AppError, asyncHandler
└── integration/
    ├── auth.routes.test.js          # /api/auth/* via supertest, userModel mocked
    ├── translation.routes.test.js   # /api/translations/*, models + Google API mocked
    └── admin.routes.test.js         # role-based authorization guard
```

## What's covered automatically

| Area | Covered by |
|---|---|
| Password never stored/returned in plain text | `authService.test.js` |
| No user-enumeration via login error messages | `authService.test.js` |
| Deactivated accounts can't log in | `authService.test.js` |
| JWT sign/verify round-trip, tampering rejected | `tokenService.test.js` |
| Centralized async error forwarding | `utils.test.js` |
| Registration/login input validation (422s) | `auth.routes.test.js` |
| Auth guard on protected routes (401s) | `translation.routes.test.js`, `admin.routes.test.js` |
| **4-language scope enforced server-side**, not just in the UI | `translation.routes.test.js` |
| Same source/target language rejected | `translation.routes.test.js` |
| Successful translation persists history | `translation.routes.test.js` |
| Google API failures surface as clean 502s, don't half-save history | `translation.routes.test.js` |
| Role-based authorization (`user` blocked from `/api/admin/*`) | `admin.routes.test.js` |
| Admin can't delete their own account | `admin.routes.test.js` |

## What's intentionally NOT automated here

Full database-backed integration tests (against a real MySQL instance) and
browser-level end-to-end tests (Cypress/Playwright clicking through actual
pages) are the natural next step for a production system, but are out of
scope for this sandbox build since it has no network access to provision a
test database or browser binaries. The **System Testing** and **User
Acceptance Testing** sections below cover that ground manually instead — run
these once the project is deployed to a real environment (see
`DEPLOYMENT.md`).

---

## System Testing (manual, end-to-end)

Run through this checklist against a real running instance (localhost or
deployed) with a real MySQL database and valid Google Cloud credentials.

| # | Scenario | Steps | Expected Result |
|---|---|---|---|
| S1 | Fresh registration | Go to `/register`, submit a new name/email/password | Redirected to `/dashboard`, welcome name shown |
| S2 | Duplicate registration | Register with an email already in use | 409 error toast, no redirect |
| S3 | Login | Go to `/login`, submit valid credentials | Redirected to `/dashboard` |
| S4 | Invalid login | Submit wrong password | Generic "Invalid email or password" toast (no hint which field was wrong) |
| S5 | Logout | Click Log Out from the account dropdown | Redirected to `/login`, `/dashboard` no longer accessible without logging in again |
| S6 | Translate (manual languages) | On `/translator`, pick English → Hausa, enter text, click Translate | Translated text appears in the right panel within a few seconds |
| S7 | Translate (auto-detect) | Set source to "Detect Language", enter Yoruba text, target English | Translation appears; detected-language label shows "yo" |
| S8 | Swap blocked on auto | With source = "Detect Language", click swap | Warning toast, no swap occurs |
| S9 | Character limit | Paste text over 5000 characters | Browser blocks further input at 5000 (textarea `maxlength`); server also rejects if bypassed |
| S10 | Copy | Click Copy after a translation | Toast confirms; clipboard contains the translated text |
| S11 | Download | Click Download after a translation | A `.txt` file downloads containing the translated text |
| S12 | Favorite | Click Favorite on a fresh translation | Star fills in; entry appears when "Favorites only" is checked on `/history` |
| S13 | History search | On `/history`, search a keyword known to be in a past translation | Only matching rows shown |
| S14 | History delete | Click delete on a row, confirm in the modal | Row disappears, count updates |
| S15 | Clear all history | Click "Clear All", confirm the browser prompt | History table empty |
| S16 | Profile update | Change name/email on `/profile`, save | Success toast; topbar name updates on next page load |
| S17 | Password change | Change password with correct current password | Success toast; can log in with new password after logout |
| S18 | Wrong current password | Attempt password change with wrong current password | 401 error toast, password unchanged |
| S19 | Non-admin blocked from `/admin` | Log in as a `user`-role account, visit `/admin` directly | Redirected to `/dashboard` |
| S20 | Admin dashboard | Log in as an admin, visit `/admin` | Stat cards populate, both charts render |
| S21 | Admin deactivate user | Toggle a user's active switch off | That user can no longer log in (S3 fails with 403 for them) |
| S22 | Admin delete user | Delete a non-self user, confirm modal | User removed from the list; their translation history is also gone (cascade) |
| S23 | Rate limiting | Submit 30+ translations within 15 minutes from one account | Further requests return a 429 "Translation limit reached" message |
| S24 | Responsive layout | Resize browser to mobile width (or use device emulation) on Landing, Login, Dashboard, Translator | Layout reflows correctly, sidebar collapses, no horizontal scroll |
| S25 | 404 page | Visit a nonexistent route, e.g. `/does-not-exist` | Styled 404 page, not a raw Express error |

## User Acceptance Testing (UAT)

To be run by someone unfamiliar with the codebase (ideally the project
supervisor or a classmate), using the functional requirements as acceptance
criteria. Suggested sign-off table:

| Requirement | Pass/Fail | Notes |
|---|---|---|
| Can register, log in, log out | | |
| Can translate between English/Hausa/Igbo/Yoruba in either direction | | |
| Auto-detect correctly identifies the source language | | |
| Can view, search, and delete translation history | | |
| Can manage profile and change password | | |
| Admin can view all users and translation logs | | |
| Admin can deactivate/delete users | | |
| Interface is usable on a phone-sized screen | | |
| No sensitive data (passwords, tokens) visible anywhere in the UI or network tab in plain text | | |

## Error Handling Reference

| HTTP Status | Meaning in this system | Where it's produced |
|---|---|---|
| 400 | Bad request (e.g. malformed action) | Controllers, via `AppError` |
| 401 | Not authenticated / bad or expired token | `authMiddleware`, `errorHandler` (JWT errors) |
| 403 | Authenticated but not authorized (wrong role), or deactivated account | `authMiddleware.requireRole`, `authService` |
| 404 | Resource or route not found | `errorHandler.notFoundHandler`, individual controllers |
| 409 | Conflict (duplicate email) | `authService`, `errorHandler` (`ER_DUP_ENTRY`) |
| 422 | Validation failed (bad input shape/values) | `middleware/validators.js` |
| 429 | Rate limit exceeded | `middleware/rateLimiter.js` |
| 502 | Upstream Google Translation API failure | `translationService.js` |
| 503 | Google API quota exhausted | `translationService.js` |
| 500 | Unexpected/programming error | `errorHandler` (fallback) |

Every error response follows the same JSON envelope:
`{ "success": false, "message": "...", "errors": [...] | null }`, so the
frontend never has to guess where to look for the failure reason.
