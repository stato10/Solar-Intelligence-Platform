import { Injectable } from "@nestjs/common";

export type SnapshotType =
  | "weather_current"   // 15 minutes — dashboard real-time
  | "weather_hourly"    // 1 hour — hourly forecast refresh
  | "solar_baseline"    // 30 days — PVGIS long-term profile
  | "daily_summary"     // 24 hours — end-of-day processing
  | "air_quality";      // 1 hour — PM10/PM2.5 dust data

/** TTL durations in milliseconds per snapshot type */
const TTL_MAP: Record<SnapshotType, number> = {
  weather_current: 15 * 60 * 1000,           // 15 minutes
  weather_hourly: 60 * 60 * 1000,            // 1 hour
  solar_baseline: 30 * 24 * 60 * 60 * 1000,  // 30 days
  daily_summary: 24 * 60 * 60 * 1000,        // 24 hours
  air_quality: 60 * 60 * 1000                 // 1 hour
};

@Injectable()
export class FreshnessPolicyService {
  /**
   * Evaluates if a given snapshot timestamp is still considered fresh.
   */
  isFresh(fetchedAt: Date, type: SnapshotType): boolean {
    const now = Date.now();
    const fetchedMs = fetchedAt.getTime();
    const diffMs = now - fetchedMs;

    // Fast return if the snapshot is from the future (e.g. clock drift)
    if (diffMs < 0) return true;

    const ttl = TTL_MAP[type];
    if (ttl === undefined) return false;

    return diffMs < ttl;
  }

  /**
   * Returns the TTL in milliseconds for a given snapshot type.
   */
  getTtlMs(type: SnapshotType): number {
    return TTL_MAP[type] ?? 0;
  }

  /**
   * Returns how many milliseconds remain before the snapshot becomes stale.
   * Negative means already stale.
   */
  remainingFreshnessMs(fetchedAt: Date, type: SnapshotType): number {
    const ttl = TTL_MAP[type] ?? 0;
    return fetchedAt.getTime() + ttl - Date.now();
  }
}
