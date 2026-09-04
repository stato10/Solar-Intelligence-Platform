"use client";

import type { MouseEvent, ReactNode } from "react";
import { Children } from "react";
import { cn } from "@/lib/utils";
import { track } from "@/lib/analytics/client";

/**
 * Action priority matching docs/redesign/01-state-contracts.md §2.
 * Drives the three lanes on the dashboard primary column:
 *   high   → "Now"          (solid CTAs, tightest rhythm)
 *   medium → "Recommended"  (outline CTAs)
 *   low    → "Explore later" (text links, muted)
 */
export type ActionLanePriority = "high" | "medium" | "low";

interface ActionLaneProps {
  priority: ActionLanePriority;
  /** Section title. If omitted, derived from `priority`. */
  title?: string;
  /** Optional one-line sub copy under the title. */
  subtitle?: string;
  /** Optional right-aligned slot (e.g. total N.IS/month chip). */
  trailing?: ReactNode;
  /**
   * When true and there are no children, the lane renders a muted
   * placeholder ("No new opportunities this week — we are monitoring").
   * Per spec §8 the Now lane should instead be omitted when empty; callers
   * should not pass `showWhenEmpty` for the Now lane.
   */
  showWhenEmpty?: boolean;
  /**
   * Layout for the children area:
   *   "grid"  — 2-up grid on md+, 1-up below (default for high/medium).
   *   "stack" — single column, children stretch full-width. Use this for
   *             a self-laid-out section so it does not get squeezed into
   *             half the lane.
   *   "rows"  — tight vertical list, used by the low-priority lane.
   * If omitted, resolves to "rows" for `low` and "grid" otherwise. A single
   * child on a non-low lane auto-upgrades to "stack" so it does not leave
   * an empty second column.
   */
  layout?: "grid" | "stack" | "rows";
  /** The action cards for this lane. */
  children?: ReactNode;
  className?: string;
}

const LANE_META: Record<
  ActionLanePriority,
  { title: string; eyebrow: string }
> = {
  high: { title: "Now", eyebrow: "High priority" },
  medium: { title: "Recommended", eyebrow: "Medium priority" },
  low: { title: "Explore later", eyebrow: "Low priority" },
};

/** Analytics lane names per doc 02 §9. */
const LANE_EVENT_NAME: Record<ActionLanePriority, "now" | "recommended" | "explore"> = {
  high: "now",
  medium: "recommended",
  low: "explore",
};

/**
 * Presentational wrapper for a dashboard action lane. Does not own any
 * business logic — the page composes the correct children for each lane.
 *
 * Tokens: section rhythm `mt-8`, card grid gap `gap-4` (see 00-design-tokens.md).
 */
export function ActionLane({
  priority,
  title,
  subtitle,
  trailing,
  showWhenEmpty = false,
  layout,
  children,
  className,
}: ActionLaneProps) {
  const childArray = Children.toArray(children).filter(Boolean);
  const childCount = childArray.length;
  const hasChildren = childCount > 0;

  if (!hasChildren && !showWhenEmpty) {
    return null;
  }

  const resolvedLayout: "grid" | "stack" | "rows" =
    layout ??
    (priority === "low"
      ? "rows"
      : childCount <= 1
        ? "stack"
        : "grid");

  const meta = LANE_META[priority];
  const displayTitle = title ?? meta.title;

  return (
    <section
      data-action-lane={priority}
      data-lane-layout={resolvedLayout}
      className={cn("space-y-4", className)}
      aria-label={`${displayTitle} actions`}
    >
      <header className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {meta.eyebrow}
          </p>
          <h2 className="text-xl font-semibold tracking-tight text-white">
            {displayTitle}
          </h2>
          {subtitle ? (
            <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>
        {trailing ? <div className="shrink-0">{trailing}</div> : null}
      </header>

      {hasChildren ? (
        <div
          className={cn(
            resolvedLayout === "rows" && "space-y-2",
            resolvedLayout === "stack" && "space-y-4",
            resolvedLayout === "grid" && "grid grid-cols-1 gap-4 md:grid-cols-2",
          )}
          // Capture-phase click instrumentation for every card in the lane
          // (doc 02 §9 `action_card_click`). Only interactive targets count
          // so plain text selection inside a card does not emit.
          onClickCapture={(event: MouseEvent<HTMLDivElement>) => {
            const target = event.target as HTMLElement | null;
            const interactive = target?.closest("a, button");
            if (!interactive) return;
            const card = target?.closest("section[aria-label]");
            track(
              "action_card_click",
              {
                lane: LANE_EVENT_NAME[priority],
                actionId: card?.getAttribute("aria-label") ?? "unknown",
                priority,
              },
              { surface: "dashboard" },
            );
          }}
        >
          {children}
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-border/70 px-4 py-6 text-center text-sm text-muted-foreground">
          No new opportunities this week — we are monitoring.
        </p>
      )}
    </section>
  );
}
