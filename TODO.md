# TODO

## Task Status Model (Controlled Execution)
Use one of the following tags on task lines:
- `planned`
- `active`
- `needs-audit`
- `blocked`
- `done`

Rules:
- Keep exactly one `active` implementation task at a time.
- Do not move to the next task before current task reaches `done`.
- If a code TODO is added, track it here explicitly.

## Task Closure Protocol
Each task follows:

`Command -> Implement -> Report -> Audit -> Close`

Before marking task `done`, verify `PHASE_GATE_CHECKLIST.md` and `SYNC_PROTOCOL.md`.

## Runtime Truth Note (Current)
- Active runtime persistence is PostgreSQL via Prisma (`apps/api/prisma/schema.prisma`).
- All domain routes are JWT-guarded with per-user ownership enforcement.
- `DB_SCHEMA.md` documents the live model plus remaining target tables (telemetry/history).

## Phase 0 - Documentation Freeze (In Order)
- [x] 0.1 Final consistency pass across all `.md` files (single source of truth = web-first)
- [x] 0.2 Freeze MVP scope boundaries (`MVP_SCOPE.md`)
- [x] 0.3 Freeze architecture flow and service boundaries (`ARCHITECTURE.md`, `PROJECT_BOOTSTRAP.md`)
- [x] 0.4 Freeze API contracts (`API_CONTRACTS.md`)
- [x] 0.5 Freeze DB schema (`DB_SCHEMA.md`)
- [x] 0.6 Freeze Cursor execution rules (`CURSOR_RULES.md`)
- [x] 0.7 Mark Phase 0 complete and lock docs baseline

Definition of Done:
- Docs aligned and internally consistent
- MVP boundaries explicit and stable
- Any future doc changes require versioned updates

## In Progress

## Recently Closed
- [x] 7.12 Energy Decision product links + monetization [done]
- [x] 7.11 Energy Decision AI frontend integration [done]
- [x] 7.10 Energy Decision AI (v3 contract) [done]
- [x] 7.9 End-to-end AI flow validation [done]
- [x] 7.8 AI output validation + guardrails [done]
- [x] 7.7 Frontend AI insights integration [done]
- [x] 7.6 Savings explanation with and without upgrades [done]
- [x] 7.5 Product recommendation engine [done]
- [x] 7.4 Smart product recommendation catalog [done]
- [x] 7.3 Current-state transparency insights [done]
- [x] 7.2 AI service baseline + fallback [done]
- [x] Phase 4.1 Freeze deterministic engine contract (input/output + fixtures) [done]
- [x] Phase 4.2 Implement forecast normalization module in engine [done]
- [x] Phase 4.3 Implement soiling and heat-loss deterministic modules [done]
- [x] Phase 4.4 Implement risk detection and opportunity scoring modules [done]
- [x] Phase 4.5 Implement deterministic financial estimation module [done]
- [x] Phase 4.6 Wire API <-> engine deterministic contract integration [done]
- [x] Phase 4.7 Add fixture-based validation and golden-output checks [done]
- [x] 4.3a Add AIR QUALITY abstraction contract (pm10/pm25/dust) [done]
- [x] 4.4a Define unified recommendation schema and enforce it in outputs [done]
- [x] 4.5a Define normalization + units rules (UTC, C, m/s, ILS, percent) [done]
- [x] 4.6a Add stronger runtime contract validation (API-engine payload guards) [done]
- [x] 4.7a Add fixture-based validation tests in CI-friendly runner [done]
- [x] 4.8 Freeze engine output contract before dashboard integration [done]
- [x] 5.1 Build aggregated dashboard endpoint [done]
- [x] 5.2 Merge dashboard response model (forecast, soiling, heat, risks, opportunities, financials) [done]
- [x] 5.3 Add structured logging baseline [done]
- [x] 5.4 Add dashboard contract smoke tests [done]
- [x] 5.5 Add dashboard response snapshot test [done]
- [x] 5.6 Create demo seed (demo user/site/system + seeded dashboard payload) [done]
- [x] Phase 4.9a Sync API contracts with implemented routes [done]
- [x] Phase 4.9b Freeze canonical dashboard aggregate contract [done]
- [x] Phase 4.9c Align engine schema with API DTOs/tests [done]
- [x] Phase 4.9d Document DB truth (in-memory runtime, PostgreSQL target) [done]
- [x] Phase 4.9e Normalize payload naming to camelCase in public contracts [done]
- [x] Phase 4.9f Provider->engine mapping policy freeze (mapped vs ignored fields) [done]
- [x] Phase 4.9g Final sync audit and phase gate check [done]

