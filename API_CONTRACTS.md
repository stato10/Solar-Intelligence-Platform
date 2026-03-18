# API Contracts

## Base Information
- Base URL (local): `http://localhost:3000/api`
- Authentication: `Authorization: Bearer <jwt>`
- Versioning strategy: `v1` namespace via route prefix or module versioning
- Content type: `application/json`

## Endpoints
### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

### Sites
- `POST /api/sites`
- `GET /api/sites/:id`
- `PUT /api/sites/:id`

### Solar System
- `POST /api/sites/:siteId/system`
- `GET /api/sites/:siteId/system`
- `PUT /api/sites/:siteId/system`

### Forecast
- `GET /api/sites/:siteId/forecast/today`
- `GET /api/sites/:siteId/forecast/week`
- `GET /api/sites/:siteId/forecast/month`

### Soiling
- `GET /api/sites/:siteId/soiling`

### Heat
- `GET /api/sites/:siteId/heat`

### Risks
- `GET /api/sites/:siteId/risks`

### Optimization
- `GET /api/sites/:siteId/opportunities`

### Financial
- `GET /api/sites/:siteId/financial-summary`

### Insights
- `GET /api/sites/:siteId/insights/daily`
- `GET /api/sites/:siteId/insights/weekly`

## Contract Notes
- API responses should be typed DTOs with stable keys.
- All computed endpoints should include:
  - `siteId`
  - `generatedAt`
  - `source` metadata where relevant
- AI insight endpoints must include deterministic metric references used for summary generation.
- Internal API-to-engine calls must use explicit schemas and timeout/retry policy.

## Error Model
- Standard error payload:
  - `statusCode` (number)
  - `error` (string)
  - `message` (string | string[])
  - `timestamp` (ISO-8601)
  - `path` (string)
- Common status codes:
  - `400` validation error
  - `401` unauthorized
  - `403` forbidden
  - `404` resource not found
  - `409` conflict
  - `422` semantic processing error
  - `500` internal server error
  - `503` dependency unavailable (provider/engine/AI)
