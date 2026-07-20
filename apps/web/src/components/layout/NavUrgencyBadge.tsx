"use client";

/**
 * NavUrgencyBadge — small dot or count chip rendered to the right of
 * a sidebar nav item to signal urgency without leaving the sidebar.
 *
 * Variants (per docs/redesign/09-sidebar-shell.md §5):
 *   - "dot"   : binary indicator (e.g. "any unresolved concern").
 *   - "count" : numeric (e.g. "3 alerts").
 *   - "label" : tiny text chip (e.g. "New").
 *
 * Tone is mapped from the urgency level:
 *   - critical → rose (alerts, blocking maintenance)
 *   - warning  → amber (degraded but not blocking)
 *   - info     → indigo ("New" opportunities)
 *   - none     → render nothing
 */

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type BadgeTone = "critical" | "warning" | "info";
export type BadgeVariant = "dot" | "count" | "label";

interface NavUrgencyBadgeProps {
  variant: BadgeVariant;
  tone: BadgeTone;
  /** For variant="count": the numeric count to show. */
  count?: number;
  /** For variant="label": short label text, e.g. "New". */
  label?: string;
  /** Surfaces "5 alerts" style text to AT users. */
  ariaLabel: string;
  children?: ReactNode;
}

const TONE_BG: Record<BadgeTone, string> = {
  critical: "bg-rose-500",
  warning: "bg-amber-500",
  info: "bg-indigo-500",
};

const TONE_CHIP: Record<BadgeTone, string> = {
  critical: "bg-rose-500/15 text-rose-300 border border-rose-500/30",
  warning: "bg-amber-500/15 text-amber-300 border border-amber-500/30",
  info: "bg-indigo-500/15 text-indigo-300 border border-indigo-500/30",
};

export function NavUrgencyBadge({
  variant,
  tone,
  count,
  label,
  ariaLabel,
}: NavUrgencyBadgeProps) {
  if (variant === "dot") {
    return (
      <span
        aria-label={ariaLabel}
        role="status"
        className={cn(
          "inline-block size-2 rounded-full ring-2 ring-slate-950",
          TONE_BG[tone],
        )}
      />
    );
  }

  if (variant === "count") {
    if (!count || count <= 0) return null;
    const display = count > 99 ? "99+" : String(count);
    return (
      <span
        aria-label={ariaLabel}
        role="status"
        className={cn(
          "inline-flex min-w-[1.25rem] items-center justify-center rounded-full px-1.5 text-[10px] font-semibold tabular-nums",
          TONE_CHIP[tone],
        )}
      >
        {display}
      </span>
    );
  }

  // label variant
  if (!label) return null;
  return (
    <span
      aria-label={ariaLabel}
      role="status"
      className={cn(
        "inline-flex items-center rounded-full px-1.5 py-px text-[10px] font-semibold uppercase tracking-wide",
        TONE_CHIP[tone],
      )}
    >
      {label}
    </span>
  );
}
