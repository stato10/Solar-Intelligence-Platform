# Solar Intelligence Platform

Web-first monorepo for the Solar Intelligence Platform.

## Monorepo Structure

```text
apps/
  web/        # Next.js web app
  api/        # NestJS backend API
  engine/     # FastAPI calculation engine
packages/
  types/      # Shared TypeScript types
  config/     # Shared configuration
```

## Workspace Commands

From repository root:

```bash
npm install
npm run engine:setup
```

Run all services:

```bash
npm run dev
```

Run with Docker Compose:

```bash
docker compose up --build
```

Run specific services:

```bash
npm run dev:web
npm run dev:api
npm run dev:engine
```

Quality/build:

```bash
npm run lint
npm run build
```

## Current Status

- Phase 0 documentation freeze: completed
- Phase 1.1 scaffold: completed
- Phase 1.2 runtimes initialized: completed
- Phase 1.3 root workspace scripts: completed
- Phase 1.4 minimal Docker runtime setup: completed
- Phase 1.5 API auth scaffold (register/login/me): completed
- Phase 1.6 API config scaffold (`env`, `app`, `database`): completed
- Phase 1.7 web design-system baseline (`shadcn/ui`, tokens, shell): completed
- Phase 1.8 web route skeleton (`/auth`, `/dashboard`, `/settings`): completed
- Phase 1.9 API-engine integration placeholders: completed
- Phase 2.1 domain module/entity scaffold: completed
- Phase 2.2 domain CRUD route extensions (`GET :id`, `PATCH :id`): completed
- Business logic: not started

## Phase 1 Verification Notes

### Verified
- Web app runs locally (`npm run dev:web`)
- Web routes available: `/`, `/auth`, `/dashboard`, `/settings`
- API compiles and lints (`npm run lint:api`, `npm run build:api`)
- Engine module compiles (`python -m py_compile apps/engine/src/main.py`)
- Auth scaffold endpoints are present (`/api/v1/auth/register`, `/api/v1/auth/login`, `/api/v1/auth/me`)
- API-engine placeholder endpoint is present (`/api/v1/integrations/engine/health`)
- Design-system baseline is active (tokens + shell + reusable button)

### Known Gaps / Blockers
- Docker runtime could not be executed in this environment because `docker` command was unavailable in PATH.
- PostgreSQL runtime connectivity was not fully verified via docker-compose in this environment.

### Ready for Phase 2
- Monorepo structure and service scaffolds are in place.
- Core domain implementation can start with users/sites/systems/devices/tariffs CRUD.
