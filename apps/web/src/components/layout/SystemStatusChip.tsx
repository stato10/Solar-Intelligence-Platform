/**
 * SystemStatusChip — always-on pipeline-state indicator for the sidebar.
 *
 * Spec-extension: docs/redesign/12-empty-states.md §3 / 09-sidebar-shell.md.
 * This is Layer 1 of the progressive-disclosure architecture: a tiny status
 * chip that sits below the site-selector and tells the user, at a glance,
 * whether what they are looking at is real, estimated, stale, or absent.
 *
 * The chip is **presentational only** — a wrapper (`SidebarSystemStatus`)
 * owns the substate detection and passes it in.
 */

import { cn } from "@/lib/utils";
import type { OnboardingSubstate } from "@/lib/view-models/onboarding";

interface SystemStatusChipProps {
  substate: OnboardingSubstate;
  /** Optional override for the secondary line (e.g. "3h ago" for stale). */
  detail?: string;
  className?: string;
}

// --------------------------------------------------------------------------
// Visual contract — one row per substate so the whole mapping is readable.
// --------------------------------------------------------------------------
const CHIP_CONFIG: Record<
  OnboardingSubstate,
  {
    label: string;
    dotClass: string;
    textClass: string;
    pulse: boolean;
  }
> = {
  live: {
    label: "Live data",
    // Emerald w/ a subtle pulse so the user knows it's fresh.
    dotClass: "bg-emerald-500",
    textClass: "text-emerald-400",
    pulse: true,
  },
  "stale-telemetry": {
    label: "Live data paused",
    dotClass: "bg-amber-500",
    textClass: "text-amber-400",
    pulse: false,
  },
  "never-synced": {
    label: "Estimated",
    dotClass: "bg-amber-500",
    textClass: "text-amber-400",
    pulse: false,
  },
  "no-site": {
    label: "No system yet",
    dotClass: "bg-slate-500",
    textClass: "text-slate-400",
    pulse: false,
  },
  anonymous: {
    label: "Preview mode",
    dotClass: "bg-slate-500",
    textClass: "text-slate-400",
    pulse: false,
  },
};

export function SystemStatusChip({ substate, detail, className }: SystemStatusChipProps) {
  const cfg = CHIP_CONFIG[substate];

  return (
    <div
      role="status"
      aria-label={`System status: ${cfg.label}${detail ? ` — ${detail}` : ""}`}
      data-substate={substate}
      className={cn(
        "flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/40",
        "px-3 py-1 text-[10px] font-medium",
        className,
      )}
    >
      <span className="relative flex h-2 w-2 shrink-0">
        {cfg.pulse ? (
          <span
            aria-hidden
            className={cn(
              "absolute inline-flex h-full w-full animate-ping rounded-full opacity-60",
              cfg.dotClass,
            )}
          />
        ) : null}
        <span
          aria-hidden
          className={cn("relative inline-flex h-2 w-2 rounded-full", cfg.dotClass)}
        />
      </span>
      <span className={cn("truncate uppercase tracking-wider", cfg.textClass)}>
        {cfg.label}
      </span>
      {detail ? (
        <span className="truncate text-slate-500 normal-case tracking-normal">
          · {detail}
        </span>
      ) : null}
    </div>
  );
}
