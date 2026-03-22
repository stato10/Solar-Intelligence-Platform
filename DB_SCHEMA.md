# Database Schema

## Schema Freeze (Phase 0)
- Baseline status: **Frozen for Phase 1 scaffold**
- Change policy: schema changes require explicit approval and synchronized updates to `API_CONTRACTS.md`, `ARCHITECTURE.md`, and `PROJECT_BOOTSTRAP.md`
- Rule: no destructive schema changes in `v1` without staged migration plan

## Database Engine
- PostgreSQL (primary system of record)

## Runtime Truth (Phase 4.9 Decision)
- Active runtime persistence in the current scaffold is in-memory in API domain services.
- This document defines the target PostgreSQL persistence model, not the active runtime source yet.
- Any implementation that introduces PostgreSQL as active runtime persistence must be tracked as explicit phase tasks and synchronized with `ARCHITECTURE.md`, `API_CONTRACTS.md`, and `TODO.md`.

## Naming and Type Conventions (Strict)
- Table names: `snake_case` plural.
- Column names: `snake_case`.
- Primary keys: `id` (`uuid` preferred).
- Foreign keys: `<parent>_id` with explicit FK constraints.
- Timestamps: UTC, ISO-8601 semantics at API boundary.
- Monetary values: `numeric(12,4)` (not floating point).
- Percent and score values:
  - score fields constrained to `0..100`
  - percent fields constrained to `0..100`

## Entities and Tables
### `users`
- `id`, `full_name`, `email`, `password_hash`, `role`, `created_at`, `updated_at`

### `sites`
- `id`, `user_id`, `site_name`, `address`, `latitude`, `longitude`, `timezone`, `created_at`

### `solar_systems`
- `id`, `site_id`, `system_size_kw`, `tilt`, `azimuth`, `panel_wattage`, `panel_efficiency`, `inverter_type`, `last_cleaning_date`, `created_at`, `updated_at`

### `user_devices`
- `id`, `site_id`, `has_boiler`, `has_ev`, `has_dishwasher`, `has_washing_machine`, `has_ac`, `usage_flexibility_level`

### `tariffs`
- `id`, `site_id`, `self_consumption_rate`, `export_rate`, `currency`, `effective_from`

### `weather_snapshots`
- `id`, `site_id`, `timestamp`, `temperature`, `cloud_cover`, `wind_speed`, `humidity`, `precipitation`, `weather_source`

### `air_quality_snapshots`
- `id`, `site_id`, `timestamp`, `pm10`, `pm25`, `dust`, `aod`, `aq_source`

### `forecast_runs`
- `id`, `site_id`, `run_date`, `expected_daily_kwh`, `expected_weekly_kwh`, `expected_monthly_kwh`, `peak_window_start`, `peak_window_end`, `forecast_source`

### `soiling_scores`
- `id`, `site_id`, `score`, `estimated_loss_percent`, `cleaning_recommended`, `recommended_cleaning_date`, `explanation`, `created_at`

### `heat_loss_scores`
- `id`, `site_id`, `score`, `estimated_loss_percent`, `peak_heat_window_start`, `peak_heat_window_end`, `created_at`

### `risk_alerts`
- `id`, `site_id`, `risk_type`, `severity`, `message`, `expected_start`, `expected_end`, `created_at`, `resolved_at`

### `optimization_recommendations`
- `id`, `site_id`, `recommendation_type`, `title`, `description`, `estimated_value`, `priority`, `valid_from`, `valid_until`, `created_at`

### `insight_summaries`
- `id`, `site_id`, `summary_type`, `summary_text`, `generated_at`

## Required Constraints (Freeze Baseline)
- `users.email` unique and not null.
- `users.role` check-constrained to allowed roles (`owner`, `admin` for MVP baseline).
- `sites.user_id` not null FK -> `users.id` (delete cascade or restrict based on policy).
- `solar_systems.site_id` unique FK -> `sites.id` (one system per site in MVP).
- `user_devices.site_id` unique FK -> `sites.id` (one device profile per site in MVP).
- `tariffs.site_id` not null FK -> `sites.id`.
- `soiling_scores.score`, `heat_loss_scores.score` check `between 0 and 100`.
- `estimated_loss_percent` fields check `between 0 and 100`.
- `risk_alerts.severity` constrained enum (`low`, `medium`, `high`, `critical`).
- `optimization_recommendations.priority` constrained enum (`low`, `medium`, `high`).
- All `created_at` / `updated_at` fields default to `now()` where applicable.
- `updated_at` auto-update trigger on mutable tables.

## Relationships
- `users (1) -> (N) sites`
- `sites (1) -> (1) solar_systems`
- `sites (1) -> (1) user_devices`
- `sites (1) -> (N) tariffs`
- `sites (1) -> (N) weather_snapshots`
- `sites (1) -> (N) air_quality_snapshots`
- `sites (1) -> (N) forecast_runs`
- `sites (1) -> (N) soiling_scores`
- `sites (1) -> (N) heat_loss_scores`
- `sites (1) -> (N) risk_alerts`
- `sites (1) -> (N) optimization_recommendations`
- `sites (1) -> (N) insight_summaries`

## Indexing Strategy
- Unique index on `users.email`.
- FK indexes on all `*_id` columns (`user_id`, `site_id`).
- Time-series indexes:
  - `weather_snapshots(site_id, timestamp desc)`
  - `air_quality_snapshots(site_id, timestamp desc)`
  - `forecast_runs(site_id, run_date desc)`
- Query optimization indexes:
  - `risk_alerts(site_id, severity, expected_start)`
  - `optimization_recommendations(site_id, priority, valid_from)`
  - `insight_summaries(site_id, generated_at desc)`
  - `soiling_scores(site_id, created_at desc)`
  - `heat_loss_scores(site_id, created_at desc)`

## Seed Data Baseline (Phase 1 Ready)
- Create one demo user with one site and one solar system.
- Seed one device profile and one tariff row for demo site.
- Seed minimum 7 days of weather and air quality snapshots for local demos.
- Seed one forecast run, soiling score, heat score, risk alert list, and recommendation sample.

## Migration Notes
- Use migration files only (no schema drift by manual DB edits).
- Add backward-compatible migrations first; run destructive changes in controlled steps.
- Seed local dev with baseline user/site/system/sample snapshots.
- Version DB changes alongside API/engine contract updates.
- Migration checklist:
  - apply migration on clean DB
  - apply migration on non-empty DB
  - rollback path verified in staging
