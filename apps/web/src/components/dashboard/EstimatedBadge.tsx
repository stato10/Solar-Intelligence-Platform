/**
 * EstimatedBadge — visual chip + wrapper for zero-data / estimated surfaces.
 *
 * Spec: docs/redesign/12-empty-states.md §5.
 *   "Estimated data surfaces add a 1px dashed border segment at the top of
 *    the card and a chip 'Estimated'."
 *
 * Two exports:
 *   - `EstimatedChip` — standalone pill, for places where the caller controls
 *     layout (e.g. PerformanceStatsGrid header slot).
 *   - `EstimatedSurface` — wrapper that injects the dashed-top treatment and
 *     a top-right chip over any existing card, without duplicating the card's
 *     own padding / radius.
 *
 * Both are intentionally token-driven (amber accent) so the treatment stays
 * consistent across pages.
 */

import type { ReactNode } from "react";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

// --------------------------------------------------------------------------
// Chip
// --------------------------------------------------------------------------
interface EstimatedChipProps {
  label?: string;
  className?: string;
}

export function EstimatedChip({ label = "Estimated", className }: EstimatedChipProps) {
  return (
    <span
      role="status"
      aria-label="Estimated data — not based on live telemetry"
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-amber-500/30",
        "bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider",
        "text-amber-500 dark:text-amber-400",
        className,
      )}
    >
      <Sparkles className="h-3 w-3" aria-hidden />
      {label}
    </span>
  );
}

// --------------------------------------------------------------------------
// Surface wrapper
// --------------------------------------------------------------------------
interface EstimatedSurfaceProps {
  /**
   * When `false`, renders children as-is. This lets pages conditionally toggle
   * the treatment via a single prop (`<EstimatedSurface active={systemState === "no-data"}>`)
   * without branching at the call site.
   */
  active?: boolean;
  /** Position of the floating chip. Defaults to top-right. */
  chipPosition?: "top-right" | "top-left";
  /** Pass-through label override for the chip. */
  chipLabel?: string;
  /**
   * Whether the wrapper owns the rounded corners / dashed border. Defaults to
   * `true`. Set to `false` when the child card already paints its own border
   * and you only want the chip overlay (used for cards that we don't want to
   * visually double-border).
   */
  withDashedBorder?: boolean;
  className?: string;
  children: ReactNode;
}

/**
 * Wraps a card in the estimated-data treatment. The wrapper uses a dashed
 * top edge (not a full border) so the underlying card's existing styling
 * keeps its integrity — the dashed edge reads as an annotation, not a
 * re-skin.
 */
export function EstimatedSurface({
  active = true,
  chipPosition = "top-right",
  chipLabel,
  withDashedBorder = true,
  className,
  children,
}: EstimatedSurfaceProps) {
  if (!active) return <>{children}</>;

  return (
    // `pt-2.5` reserves space for the chip which floats half-above the card
    // edge (`-top-2.5`). This way we never collide with the card's own
    // top-right badge (e.g. `PerformanceStatsGrid`'s Good/Strong chip or the
    // What-If Simulator's BETA badge).
    <div
      className={cn("relative pt-2.5", className)}
      data-estimated="true"
    >
      {withDashedBorder ? (
        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-x-3 top-2.5 h-px",
            "border-t border-dashed border-amber-500/40",
          )}
        />
      ) : null}
      <div
        className={cn(
          "absolute z-10 -top-px",
          chipPosition === "top-right" ? "right-4" : "left-4",
        )}
      >
        <EstimatedChip label={chipLabel} />
      </div>
      {children}
    </div>
  );
}
