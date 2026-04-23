/**
 * ZeroDataHero — dashboard hero for the zero-data / unconnected experience.
 *
 * Spec: docs/redesign/12-empty-states.md §3.
 *
 *   Surfaces when the site is unconnected or ingestion has no data for the
 *   last 24h. The dashboard per-page override is clear:
 *     - replaces the Hero entirely
 *     - dims the right panel
 *     - "Connect System" is the single dominant action
 *
 * The copy is intentionally neutral — the goal is to explain, not to alarm.
 * Emoji and urgency language are forbidden here (see 13-voice-and-copy.md).
 *
 * The Connect CTA deep-links (`#connect`) to the existing `HardwareConnectCta`
 * block that already lives in the right column; we don't duplicate the
 * connection flow here to keep a single source of truth.
 */

import Link from "next/link";
import { ArrowDown, PlugZap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EstimatedChip } from "./EstimatedBadge";

interface ZeroDataHeroProps {
  /**
   * Where the "Connect" CTA routes. Defaults to the in-page anchor
   * `#connect` where `HardwareConnectCta` renders today. Overridable for
   * pages where the connect flow lives elsewhere (settings, etc.).
   */
  connectHref?: string;
  /** Optional override for the CTA label. */
  connectLabel?: string;
}

export function ZeroDataHero({
  connectHref = "#connect",
  connectLabel = "Connect your inverter",
}: ZeroDataHeroProps) {
  return (
    <article
      id="hero-insight"
      data-system-state="no-data"
      aria-label="System not connected yet"
      className="glass-card relative overflow-hidden rounded-2xl p-6 md:p-8"
    >
      {/* Soft ambient glow — neutral slate/indigo, no alarm colors. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-transparent"
      />

      <div className="relative flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 flex-1 space-y-4">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/15 text-indigo-500 dark:text-indigo-400">
              <PlugZap className="h-4 w-4" aria-hidden />
            </span>
            <EstimatedChip label="Estimated view" />
          </div>

          <div className="space-y-2">
            <h1 className="max-w-2xl text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">
              Your system isn&apos;t connected yet.
            </h1>
            <p className="max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              We can still show you an estimated view based on your setup.
              Connect your inverter to switch to real-time monitoring.
            </p>
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-start gap-2 md:items-end">
          <Button asChild size="lg" className="shadow-lg">
            <Link href={connectHref}>
              <PlugZap className="mr-2 h-4 w-4" aria-hidden />
              {connectLabel}
            </Link>
          </Button>
          <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
            <ArrowDown className="h-3 w-3" aria-hidden />
            Supported: SolarEdge · Enphase · SMA · Fronius
          </span>
        </div>
      </div>
    </article>
  );
}
