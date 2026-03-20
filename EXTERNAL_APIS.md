# External APIs

## Provider 1: PVGIS (Solar)

This document defines the integration contract for PVGIS in this project.

## Base URLs and Version Policy

- Preferred version (default): `https://re.jrc.ec.europa.eu/api/v5_3`
- Fallback version: `https://re.jrc.ec.europa.eu/api/v5_2`
- Do not use legacy unversioned endpoints for new integrations.

## Protocol Rules

- HTTP method: `GET` only (`405` for other methods).
- Output format: use `outputformat=json`.
- Browser/CORS constraint: do not call PVGIS directly from frontend (no AJAX/CORS support).
- Integration must run server-to-server from API backend only.

## Rate and Load Limits

- Rate limit: `30 requests/second per IP`, returns `429` when exceeded.
- Overload behavior: may return `529` when computation queues are saturated.
- Retry strategy:
  - `429`: exponential backoff with jitter, max 3 retries.
  - `529`: retry after delay (500-2000 ms), max 3 retries.
  - After retry budget exhausted, return internal provider-unavailable response.

## PVGIS Tools Relevant for MVP

- `PVcalc`: yearly/monthly PV production estimates for configured system.
- `seriescalc`: hourly radiation/PV output data for aggregation pipelines.
- `MRcalc`: monthly radiation series if needed for baseline fallback logic.
- Optional later:
  - `DRcalc` (daily radiation),
  - `tmy` (typical meteorological year),
  - `printhorizon` (horizon profile).

## MVP Request Mapping (PVcalc)

Endpoint pattern:

`/PVcalc?lat={lat}&lon={lon}&peakpower={kw}&loss={loss}&outputformat=json`

Required project-side inputs:

- `lat` <- site latitude
- `lon` <- site longitude
- `peakpower` <- system size in kW
- `loss` <- configured system loss percent

Recommended optional inputs:

- `raddatabase` (`PVGIS-SARAH3`, `PVGIS-NSRDB`, `PVGIS-ERA5`)
- `pvtechchoice` (`crystSi` by default)
- `mountingplace` (`free` by default)
- `fixed` / `angle` / `aspect` based on system profile

## MVP Request Mapping (seriescalc)

Endpoint pattern:

`/seriescalc?lat={lat}&lon={lon}&outputformat=json&startyear={y1}&endyear={y2}&pvcalculation=1&peakpower={kw}&loss={loss}`

Use `seriescalc` for hourly derivations when daily/weekly/monthly aggregation requires higher resolution.

## Response Fields to Parse (Internal Mapping)

At minimum, parse and map:

- Annual and period yield values (kWh)
- Radiation/irradiance totals where available
- Metadata:
  - `source = "PVGIS"`
  - API version used (`v5_3` or `v5_2`)
  - request timestamp

Internal normalized forecast payload must include:

- `siteId`
- `generatedAt`
- `source`
- `expectedDailyKwh`
- `expectedWeeklyKwh`
- `expectedMonthlyKwh`
- `peakWindowStart`
- `peakWindowEnd`

## Error Handling Contract

- Input validation errors from PVGIS -> map to `422` provider semantic error.
- Connectivity/timeout/overload -> map to `503` dependency unavailable.
- Include provider diagnostics in logs:
  - full provider URL (without secrets),
  - status code,
  - response body snippet,
  - retry count.

## Minimal PVGIS Examples

- PVcalc minimum:
  - `https://re.jrc.ec.europa.eu/api/v5_3/PVcalc?lat=45&lon=8&peakpower=1&loss=14&outputformat=json`
- MRcalc minimum:
  - `https://re.jrc.ec.europa.eu/api/v5_3/MRcalc?lat=45&lon=8&horirrad=1&outputformat=json`
- SHScalc minimum:
  - `https://re.jrc.ec.europa.eu/api/v5_3/SHScalc?lat=45&lon=8&peakpower=10&batterysize=50&consumptionday=200&cutoff=40&outputformat=json`

## Implementation Notes

- Keep provider adapter isolated behind interface (do not leak PVGIS-specific fields to domain logic).
- Standardize numeric units before storing/calculating downstream.
- Keep a provider fallback strategy ready (Solcast/Open-Meteo-dependent logic in later phases).

---

## Provider 2: Open-Meteo (Weather)

This section defines the integration contract for Open-Meteo weather forecast data.

## Base URL and Endpoint

- Base URL: `https://api.open-meteo.com`
- Main endpoint: `/v1/forecast`
- Method: `GET`
- Output: JSON

## MVP Request Contract

Required query parameters:

- `latitude` <- site latitude
- `longitude` <- site longitude
- `timezone=auto`

Hourly variables (MVP baseline):

- `temperature_2m`
- `cloud_cover`
- `wind_speed_10m`
- `precipitation`
- `direct_normal_irradiance`
- `shortwave_radiation`

Daily variables (MVP baseline):

- `temperature_2m_max`
- `temperature_2m_min`
- `precipitation_sum`
- `wind_speed_10m_max`
- `shortwave_radiation_sum`

Forecast window:

- `forecast_days=7` for weekly pipeline
- Optional `forecast_days=16` for extended projection (post-MVP)

