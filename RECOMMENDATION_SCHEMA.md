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
  "estimated_value": 125.4,
  "valid_from": "2026-03-20T00:00:00Z",
  "valid_until": "2026-03-27T00:00:00Z",
  "source_module": "heat"
}
```

## Field Definitions

- `id` (string, required): globally unique recommendation identifier.
- `type` (string, required): category (`maintenance`, `optimization`, `risk`, `financial`, `operational`).
- `title` (string, required): short human-readable action title.
- `message` (string, required): full context and what action to take.
- `severity` (enum, required): `low | moderate | high`.
- `priority` (integer, required): `1` highest urgency -> `5` lowest urgency.
- `estimated_value` (number, optional): estimated value impact in configured currency.
- `valid_from` (ISO-8601 string, required): recommendation start timestamp.
- `valid_until` (ISO-8601 string, required): recommendation expiry timestamp.
- `source_module` (string, required): originating module (`soiling`, `heat`, `risks`, `opportunity`, `financial`, `ai_fallback`).

## Validation Rules

- `priority` must be integer in range `1..5`.
- `valid_until` must be greater than `valid_from`.
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
      "estimated_value": 98.3,
      "valid_from": "2026-03-20T00:00:00Z",
      "valid_until": "2026-03-27T00:00:00Z",
      "source_module": "soiling"
    }
  ]
}
```

## Determinism Requirement
- Given identical deterministic inputs, recommendation list ordering and field values must remain stable.
