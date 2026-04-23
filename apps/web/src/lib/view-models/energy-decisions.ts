/**
 * Energy-decisions view-model helpers.
 *
 * Spec: docs/redesign/01-state-contracts.md §2 (ActionPriority) and §3
 * (AI confidence). This file is the single source of truth that routes raw
 * `EnergyDecisionItem`s emitted by the AI engine into the dashboard's
 * Now / Recommended / Explore-later action lanes — and normalizes the raw
 * engine vocabulary (`"moderate"`, `"not-worth-it-now"`, ...) into the
 * UI vocabulary used by AiInsightCard (`"medium"`, `"info"`, ...).
 *
 * Keep this file pure (no React, no DOM) so both server components and
 * tests can import it safely.
 */

import type { EnergyDecisionItem } from "@/lib/contracts";

// ---------------------------------------------------------------------------
// UI-layer enums — matches docs/redesign/01-state-contracts.md §2 / §3 /
// docs/redesign/11-ai-insight-card.md §5.
// ---------------------------------------------------------------------------
export type ActionPriority = "high" | "medium" | "low";
export type InsightConfidence = "high" | "medium" | "low";
export type InsightSeverity = "critical" | "warning" | "info";

// ---------------------------------------------------------------------------
// Normalizers — map engine vocabulary → UI vocabulary.
// The engine emits `"moderate"` while the UI layer uses `"medium"` (per
// 11-ai-insight-card.md §5). Centralizing this translation avoids scattered
// string-compare drift across components.
// ---------------------------------------------------------------------------

/** `"moderate"` → `"medium"`; other values pass through. */
export function normalizeConfidence(value: EnergyDecisionItem["confidence"]): InsightConfidence {
  switch (value) {
    case "high":
      return "high";
    case "moderate":
      return "medium";
    case "low":
    default:
      return "low";
  }
}

/** Engine severity (`low/moderate/high`) → UI severity (`info/warning/critical`). */
export function normalizeSeverity(value: EnergyDecisionItem["severity"]): InsightSeverity {
  switch (value) {
    case "high":
      return "critical";
    case "moderate":
      return "warning";
    case "low":
    default:
      return "info";
  }
}

// ---------------------------------------------------------------------------
// Priority derivation — docs/redesign/01-state-contracts.md §2.
// ---------------------------------------------------------------------------
/**
 * Decide which action lane a decision belongs to.
 *
 * Intuition:
 *   - "Not worth it now" never competes for attention → always `low`.
 *   - Anything you can act on today without buying hardware is the highest-
 *     leverage item we can surface, so `recommendation = "recommended"` +
 *     `requiresPurchase = false` earns the `high` lane.
 *   - Anything that nudges a purchase (battery / EV / smart switches) or is
 *     a soft "consider this" is forecasted-ROI territory → `medium`.
 *   - Explicit low-severity / low-confidence items fall to `low`.
 *
 * The rules intentionally never elevate a purchase-dependent decision to
 * `high`, so the Now lane stays an actionable "do today" set and never
 * becomes a storefront.
 */
export function derivePriorityFromDecision(decision: EnergyDecisionItem): ActionPriority {
  if (decision.recommendation === "not-worth-it-now") return "low";

  if (!decision.requiresPurchase && decision.recommendation === "recommended") {
    // Behavioral change the user can make today — highest leverage.
    return "high";
  }

  if (decision.recommendation === "recommended" || decision.recommendation === "consider") {
    // Purchase-dependent or soft "consider" → forecasted-ROI improvement.
    return "medium";
  }

  return "low";
}

// ---------------------------------------------------------------------------
// Partitioning
// ---------------------------------------------------------------------------
export interface PartitionedDecisions {
  high: EnergyDecisionItem[];
  medium: EnergyDecisionItem[];
  low: EnergyDecisionItem[];
}

/**
 * Partition a batch of `EnergyDecisionItem`s into the three action lanes
 * used by the dashboard (spec: 02-dashboard.md §8 / §4). Order within each
 * bucket is preserved so engine-level ordering (confidence desc, money desc)
 * carries through to the UI.
 */
export function partitionDecisionsByPriority(
  decisions: EnergyDecisionItem[] | undefined,
): PartitionedDecisions {
  const buckets: PartitionedDecisions = { high: [], medium: [], low: [] };
  if (!decisions) return buckets;

  for (const decision of decisions) {
    buckets[derivePriorityFromDecision(decision)].push(decision);
  }
  return buckets;
}
