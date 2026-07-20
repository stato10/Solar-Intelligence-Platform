import type {
  DashboardAggregateData,
  DashboardAggregateRequest,
  DashboardAggregateSuccessEnvelope
} from "@/lib/contracts";
import { API_ENDPOINTS } from "./endpoints";
import { ApiHttpError, getJson, postJson } from "./client";

/** Real browser location captured client-side (see GeolocationBridge). */
export interface GeoOverride {
  latitude: number;
  longitude: number;
  timezone?: string;
}

/**
 * Parses the `sip.geo` cookie value ("lat,lon,timezone") written by the
 * client-side geolocation bridge. Returns undefined for missing/bad values.
 */
export function parseGeoCookie(raw?: string): GeoOverride | undefined {
  if (!raw) return undefined;
  const [latStr, lonStr, tzRaw] = decodeURIComponent(raw).split(",");
  const latitude = Number(latStr);
  const longitude = Number(lonStr);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return undefined;
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return undefined;
  return { latitude, longitude, timezone: tzRaw || undefined };
}

export function getDefaultDashboardAggregateRequest(geo?: GeoOverride): DashboardAggregateRequest {
  const latitude = geo?.latitude ?? 32.0853;
  const longitude = geo?.longitude ?? 34.7818;
  return {
    // Geo-specific demo site id so cached snapshots are per-location,
    // not shared across users at different coordinates.
    siteId: geo
      ? `site-demo-geo-${latitude.toFixed(2)}-${longitude.toFixed(2)}`
      : "site-demo-001",
    latitude,
    longitude,
    systemSizeKw: 8.5,
    lossPercent: 14,
    timezone: geo?.timezone,
    generatedAt: new Date().toISOString(),
    tariff: {
      currency: "ILS",
      importRate: 0.62,
      exportRate: 0.28
    }
  };
}

export async function fetchDashboardAggregate(
  request: DashboardAggregateRequest = getDefaultDashboardAggregateRequest()
): Promise<DashboardAggregateData> {
  const envelope = await postJson<DashboardAggregateRequest, DashboardAggregateSuccessEnvelope>(
    API_ENDPOINTS.dashboard.aggregate,
    request
  );

  if (!envelope.success || !envelope.data) {
    throw new Error("Dashboard response payload is invalid");
  }

  return envelope.data;
}

/**
 * Preferred entry point for pages: uses the site-backed aggregate when an
 * active site is selected, and degrades to the anonymous demo aggregate
 * when the session is missing/expired (the site endpoint requires a JWT)
 * or the site is gone — instead of surfacing an error page.
 */
export async function fetchDashboardForSession(
  activeSiteId?: string,
  accessToken?: string,
  geo?: GeoOverride
): Promise<DashboardAggregateData> {
  if (activeSiteId) {
    try {
      return await fetchDashboardBySiteId(activeSiteId, accessToken);
    } catch (error) {
      const status = error instanceof ApiHttpError ? error.status : undefined;
      if (status !== 401 && status !== 403 && status !== 404) {
        throw error;
      }
      // Stale session or foreign/deleted site — fall through to demo data.
    }
  }
  // Demo aggregate uses the visitor's real browser location when available.
  return fetchDashboardAggregate(getDefaultDashboardAggregateRequest(geo));
}

export async function fetchDashboardBySiteId(
  siteId: string,
  accessToken?: string
): Promise<DashboardAggregateData> {
  const headers: Record<string, string> = accessToken
    ? { Authorization: `Bearer ${accessToken}` }
    : {};

  const envelope = await getJson<DashboardAggregateSuccessEnvelope>(
    `${API_ENDPOINTS.dashboard.aggregate.replace("/aggregate", "")}/site/${siteId}`,
    undefined,
    { headers }
  );

  if (!envelope.success || !envelope.data) {
    throw new Error("Dashboard response payload is invalid");
  }

  return envelope.data;
}
