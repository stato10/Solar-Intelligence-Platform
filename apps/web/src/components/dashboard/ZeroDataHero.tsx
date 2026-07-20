/**
 * ZeroDataHero — dashboard hero for the zero-data / pre-telemetry substates.
 *
 * Spec: docs/redesign/12-empty-states.md §3.
 *
 * Instead of a single "not connected yet" screen, the hero is substate-
 * aware and speaks to the user's *actual* onboarding position:
 *
 *   - anonymous    → "See how much your solar could save you"   (→ sign up)
 *   - no-site      → "Add your first system"                    (→ add site)
 *   - never-synced → "Your inverter isn't talking to us yet"    (→ connect)
 *
 * All three variants render the same 4-step `OnboardingChecklist` so the
 * user always sees where they are in the flow — what's done, what's next,
 * what still takes effort after the main CTA.
 *
 * The copy is intentionally neutral; emoji and urgency words are forbidden
 * here (see 13-voice-and-copy.md). The substate-specific strings live in
 * the `SUBSTATE_COPY` table in `view-models/onboarding.ts` so there's one
 * place to update copy without touching the component.
 */

import Link from "next/link";
import { ArrowDown, PlugZap, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EstimatedChip } from "./EstimatedBadge";
import { OnboardingChecklist } from "./OnboardingChecklist";
import {
  SUBSTATE_COPY,
  type OnboardingSubstate,
} from "@/lib/view-models/onboarding";

interface ZeroDataHeroProps {
  /**
   * Which onboarding substate the user is in. Controls headline, body,
   * CTA label, target href and which checklist step is current.
   * Defaults to "never-synced" (the pre-existing behavior).
   */
  substate?: OnboardingSubstate;
  /**
   * Where the primary CTA routes. Substate-specific defaults are used
   * when not provided:
   *   - anonymous    → /login?intent=signup
   *   - no-site      → /onboarding
   *   - never-synced → #connect (deep-link to the existing connect CTA
   *                    that already lives in the right column)
   *   - stale        → /settings#integrations
   */
  ctaHref?: string;
  /** Override for the CTA label. Falls back to the substate default. */
  ctaLabel?: string;
  /** Hide the onboarding checklist when embedding in a denser layout. */
  hideChecklist?: boolean;
}

// Per-substate default destination for the hero CTA.
const DEFAULT_CTA_HREF: Record<OnboardingSubstate, string> = {
  anonymous: "/login?intent=signup",
  "no-site": "/onboarding",
  "never-synced": "#connect",
  "stale-telemetry": "/settings#integrations",
  live: "#",
};

export function ZeroDataHero({
  substate = "never-synced",
  ctaHref,
  ctaLabel,
  hideChecklist = false,
}: ZeroDataHeroProps) {
  const copy = SUBSTATE_COPY[substate];
  const href = ctaHref ?? DEFAULT_CTA_HREF[substate];
  const label = ctaLabel ?? copy.ctaLabel;

  // Decorative glyph — anonymous gets a Sparkles to hint "preview", all
  // other substates get PlugZap to visually echo the hardware connection.
  const Glyph = substate === "anonymous" ? Sparkles : PlugZap;

  return (
    <article
      id="hero-insight"
      data-system-state="no-data"
      data-substate={substate}
      aria-label={copy.headline}
      className="glass-card relative overflow-hidden rounded-2xl p-6 md:p-8"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-transparent"
      />

      <div className="relative flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 flex-1 space-y-4">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/15 text-indigo-500 dark:text-indigo-400">
              <Glyph className="h-4 w-4" aria-hidden />
            </span>
            <EstimatedChip label={copy.eyebrow} />
          </div>

          <div className="space-y-2">
            <h1 className="max-w-2xl text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">
              {copy.headline}
            </h1>
            <p className="max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              {copy.body}
            </p>
          </div>

          {!hideChecklist ? (
            <div className="pt-2">
              <OnboardingChecklist
                activeStepIndex={copy.activeStepIndex}
                className="max-w-md"
              />
            </div>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-col items-start gap-2 md:items-end">
          <Button asChild size="lg" className="shadow-lg">
            <Link href={href}>
              <Glyph className="mr-2 h-4 w-4" aria-hidden />
              {label}
            </Link>
          </Button>
          {/* The supported-integrations hint is only meaningful for the
              "never-synced" substate where the next click is literally the
              hardware handshake. For earlier substates it would be noise. */}
          {substate === "never-synced" ? (
            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
              <ArrowDown className="h-3 w-3" aria-hidden />
              Supported: SolarEdge · Enphase · SMA · Fronius
            </span>
          ) : null}
        </div>
      </div>
    </article>
  );
}