## Blocked
- [x] OpenAI output sometimes fails v2/v3 contract validation in runtime (must degrade safely + pass regression checks) [resolved]

## Done
- [x] Bootstrap brief defined and aligned to web-first application direction
- [x] Project planning docs created in repository root
- [x] Phase-by-phase execution plan documented with exit criteria
- [x] Phase 0 documentation freeze completed
- [x] Phase 1.1 Scaffold monorepo root structure (`apps/web`, `apps/api`, `apps/engine`, `packages/*`)
- [x] Phase 1.2 Initialize app runtimes (`Next.js`, `NestJS`, `FastAPI`) without business logic
- [x] Phase 1.3 Configure root workspace scripts and unified dev commands
- [x] Phase 1.4 Add minimal runtime Dockerfiles for `web`, `api`, and `engine`
- [x] Phase 1.5 Add base auth module scaffold in API (no domain business logic)
- [x] Phase 1.6 Add API config module scaffold (`env`, `app`, `database` placeholders)
- [x] Phase 1.7 Add web design-system baseline (`shadcn/ui`, tokens, shell layout)
- [x] Phase 1.8 Add web route skeleton (`/auth`, `/dashboard`, `/settings`) placeholder pages
- [x] Phase 1.9 Add API-engine integration placeholders (internal client + stub service)
- [x] Phase 1.10 Finalize Phase 1 checklist and local run verification notes
- [x] Phase 1 completion gate (services run, auth baseline, scaffold integration) satisfied for current environment
- [x] Phase 2.1 Define domain entities in API modules (`users`, `sites`, `solar-systems`, `devices`, `tariffs`)
- [x] Phase 2.2 Add CRUD route extensions (`:id`, update) for domain modules
- [x] Phase 2.3 Add temporary in-memory relation checks between entities
- [x] Phase 2.4 Add simple list filters and pagination placeholders per module
- [x] Phase 2 closure decision: marked as scaffold-complete (in-memory persistence)
- [x] Phase 2 completion gate (onboarding API flow + structured responses) satisfied for scaffold scope
- [x] Phase 3.1 Define provider interfaces and base adapter contracts
- [x] Phase 3.2 Add mock provider adapters for PVGIS/Open-Meteo/OpenWeather/OpenCage
- [x] Phase 3.3 Add provider selection strategy and fallback wiring scaffold
- [x] Phase 3.4 Add first real provider adapter behind strategy (OpenCage)
- [x] Phase 3.5 Add first real weather adapter behind strategy (Open-Meteo)
- [x] Phase 3.6 Add first real alert-capable weather fallback adapter (OpenWeather)
- [x] Phase 3.7 Add first real solar provider adapter behind strategy (PVGIS)
- [x] Phase 3 scope decision: defer air-quality provider abstraction to post-MVP extension
- [x] External API docs baseline: PVGIS provider contract and env configuration
- [x] External API docs extended: Open-Meteo and OpenWeather One Call 3.0
- [x] External API docs extended: OpenCage geolocation provider (multilingual forward/reverse geocoding)
- [x] Phase 3 completion gate (real+mock providers interchangeable with strategy fallback) satisfied

## Next Phases (Queued)
- [x] Phase 1: Project scaffold (web/api/engine + docker + base auth) [done]
- [x] Phase 2: Core domain CRUD scaffolding (users/sites/systems/devices/tariffs) [done]
- [x] Phase 3: Provider abstraction + mocks/real adapters (weather/geolocation/solar) [done]
- [x] Phase 4: Calculation engine modules [done]
- [x] Phase 5: Dashboard integration endpoints [done]
- [x] Phase 6: Frontend MVP pages and states [done]
- [x] Phase 7: AI insights + fallback [done]
- [x] Phase 8: Database Migration & Hardening [done]

## Phase 8 - Postgres Database Migration
- [x] 8.1 Schema Analysis & ORM Selection [done]
- [x] 8.2 Prisma & Infrastructure Scaffold (`docker-compose`, migrations, PrismaService) [done]
- [x] 8.3 Repository Abstraction Layer [done]
- [x] 8.4 Prisma Integration & Transactions [done]
- [x] 8.5 Auth Hardening (Proper JWT) [done]

