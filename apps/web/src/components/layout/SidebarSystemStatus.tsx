"use client";

/**
 * SidebarSystemStatus — client-side wrapper that drives SystemStatusChip
 * from whatever the current browser session knows.
 *
 * This component lives in the sidebar and renders on every page, so its
 * detection has to work without a dashboard-specific data fetch. We use
 * two cheap signals:
 *
 *   1. Cookies (`sip.accessToken`, `sip.activeSiteId`) — enough to
 *      distinguish "anonymous" and "no-site" reliably.
 *   2. A cached substate mirror (`sip.substate`) that the dashboard page
 *      writes out on every render — lets the sidebar show "Estimated",
 *      "Live data paused", or "Live" without hitting the API itself.
 *
 * If we have no mirrored signal, the chip falls back to the best cookie-
 * derived guess and lets the dashboard page correct it as soon as it
 * renders.
 */

import { useEffect, useState } from "react";
import {
  deriveOnboardingSubstate,
  type OnboardingSubstate,
} from "@/lib/view-models/onboarding";
import { SystemStatusChip } from "./SystemStatusChip";

const SUBSTATE_COOKIE = "sip.substate";
const SUBSTATE_DETAIL_COOKIE = "sip.substateDetail";

function getCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? decodeURIComponent(match[2]) : undefined;
}

function isKnownSubstate(value: string | undefined): value is OnboardingSubstate {
  return (
    value === "anonymous" ||
    value === "no-site" ||
    value === "never-synced" ||
    value === "stale-telemetry" ||
    value === "live"
  );
}

export function SidebarSystemStatus() {
  const [substate, setSubstate] = useState<OnboardingSubstate | null>(null);
  const [detail, setDetail] = useState<string | undefined>(undefined);

  useEffect(() => {
    function readSubstate() {
      const accessToken = getCookie("sip.accessToken");
      const activeSiteId = getCookie("sip.activeSiteId");
      const mirrored = getCookie(SUBSTATE_COOKIE);
      const mirroredDetail = getCookie(SUBSTATE_DETAIL_COOKIE);

      if (isKnownSubstate(mirrored)) {
        // Trust the server-written mirror when the dashboard has rendered at
        // least once — it has access to telemetry mode + staleness which we
        // cannot see from the client alone.
        setSubstate(mirrored);
        setDetail(mirroredDetail);
        return;
      }

      // Cold boot / non-dashboard page: make the best guess from cookies.
      const guess = deriveOnboardingSubstate({
        accessToken,
        activeSiteId,
      });
      setSubstate(guess);
      setDetail(undefined);
    }

    readSubstate();

    // Live-sync on the current page: when `SubstateBridge` rewrites the
    // cookie after a dashboard re-render, refresh the chip without
    // waiting for the next navigation.
    function onSubstateChange() {
      readSubstate();
    }
    window.addEventListener("sip:substate-change", onSubstateChange);
    return () => {
      window.removeEventListener("sip:substate-change", onSubstateChange);
    };
  }, []);

  // Avoid hydration mismatches: render nothing on SSR, let it fade in.
  if (!substate) return null;

  return <SystemStatusChip substate={substate} detail={detail} />;
}
