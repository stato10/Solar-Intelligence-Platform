# Recommendation Schema

## Goal
Define a canonical recommendation payload used across engine, API aggregation, and frontend rendering.

## Canonical Fields

```json
{
  "id": "rec-heat-001",
  "type": "maintenance",
  "title": "Improve thermal operating window",
  "message": "High thermal loss detected; adjust ventilation and operating schedule.",
  "severity": "moderate",
  "priority": 2,
  "estimatedValue": 125.4,
  "validFrom": "2026-03-20T00:00:00Z",
  "validUntil": "2026-03-27T00:00:00Z",
  "sourceModule": "heat"
}
```

## Field Definitions

- `id` (string, required): globally unique recommendation identifier.
- `type` (string, required): category (`maintenance`, `optimization`, `risk`, `financial`, `operational`).
- `title` (string, required): short human-readable action title.
- `message` (string, required): full context and what action to take.
- `severity` (enum, required): `low | moderate | high`.
- `priority` (integer, required): `1` highest urgency -> `5` lowest urgency.
- `estimatedValue` (number, optional): estimated value impact in configured currency.
- `validFrom` (ISO-8601 string, required): recommendation start timestamp.
- `validUntil` (ISO-8601 string, required): recommendation expiry timestamp.
- `sourceModule` (string, required): originating module (`soiling`, `heat`, `risks`, `opportunity`, `financial`, `ai_fallback`).

## Validation Rules

- `priority` must be integer in range `1..5`.
- `validUntil` must be greater than `validFrom`.
- `severity` must map to priority bands:
  - `high` -> priority `1..2`
  - `moderate` -> priority `2..4`
  - `low` -> priority `3..5`
- `estimated_value` must be non-negative when present.
- `id` must be stable for the same deterministic trigger in the same period window.

## API Envelope Usage

Recommended usage under endpoint payloads:

```json
{
  "recommendations": [
    {
      "id": "rec-soiling-20260320-1",
      "type": "maintenance",
      "title": "Schedule cleaning",
      "message": "Moderate soiling risk detected.",
      "severity": "moderate",
      "priority": 2,
      "estimatedValue": 98.3,
      "validFrom": "2026-03-20T00:00:00Z",
      "validUntil": "2026-03-27T00:00:00Z",
      "sourceModule": "soiling"
    }
  ]
}
```

## Determinism Requirement
- Given identical deterministic inputs, recommendation list ordering and field values must remain stable.

## Internal Mapping Note
- Engine internal payloads may still emit snake_case recommendation fields.
- API integration layers must normalize them to this canonical camelCase schema before returning public responses.
