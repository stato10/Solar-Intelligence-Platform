"use client";

/**
 * SubstateBridge — invisible client component that mirrors the server-
 * computed onboarding substate into a client-readable cookie so that
 * `SidebarSystemStatus` can pick it up and render the accurate chip
 * without its own API call.
 *
 * This is the cheapest, smallest surface-area way to solve the
 * "server knows the truth, sidebar client needs it" handoff: the
 * dashboard page already computes the substate server-side, and this
 * bridge replays it into a cookie on hydration.
 *
 * The cookie is intentionally short-lived (session only) and
 * overwritten on every dashboard visit — so a user who signs out or
 * switches accounts never sees a stale chip.
 */

import { useEffect } from "react";
import type { OnboardingSubstate } from "@/lib/view-models/onboarding";

interface SubstateBridgeProps {
  substate: OnboardingSubstate;
  /** Optional human-friendly detail string, e.g. "3h ago" for stale-telemetry. */
  detail?: string;
}

export function SubstateBridge({ substate, detail }: SubstateBridgeProps) {
  useEffect(() => {
    // Session cookies: no `max-age` / `expires` → gone at tab close.
    // `path=/` so every route (sidebar is global) can read it.
    document.cookie = `sip.substate=${encodeURIComponent(substate)}; path=/; samesite=lax`;
    if (detail) {
      document.cookie = `sip.substateDetail=${encodeURIComponent(detail)}; path=/; samesite=lax`;
    } else {
      document.cookie = `sip.substateDetail=; path=/; max-age=0; samesite=lax`;
    }
    // Fire a custom event so any mounted `SidebarSystemStatus` instance
    // can re-read on the same navigation without waiting for a remount.
    window.dispatchEvent(
      new CustomEvent("sip:substate-change", { detail: { substate, detail } }),
    );
  }, [substate, detail]);

  return null;
}
