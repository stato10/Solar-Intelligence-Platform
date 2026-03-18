# Database Schema

## Database Engine
- PostgreSQL (primary system of record)

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

## Migration Notes
- Use migration files only (no schema drift by manual DB edits).
- Add backward-compatible migrations first; run destructive changes in controlled steps.
- Seed local dev with baseline user/site/system/sample snapshots.
- Version DB changes alongside API/engine contract updates.
