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

## Runtime Truth Note (Phase 4.9)
- Active runtime persistence remains in-memory for current scaffold scope.
- `DB_SCHEMA.md` is treated as the target persistence model for future PostgreSQL hardening tasks.

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
- [ ] 7.9 End-to-end AI flow validation [needs-audit] — OpenAI production wiring deferred until key is available; output validator (7.8) is in place and will gate this path

## Recently Closed
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
- [ ] OpenAI production key not yet available (AI summary validation limited to fallback path) [blocked]

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
- [ ] Phase 8: QA, polish, release readiness [planned]

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
- No critical bugs in happy-path usage
- Performance and reliability baselines met
- Docs and runbooks ready for pilot/demo

## Cross-Cutting Tasks

Testing:
- [x] Create `TESTING_STRATEGY.md`
- [ ] Unit tests for engine modules
- [x] API <-> engine contract tests
- [ ] Provider adapter tests (mock/real behavior)
- [x] Dashboard response snapshot tests

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
