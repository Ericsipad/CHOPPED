# CHOPPED — Fresh Start

## Environment
1. Copy `.env.example` to `.env`.
2. Fill in values for your environment.

### DigitalOcean environment setup
- Use App Platform or Secrets Manager to store non-public variables (e.g., `MONGODB_URI`, `SMTP_*`, `BUNNY_ACCESS_KEY`, `BUNNY_THUMBS_TOKEN_KEY`).
- Only commit public variables (e.g., `NEXT_PUBLIC_*`, hostnames). Keep secrets out of the repo.
- For App Platform:
  - Settings  Environment Variables  Add variables matching `.env.example` keys
  - Redeploy to apply changes

## Database
- Place schema in `database/schema.sql`.
- Apply schema (PostgreSQL example):
  - PowerShell: `psql $env:DATABASE_URL -f database/schema.sql`
  - CMD: `psql "%DATABASE_URL%" -f database/schema.sql`

## Monorepo layout
- Backend: Next.js app at repo root (`/`)
- Frontend: Vite + React + Chakra UI in `frontend/`
- Node version pinned to 22 LTS via `.nvmrc` and `.node-version`
- Package manager: npm (declared in `package.json`)

## Commands
- Backend dev: `npm run dev`
- Frontend dev: `npm run frontend:dev`
- Dev both (concurrently): `npm run dev:all`
- Backend build/start: `npm run build` / `npm run start`
- Frontend build/preview: `npm run frontend:build` / `npm run frontend:preview`

## DigitalOcean deployment (two machines)
- Machine A: Backend (Next.js)
  - Deploy the repo root as a Node app (Next.js). Set env vars in DO (App Platform or Droplet).
  - Health check: GET `/api/health` (add if desired).
- Machine B: Frontend (Vite static)
  - Build in CI/CD: `npm ci && npm run frontend:build`.
  - Serve `frontend/dist/` via Nginx or DO App Platform Static Site.

### Environment
- Keep secrets in DigitalOcean (App Platform env vars or Secrets Manager).
- Only commit public vars (e.g., `NEXT_PUBLIC_*`, hostnames).
