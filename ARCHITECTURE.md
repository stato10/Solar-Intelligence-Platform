# Architecture

## Architecture Freeze (Phase 0)
- Baseline status: **Frozen for Phase 1 scaffold**
- Approved runtime path: `Web App -> Node.js API -> Decision Layer -> Python Engine -> External APIs`
- Change policy: architecture changes require explicit approval and synchronized updates to `PROJECT_BOOTSTRAP.md` and `EXECUTION_PLAN.md`

## System Overview
Web-first, service-oriented monorepo:
- `apps/web` (Next.js): user-facing application.
- `apps/api` (NestJS): auth, business orchestration, persistence, AI summary service.
- `apps/engine` (FastAPI): deterministic scoring/calculation service.
- `packages/types` and `packages/config`: shared contracts/config.

The API orchestrates provider data and engine results, persists outputs, then returns typed responses to the web app.

## Runtime Persistence Truth (Phase 4.9)
- Active runtime persistence for current scaffold scope is in-memory in API modules.
- PostgreSQL remains the target persistence architecture and schema source of truth for future persistence hardening phases.
- No architecture change is implied by this note; it clarifies current runtime behavior vs target-state design.

## Tech Stack
- Client: Next.js App Router, React, TypeScript, Tailwind CSS, shadcn/ui, Radix UI, Framer Motion, TanStack Query, Zod.
- Backend: Node.js, NestJS, REST, OpenAPI docs.
- Engine: Python, FastAPI, Pydantic, NumPy/Pandas where useful.
- Data: PostgreSQL (primary), optional Redis cache abstraction.
- AI: OpenAI structured outputs for explanations only.
- Infra: Docker Compose, `.env`, local health checks.

## Components
- Web app: onboarding, dashboard, details pages, user interaction.
- API auth module: JWT issuance, password hashing, route guards.
- API domain modules: sites, systems, forecasts, scores, risks, opportunities, finance, insights.
- Decision layer (inside API):
  - Solar Orchestrator Agent: gathers context and coordinates forecast/score computation flow.
  - Recommendation Router: converts computed outputs into prioritized user actions.
- Provider adapters: solar/weather/air-quality provider interfaces + mock implementations.
- Engine calculators: forecast normalization, soiling, heat, risk, opportunity, financial estimators.
- AI insight service: summarize deterministic outputs with fallback template summaries.

## Runtime Flow
`Web App` -> `Node.js API` -> `Decision Layer` -> `Python Engine` -> `External APIs`

- Decision Layer includes:
  - Solar Orchestrator Agent
  - Recommendation Router
- Python Engine includes:
  - Forecast Calculator
  - Soiling Calculator
  - Heat Calculator
  - Risk Calculator
  - Financial Calculator
- External APIs include:
  - Solar
  - Weather
  - Air Quality

## Data Flow
1. Web app sends authenticated request to API.
2. API loads site/system/device/tariff context from active in-memory services (Phase 4.9 runtime truth).
3. Solar Orchestrator Agent triggers provider fetch and normalization flow.
4. API/provider layer fetches solar/weather/air-quality data from abstractions.
5. API calls engine calculators for deterministic scoring outputs.
6. Recommendation Router prioritizes actions from deterministic results.
7. API stores outputs and returns typed response.
8. API optionally generates AI summary from deterministic payload only.
9. Web app renders metrics, alerts, opportunities, and explanations.

## Deployment
- Local: Docker Compose with API, engine, and PostgreSQL (plus optional Redis).
- Staging: containerized services with environment-separated secrets.
- Production baseline: API and engine independently scalable; DB managed service preferred.
- Operational baseline: readiness/liveness health endpoints and structured logging enabled.
