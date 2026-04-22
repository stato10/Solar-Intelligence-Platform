import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

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
  children,
  className,
}: ActionLaneProps) {
  const hasChildren =
    Array.isArray(children) ? children.some(Boolean) : Boolean(children);

  if (!hasChildren && !showWhenEmpty) {
    return null;
  }

  const meta = LANE_META[priority];
  const displayTitle = title ?? meta.title;

  return (
    <section
      data-action-lane={priority}
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
            priority === "low"
              ? "space-y-2"
              : "grid grid-cols-1 gap-4 md:grid-cols-2",
          )}
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
