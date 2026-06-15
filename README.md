# CapStack

Modern cap table management for startups — equity grants, SAFEs, round modeling, documents, and team access.

## Quick start (local)

**Requires PostgreSQL 16+** (Docker recommended).

```bash
npm install
cp .env.example .env

# Start Postgres (Docker)
docker compose up postgres -d

# Or on Windows with PostgreSQL 16 installed locally:
npm run db:setup

# Apply schema and seed demo data
npm run db:deploy
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

**Demo login:** `demo@acmerobotics.com` / `demo12345`

### Without Docker

Install [PostgreSQL 16](https://www.postgresql.org/download/windows/), then run `npm run db:setup` once (prompts for your `postgres` superuser password). Point `DATABASE_URL` in `.env` at the database, then run `npm run db:deploy` and `npm run db:seed`.

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `AUTH_SECRET` | Yes (prod) | 32+ char secret for session JWTs |
| `APP_URL` | Yes (prod) | Public app URL for invite links |
| `EMAIL_PROVIDER` | No | `console` (default) or `resend` |
| `RESEND_API_KEY` | Prod email | Resend API key |
| `EMAIL_FROM` | Prod email | Sender address |

## Production checklist

- [ ] Set strong `AUTH_SECRET` (never use the example value)
- [ ] Use managed PostgreSQL (RDS, Neon, Supabase, etc.)
- [ ] Configure `EMAIL_PROVIDER=resend` with a verified domain
- [ ] Set `APP_URL` to your public HTTPS URL
- [ ] Point monitoring at `GET /api/health`
- [ ] Schedule regular JSON exports from Settings

## CI

Every push and PR to `main`/`master` runs [`.github/workflows/ci.yml`](.github/workflows/ci.yml):

1. `npm ci` → `npm run lint` → `npm run build`
2. Docker image build (validates the production `Dockerfile`)

No database is required in CI — placeholder env vars are injected by the workflow.

## Deploy to Railway (recommended)

Fastest path to a public URL with Postgres + auto-deploy from GitHub.

### 1. Push to GitHub

```bash
git add .
git commit -m "Add CI and production deploy config"
git remote add origin https://github.com/YOUR_USER/capstack.git
git push -u origin master
```

### 2. Create the Railway project

1. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo**
2. Select your `capstack` repository
3. Railway detects `railway.toml` and builds from the `Dockerfile`

### 3. Add PostgreSQL

1. In the project, click **+ New** → **Database** → **PostgreSQL**
2. Open the Postgres service → **Variables** → copy `DATABASE_URL`
3. In your **app service** → **Variables**, add:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Reference the Postgres service (`${{Postgres.DATABASE_URL}}`) or paste the URL |
| `AUTH_SECRET` | Run `openssl rand -base64 32` locally |
| `APP_URL` | Your Railway app URL, e.g. `https://capstack-production.up.railway.app` |
| `EMAIL_PROVIDER` | `resend` |
| `RESEND_API_KEY` | From [resend.com](https://resend.com) |
| `EMAIL_FROM` | `CapStack <notifications@yourdomain.com>` |

See [`.env.production.example`](.env.production.example) for the full list.

### 4. Generate a public URL

App service → **Settings** → **Networking** → **Generate Domain**. Set that URL as `APP_URL`.

### 5. Verify

- `GET https://your-app.up.railway.app/api/health` → `{ "status": "ok", "database": "connected" }`
- Migrations run automatically on container start (`prisma migrate deploy` in the Dockerfile `CMD`)
- Optional demo data: Railway shell → `npm run db:seed` (once)

### Neon instead of Railway Postgres

Use [Neon](https://neon.tech) for a free managed Postgres:

1. Create a project → copy the connection string (add `?sslmode=require` if needed)
2. Set `DATABASE_URL` on Railway to that string
3. Skip the Railway Postgres service

## Docker (full stack locally)

```bash
docker compose up --build
```

Runs Postgres + the app on port 3000. Migrations apply automatically on container start.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run db:migrate` | Create/apply dev migrations |
| `npm run db:deploy` | Apply migrations in production |
| `npm run db:seed` | Seed demo data |
| `npm run dev:demo` | Seed + dev server (requires DB) |

## Migrating from SQLite

Earlier versions used SQLite (`file:./dev.db`). To migrate:

1. Export your company JSON from Settings (if you had data)
2. Update `.env` to a PostgreSQL `DATABASE_URL`
3. Run `npm run db:deploy && npm run db:seed` for a fresh demo, or restore from export manually

## Features

- Cap table with vesting, SAFEs, convertible notes
- Fundraise modeler and round closing
- Equity grant issuance with PDF/DOCX documents
- Role-based access (owner / admin / viewer)
- Team invites with email notifications
- Audit log and activity feed
- JSON and CSV export

## API health

```
GET /api/health
```

Returns `{ status: "ok", database: "connected" }` when the app is ready.
