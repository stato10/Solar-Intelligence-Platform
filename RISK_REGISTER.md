# Risk Register

## Scale
- Likelihood: `Low | Medium | High`
- Impact: `Low | Medium | High`
- Priority: `P1 | P2 | P3`

## Active Risks

| ID | Risk | Likelihood | Impact | Priority | Owner | Trigger | Mitigation | Status |
|---|---|---|---|---|---|---|---|---|
| R-001 | Provider schema drift breaks adapter mapping | Medium | High | P1 | API Integrations | External API response fields change | Add adapter contract tests and response guards; pin mapping docs | Open |
| R-002 | Unit inconsistency across providers causes wrong scoring | Medium | High | P1 | Engine + API | Unexpected units in provider responses | Enforce normalization rules (UTC, C, m/s, ILS, %) before engine input | Open |
| R-003 | Low-quality user input (location/system/tariff) degrades recommendations | High | Medium | P2 | API Domain | Missing/invalid onboarding fields | Strengthen DTO validation and fallback defaults with clear warnings | Open |
| R-004 | Engine logic complexity reduces explainability/maintainability | Medium | Medium | P2 | Engine | Frequent ad-hoc formula changes | Keep deterministic modules isolated + fixture golden tests + code comments only where needed | Open |
| R-005 | Weak perceived product value due to non-actionable recommendations | Medium | High | P1 | Product + Engine | Users ignore recommendations | Freeze recommendation schema with priority, value, validity window, source module | Open |
| R-006 | OpenAI dependency blocks AI phase verification | High | Medium | P2 | AI Layer | No production key available | Maintain deterministic fallback insight mode and test it as primary path | Open |
| R-007 | API-engine contract mismatch causes runtime failures | Medium | High | P1 | API Integrations | DTO and engine output drift | Keep strict request DTO and runtime response shape validation | Mitigated |
| R-008 | Port/process contention in local dev causes false failures | Medium | Low | P3 | DevOps Local | Stale process occupies service port | Add startup checks and explicit process cleanup guidance | Open |

## Review Cadence
- Review before starting each new phase.
- Re-score likelihood/impact after major integration changes.
- Close risks only when mitigation is automated and verified by tests.
