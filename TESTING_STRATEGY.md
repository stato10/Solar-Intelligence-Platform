# Testing Strategy

## Purpose
Define a phase-aware testing system that keeps contracts stable, prevents regressions, and supports deterministic outputs for engine-driven modules.

## Quality Gates by Layer

Engine (`apps/engine`):
- Unit tests for deterministic computation modules (forecast normalization, soiling, heat, risks, opportunity, financial).
- Fixture-based golden tests for `POST /calculate/v1` output stability.
- Determinism check: same input fixture must produce same normalized JSON output across repeated runs.

API (`apps/api`):
- Contract tests for `POST /api/v1/integrations/engine/calculate/v1`.
- DTO validation tests for request payload acceptance/rejection.
- Provider integration smoke tests for OpenWeather, Open-Meteo, PVGIS (real and fallback paths).

Web (`apps/web`):
- Component-level rendering checks for loading/error/empty states.
- Snapshot/structure checks for dashboard response mapping.
- End-to-end flow smoke for auth -> onboarding -> dashboard.

## Test Pyramid

1. Unit (fastest, largest count):
- Engine pure functions and deterministic calculations.
- API mapping/validation helpers.

2. Contract (medium):
- API <-> engine request and response schema assertions.
- Provider adapter contract shape checks.

3. Integration (slower):
- Live provider smoke tests (rate-limited, low frequency).
- Dashboard aggregated endpoint checks.

4. End-to-End (smallest):
- Demo flow with seeded data.

## Phase-Aware Test Gates

Phase 4 gate:
- Engine fixtures exist for baseline, high-risk, low-risk, and tariff scenarios.
- Golden output checks pass.
- API contract endpoint returns schema-valid payload for all fixtures.

Phase 5 gate:
- Dashboard aggregation contract tests pass.
- Snapshot tests for dashboard payloads pass.

Phase 6 gate:
- UI state tests pass (loading/error/empty/success).
- End-to-end flow passes on demo seed.

Phase 7 gate:
- AI fallback tests pass without OpenAI key.
- Deterministic references always present in insight payloads.

## Fixtures and Golden Files

Engine fixture location:
- `apps/engine/tests/fixtures/engine/v1/input-*.json`
- `apps/engine/tests/fixtures/engine/v1/expected-*.json`

Fixture set (minimum):
- `input-baseline.json`
- `input-high-risk.json`
- `input-low-risk.json`
- `input-tariff-sensitive.json`
- `input-weather-severe.json`

Golden testing rules:
- Compare normalized JSON with sorted keys.
- Numeric precision fixed to 2 decimals where applicable.
- Fail tests on missing fields or additional undeclared keys in contract-critical sections.

## CI Hooks

Required checks before merge:
- API build succeeds.
- Engine syntax checks succeed.
- Fixture runner passes.
- API-engine contract smoke passes.

Recommended commands:
- `npm --workspace @sip/api run build`
- `python -m py_compile apps/engine/src/main.py`
- `python apps/engine/tests/run_golden.py`
- `python apps/api/tests/run_engine_contract_smoke.py`

## Runtime Smoke Policy

Provider live tests are constrained:
- Keep calls minimal.
- Use one canonical coordinate fixture.
- Run full live provider suite on demand and pre-release only.
