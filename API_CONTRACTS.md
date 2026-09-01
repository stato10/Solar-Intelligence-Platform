# API Contracts

## Contract Freeze (Phase 0)
- Baseline status: **Frozen for Phase 1 scaffold**
- Change policy: contract changes require explicit approval and synchronized updates to `DB_SCHEMA.md`, `ARCHITECTURE.md`, and `PROJECT_BOOTSTRAP.md`
- Rule: no breaking response shape changes within the same API version

## Base Information
- Base URL (local): `http://localhost:${API_PORT}/api/v1` (default `3000`; local dev commonly uses `3002` — see `.env` / `NEXT_PUBLIC_API_BASE_URL`)
- Authentication: `Authorization: Bearer <jwt>` (JWT issued by `/auth/register` / `/auth/login`)
- Versioning strategy: strict path versioning (`/api/v1/...`)
- Content type: `application/json`

## Versioning Rules (Strict)
- Every public endpoint MUST be prefixed with `/api/v1`.
- Backward-incompatible contract changes MUST use a new version (`/api/v2`).
- Optional fields may be added in `v1`; required fields may not be removed or renamed.
- Internal API-to-engine contracts must be versioned explicitly in DTO/schema names.

## Standard Response Envelope
- All successful responses must use:
  - `success` (boolean)
  - `data` (object | array | null)
  - `meta` (object, optional)
- `meta` should include:
  - `requestId` (string)
  - `timestamp` (ISO-8601)
  - `version` (`v1`)

## Endpoints

Auth legend: **[JWT]** = requires `Authorization: Bearer <jwt>`; ownership is
derived from the token (`sub` claim) — resources belonging to other users
return `404`.

### App
- `GET /api/v1/health`