Example URL:

`https://api.open-meteo.com/v1/forecast?latitude=45&longitude=8&timezone=auto&hourly=temperature_2m,cloud_cover,wind_speed_10m,precipitation,direct_normal_irradiance,shortwave_radiation&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max,shortwave_radiation_sum&forecast_days=7`

## Response Mapping to Internal Weather Snapshot

Map hourly output to internal weather fields:

- `temperature` <- `hourly.temperature_2m`
- `cloud_cover` <- `hourly.cloud_cover`
- `wind_speed` <- `hourly.wind_speed_10m`
- `precipitation` <- `hourly.precipitation`
- `irradiance_proxy` <- `hourly.shortwave_radiation` (or DNI when needed)

Map metadata:

- `source = "OPEN_METEO"`
- `generatedAt` <- current processing timestamp
- preserve `timezone`, `utc_offset_seconds`, and model metadata when available

## Error Handling Contract

- Invalid/missing params -> provider `400`, map to internal `422`.
- Provider unavailable/timeouts -> internal `503`.
- Retry policy:
  - up to 3 retries with exponential backoff + jitter.
  - no retries on malformed request errors (`400`).

## Open-Meteo Notes for Integration

- Supports up to 16-day forecast (`forecast_days`).
- Rich hourly and daily variables available for weather + radiation.
- For stable integration, always request explicit variable lists (do not rely on defaults).
- Keep query lists centralized in provider adapter constants to avoid drift.

---

## Provider 3: OpenWeather One Call 3.0 (Weather + Alerts)

This section defines the integration contract for OpenWeather One Call 3.0.

## Base URL and Endpoint

- Base URL: `https://api.openweathermap.org`
- Main endpoint: `/data/3.0/onecall`
- Method: `GET`
- Authentication: required API key via `appid` query parameter
- Note: One Call 3.0 requires the dedicated One Call subscription plan
- Update cadence: model is updated roughly every 10 minutes

## MVP Request Contract

Required query parameters:

- `lat` <- site latitude
- `lon` <- site longitude
- `appid` <- OpenWeather API key

Recommended query parameters:

- `units=metric`
- `exclude=minutely` (keep payload lean for MVP)
- Optional language: `lang=en`

Example:

`https://api.openweathermap.org/data/3.0/onecall?lat=33.44&lon=-94.04&exclude=minutely&units=metric&appid={API_KEY}`

Recommended MVP include set:

- Keep `current`, `hourly`, `daily`, `alerts`
- Exclude only `minutely` unless 1-minute forecast is explicitly needed

## Alert-only Request Contract

To fetch national weather alerts only:

`https://api.openweathermap.org/data/3.0/onecall?lat={lat}&lon={lon}&exclude=current,minutely,hourly,daily&appid={API_KEY}`

Use this mode when only severe-event alerts are required.

## One Call 3.0 Endpoint Family (for phased adoption)

- Current + forecast + alerts:
  - `GET /data/3.0/onecall`
- Timestamp weather:
  - `GET /data/3.0/onecall/timemachine`
- Daily aggregation:
  - `GET /data/3.0/onecall/day_summary`
- Weather overview:
  - `GET /data/3.0/onecall/overview`
- AI Weather Assistant:
  - `POST /assistant/session`
  - `POST /assistant/session/{session_id}`

MVP integration recommendation:

- Phase 3:
  - `onecall` (weather + alerts)
- Phase 5+ (optional):
  - `timemachine`, `day_summary`, `overview`
- Phase 7 (optional enhancement):
  - AI Assistant endpoints, only as non-critical enrichment

## Response Mapping to Internal Models

Map from OpenWeather response:

- Current/hourly weather:
  - `temp`, `humidity`, `clouds`, `wind_speed`, `wind_deg`, `rain.1h`, `snow.1h`
- Daily weather:
  - `daily.temp.max`, `daily.temp.min`, `daily.rain`, `daily.snow`, `daily.wind_speed`
- Alerts:
  - `alerts[].event` -> `riskType`
  - `alerts[].description` -> `message`
  - `alerts[].start` -> `expectedStart`
  - `alerts[].end` -> `expectedEnd`
  - `alerts[].sender_name` -> `sourceProvider`

Normalize output to internal contract with:

- `siteId`
- `generatedAt`
- `source = "OPENWEATHER_ONECALL_3_0"`

## Error Handling Contract

OpenWeather documented errors:

- `400` bad request (invalid/missing params)
- `401` unauthorized (invalid key or missing entitlement)
- `404` data not found
- `429` quota/rate exceeded
- `5xx` provider internal error

Internal mapping policy:

- `400` -> internal `422`
- `401` -> internal `503` (configuration/dependency issue)
- `404` -> internal `404` (location/data unavailable)
- `429`, `5xx` -> internal `503` with retry policy

Retry policy:

- retry only for `429` and `5xx`
- exponential backoff + jitter
- max 3 retries

Provider error payload shape reference:

- `cod`
- `message`
- `parameters` (optional list of invalid params)

Do not pass provider error payload directly to frontend; map it to internal error model.

## AI Weather Assistant Contract (Optional, Non-Critical)

