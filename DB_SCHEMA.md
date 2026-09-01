# Database Schema

## Schema Freeze (Phase 0)
- Baseline status: **Frozen for Phase 1 scaffold**
- Change policy: schema changes require explicit approval and synchronized updates to `API_CONTRACTS.md`, `ARCHITECTURE.md`, and `PROJECT_BOOTSTRAP.md`
- Rule: no destructive schema changes in `v1` without staged migration plan

## Database Engine
- PostgreSQL (primary system of record)

## Runtime Truth (Current)
- Active runtime persistence is **PostgreSQL via Prisma**.
- The live schema source of truth is `apps/api/prisma/schema.prisma` (with migrations under `apps/api/prisma/migrations/`).
- This document summarizes the live model plus not-yet-implemented target tables; where they differ, the Prisma schema wins.

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

## Entities and Tables (Live — Prisma models)

Prisma models use camelCase field names and PascalCase model names; the
canonical definitions live in `apps/api/prisma/schema.prisma`.

### `User` (unified auth + domain user)
- `id`, `email` (unique), `passwordHash` (bcrypt), `fullName`, `role` (`owner` | `admin`), `createdAt`, `updatedAt`

### `Site`
- `id`, `userId` (FK → User, cascade), `siteName`, `address`, `latitude`, `longitude`, `timezone`, `createdAt`, `updatedAt`

### `SolarSystem`
- `id`, `siteId` (FK → Site, cascade), `systemSizeKw`, `tilt`, `azimuth`, `panelWattage`, `panelEfficiency` (percent 0–100), `panelCount?`, `panelType?`, `inverterType?`, `installationDate?`, `lastCleaningDate`, `isActive`, `createdAt`, `updatedAt`

### `SiteDeviceProfile` (one per site)
- `id`, `siteId` (unique FK → Site), `hasBoiler`, `hasEv`, `hasBattery`, `hasDishwasher`, `hasWashingMachine`, `hasAc`, `usageFlexibilityLevel` (1–5), `flexibleLoadShiftingPossible`, `openToUpgrades`, `homeOccupancyProfile` (`mostly_day` | `mostly_evening` | `mixed`), `createdAt`, `updatedAt`

### `Tariff`
- `id`, `siteId` (FK → Site, cascade), `selfConsumptionRate`, `exportRate`, `currency`, `isActive`, `effectiveFrom`, `effectiveUntil?`, `createdAt`, `updatedAt`

### Marketplace: `Provider`, `Product`, `LeadIntent`, `RecommendationLink`
- `Provider`: `id`, `name`, `slug` (unique), `category` (cleaning/maintenance/installation/battery/ev_charging/automation), `description?`, `serviceAreas[]`, contact fields, `isActive`.
- `Product`: `id`, `name`, `slug` (unique), `category` (battery/ev_charger/switcher/cooling/automatic_cleaning), `brand?`, price range, `affiliateUrl?`, `isActive`.
- `LeadIntent`: `id`, `siteId`, `userId`, `sourceType` (…_recommendation), `sourceReference?`, `title`, `message?`, `status` (new_lead/submitted/contacted/closed/cancelled), `estimatedValue?`, `metadataJson?`.
- `RecommendationLink`: `id`, `triggerType`, `providerId?`, `productId?`, `priority`, `countryCode?`, `isActive`.

### Snapshot & summary cache: `SiteCurrentSnapshot`, `SiteDailySummary`, `SiteMonthlySummary`
- `SiteCurrentSnapshot`: one per site — `fetchedAt`, `weatherJson?`, `solarJson?`, `aggregateJson?`, `aiContextJson?`.
- `SiteDailySummary`: unique per `(siteId, date)` — `expectedKwh`, `actualKwh`, `deviationPercent`, `soilingScore?`, `heatScore?`, `dailySavings?`.
- `SiteMonthlySummary`: unique per `(siteId, month)` — `totalExpected`, `totalActual`, `totalSavings?`, `avgDeviation`.

