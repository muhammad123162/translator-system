# GitHub Repository Setup

## 1. Initialize and make the first commit

From the project root (where `package.json` lives):

```bash
git init
git add .
git status          # sanity check: .env and google-credentials.json should NOT appear here
git commit -m "Initial commit: project scaffold, backend, and full frontend"
```

If `.env` or `server/config/google-credentials.json` show up in `git
status`, stop and check `.gitignore` before committing — those files contain
secrets and should never enter version control, even in a private repo.

## 2. Create the remote repository

On GitHub: **New repository** → name it (e.g. `translator-system`) → do
**not** initialize with a README/`.gitignore`/license (you already have
those locally, and doing so would create a conflicting history).

```bash
git branch -M main
git remote add origin https://github.com/<your-username>/translator-system.git
git push -u origin main
```

## 3. Suggested branch strategy for ongoing work

For a solo final-year project, a lightweight flow is enough:

```bash
git checkout -b feature/admin-panel-charts
# ... make changes ...
git add .
git commit -m "Add translation volume and top-languages charts to admin dashboard"
git push -u origin feature/admin-panel-charts
# open a Pull Request into main, merge once reviewed (even self-reviewed)
```

Keeping features on branches — even for a one-person project — gives you a
clean commit history to show a supervisor or defense panel, and makes it
easy to point at exactly which commit introduced which stage of the build.

## 4. Suggested commit granularity

Given how this project was built in stages, mirroring that in your commit
history tells a clear story:
feat: scaffold project structure and software architecture
feat: add MySQL schema and seed data
feat: implement Express backend, JWT auth, and Google Translation API integration
feat: build landing, login, and registration pages
feat: build dashboard, translator, and history pages
feat: build admin panel with charts and user management
style: theme pass — NSUK green/gold consistency, dark mode
test: add unit and integration test suite
docs: add README, deployment guide, and testing documentation

## 5. Protecting secrets if a mistake happens

If `.env` or credentials are ever accidentally committed:

1. Rotate the exposed secrets immediately (generate a new JWT secret, a new
   Google service account key, change the DB password) — removing the file
   from a future commit does **not** remove it from git history
2. Then remove it from history if needed, e.g. with `git filter-repo` or
   GitHub's own secret-scanning remediation guidance
3. Double-check `.gitignore` is committed and correct going forward

## 6. `.gitignore` reference

The project's `.gitignore` already excludes:
node_modules/
.env
.env.*
!.env.example
server/config/google-credentials.json
.log
npm-debug.log
.DS_Store
dist/
coverage/

`.env.example` is deliberately un-ignored (`!.env.example`) — it documents
every required variable without containing any real secret, so it should be
committed.