Execution Order (strict, single-task flow):
- `8.2 -> 8.3 -> 8.4 -> 8.5 -> cross-cutting tests -> final audit/close`
- Do not open next task before current task reaches `[done]`.

### 8.2 Detailed Assignment (Prisma & Infrastructure) [done]
- [x] Add Prisma module/service wiring in API app bootstrap.
- [x] Generate initial migration and lock file in `apps/api/prisma/migrations`.
- [x] Ensure Docker Postgres is the canonical DB runtime on host `5432`.
- [x] Disable local Windows PostgreSQL service to prevent dual-binding conflicts.
- [x] Ensure `prisma.config.ts` loads workspace root `.env`.
- [x] Ensure seed command is configured and runnable under Prisma 7.
- [x] Run `prisma generate`.
- [x] Run `prisma migrate deploy`.
- [x] Run `prisma db seed`.
- [x] Run API quality gates (`lint`, `build`).
- [x] Audit pass and close 8.2 (`needs-audit -> done`).

### 8.3 Detailed Assignment (Repository Abstraction Layer) [done]
- [x] Introduce repository interfaces for `users`, `sites`, `solar-systems`, `devices`, `tariffs`.
- [x] Keep controller/service API contracts unchanged (no response-shape breaking changes).
- [x] Replace direct in-memory arrays with repository-backed reads/writes.
- [x] Preserve validation and relation checks currently enforced in services.
- [x] Add minimal integration tests for repository-backed CRUD happy paths.
- [x] Run API contract smoke tests after repository swap.
- [x] Audit pass and close 8.3.

### 8.4 Detailed Assignment (Prisma Integration & Transactions) [done]
- [x] Add transactional boundaries for multi-step domain flows.
- [x] Ensure rollback behavior on partial failures.
- [x] Keep deterministic engine and dashboard logic unchanged.
- [x] Verify API-engine and dashboard smoke/snapshot tests still pass.
- [x] Add regression checks for transaction failure paths.
- [x] Audit pass and close 8.4.

### 8.5 Detailed Assignment (Auth Hardening - Proper JWT) [done]
- [x] Replace `dev.*` token format with proper JWT issue/verify flow.
- [x] Add password hashing for persisted users.
- [x] Keep auth route contract stable for frontend (`register/login/me` envelope).
- [x] Ensure protected AI endpoints work with frontend-authenticated flow.
- [x] Add auth regression tests (invalid token, expired token, bad credentials).
- [x] Audit pass and close 8.5.

### AI Stabilization Gate (must pass before MVP close) [done]
- [x] Keep OpenAI path enabled when key exists.
- [x] On invalid OpenAI output, return deterministic fallback output instead of breaking user flow.
- [x] Enforce v2/v3 output validator before response.
- [x] Add regression tests:
  - [x] OpenAI valid output -> returned as-is.
  - [x] OpenAI invalid output -> deterministic fallback returned.
  - [x] Missing key -> deterministic fallback returned.
- [x] Remove blocked status once runtime validation is stable.

## Phase 6 - Frontend MVP Pages and States

- [x] 6.1 Frontend API contract alignment [done]
  - define exact frontend-facing shapes for:
    - auth
    - onboarding
    - dashboard aggregate
  - align with `API_CONTRACTS.md` only
  - no UI rewrite yet

- [x] 6.2 Dashboard source switch [done]
  - replace demo/seed dependency
  - consume canonical `POST /api/v1/dashboard/aggregate`
  - handle `success`/`data`/`meta` envelope correctly

- [x] 6.3 Dashboard view model [done]
  - add thin frontend mapping layer from aggregate payload to UI sections/cards
  - no calculations in frontend
  - presentation-only transformations

- [x] 6.4 Shared frontend data layer baseline [done]
  - establish client data-fetching pattern
  - choose and wire canonical client layer (TanStack Query preferred if already planned)
  - standardize API calling + error handling

- [x] 6.5 UX states hardening [done]
  - loading states
  - empty states
  - error states
  - shared patterns for core pages

- [x] 6.6 Auth screen implementation [done]
  - login/register forms
  - token/session handling
  - redirect flow
  - auth error handling

- [x] 6.7 Onboarding step 1 (site/system) [done]
  - site form
  - solar system form
  - validation + submit flow

