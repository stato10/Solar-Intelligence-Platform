/**
 * StaleTelemetryBanner — Layer 2 of the progressive-disclosure architecture.
 *
 * Spec-extension: docs/redesign/12-empty-states.md §3.
 *
 * When a site was previously live but the last reading is older than the
 * stale threshold (default 24h), we deliberately *do not* replace the hero
 * — the user's last-known state is still valuable and replacing it would
 * feel punitive. Instead we render a non-destructive ribbon above the hero
 * that:
 *
 *   - Tells them what happened ("We haven't heard from your system since …")
 *   - Gives them a single remedial CTA (Troubleshoot / Reconnect)
 *   - Doesn't look like an alert — amber, not red. Urgent language and
 *     emoji are forbidden (13-voice-and-copy.md).
 *
 * The banner has no internal state; the `lastSeenIso` prop is formatted
 * into a human relative time so the component stays pure and testable.
 */

import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface StaleTelemetryBannerProps {
  /** ISO timestamp of the last successful telemetry / aggregate generation. */
  lastSeenIso?: string;
  /** Where the "Troubleshoot" CTA routes. Defaults to integration settings. */
  reconnectHref?: string;
  className?: string;
}

export function StaleTelemetryBanner({
  lastSeenIso,
  reconnectHref = "/settings#integrations",
  className,
}: StaleTelemetryBannerProps) {
  const lastSeenLabel = formatRelativeTime(lastSeenIso);

  return (
    <div
      role="status"
      aria-live="polite"
      data-substate="stale-telemetry"
      className={cn(
        "relative flex flex-col gap-3 rounded-xl border border-amber-500/30",
        "bg-amber-500/10 px-4 py-3 text-amber-100",
        "sm:flex-row sm:items-center sm:justify-between sm:gap-4",
        className,
      )}
    >
      <div className="flex min-w-0 items-start gap-3">
        <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-amber-400">
          <AlertTriangle className="h-4 w-4" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold leading-tight text-amber-100">
            We haven&apos;t heard from your system
            {lastSeenLabel ? ` since ${lastSeenLabel}` : ""}.
          </p>
          <p className="mt-0.5 text-xs leading-relaxed text-amber-200/80">
            The numbers below show your last-known state. Reconnect to
            resume live monitoring.
          </p>
        </div>
      </div>

      <div className="flex shrink-0 gap-2 sm:self-center">
        <Button
          asChild
          size="sm"
          variant="outline"
          className="border-amber-400/40 bg-amber-500/10 text-amber-100 hover:bg-amber-500/20 hover:text-amber-50"
        >
          <Link href={reconnectHref}>Troubleshoot connection</Link>
        </Button>
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------
// Helpers
// --------------------------------------------------------------------------
/** Rough human-friendly "N hours/days ago"; undefined if input is unparsable. */
function formatRelativeTime(iso?: string): string | undefined {
  if (!iso) return undefined;
  const then = Date.parse(iso);
  if (Number.isNaN(then)) return undefined;

  const diffMs = Date.now() - then;
  if (diffMs < 0) return undefined;

  const hours = Math.floor(diffMs / (60 * 60 * 1000));
  if (hours < 24) {
    return hours <= 1 ? "an hour ago" : `${hours} hours ago`;
  }

  const days = Math.floor(hours / 24);
  if (days < 7) {
    return days === 1 ? "yesterday" : `${days} days ago`;
  }

  const weeks = Math.floor(days / 7);
  return weeks === 1 ? "a week ago" : `${weeks} weeks ago`;
}
