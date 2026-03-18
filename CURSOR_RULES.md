# Cursor Rules

## Rules Freeze (Phase 0)
- Baseline status: **Frozen for Phase 1 execution**
- Rule priority:
  1. `EXECUTION_PLAN.md` phase boundaries
  2. `API_CONTRACTS.md` and `DB_SCHEMA.md` contracts
  3. coding and design rules in this file
- Change policy: rule changes require explicit approval and must be reflected in `TODO.md`

## General Rules
1. Work strictly phase by phase.
2. Do not implement future phases early.
3. Do not rewrite architecture without explicit approval.
4. Always prefer clean, modular, maintainable code.
5. Keep the repository runnable after every task.

---

## Code Rules
5. Use TypeScript strictly (no any unless necessary).
6. Use DTOs and validation for all APIs.
7. Keep business logic separate from controllers.
8. Avoid duplicated logic.

---

## Calculation Rules
9. All calculations MUST be deterministic (Python engine).
10. AI must NOT calculate values.
11. AI is allowed only for:
   - summarization
   - explanation
   - prioritization

---

## Integration Rules
12. External APIs must be abstracted behind providers.
13. Do NOT hardcode third-party logic in core services.
14. Use mock providers if real APIs are not ready.

---

## Development Rules
15. After each task:
   - list created files
   - explain changes
   - list TODOs

16. Do not over-engineer.
17. Do not introduce unnecessary libraries.
18. Keep architecture simple and scalable.
19. For each phase task, update `TODO.md` status immediately (`In Progress` -> `Done`).
20. Do not start next task before current task has explicit "done criteria" check.

---

## Design Rules
21. Use `shadcn/ui` as base components and customize with project tokens.
22. Use Tailwind CSS tokens; avoid hardcoded visual values in feature components.
23. Use Radix UI primitives for accessibility-first interactions.
24. Use Framer Motion for meaningful micro-interactions only (no decorative over-animation).
25. Keep UI non-generic: consistent hierarchy, premium spacing, and strong visual rhythm.
26. Every page must include loading, empty, and error states.
27. Before UI implementation, freeze token names and component variants in docs.

---

## AI Layer Rules
28. AI must never invent raw data.
29. Always use structured inputs and outputs.
30. Provide fallback summaries if AI is unavailable.

---

## Quality Rules
31. Validate all inputs.
32. Handle errors properly.
33. Keep naming consistent.
34. Maintain folder structure discipline.
35. No merge-ready task without passing lint/typecheck/test for touched modules.
