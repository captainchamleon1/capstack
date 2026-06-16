# Railway deploy checklist

## 1. Connect GitHub (recommended)

1. Go to [railway.app](https://railway.app) and sign in with GitHub
2. **New Project** → **Deploy from GitHub repo** → select `captainchamleon1/capstack`
3. Railway reads `railway.toml` and builds from the `Dockerfile`

## 2. Add PostgreSQL

1. In the project, click **+ New** → **Database** → **PostgreSQL**
2. Open your **app service** → **Variables**
3. Add: `DATABASE_URL` = `${{Postgres.DATABASE_URL}}` (use Railway's variable reference UI)

## 3. Set required variables

| Variable | Value |
|----------|-------|
| `AUTH_SECRET` | Run `openssl rand -base64 32` locally |
| `APP_URL` | Your Railway URL (step 4) — update after first deploy |
| `EMAIL_PROVIDER` | `resend` (required in production) |
| `RESEND_API_KEY` | From [resend.com](https://resend.com) |
| `EMAIL_FROM` | `Equitr <notifications@yourdomain.com>` |

## 4. Public URL

1. App service → **Settings** → **Networking** → **Generate Domain**
2. Copy the URL (e.g. `https://capstack-production.up.railway.app`)
3. Set `APP_URL` to that URL (no trailing slash)
4. Redeploy if the app already started

## 5. Verify

- Health: `https://YOUR-URL/api/health` → `{ "status": "ok", "database": "connected" }`
- Migrations run automatically on container start
- Optional demo data: Railway shell → `npm run db:seed` (once)

## CLI alternative

```powershell
railway login
cd capstack
railway init
railway add --database postgres
railway up
```
