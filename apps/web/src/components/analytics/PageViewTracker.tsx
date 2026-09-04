"use client";

/**
 * PageViewTracker — emits `page_view` with `{ path, systemState }` on every
 * route change (docs/redesign/17-monetization.md §3.2).
 *
 * Mounted once inside AppShell so every product page is covered without
 * per-page wiring. `systemState` resolution order:
 *   1. A `[data-system-state]` attribute in the rendered page (the dashboard
 *      hero and state views expose it).
 *   2. Fallback "unknown" — pages without a state-driven hero.
 *
 * The DOM read happens inside an effect (post-commit) so the freshly
 * navigated page's markup is already present.
 */

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { track } from "@/lib/analytics/client";

function readSystemStateFromDom(): string {
  if (typeof document === "undefined") return "unknown";
  const el = document.querySelector("[data-system-state]");
  return el?.getAttribute("data-system-state") ?? "unknown";
}

export function PageViewTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;
    track(
      "page_view",
      { path: pathname, systemState: readSystemStateFromDom() },
      { surface: pathname },
    );
  }, [pathname]);

  return null;
}
