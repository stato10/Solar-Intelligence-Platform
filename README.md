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

## External Provider Docs

- `EXTERNAL_APIS.md` - provider integration contracts (`PVGIS`, `Open-Meteo`, `OpenWeather One Call 3.0`, `OpenCage`)

## Governance Docs

- `TODO.md` - phase tracking and cross-cutting execution checklist
- `TESTING_STRATEGY.md` - phase-aware testing gates and fixture strategy
- `RISK_REGISTER.md` - active technical/product risks and mitigations
- `RECOMMENDATION_SCHEMA.md` - canonical recommendation payload contract
- `NORMALIZATION_RULES.md` - frozen units and normalization standards

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
- Phase 1 scaffold package (1.1-1.10): completed
- Phase 2 domain CRUD scaffolding (2.1-2.4): completed
- Phase 3 provider layer (3.1-3.7): completed
  - Real adapters live: Open-Meteo, OpenWeather One Call 3.0, OpenCage, PVGIS
  - Strategy/orchestration + fallback chains live for weather/geolocation/solar
- Phase 2 closure mode: scaffold-complete (currently in-memory domain storage)
- Phase 4 deterministic calculation engine: in progress (`4.1`-`4.6` complete, `4.7` fixtures/golden checks pending)
- Governance-first gate enabled before dashboard integration:
  - testing strategy defined
  - risk register defined
  - recommendation schema defined

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

### Ready for Phase 4
- Domain and provider scaffolds are in place.
- External provider integrations are wired and validated.
- Next focus is Phase 4.7 fixture-based validation and golden output checks.
