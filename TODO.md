# TODO

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
- [x] Phase 4.1 Freeze deterministic engine contract (input/output + fixtures)
- [x] Phase 4.2 Implement forecast normalization module in engine
- [x] Phase 4.3 Implement soiling and heat-loss deterministic modules
- [x] Phase 4.4 Implement risk detection and opportunity scoring modules
- [x] Phase 4.5 Implement deterministic financial estimation module
- [x] Phase 4.6 Wire API <-> engine deterministic contract integration
- [x] Phase 4.7 Add fixture-based validation and golden-output checks
- [x] 4.3a Add AIR QUALITY abstraction contract (pm10/pm25/dust)
- [x] 4.4a Define unified recommendation schema and enforce it in outputs
- [x] 4.5a Define normalization + units rules (UTC, C, m/s, ILS, percent)
- [x] 4.6a Add stronger runtime contract validation (API-engine payload guards)
- [x] 4.7a Add fixture-based validation tests in CI-friendly runner
- [x] 4.8 Freeze engine output contract before dashboard integration
- [x] 5.1 Build aggregated dashboard endpoint

## Blocked
- [ ] OpenAI production key not yet available (AI summary validation limited to fallback path)

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
- [x] Phase 1: Project scaffold (web/api/engine + docker + base auth)
- [x] Phase 2: Core domain CRUD scaffolding (users/sites/systems/devices/tariffs)
- [x] Phase 3: Provider abstraction + mocks/real adapters (weather/geolocation/solar)
- [x] Phase 4: Calculation engine modules
- [ ] Phase 5: Dashboard integration endpoints
- [ ] Phase 6: Frontend MVP pages and states
- [ ] Phase 7: AI insights + fallback
- [ ] Phase 8: QA, polish, release readiness

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
- [ ] Dashboard response snapshot tests

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
- [ ] Request logging baseline
- [ ] Provider error logging
- [ ] Engine execution logging
- [ ] Correlation ID propagation support

## Strategic Risks
- Provider schema drift
- Inconsistent units between external APIs
- Low-quality user/location input
- Engine complexity growth reducing explainability
- Weak perceived user value if recommendations lack actionability