Session start:

- Method: `POST`
- URL: `https://api.openweathermap.org/assistant/session`
- Headers:
  - `Content-Type: application/json`
  - `X-Api-Key: <OPENWEATHER_API_KEY>`
- Body:
  - `{ "prompt": "What’s weather like in London?" }`

Session resume:

- Method: `POST`
- URL: `https://api.openweathermap.org/assistant/session/{session_id}`
- Headers:
  - `Content-Type: application/json`
  - `X-Api-Key: <OPENWEATHER_API_KEY>`
- Body:
  - `{ "prompt": "Do I need a hat?" }`

Assistant response fields to consume:

- `answer` (human-readable response)
- `data` (weather source payload used for answer)
- `session_id` (conversation continuity key)

Project rule:

- Assistant output must not override deterministic internal calculations.
- Treat assistant output as optional explanation/enrichment only.

## Operational Notes

- Treat OpenWeather as additional provider for weather and alerts.
- Keep provider adapters interchangeable behind interface.
- Do not expose provider-specific payload directly to frontend.

---

## Air Quality Abstraction Contract (Phase 4.3a)

This phase freezes the platform-level contract for air quality inputs before selecting a production provider.

Canonical output fields:

- `pm10` (number, optional)
- `pm25` (number, optional)
- `dustIndex` (number, optional)

Contract location:

- `apps/api/src/integrations/providers/contracts/air-quality-provider.interface.ts`

Rule:

- Engine and API integrations must consume this abstraction contract, not provider-specific payload shapes.

---

## Provider 4: OpenCage Geocoding (Global Address Intelligence)

This section defines the integration contract for OpenCage geocoding and reverse geocoding.

## Why We Add OpenCage

- Enables multilingual address handling across global regions.
- Supports both directions needed by the platform:
  - Address/placename -> coordinates (`lat`, `lon`)
  - Coordinates (`lat`, `lon`) -> normalized human-readable address
- Useful for robust site onboarding and location validation before solar/weather calculations.

## Base URL and Endpoint

- Base URL: `https://api.opencagedata.com`
- Main endpoint: `/geocode/v1/json`
- Method: `GET` only
- Authentication: required API key via `key` query parameter

## Core Request Contract

Required query parameters:

- `q` <- input query
  - forward geocoding: free-text address/placename
  - reverse geocoding: `lat,lon` decimal pair
- `key` <- OpenCage API key

Recommended query parameters:

- `language` (IETF language tag or `native`)
- `limit` (forward geocoding result cap; default project-side: 5)
- `no_annotations=1` for lean responses unless annotations are needed
- `no_record=1` for privacy-sensitive requests
- `countrycode` for scope narrowing when applicable

## Forward Geocoding (Address -> Coordinates)

Example:

`https://api.opencagedata.com/geocode/v1/json?q=Tel+Aviv%2C+Israel&key={API_KEY}&language=he&limit=5&no_annotations=1`

Use cases in this project:

- Parse user-entered addresses in multiple languages.
- Normalize address format for storage.
- Resolve ambiguous place names with ranked results.

## Reverse Geocoding (Coordinates -> Address)

Example:

`https://api.opencagedata.com/geocode/v1/json?q=32.0853,34.7818&key={API_KEY}&language=native&no_annotations=1`

Use cases in this project:

- Convert GPS coordinates to display-friendly address.
- Pre-fill site location details from map pin selection.
- Validate location metadata before external weather/solar provider calls.

## Response Mapping to Internal Geolocation Model

Map from OpenCage response:

- `results[].formatted` -> `formattedAddress`
- `results[].geometry.lat` -> `lat`
- `results[].geometry.lng` -> `lon`
- `results[].components.country_code` -> `countryCode`
- `results[].confidence` -> `confidence`
- `results[].annotations.timezone.name` -> `timezone` (when annotations enabled)
- `results[].components` -> `components`

Normalize output to internal contract with:

- `source = "OPENCAGE"`
- `generatedAt`
- project-side stable keys independent from provider response shape

## Error Handling Contract

Documented provider response codes include:

- `200` success (may return zero results)
- `400` invalid request
- `401` missing/invalid API key
- `402` quota exceeded
- `403` disabled/forbidden key usage
- `405` method not allowed
- `408` timeout
- `410` request too long
- `426` TLS upgrade required
- `429` rate-limited
- `503` provider internal error

Internal mapping policy:

- `400` -> internal `422`
- `401`, `402`, `403` -> internal `503` (configuration/subscription/dependency issue)
- `429`, `503`, `408` -> internal `503` with retry policy
- zero results (`200` with empty array) -> internal `404` semantic location not found

Retry policy:

- retry only for `429`, `503`, and transient timeout paths
- exponential backoff + jitter
- max 3 retries

## Integration Notes

- Reverse geocoding returns at most one result; forward geocoding may return multiple ranked results.
- Use `countrycode` and/or bounds biasing where possible to improve precision in ambiguous queries.
- Keep OpenCage adapter isolated behind provider interface (no provider-specific leakage to domain/business logic).
- Cache normalized geocoding results to reduce request volume on repeated user inputs.
