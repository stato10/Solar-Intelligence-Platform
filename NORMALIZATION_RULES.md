# Normalization Rules

This document freezes canonical normalization and units rules for deterministic engine/API behavior.

## Time
- Canonical format: ISO-8601 UTC timestamps.
- Input fields that represent timestamps must be parseable ISO strings.
- Engine calculations must derive deterministic dates from provided `generatedAt` only.

## Temperature
- Canonical unit: Celsius (`C`).
- Weather providers returning Kelvin/Fahrenheit must be normalized before engine usage.

## Wind
- Canonical unit: meters per second (`m/s`).
- Provider adapters must normalize other wind units before contract output.

## Money
- Canonical display currency for MVP financial outputs: `ILS`.
- If a tariff currency is omitted, API/engine defaults apply deterministically.
- Numeric monetary values are rounded to 2 decimal places.

## Percentages
- Percentage-based values use `0..100` scale (not fractional `0..1`), unless explicitly documented.
- Probability-like upstream fields in `0..1` must be converted before inclusion in engine-facing contracts.

## Numeric Precision
- Engine output numeric values are rounded to 2 decimal places.
- Deterministic fixture checks compare normalized JSON payloads.
