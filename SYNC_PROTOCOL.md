# Sync Protocol

This protocol prevents drift between code, contracts, and documentation.

## Mandatory Order for Every Implementation Task
1. Read `TODO.md`, `CURSOR_RULES.md`, `WORKFLOW_RULES.md`, and this file.
2. Confirm active phase and active task ID.
3. Read only relevant contracts/modules for the active task.
4. Implement only scoped changes.
5. Run validation for touched areas.
6. Produce task report (files changed, logic summary, validations, remaining TODOs).
7. Run audit/refinement pass on touched scope.
8. Close task only if no open critical issues remain.

## Drift Checks (Must Run During Audit)
- Contract drift:
  - Has request/response shape changed?
  - If yes, update `API_CONTRACTS.md` and any affected fixtures/tests.
- Integration drift:
  - Does `apps/engine` output still match `apps/api` expectations?
  - Do contract/smoke checks still pass?
- UX drift:
  - Do frontend assumptions still match documented API payloads?
- TODO drift:
  - Any TODO comment in code must have a tracked item in `TODO.md`.

## Mandatory Doc Updates on Change
- Contract change -> update `API_CONTRACTS.md`
- Schema change -> update `DB_SCHEMA.md`
- Architecture boundary/runtime change -> update `ARCHITECTURE.md`
- Phase/task progress change -> update `TODO.md`
- Verification flow change -> update `TESTING_STRATEGY.md`

## Forbidden End States
- Untyped or undocumented payload shape changes
- Broken provider contracts
- Broken imports in touched modules
- Partially integrated cross-service behavior
- Open critical audit issues marked as done

## Runnable End-State Rule
No task is complete unless touched services/modules remain runnable after task closure.
