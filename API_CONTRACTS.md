# API Contracts

## Contract Freeze (Phase 0)
- Baseline status: **Frozen for Phase 1 scaffold**
- Change policy: contract changes require explicit approval and synchronized updates to `DB_SCHEMA.md`, `ARCHITECTURE.md`, and `PROJECT_BOOTSTRAP.md`
- Rule: no breaking response shape changes within the same API version

## Base Information
- Base URL (local): `http://localhost:3000/api/v1`
- Authentication: `Authorization: Bearer <jwt>`
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
### App
- `GET /api/v1/health`

### Auth
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`

### Sites
- `GET /api/v1/sites`
- `POST /api/v1/sites`
- `GET /api/v1/sites/:id`
- `PATCH /api/v1/sites/:id`

### Users
- `GET /api/v1/users`
- `POST /api/v1/users`
- `GET /api/v1/users/:id`
- `PATCH /api/v1/users/:id`

### Devices
- `GET /api/v1/devices`
- `POST /api/v1/devices`
- `GET /api/v1/devices/:id`
- `PATCH /api/v1/devices/:id`

### Tariffs
- `GET /api/v1/tariffs`
- `POST /api/v1/tariffs`
- `GET /api/v1/tariffs/:id`
- `PATCH /api/v1/tariffs/:id`

### Solar Systems
- `GET /api/v1/solar-systems`
- `POST /api/v1/solar-systems`
- `GET /api/v1/solar-systems/:id`
- `PATCH /api/v1/solar-systems/:id`

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
- `POST /api/v1/dashboard/aggregate`
- `POST /api/v1/dashboard/demo/seed`

### AI Insights
- `POST /api/v1/ai/insights`
  - Auth: `Bearer <token>` required
  - Request body: `CanonicalAggregateAiSource` (same shape as `DashboardAggregateData` — see Dashboard Aggregate Canonical Contract)
  - Response: standard `{ success, data: AiInsightContractOutput, meta }` envelope
  - Contract version: `ai-insight-v2`
  - Fallback: deterministic when `OPENAI_API_KEY` is absent; OpenAI wiring deferred

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