- [x] 6.8 Onboarding step 2 (tariff/devices) [done]
  - tariff form
  - device profile form
  - validation + submit flow

- [x] 6.9 Maintenance screen [done]
  - render deterministic maintenance signals from dashboard/aggregate data
  - no new logic

- [x] 6.10 Savings screen [done]
  - render financial and optimization sections from canonical data
  - no new calculations

- [x] 6.11 End-to-end MVP flow validation [done]
  - auth -> onboarding -> dashboard
  - validate fallback/error paths
  - verify frontend uses canonical contracts only

## Phase 5 Definition of Done
- Aggregated dashboard endpoint returns complete, contract-valid data
- Contract tests and snapshot checks pass
- Demo seed supports end-to-end walkthrough

## Phase 6 Definition of Done
- User completes full app flow (auth -> onboarding -> dashboard)
- UI handles loading/empty/error states consistently
- Data rendering matches backend contracts

## Phase 7 Definition of Done
- AI layer uses deterministic inputs only
- Fallback mode works without OpenAI production key
- Output is explainable and non-hallucinatory

## Phase 8 Definition of Done
- 8.2, 8.3, 8.4, 8.5 are all marked `[done]` with audit evidence.
- AI stabilization gate is fully green (OpenAI + fallback + validator behavior verified).
- Cross-cutting MVP test gate is fully green.
- No active blockers in `Blocked` section.
- `PHASE_GATE_CHECKLIST.md` and `SYNC_PROTOCOL.md` closure steps completed.

## Phase 9 — Telemetry Ingestion (in progress)
- [x] Prisma models: `InverterConnection` + `TelemetryReading` (+ migration `20260901_telemetry_foundation`)
- [x] Vendor-neutral connector contract (`InverterConnector`)
- [x] SolarEdge monitoring API adapter (verify + 15-min energy readings)
- [x] Mock inverter adapter (deterministic bell curve for demos)
- [x] JWT-guarded endpoints: create/get/delete connection, manual sync, readings query
- [x] 15-minute background sync scheduler (`@nestjs/schedule`)
- [x] `telemetry` summary block on the site-backed dashboard aggregate
- [x] Settings → Integrations: real inverter connect/disconnect flow (encrypted key at rest)
- [ ] Apply `20260901_telemetry_foundation` migration (blocked: local port 5432 occupied by another project's Postgres)
- [ ] Feed actual telemetry kWh into engine benchmark (`actualProductionKwh`)
- [ ] Enphase / Fronius / SMA adapters
- [ ] Dashboard substate wiring: drive `stale-telemetry` / `live` from the aggregate `telemetry` block

## Cross-Cutting Tasks

Testing:
- [x] Create `TESTING_STRATEGY.md`
- [ ] Unit tests for engine modules *(post-MVP hardening — not blocking product close)*
- [x] API <-> engine contract tests
- [ ] Provider adapter tests (mock/real behavior) *(post-MVP hardening — not blocking product close)*
- [x] Dashboard response snapshot tests

Cross-cutting MVP test gate (must all pass before final close):
- [x] `npm run lint:api`
- [x] `npm run build:api`
- [x] `npm run lint:web`
- [x] `npm run build:web`
- [x] `python apps/engine/tests/run_golden.py`
- [x] `python apps/api/tests/run_engine_contract_smoke.py`
- [x] `python apps/api/tests/run_dashboard_contract_smoke.py`
- [x] `python apps/api/tests/run_dashboard_snapshot.py`
- [x] Auth + onboarding + dashboard + AI (v2/v3) end-to-end smoke (manual scripted run)

Risk Management:
- [x] Create `RISK_REGISTER.md`

Data Consistency:
- [x] Freeze normalization rules:
  - time: UTC
  - temperature: C
  - wind: m/s
  - money: ILS
  - percentages: normalized scale

Recommendation System:
- [x] Freeze canonical recommendation schema:
  - id
  - type
  - title
  - message
  - severity
  - priority
  - estimated_value
  - valid_from
  - valid_until
  - source_module

Observability:
- [x] Request logging baseline
- [x] Provider error logging
- [x] Engine execution logging
- [x] Correlation ID propagation support

## Strategic Risks
- Provider schema drift
- Inconsistent units between external APIs
- Low-quality user/location input
- Engine complexity growth reducing explainability
- Weak perceived user value if recommendations lack actionability
