/**
 * Request-scoped session data loaders.
 *
 * Every authenticated page previously re-read cookies and re-fetched the
 * dashboard aggregate + tariff independently. Wrapping those paths in
 * React `cache()` collapses duplicate work within a single RSC render
 * (layout + page share one tariff / one aggregate call).
 */

import { cache } from "react";
import { cookies } from "next/headers";
import type { DashboardAggregateData } from "@/lib/contracts";
import type { Tariff } from "@/lib/contracts/onboarding";
import {
  fetchDashboardForSession,
  parseGeoCookie,
  type GeoOverride,
} from "./dashboard";
import { fetchTariffBySite } from "./settings-persist";

export interface SessionCookies {
  accessToken?: string;
  activeSiteId?: string;
  geo?: GeoOverride;
}

/** One cookie read per request — shared by layout and every page. */
export const getSessionCookies = cache(async (): Promise<SessionCookies> => {
  const store = await cookies();
  return {
    accessToken: store.get("sip.accessToken")?.value,
    activeSiteId: store.get("sip.activeSiteId")?.value,
    geo: parseGeoCookie(store.get("sip.geo")?.value),
  };
});

/** One dashboard aggregate (or demo fallback) per request. */
export const getSessionDashboard = cache(
  async (): Promise<DashboardAggregateData> => {
    const { accessToken, activeSiteId, geo } = await getSessionCookies();
    return fetchDashboardForSession(activeSiteId, accessToken, geo);
  },
);

/** One tariff lookup per request — used by CurrencyProvider + AI context. */
export const getSessionTariff = cache(async (): Promise<Tariff | null> => {
  const { accessToken, activeSiteId } = await getSessionCookies();
  if (!accessToken || !activeSiteId) return null;
  return fetchTariffBySite(activeSiteId, accessToken);
});
