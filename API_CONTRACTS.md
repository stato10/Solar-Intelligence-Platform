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
