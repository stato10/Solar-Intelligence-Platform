"use client";

/**
 * SidebarUtilityZone — bottom-pinned stack of utility controls in the
 * sidebar (per docs/redesign/09-sidebar-shell.md §6).
 *
 * Order, top to bottom:
 *   1. Connect System CTA (only when the active site is not yet live).
 *   2. Integration status pill — links to Settings → Integrations.
 *   3. Plan badge (kept from the previous design, minified).
 *   4. Support link.
 *
 * This zone never scrolls; if the nav list grows, the nav scrolls
 * independently above it.
 */

import Link from "next/link";
import { useEffect, useSyncExternalStore } from "react";
import { CircuitBoard, LifeBuoy, Plug, Sparkles } from "lucide-react";
import { track } from "@/lib/analytics/client";
import { cn } from "@/lib/utils";

function getCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? decodeURIComponent(match[2]) : undefined;
}

// Cookie + custom event form an external store; `useSyncExternalStore`
// reads it without a cascading setState-in-effect and stays SSR-safe.
function readSubstate(): string | null {
  return getCookie("sip.substate") ?? null;
}

function getServerSubstate(): string | null {
  return null;
}

function subscribeToSubstate(onStoreChange: () => void): () => void {
  window.addEventListener("sip:substate-change", onStoreChange);
  return () => window.removeEventListener("sip:substate-change", onStoreChange);
}

export function SidebarUtilityZone() {
  const substate = useSyncExternalStore(subscribeToSubstate, readSubstate, getServerSubstate);

  // The plan badge is a subscription upsell surface — doc 17 §3.3 requires
  // `subscription_upsell_shown` once per mount for funnel-ratio denominators.
  useEffect(() => {
    track(
      "subscription_upsell_shown",
      { surface: "sidebar_utility" },
      { surface: "sidebar" },
    );
  }, []);

  // "live" = connected with fresh telemetry. Hide the Connect CTA there.
  const isLive = substate === "live";
  const integrationLabel =
    substate === "live"
      ? "All systems connected"
      : substate === "stale-telemetry"
        ? "1 integration needs attention"
        : substate === "never-synced"
          ? "Awaiting first telemetry"
          : "Not connected yet";
  const integrationTone =
    substate === "live"
      ? "text-emerald-400"
      : substate === "stale-telemetry"
        ? "text-amber-400"
        : "text-muted-foreground";

  return (
    <div className="space-y-2 border-t border-slate-800/60 p-3">
      {/* 1. Connect System (conditional) */}
      {!isLive ? (
        <Link
          href="/settings#system-configuration"
          onClick={() =>
            track(
              "sidebar_connect_click",
              { surface: "sidebar_utility" },
              { surface: "sidebar" },
            )
          }
          className="group flex items-center gap-2.5 rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-3 py-2 text-xs font-semibold text-indigo-300 transition-colors hover:bg-indigo-500/20"
        >
          <Plug className="size-3.5 shrink-0" aria-hidden />
          <span className="truncate">Connect system</span>
        </Link>
      ) : null}

      {/* 2. Integration status pill */}
      <Link
        href="/settings#integrations"
        className={cn(
          "flex items-center gap-2 rounded-lg border border-border/60 bg-card/60 px-3 py-1.5 text-[11px] transition-colors hover:bg-muted/60",
          integrationTone,
        )}
        aria-label={`Integration status: ${integrationLabel}`}
      >
        <CircuitBoard className="size-3 shrink-0" aria-hidden />
        <span className="truncate">{integrationLabel}</span>
      </Link>

      {/* 3. Plan badge */}
      <div className="flex items-center gap-2 rounded-lg bg-slate-900/50 px-3 py-2">
        <Sparkles className="size-3.5 shrink-0 text-amber-400" aria-hidden />
        <div className="flex min-w-0 flex-col">
          <span className="text-xs font-semibold leading-tight text-white">Premium</span>
          <span className="truncate text-[10px] leading-tight text-slate-400">
            View account
          </span>
        </div>
      </div>

      {/* 4. Support link */}
      <Link
        href="/onboarding"
        onClick={() => track("sidebar_support_click", {}, { surface: "sidebar" })}
        className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-[11px] text-slate-400 transition-colors hover:bg-slate-900/50 hover:text-slate-200"
      >
        <LifeBuoy className="size-3 shrink-0" aria-hidden />
        <span>Support &amp; docs</span>
      </Link>
    </div>
  );
}
