# Product Requirements

## Functional Requirements
- Authentication: register, login, get current user profile.
- Site management: create/update site with address, coordinates, timezone.
- Solar system profile: define size, tilt, azimuth, panel details, cleaning date.
- Device profile: indicate controllable/flexible household devices.
- Forecasting: today/week/month expected production and peak window.
- Soiling analysis: score, estimated loss, cleaning recommendation/date.
- Heat analysis: heat stress score and estimated efficiency loss.
- Risk detection: weather risk alerts with severity and expected timeframe.
- Opportunity engine: best device run windows and estimated opportunity value.
- Financial summary: daily/monthly/yearly savings potential.
- Insight layer: daily/weekly AI summaries from deterministic outputs only.

## Non-Functional Requirements
- Security: JWT auth, password hashing, guarded endpoints, validated input.
- Performance: p95 API response <= 500ms for cached reads; <= 1500ms for computed endpoints.
- Reliability: service health checks and graceful fallback summaries when AI is unavailable.
- Observability: structured logs and error traces across API + engine.
- Maintainability: modular architecture and strict TypeScript/Python typing.
- Developer efficiency: one-command local startup with seeded mock data.

## User Stories
- As a solar owner, I want a daily production forecast so I can plan energy usage.
- As a solar owner, I want cleaning recommendations so I only clean when value is positive.
- As a solar owner, I want heat/weather risk alerts so I can avoid efficiency losses.
- As a solar owner, I want appliance timing guidance so I can maximize self-consumption.
- As a solar owner, I want plain-language insights so I can act without reading raw metrics.

## Acceptance Criteria
- User can onboard a site and solar system from the web app without manual DB edits.
- Forecast/soiling/heat/risk/opportunity/financial endpoints return valid typed payloads.
- AI summary never fabricates deterministic values and supports non-AI fallback.
- End-to-end flow works locally using mock provider adapters.
- Each phase includes documented run steps and open TODOs.

## Assumptions and Constraints
- V1 excludes direct hardware inverter/sensor integration.
- External providers are abstracted; mocks are allowed until live adapters stabilize.
- PostgreSQL is the system of record; Redis caching is optional in MVP.
- Web app is the primary client in MVP (Next.js).
