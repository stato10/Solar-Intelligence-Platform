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
### Auth
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`

### Sites
- `POST /api/v1/sites`
- `GET /api/v1/sites/:id`
- `PUT /api/v1/sites/:id`

### Geolocation
- `GET /api/v1/geolocation/forward?q={addressQuery}&language={lang?}&countrycode={iso2?}&limit={n?}`
- `GET /api/v1/geolocation/reverse?lat={lat}&lon={lon}&language={lang?}`

### Solar System
- `POST /api/v1/sites/:siteId/system`
- `GET /api/v1/sites/:siteId/system`
- `PUT /api/v1/sites/:siteId/system`

### Forecast
- `GET /api/v1/sites/:siteId/forecast/today`
- `GET /api/v1/sites/:siteId/forecast/week`
- `GET /api/v1/sites/:siteId/forecast/month`

### Soiling
- `GET /api/v1/sites/:siteId/soiling`

### Heat
- `GET /api/v1/sites/:siteId/heat`

### Risks
- `GET /api/v1/sites/:siteId/risks`

### Optimization
- `GET /api/v1/sites/:siteId/opportunities`

### Financial
- `GET /api/v1/sites/:siteId/financial-summary`

### Insights
- `GET /api/v1/sites/:siteId/insights/daily`
- `GET /api/v1/sites/:siteId/insights/weekly`

## Contract Notes
- API responses should be typed DTOs with stable keys.
- All computed endpoints MUST include in `data`:
  - `siteId`
  - `generatedAt`
  - `source` (provider/engine source metadata)
- AI insight endpoints must include deterministic metric references used for summary generation.
- Internal API-to-engine calls must use explicit schemas and timeout/retry policy.
- Geolocation endpoints must support multilingual input/output and provider-backed address normalization.

## Geolocation Data Contract
- Forward geocoding (`/geolocation/forward`) minimum `data` payload:
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
- Reverse geocoding (`/geolocation/reverse`) minimum `data` payload:
  - `lat`
  - `lon`
  - `formattedAddress`
  - `countryCode`
  - `timezone` (if available)
  - `components`
  - `source`
  - `generatedAt`

## Computed Endpoint Minimum Data Contract
- Forecast endpoints:
  - `siteId`, `generatedAt`, `source`
  - `expectedDailyKwh`, `expectedWeeklyKwh`, `expectedMonthlyKwh`
  - `peakWindowStart`, `peakWindowEnd`
- Soiling endpoint:
  - `siteId`, `generatedAt`, `source`
  - `score`, `estimatedLossPercent`, `cleaningRecommended`, `recommendedCleaningDate`, `explanation`
- Heat endpoint:
  - `siteId`, `generatedAt`, `source`
  - `score`, `estimatedLossPercent`, `peakHeatWindowStart`, `peakHeatWindowEnd`
- Risks endpoint:
  - `siteId`, `generatedAt`, `source`
  - `alerts` (array of `{ riskType, severity, message, expectedStart, expectedEnd }`)
- Optimization endpoint:
  - `siteId`, `generatedAt`, `source`
  - `recommendations`, `opportunityScore`, `estimatedValue`
- Financial endpoint:
  - `siteId`, `generatedAt`, `source`
  - `dailyEstimatedSavings`, `monthlyEstimatedSavings`, `yearlyOptimizationPotential`
- Insights endpoints:
  - `siteId`, `generatedAt`
  - `summaryType`, `summaryText`, `recommendations`
  - `deterministicReferences` (IDs/keys to forecast/score/financial metrics used)

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
  - `recommendations` (array of canonical recommendation objects)
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
