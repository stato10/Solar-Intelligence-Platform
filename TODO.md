# TODO

## Phase 0 - Documentation Freeze (In Order)
- [x] 0.1 Final consistency pass across all `.md` files (single source of truth = web-first)
- [x] 0.2 Freeze MVP scope boundaries (`MVP_SCOPE.md`)
- [x] 0.3 Freeze architecture flow and service boundaries (`ARCHITECTURE.md`, `PROJECT_BOOTSTRAP.md`)
- [x] 0.4 Freeze API contracts (`API_CONTRACTS.md`)
- [x] 0.5 Freeze DB schema (`DB_SCHEMA.md`)
- [x] 0.6 Freeze Cursor execution rules (`CURSOR_RULES.md`)
- [x] 0.7 Mark Phase 0 complete and lock docs baseline

## In Progress
- [ ] Phase 1.10 Finalize Phase 1 checklist and local run verification notes

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

## Next Phases (Queued)
- [ ] Phase 1: Project scaffold (web/api/engine + docker + base auth)
- [ ] Phase 2: Core domain CRUD (users/sites/systems/devices/tariffs)
- [ ] Phase 3: Provider abstraction + mocks
- [ ] Phase 4: Calculation engine modules
- [ ] Phase 5: Dashboard integration endpoints
- [ ] Phase 6: Frontend MVP pages and states
- [ ] Phase 7: AI insights + fallback
- [ ] Phase 8: QA, polish, release readiness
