# Workflow Rules

This document defines the mandatory execution model for implementation work in this repository.

## Objective
- Keep scope controlled and phase-aligned.
- Keep architecture stable unless explicitly approved.
- Keep the repository runnable after every completed task.
- Keep documentation, contracts, and implementation synchronized.

## Mandatory Task Lifecycle
Every implementation task must run in this order:

1. Command
2. Implement
3. Report
4. Audit
5. Close

No step may be skipped.

## Rules
1. Work on one task only.
2. Do not implement outside the active task scope.
3. Do not implement future-phase logic early.
4. Do not change architecture without explicit approval.
5. Keep deterministic-first behavior for engine calculations.
6. Keep touched modules runnable at task end.
7. Do not leave partial integration states between `apps/web`, `apps/api`, and `apps/engine`.
8. Do not leave untracked TODO comments in code.
9. Prefer focused refactors over broad rewrites.
10. Do not introduce dependencies unless required by the active task.

## Required Report Output (after Implement)
Each task report must include:
- Files created
- Files modified
- What logic changed
- Which validations were run
- Remaining TODOs and blockers

## Required Audit Scope
Audit must cover:
- Architecture consistency (`ARCHITECTURE.md`)
- Contract consistency (`API_CONTRACTS.md`)
- Schema consistency (`DB_SCHEMA.md`) when relevant
- Typing, validation, imports, and dead code in touched areas
- Deterministic behavior and fixture alignment for engine-related work

## Task Closure Rule
A task is not closed until all are true:
- Done criteria for the task are satisfied.
- Critical findings from audit are fixed or explicitly tracked.
- Required docs are updated when contracts/structure changed.
- The project remains runnable in the touched scope.

## Source-of-Truth Priority
When conflicts exist, follow this order:
1. `EXECUTION_PLAN.md`
2. `API_CONTRACTS.md` and `DB_SCHEMA.md`
3. `ARCHITECTURE.md`
4. `CURSOR_RULES.md` and this file
5. task-specific brief (`TASK_TEMPLATE.md`)
