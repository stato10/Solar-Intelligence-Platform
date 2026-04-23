/**
 * Onboarding substate view-model.
 *
 * Spec-extension: docs/redesign/12-empty-states.md §3 (Zero-data experience).
 * The original spec treated "no-data" as a single binary state. In practice
 * the product has *five* distinct stages the UI must distinguish to feel
 * native instead of buggy:
 *
 *   A. anonymous       — no auth, no session (public marketing visit).
 *   B. no-site         — authenticated but hasn't added / selected a site.
 *   C. never-synced    — site exists, but the engine has never received real
 *                        telemetry (falls back to forecast mode).
 *   D. stale-telemetry — site was live, but the last reading is > 24h old
 *                        (connector broke, sync stopped).
 *   E. live            — fresh real telemetry, everything is healthy.
 *
 * Each substate deserves a different copy, a different CTA, and a different
 * level of dashboard disruption — the page composes three display layers
 * on top of the substate:
 *
 *   - Layer 1 — always-on sidebar status chip (A/B/C/D/E)
 *   - Layer 2 — top ribbon for stale-telemetry (D only; non-destructive)
 *   - Layer 3 — ZeroDataHero + onboarding checklist (A/B/C; full replace)
 *
 * Keep this file pure (no React, no DOM) so it is safe to import from both
 * server components and tests.
 */

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------
export type OnboardingSubstate =
  | "anonymous"
  | "no-site"
  | "never-synced"
  | "stale-telemetry"
  | "live";

/** Input signals the detector needs. All optional on purpose — callers from
 *  server components may not know every signal up front. */
export interface OnboardingSignals {
  /** `sip.accessToken` cookie value, or undefined when unauthenticated. */
  accessToken?: string;
  /** `sip.activeSiteId` cookie value, or undefined when no site is selected. */
  activeSiteId?: string;
  /** Engine calculation mode for the latest aggregate. */
  mode?: "real" | "estimated" | "forecast";
  /**
   * ISO timestamp of the last successful telemetry sync / aggregate
   * generation. Used to drive the "stale" detection.
   */
  lastGeneratedAtIso?: string;
  /** Now, injected for testability. Defaults to `Date.now()` at call time. */
  nowMs?: number;
}

// ---------------------------------------------------------------------------
// Thresholds — single source of truth for the substate rules.
// ---------------------------------------------------------------------------
/** A system that hasn't reported within this window is treated as stale. */
export const STALE_TELEMETRY_THRESHOLD_MS = 24 * 60 * 60 * 1000; // 24h

// ---------------------------------------------------------------------------
// Detection — precedence: anonymous > no-site > never-synced > stale > live.
// ---------------------------------------------------------------------------
/**
 * Resolve the 5-value onboarding substate from the available signals.
 *
 * Precedence is important and intentional:
 *   - Anonymous beats everything (no auth → marketing surface).
 *   - No-site beats sync state (authenticated but zero setup → add-a-site
 *     flow, not a telemetry error).
 *   - Never-synced beats stale (no real reading ever → still a connect
 *     flow, not a reconnect flow).
 *   - Stale beats live (last sync > threshold → degraded, show ribbon).
 *   - Live is the terminal state.
 */
export function deriveOnboardingSubstate(
  signals: OnboardingSignals,
): OnboardingSubstate {
  const { accessToken, activeSiteId, mode, lastGeneratedAtIso } = signals;

  if (!accessToken) return "anonymous";
  if (!activeSiteId) return "no-site";

  // Forecast mode means the engine never received real hardware data for
  // this site. Note: "estimated" mode (region weather extrapolation) still
  // counts as a working pipeline — we only demote when there's truly no
  // live reading to anchor on.
  if (mode === "forecast") return "never-synced";

  if (lastGeneratedAtIso) {
    const generatedAt = Date.parse(lastGeneratedAtIso);
    if (!Number.isNaN(generatedAt)) {
      const now = signals.nowMs ?? Date.now();
      if (now - generatedAt > STALE_TELEMETRY_THRESHOLD_MS) {
        return "stale-telemetry";
      }
    }
  }

  return "live";
}

// ---------------------------------------------------------------------------
// Convenience predicates — keep dashboard logic boring and readable.
// ---------------------------------------------------------------------------
/**
 * Which substates warrant a full hero replacement (Layer 3). Substate D
 * intentionally returns false: stale telemetry uses the ribbon pattern
 * instead so the user's last-known state stays visible.
 */
export function shouldReplaceHero(substate: OnboardingSubstate): boolean {
  return (
    substate === "anonymous" ||
    substate === "no-site" ||
    substate === "never-synced"
  );
}

/** Whether the page should render the stale-telemetry ribbon (Layer 2). */
export function shouldRenderStaleRibbon(substate: OnboardingSubstate): boolean {
  return substate === "stale-telemetry";
}

/**
 * Whether estimated/forecast chips should be applied to data cards. True
 * for A/B/C (all zero-data-ish states) and false for D (we still show
 * the last-known real numbers) and E.
 */
export function shouldTagAsEstimated(substate: OnboardingSubstate): boolean {
  return shouldReplaceHero(substate);
}

// ---------------------------------------------------------------------------
// Copy library — one place where all substate-specific strings live.
// The component that displays them is intentionally dumb and just reads
// from this table.
// ---------------------------------------------------------------------------
export interface SubstateCopy {
  eyebrow: string;
  headline: string;
  body: string;
  ctaLabel: string;
  /** Which checklist step is currently the *active* one. */
  activeStepIndex: number;
}

export const SUBSTATE_COPY: Record<OnboardingSubstate, SubstateCopy> = {
  anonymous: {
    eyebrow: "Preview mode",
    headline: "See how much your solar could save you.",
    body: "Create a free account to connect your system and unlock real-time monitoring.",
    ctaLabel: "Create free account",
    activeStepIndex: 0,
  },
  "no-site": {
    eyebrow: "Almost there",
    headline: "Add your first system to get started.",
    body: "We'll personalize every number on this dashboard once we know your setup.",
    ctaLabel: "Add your system",
    activeStepIndex: 1,
  },
  "never-synced": {
    eyebrow: "Estimated view",
    headline: "Your inverter isn't talking to us yet.",
    body: "Connect your inverter to switch from estimated values to real-time monitoring.",
    ctaLabel: "Connect your inverter",
    activeStepIndex: 2,
  },
  "stale-telemetry": {
    eyebrow: "Live data paused",
    headline: "We haven't heard from your system in a while.",
    body: "The dashboard is showing your last-known state. Reconnect to resume live monitoring.",
    ctaLabel: "Troubleshoot connection",
    activeStepIndex: 3,
  },
  live: {
    eyebrow: "Live",
    headline: "Your system is running.",
    body: "",
    ctaLabel: "",
    activeStepIndex: 3,
  },
};

// ---------------------------------------------------------------------------
// Onboarding steps — the checklist renders this array verbatim.
// ---------------------------------------------------------------------------
export interface OnboardingStep {
  id: "account" | "site" | "connect" | "first-reading";
  label: string;
  sublabel: string;
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: "account",
    label: "Create your account",
    sublabel: "Free, 30 seconds, no card.",
  },
  {
    id: "site",
    label: "Add your system details",
    sublabel: "Panel count, tilt, location.",
  },
  {
    id: "connect",
    label: "Connect your inverter",
    sublabel: "SolarEdge · Enphase · SMA · Fronius.",
  },
  {
    id: "first-reading",
    label: "Wait for first reading",
    sublabel: "Usually ~5 minutes after connect.",
  },
];
