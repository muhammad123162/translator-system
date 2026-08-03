# Deployment Guide

## 1. Localhost (development)

**Prerequisites:** Node.js 18+, MySQL 8+ (or MariaDB), a Google Cloud project
with the Translation API enabled and a service account key.

```bash
git clone <your-repo-url>
cd translator-system
npm install
cp .env.example .env        # then edit .env with real values
```

Create the database:

```bash
mysql -u root -p < server/database/schema.sql
```

Start the server:

```bash
npm run dev      # nodemon, auto-restarts on file changes
# or
npm start        # plain node, for a production-like run
```

Visit `http://localhost:5000`.

---

## 2. XAMPP (as a local MySQL host)

XAMPP is a PHP/MySQL stack — this project doesn't run PHP, but XAMPP's
**MySQL + phpMyAdmin** are a convenient way to host the database locally if
you don't want to install MySQL standalone.

1. Install XAMPP, start the **MySQL** module from the XAMPP control panel
   (leave Apache off — this project's own Node server handles HTTP)
2. Open `http://localhost/phpmyadmin`, create a database named
   `translator_db`, then use the **Import** tab to run
   `server/database/schema.sql`
3. In `.env`, point `DB_HOST=127.0.0.1`, `DB_PORT=3306`, and use XAMPP's
   default MySQL credentials (`root` with no password, unless you've changed
   it)
4. Run the Node app exactly as in the Localhost section above — XAMPP is
   only supplying the database here, not serving the app itself

---

## 3. Render (recommended — full Node + MySQL hosting)

Render suits this project well since it runs a persistent Node process (this
app uses cookies and a connection pool, which don't fit a stateless
serverless model as cleanly — see the Vercel caveat below).

1. Push the repository to GitHub (see `GITHUB_SETUP.md`)
2. On [render.com](https://render.com): **New → Web Service**, connect the
   repo
3. Settings:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Environment:** Node
4. Add every variable from `.env.example` under **Environment → Environment
   Variables**. For the Google credentials, either:
   - Add the full JSON key contents as a **Secret File** mounted at
     `/etc/secrets/google-credentials.json`, and set
     `GOOGLE_APPLICATION_CREDENTIALS=/etc/secrets/google-credentials.json`, or
   - Base64-encode the JSON, store it as an env var, and decode it to a file
     in a small build step
5. For MySQL, either use **Render's managed MySQL/PostgreSQL** add-on (note:
   Render's native managed DB is PostgreSQL — for MySQL specifically, use
   **PlanetScale** or **Railway's MySQL** and point `DB_HOST` etc. at it) or
   any external MySQL host
6. Run the schema against that remote database once (`mysql -h <host> -u
   <user> -p < server/database/schema.sql`) before first deploy
7. Deploy. Render assigns a `https://your-app.onrender.com` URL —
   update `CLIENT_URL` in the environment variables to match it (needed for
   the CORS + cookie configuration in `server/app.js`)

---

## 4. Vercel

Vercel's core model is serverless functions with no persistent process or
local filesystem between invocations. This project's stateful pieces —
the MySQL connection pool in `server/config/db.js`, and the
`GOOGLE_APPLICATION_CREDENTIALS` file path — need small adjustments to work
cleanly there:

1. Add a `vercel.json` at the project root:
```json
   {
     "version": 2,
     "builds": [{ "src": "server/app.js", "use": "@vercel/node" }],
     "routes": [{ "src": "/(.*)", "dest": "server/app.js" }]
   }
```
2. Export the Express `app` from `server/app.js` as-is (already done — Vercel
   wraps it automatically) rather than calling `app.listen()`; keep
   `server/server.js` for local/Render use only.
3. Google credentials: Vercel functions can't reliably read a file you
   uploaded manually. Instead, store the **full JSON key as a single
   environment variable** (e.g. `GOOGLE_CREDENTIALS_JSON`), and add a small
   snippet near the top of `server/services/translationService.js` to write
   it to `/tmp/google-credentials.json` on cold start and point
   `GOOGLE_APPLICATION_CREDENTIALS` at that path before the client is
   constructed.
4. Database: Vercel functions are short-lived, so a long-lived connection
   pool (as configured in `db.js`) can exhaust connections under load. Use a
   managed MySQL provider designed for serverless (e.g. **PlanetScale**,
   which handles connection pooling for you) and reduce
   `DB_CONNECTION_LIMIT` to 1–2 in that environment.
5. Add all `.env.example` variables under **Vercel → Project → Settings →
   Environment Variables**, then deploy with `vercel --prod` or via the
   GitHub integration.

**In short:** Render (or any host that runs a persistent Node process, like
Railway or a plain VPS) is the lower-friction option for this project as
built. Vercel is documented here because the brief asks for it, but expect
to spend extra effort adapting the credential-loading and DB-pooling code.

---

## Post-deployment checklist

- [ ] `.env` values are production values, not the `.env.example` defaults
- [ ] `NODE_ENV=production` (enables secure cookies, hides stack traces)
- [ ] `JWT_SECRET` / `JWT_REFRESH_SECRET` are freshly generated, not reused
      from development
- [ ] The seeded admin account's placeholder password hash has been replaced
      (see `server/database/schema.sql`) — log in and change it immediately,
      or update the hash directly before running the seed
- [ ] `CLIENT_URL` matches the deployed domain (CORS + cookies depend on it)
- [ ] Database is reachable from the deployed environment (check firewall/IP
      allowlist rules on your MySQL host)
- [ ] Google Cloud Translation API is enabled on the billing-linked project,
      and the service account has the **Cloud Translation API User** role