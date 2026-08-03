# LinguaBridge — Multi-Language Text Translator

A full-stack, final-year Computer Science project: a web-based translation
portal that translates text between **English, Hausa, Igbo, and Yoruba**
using the Google Cloud Translation API v3, with full user accounts,
translation history, and an admin dashboard.

Built with Node.js, Express, MySQL, and vanilla JavaScript on an
academic-themed (green/white/gold) interface, following MVC architecture,
RESTful API design, and industry-standard security practices.

---

## Features

**For users:**
- Register, log in, log out (JWT authentication, bcrypt password hashing)
- Translate text between English, Hausa, Igbo, and Yoruba, in any direction
- Automatic language detection, one-click language swap
- Copy translated text to clipboard, or download as a `.txt` file
- Full translation history: search, favorite, delete individual entries or
  clear everything
- Profile management: edit name/email, change password
- Personal dashboard with translation stats

**For administrators:**
- System-wide dashboard: user counts, translation volume charts, top
  languages, API error tracking
- View, deactivate, or delete user accounts
- View a full log of every translation performed system-wide
- Activate/deactivate supported languages

**Engineering:**
- MVC architecture with a clean `routes -> middleware -> controllers ->
  services -> models` request pipeline
- JWT auth (access + refresh tokens), bcrypt hashing, rate limiting, input
  validation, XSS/CSRF-conscious middleware, parameterized SQL queries
  throughout
- A **mock translation mode** (`USE_MOCK_TRANSLATION=true`) that lets the
  entire app run and be demoed without live Google Cloud billing
- Jest + Supertest test suite (unit + integration)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML5, CSS3, Bootstrap 5, vanilla JavaScript (ES6+), EJS templating |
| Backend | Node.js, Express.js |
| Database | MySQL |
| Translation | Google Cloud Translation API v3 |
| Auth | JWT, bcrypt |
| Testing | Jest, Supertest |
| Charts | Chart.js (admin dashboard) |

---

## Quick Start

```bash
npm install
cp .env.example .env      # fill in your DB credentials, JWT secrets, etc.
mysql -u root -p < server/database/schema.sql
npm run dev
```

Visit `http://localhost:5000`. See [`DEPLOYMENT.md`](DEPLOYMENT.md) for full
setup details (including XAMPP, Render, and Vercel), and
[`GITHUB_SETUP.md`](GITHUB_SETUP.md) for version control setup.

**Don't have Google Cloud billing set up yet?** Set
`USE_MOCK_TRANSLATION=true` in `.env` — the whole app works end-to-end with
simulated translations, no Google credentials required. Flip it back to
`false` once your Cloud Translation API billing is active.

---

## Documentation Index

| Document | Covers |
|---|---|
| [`DEPLOYMENT.md`](DEPLOYMENT.md) | Localhost, XAMPP, Render, Vercel deployment |
| [`GITHUB_SETUP.md`](GITHUB_SETUP.md) | Git/GitHub setup and workflow |
| [`TESTING.md`](TESTING.md) | Test strategy, test cases, error handling reference |
| [`docs/DIAGRAMS.md`](docs/DIAGRAMS.md) | Architecture, Use Case, ERD, DFD, Sequence, Activity, Deployment diagrams |
| [`docs/API.md`](docs/API.md) | Full REST API reference |
| [`docs/USER_MANUAL.md`](docs/USER_MANUAL.md) | End-user guide |
| [`docs/DATABASE.md`](docs/DATABASE.md) | Database schema documentation |
| [`server/database/schema.sql`](server/database/schema.sql) | Authoritative, commented SQL schema |

---

## Project Structure
translator-system/
├── public/ # Static assets: CSS, client-side JS
├── views/ # EJS templates (pages + shared partials)
├── server/
│ ├── config/ # Env validation, DB pool, constants
│ ├── controllers/ # Request handlers
│ ├── database/ # schema.sql
│ ├── middleware/ # Auth, validation, rate limiting, error handling
│ ├── models/ # Parameterized DB queries
│ ├── routes/ # Route definitions
│ ├── services/ # Business logic (auth, translation, JWT)
│ ├── utils/ # AppError, asyncHandler, logger, response formatter
│ ├── app.js # Express app assembly
│ └── server.js # Entry point
├── tests/ # Jest unit + integration tests
├── docs/ # Diagrams, API reference, user manual, DB docs
└── CHANGELOG-STAGES.md # Build history, stage by stage
---

## Scripts

```bash
npm run dev      # Start with nodemon (auto-restart on changes)
npm start        # Start in production mode
npm test         # Run the Jest test suite
```

---

## Project Scope Note

Translation is deliberately scoped to **English, Hausa, Igbo, and Yoruba**
rather than Google's full language list — enforced both in the UI dropdowns
and at the API validation layer (`server/middleware/validators.js`), so the
restriction can't be bypassed by calling the API directly.

---

## License

MIT — built as an academic final-year project. Not affiliated with or
endorsed by any university; the visual theme is an original design inspired
by, but not copying, any institution's branding.