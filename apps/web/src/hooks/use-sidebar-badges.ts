"use client";

/**
 * useSidebarBadges — reads the nav-badge counts that the dashboard
 * mirrored into cookies via `NavBadgesBridge`, and re-reads them when
 * the bridge dispatches `sip:nav-badges-change` on the same page.
 *
 * Implemented with `useSyncExternalStore` (cookies + the bridge event
 * are an external store), which also gives us correct SSR behavior:
 * the server snapshot is always the zero state and the client hydrates
 * the real counts without a cascading effect.
 *
 * Returns zeros until the dashboard has rendered at least once during
 * the session, which is fine — the sidebar simply renders without
 * badges in that interim state.
 */

import { useSyncExternalStore } from "react";
import { NAV_BADGE_COOKIES } from "@/components/layout/NavBadgesBridge";

export interface SidebarBadgeState {
  alertCount: number;
  maintenanceCount: number;
  hasNewOpportunity: boolean;
}

const ZERO: SidebarBadgeState = {
  alertCount: 0,
  maintenanceCount: 0,
  hasNewOpportunity: false,
};

function getCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? decodeURIComponent(match[2]) : undefined;
}

// getSnapshot must return a referentially stable value when nothing
// changed, so cache the last parsed state keyed by the raw cookie tuple.
let lastRaw = "";
let lastState: SidebarBadgeState = ZERO;

function getSnapshot(): SidebarBadgeState {
  const rawAlerts = getCookie(NAV_BADGE_COOKIES.alerts) ?? "";
  const rawMaintenance = getCookie(NAV_BADGE_COOKIES.maintenance) ?? "";
  const rawOpportunity = getCookie(NAV_BADGE_COOKIES.opportunitiesNew) ?? "";
  const raw = `${rawAlerts}|${rawMaintenance}|${rawOpportunity}`;
  if (raw === lastRaw) {
    return lastState;
  }

  const a = Number(rawAlerts);
  const m = Number(rawMaintenance);
  lastRaw = raw;
  lastState = {
    alertCount: Number.isFinite(a) ? a : 0,
    maintenanceCount: Number.isFinite(m) ? m : 0,
    hasNewOpportunity: rawOpportunity === "1",
  };
  return lastState;
}

function getServerSnapshot(): SidebarBadgeState {
  return ZERO;
}

function subscribe(onStoreChange: () => void): () => void {
  window.addEventListener("sip:nav-badges-change", onStoreChange);
  return () => window.removeEventListener("sip:nav-badges-change", onStoreChange);
}

export function useSidebarBadges(): SidebarBadgeState {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
