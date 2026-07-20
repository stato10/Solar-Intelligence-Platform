"use client";

/**
 * NavBadgesBridge — invisible client component that mirrors the
 * dashboard-derived sidebar urgency counts into client-readable cookies
 * so `useSidebarBadges` can render them on every page without each
 * page paying for its own data fetch.
 *
 * Mirrors the same handoff pattern as `SubstateBridge`: the dashboard
 * page already aggregates these numbers, so we replay them into a
 * cookie + custom event on hydration.
 *
 * Cookies are session-scoped (no max-age) so they vanish on tab close,
 * preventing stale badges across sign-outs / account swaps.
 */

import { useEffect } from "react";

const COOKIE_ALERTS = "sip.nav.alerts";
const COOKIE_MAINTENANCE = "sip.nav.maintenance";
const COOKIE_OPPORTUNITIES_NEW = "sip.nav.opportunitiesNew";

export interface NavBadgeCounts {
  /** Number of unresolved critical/warning alerts. */
  alertCount: number;
  /** Number of unresolved maintenance concerns (soiling + heat issues). */
  maintenanceCount: number;
  /** Whether a high-priority opportunity is freshly surfaced today. */
  hasNewOpportunity: boolean;
}

export function NavBadgesBridge({
  alertCount,
  maintenanceCount,
  hasNewOpportunity,
}: NavBadgeCounts) {
  useEffect(() => {
    document.cookie = `${COOKIE_ALERTS}=${alertCount}; path=/; samesite=lax`;
    document.cookie = `${COOKIE_MAINTENANCE}=${maintenanceCount}; path=/; samesite=lax`;
    document.cookie = `${COOKIE_OPPORTUNITIES_NEW}=${hasNewOpportunity ? 1 : 0}; path=/; samesite=lax`;
    window.dispatchEvent(
      new CustomEvent("sip:nav-badges-change", {
        detail: { alertCount, maintenanceCount, hasNewOpportunity },
      }),
    );
  }, [alertCount, maintenanceCount, hasNewOpportunity]);

  return null;
}

export const NAV_BADGE_COOKIES = {
  alerts: COOKIE_ALERTS,
  maintenance: COOKIE_MAINTENANCE,
  opportunitiesNew: COOKIE_OPPORTUNITIES_NEW,
} as const;
