# Cursor Rules

## General Rules
1. Work strictly phase by phase.
2. Do not implement future phases early.
3. Do not rewrite architecture without explicit approval.
4. Always prefer clean, modular, maintainable code.

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

---

## AI Layer Rules
19. AI must never invent raw data.
20. Always use structured inputs and outputs.
21. Provide fallback summaries if AI is unavailable.

---

## Quality Rules
22. Validate all inputs.
23. Handle errors properly.
24. Keep naming consistent.
25. Maintain folder structure discipline.