### Telemetry (Phase 9): `InverterConnection`, `TelemetryReading`
- `InverterConnection`: one per site (`siteId` unique FK → Site, cascade) — `vendor` (`solaredge` | `enphase` | `fronius` | `sma` | `mock`), `externalSystemId?`, `apiKeyEncrypted` (AES-256-GCM, never returned by the API), `status` (`pending` | `active` | `error` | `disconnected`), `lastSyncAt?`, `lastError?`.
- `TelemetryReading`: unique per `(siteId, timestamp)` — `productionWh` for the interval, `intervalMinutes` (default 15), `source` vendor enum. Indexed on `(siteId, timestamp DESC)`.
- Migration: `20260901_telemetry_foundation`.

## Target Tables (Not Yet Implemented)

These remain design targets for future telemetry/history phases and do not
exist in the live schema yet:

- `weather_snapshots` — per-site weather time series.
- `air_quality_snapshots` — per-site air-quality time series (pm10/pm25/dust/aod).
- `forecast_runs` — historical forecast run log.
- `soiling_scores`, `heat_loss_scores` — score history tables.
- `risk_alerts`, `optimization_recommendations`, `insight_summaries` — currently derived on demand and cached in `SiteCurrentSnapshot.aggregateJson` rather than persisted as rows.

## Required Constraints (Live)
- `User.email` unique and not null.
- `User.role` enum-constrained (`owner`, `admin`).
- `Site.userId` not null FK → `User.id` with `onDelete: Cascade`.
- `SiteDeviceProfile.siteId` unique FK → `Site.id` (one device profile per site).
- `Tariff.siteId` not null FK → `Site.id` with `onDelete: Cascade`.
- `Provider.slug` / `Product.slug` unique.
- `SiteCurrentSnapshot.siteId` unique; `SiteDailySummary` unique on `(siteId, date)`; `SiteMonthlySummary` unique on `(siteId, month)`.
- All `createdAt` default `now()`; `updatedAt` maintained by Prisma `@updatedAt`.
- Note: one-solar-system-per-site is enforced at the service layer (Conflict on duplicate create), not by a DB unique constraint.

## Relationships (Live)
- `User (1) -> (N) Site`
- `Site (1) -> (N) SolarSystem` (service layer enforces 1 active per site)
- `Site (1) -> (1) SiteDeviceProfile`
- `Site (1) -> (N) Tariff`
- `Site (1) -> (1) SiteCurrentSnapshot`
- `Site (1) -> (N) SiteDailySummary`
- `Site (1) -> (N) SiteMonthlySummary`
- `LeadIntent` references `siteId`/`userId` by value (indexed, no FK) to survive demo-site flows.
- `RecommendationLink (N) -> (0..1) Provider / Product`

## Indexing Strategy (Live)
- Unique index on `User.email`, `Provider.slug`, `Product.slug`.
- FK/value indexes: `Site.userId`, `SolarSystem.siteId`, `SiteDeviceProfile.siteId`, `Tariff.siteId`, `LeadIntent.siteId`, `LeadIntent.userId`, `LeadIntent.status`, `RecommendationLink.triggerType`, snapshot/summary `siteId` indexes.

## Seed Data Baseline
- `POST /api/v1/dashboard/demo/seed` idempotently creates the demo owner, site, solar system, and tariff, then computes a dashboard aggregate (see `apps/api/src/dashboard/dashboard-demo-seed.service.ts`).

## Migration Notes
- Use migration files only (no schema drift by manual DB edits).
- Add backward-compatible migrations first; run destructive changes in controlled steps.
- Seed local dev with baseline user/site/system/sample snapshots.
- Version DB changes alongside API/engine contract updates.
- Migration checklist:
  - apply migration on clean DB
  - apply migration on non-empty DB
  - rollback path verified in staging
