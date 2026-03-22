# Execution Plan

## Controlled Execution Gate (Applies to All Phases)
- Execute work one task at a time using `TASK_TEMPLATE.md`.
- Follow `Command -> Implement -> Report -> Audit -> Close` for every task.
- Use `PHASE_GATE_CHECKLIST.md` before marking any phase complete.
- Run sync checks defined in `SYNC_PROTOCOL.md` to prevent doc/code drift.

## Phase 0 - Documentation Freeze
- Finalize product definition
- Finalize MVP scope
- Finalize architecture
- Finalize DB schema
- Finalize API contracts
- Finalize UI direction (premium, non-generic)
- Finalize design tokens (color, typography, spacing, radius, motion)
- Finalize component baseline for web app (`shadcn/ui` customization rules)

---

## Phase 1 - Project Scaffold
- Monorepo setup
- Frontend (Next.js)
- Backend (NestJS)
- Python Engine (FastAPI)
- PostgreSQL
- Docker setup
- Base README

DONE WHEN:
- All services run locally
- DB connected
- Basic auth working
- Base design system is wired in web app (tokens + core layout shell)

---

## Phase 2 - Core Domain
- Users
- Sites
- Solar systems
- Devices
- Tariffs
- CRUD APIs
- Validation

DONE WHEN:
- Full onboarding flow works
- CRUD and validation flows are stable in scaffold mode (in-memory)
- Persistent database wiring is tracked as a hardening step (post-MVP stabilization)

---

## Phase 3 - Provider Layer
- Solar provider abstraction
- Weather provider abstraction
- Air quality provider abstraction (deferred to post-MVP extension)
- Mock implementations

DONE WHEN:
- End-to-end data flow works with mocks

---

## Phase 4 - Calculation Engine
- Forecast normalization
- Soiling score
- Heat loss
- Risk detection
- Opportunity scoring
- Financial estimation
- Fixture-based validation and golden output checks
- Contract freeze gate before dashboard integration

DONE WHEN:
- Engine returns consistent JSON outputs
- Golden fixtures pass repeatedly (deterministic outputs)
- API <-> engine contract checks pass for valid and invalid payloads

---

## Phase 5 - Dashboard Integration
- Aggregated backend endpoints
- Main dashboard response model
- Recommendation feed
- Structured logging baseline
- Contract and snapshot tests for dashboard payload

DONE WHEN:
- Dashboard receives full structured data
- Data contracts validated against engine/API schemas

---

## Phase 6 - Frontend MVP
- Auth screens
- Onboarding flow
- Dashboard UI
- Maintenance page
- Savings page
- Settings page

DONE WHEN:
- User can fully interact with app
- UI is consistent with design tokens and non-generic visual direction

---

## Phase 7 - AI / Agents
- Orchestrator agent
- Daily insight
- Weekly summary
- Prioritized actions
- Fallback summaries

DONE WHEN:
- AI produces consistent, non-hallucinated output

---

## Phase 8 - QA & Polish
- Bug fixing
- Refactoring
- Loading states
- Error handling
- Final documentation

DONE WHEN:
- App stable and usable
- Phase gate checklist is fully satisfied and documented