### Auth
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me` **[JWT]**

### Sites **[JWT, ownership-scoped]**
- `GET /api/v1/sites` — always filtered to the authenticated user
- `POST /api/v1/sites` — `userId` is taken from the JWT (body value ignored)
- `GET /api/v1/sites/:id`
- `PATCH /api/v1/sites/:id`

### Users **[JWT]**
- `GET /api/v1/users` — non-admins receive only their own record
- `POST /api/v1/users` — admin only (self-service accounts use `/auth/register`)
- `GET /api/v1/users/:id` — self or admin
- `PATCH /api/v1/users/:id` — self or admin; `role` changes admin-only

### Devices (site device profiles) **[JWT, ownership-scoped via site]**
- `GET /api/v1/devices`
- `POST /api/v1/devices`
- `GET /api/v1/devices/:id`
- `PATCH /api/v1/devices/:id`

### Tariffs **[JWT, ownership-scoped via site]**
- `GET /api/v1/tariffs`
- `POST /api/v1/tariffs`
- `GET /api/v1/tariffs/:id`
- `PATCH /api/v1/tariffs/:id`

### Solar Systems **[JWT, ownership-scoped via site]**
- `GET /api/v1/solar-systems`
- `POST /api/v1/solar-systems`
- `GET /api/v1/solar-systems/:id`
- `PATCH /api/v1/solar-systems/:id`

### Marketplace & Leads
- `POST /api/v1/marketplace/opportunities/derive` — derives marketplace opportunities from a dashboard aggregate (+ optional AI insights)
- `GET /api/v1/providers` — marketplace provider catalog
- `GET /api/v1/products` — marketplace product catalog
- `POST /api/v1/leads/intents` **[JWT]** — capture a lead intent
- `GET /api/v1/leads/intents/:siteId` **[JWT]** — list lead intents for an owned site

### Provider Integrations
- `GET /api/v1/integrations/providers/health`
- `GET /api/v1/integrations/providers/strategy`
- `POST /api/v1/integrations/providers/solar/forecast`
- `POST /api/v1/integrations/providers/solar/forecast/pvgis`
- `POST /api/v1/integrations/providers/weather/snapshot`
- `POST /api/v1/integrations/providers/weather/snapshot/openweather`
- `GET /api/v1/integrations/providers/geolocation/forward?query={address}&language={lang?}&countryCode={iso2?}&limit={n?}`
- `GET /api/v1/integrations/providers/geolocation/reverse?latitude={lat}&longitude={lon}&language={lang?}`

### Engine Integration
- `GET /api/v1/integrations/engine/health`
- `POST /api/v1/integrations/engine/calculate/v1`

### Dashboard
- `POST /api/v1/dashboard/aggregate` — stateless compute; public (client supplies all inputs; powers the anonymous demo)
- `GET /api/v1/dashboard/site/:siteId` **[JWT, ownership-scoped]** — site-backed aggregate built from persisted site/system/tariff records
- `POST /api/v1/dashboard/demo/seed` — idempotent local demo seeding (dev tool)

### Telemetry (Phase 9) **[JWT, ownership-scoped via site]**
- `POST /api/v1/telemetry/connections` — connect an inverter (`{ siteId, vendor, apiKey, externalSystemId? }`); verifies against the vendor API, encrypts the key at rest, and runs a 7-day backfill. Supported vendors: `solaredge`, `mock`.
- `GET /api/v1/telemetry/connections/:siteId` — connection status (never returns the key)
- `DELETE /api/v1/telemetry/connections/:siteId` — disconnect
- `POST /api/v1/telemetry/connections/:siteId/sync` — manual sync; returns `{ inserted }`
- `GET /api/v1/telemetry/sites/:siteId/readings?hours={1..168}` — 15-min interval production readings
- A background scheduler syncs all active connections every 15 minutes.
- The site-backed dashboard aggregate additively includes a `telemetry` block: `{ connected, vendor, status, lastReadingAt, last24hKwh, stale }`.

### AI Insights
- `POST /api/v1/ai/insights`
  - Auth: `Bearer <token>` required
  - Request body: `CanonicalAggregateAiSource` (same shape as `DashboardAggregateData` — see Dashboard Aggregate Canonical Contract)
  - Response: standard `{ success, data: AiInsightContractOutput, meta }` envelope
  - Contract version: `ai-insight-v2`
  - Fallback: deterministic when `OPENAI_API_KEY` is absent
- `POST /api/v1/ai/insights/v3`
  - Auth: `Bearer <token>` required
  - Request body: `CanonicalAiInsightRequestV3` — `{ aggregate, userData (device profile flags), apiData (tariffs, peak window, weather context) }`
  - Response: `{ success, data: AiInsightContractOutputV3, meta }`
  - Contract version: `ai-insight-v3`
  - Fallback: deterministic when `OPENAI_API_KEY` is absent

## Contract Notes
- API responses should be typed DTOs with stable keys.
- All computed endpoints MUST include in `data`:
  - `siteId`
  - `generatedAt`
  - `source` (provider/engine source metadata)
- AI insight endpoints must include deterministic metric references used for summary generation.
- Internal API-to-engine calls must use explicit schemas and timeout/retry policy.
- Geolocation endpoints must support multilingual input/output and provider-backed address normalization.
- Site-scoped computed `GET /sites/:siteId/*` endpoints are not part of the active runtime surface in v1; dashboard aggregation is the canonical external computed contract in the current phase.

## Geolocation Data Contract
- Forward geocoding (`/integrations/providers/geolocation/forward`) minimum `data` payload:
  - `query`
  - `results[]` with:
    - `formattedAddress`
    - `lat`
    - `lon`
    - `countryCode`
    - `confidence`
    - `timezone` (if available)
    - `components` (provider-normalized object)
  - `source`
  - `generatedAt`
- Reverse geocoding (`/integrations/providers/geolocation/reverse`) minimum `data` payload:
  - `lat`
  - `lon`
  - `formattedAddress`
  - `countryCode`
  - `timezone` (if available)
  - `components`
  - `source`
  - `generatedAt`

## Dashboard Aggregate Canonical Contract (Frozen for Phase 4.9)

Endpoint:
- `POST /api/v1/dashboard/aggregate`

Request (`AggregateDashboardRequestDto`):
- `siteId` (string, required)
- `latitude` (number, required)
- `longitude` (number, required)
- `systemSizeKw` (number, required)
- `lossPercent` (number, optional)
- `timezone` (string, optional)
- `generatedAt` (ISO-8601 string, optional)
- `tariff` (object, optional)
  - `currency` (string, optional)
  - `importRate` (number, optional)
  - `exportRate` (number, optional)

Success envelope:
- `success` (`true`)
- `data` (object)
- `meta`:
  - `timestamp` (ISO-8601 string)
  - `version` (`v1`)

Canonical `data` shape (camelCase for public payload):
- `siteId` (string)
- `generatedAt` (ISO-8601 string)
- `source` (`DASHBOARD_AGGREGATED_V1`)
- `forecast`:
  - `expectedDailyKwh` (number)
  - `expectedWeeklyKwh` (number)
  - `expectedMonthlyKwh` (number)
- `soiling`:
  - `score` (number)
  - `estimatedLossPercent` (number)
  - `cleaningRecommended` (boolean)
  - `recommendedCleaningDate` (ISO-8601 string | null)
  - `explanation` (string)
- `heat`:
  - `score` (number)
  - `estimatedLossPercent` (number)
  - `peakHeatWindowStart` (ISO-8601 string)
  - `peakHeatWindowEnd` (ISO-8601 string)
- `risks`:
  - `alerts` (array of `{ riskType, severity, message, expectedStart, expectedEnd }`)
- `optimization`:
  - `opportunityScore` (number)
  - `estimatedValue` (number)
  - `recommendations` (array of canonical recommendation objects in camelCase)
    - `id` (string)
    - `type` (string)
    - `title` (string)
    - `message` (string)
    - `severity` (`low` | `moderate` | `high`)
    - `priority` (number)
    - `estimatedValue` (number)
    - `validFrom` (ISO-8601 string)
    - `validUntil` (ISO-8601 string)
    - `sourceModule` (string)
- `financial`:
  - `dailyEstimatedSavings` (number)
  - `monthlyEstimatedSavings` (number)
  - `yearlyOptimizationPotential` (number)
- `benchmark`:
  - `expectedProductionKwh` (number)
  - `actualProductionKwh` (number)
  - `expectedExportKwh` (number)
  - `actualExportKwh` (number)
  - `productionDeviationPercent` (number)
  - `exportDeviationPercent` (number)
  - `performanceStatus` (`good` | `underperforming` | `overexporting`)
  - `insight` (string)
- `selfConsumption`:
  - `recommendedUsageWindow` (`{ start, end }`)
  - `selfConsumptionScore` (number)
  - `estimatedSavingsIls` (number)
  - `actions` (array of strings)
- `providers`:
  - `weather` (string)
  - `solar` (string)
  - `engine` (string)

## Error Model
- Standard error payload:
  - `success` (`false`)
  - `statusCode` (number)
  - `error` (string)
  - `message` (string | string[])
  - `timestamp` (ISO-8601)
  - `path` (string)
  - `requestId` (string)
- Common status codes:
  - `400` validation error
  - `401` unauthorized
  - `403` forbidden
  - `404` resource not found
  - `409` conflict
  - `422` semantic processing error
  - `500` internal server error
  - `503` dependency unavailable (provider/engine/AI)

## Phase 4.1 - Deterministic Engine Contract (Frozen)

This section freezes the first deterministic engine contract used by API-to-engine calls.

### Internal Engine Endpoint (v1)
- Method: `POST`
- Path (engine service): `/calculate/v1`
- Consumer: API integrations/engine layer
- Producer: Python engine deterministic pipeline

### Request Schema (`EngineCalculateV1Input`)
- `siteId` (string, required)
- `generatedAt` (ISO-8601 string, required)
- `weather` (object, required)
  - `temperature` (number, optional)
  - `cloudCover` (number, optional)
  - `windSpeed` (number, optional)
  - `precipitation` (number, optional)
- `solar` (object, required)
  - `expectedDailyKwh` (number, required)
  - `expectedWeeklyKwh` (number, required)
  - `expectedMonthlyKwh` (number, required)
- `tariff` (object, optional)
  - `currency` (string, optional)
  - `importRate` (number, optional)
  - `exportRate` (number, optional)

### Response Schema (`EngineCalculateV1Output`)
- `siteId` (string, required)
- `generatedAt` (ISO-8601 string, required)
- `source` (string, required, value: `ENGINE_V1`)
- `forecast` (object, required)
  - `expectedDailyKwh` (number)
  - `expectedWeeklyKwh` (number)
  - `expectedMonthlyKwh` (number)
- `soiling` (object, required)
  - `score` (number, 0-100)
  - `estimatedLossPercent` (number)
  - `cleaningRecommended` (boolean)
- `heat` (object, required)
  - `score` (number, 0-100)
  - `estimatedLossPercent` (number)
- `risks` (object, required)
  - `alerts` (array of `{ riskType, severity, message, expectedStart, expectedEnd }`)
- `optimization` (object, required)
  - `opportunityScore` (number, 0-100)
  - `recommendations` (array of internal engine recommendation objects)
    - `id` (string)
    - `type` (string)
    - `title` (string)
    - `message` (string)
    - `severity` (`low` | `moderate` | `high`)
    - `priority` (number)
    - `estimated_value` (number)
    - `valid_from` (ISO-8601 string)
    - `valid_until` (ISO-8601 string)
    - `source_module` (string)
- `financial` (object, required)
  - `dailyEstimatedSavings` (number)
  - `monthlyEstimatedSavings` (number)
  - `yearlyOptimizationPotential` (number)
- `benchmark` (object, required, internal snake_case)
  - `expected_production_kwh` (number)
  - `actual_production_kwh` (number)
  - `expected_export_kwh` (number)
  - `actual_export_kwh` (number)
  - `production_deviation_percent` (number)
  - `export_deviation_percent` (number)
  - `performance_status` (`good` | `underperforming` | `overexporting`)
  - `insight` (string)
- `self_consumption` (object, required, internal snake_case)
  - `recommended_usage_window` (`{ start, end }`)
  - `self_consumption_score` (number)
  - `estimated_savings_ils` (number)
  - `actions` (array of strings)

### API Normalization Rule (Phase 4.9)
- Engine output may contain internal snake_case fields (`estimated_value`, `self_consumption`, etc.).
- API public responses (`/api/v1/*`) must expose canonical camelCase fields.
- Mapping from provider/engine internal payloads to canonical API payloads is handled in API integration services.

### Determinism Rules
- Given identical input JSON, engine output JSON must be identical in values.
- No randomization, no external network calls, no clock-dependent recomputation except explicit `generatedAt` pass-through.
- Numeric outputs must be rounded to 2 decimal places.
- Missing optional weather fields must be handled with stable defaults (documented in engine implementation).
- Normalization and units must follow `NORMALIZATION_RULES.md` (UTC, C, m/s, ILS, percentage scale).

### Acceptance Fixtures (Phase 4.1 Gate)
- Add fixture set under engine tests:
  - `fixtures/engine/v1/input-baseline.json`
  - `fixtures/engine/v1/expected-baseline.json`
  - `fixtures/engine/v1/input-high-risk.json`
  - `fixtures/engine/v1/expected-high-risk.json`
- Required checks:
  - schema validation passes for all fixtures
  - output equals expected fixture payloads
  - repeat run equality (same input -> byte-equivalent normalized JSON)
