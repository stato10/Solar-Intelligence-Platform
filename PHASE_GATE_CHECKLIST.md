# Phase Gate Checklist

Use this checklist before marking any phase as complete.

## Global Closure Gate
- [ ] All planned tasks for the phase are marked complete in `TODO.md`.
- [ ] No active critical blockers remain for the phase scope.
- [ ] No known architecture boundary violations were introduced.
- [ ] No known contract drifts remain unresolved.

## Code Health Gate
- [ ] No broken imports in touched modules.
- [ ] Lint and/or type checks pass for touched modules.
- [ ] Validation paths exist for new/changed API payloads.
- [ ] Error handling is present for changed runtime paths.

## Test and Verification Gate
- [ ] Touched module tests pass.
- [ ] Deterministic fixtures are updated and passing when engine behavior changed.
- [ ] API-engine contract smoke is passing when integration changed.
- [ ] Dashboard contract/snapshot checks are passing when dashboard payload changed.

Recommended verification commands:
- `npm run lint`
- `npm run build`
- `python -m py_compile apps/engine/src/main.py`
- `python apps/engine/tests/run_golden.py`
- `python apps/api/tests/run_engine_contract_smoke.py`
- `python apps/api/tests/run_dashboard_contract_smoke.py`
- `python apps/api/tests/run_dashboard_snapshot.py`

## Cross-Layer Sync Gate (`web` / `api` / `engine`)
- [ ] Engine output schema aligns with API DTO/contract expectations.
- [ ] API response shape aligns with documented contract and frontend assumptions.
- [ ] Frontend mappings remain consistent with current dashboard response shape.

## Documentation Sync Gate
- [ ] `TODO.md` is updated with correct task status.
- [ ] `API_CONTRACTS.md` updated if response/request shape changed.
- [ ] `DB_SCHEMA.md` updated if persistence schema changed.
- [ ] `ARCHITECTURE.md` updated if boundaries or runtime flow changed.
- [ ] `TESTING_STRATEGY.md` updated if verification flow changed.

## Runnable State Gate
- [ ] Touched services still start successfully in local development mode.
- [ ] No phase closure is accepted with knowingly broken runtime behavior.

## Sign-off
- Phase:
- Verified by:
- Date:
- Notes:
