/**
 * Adapter: `EnergyDecisionItem` → `AiInsightCard`.
 *
 * Preserves the marketplace CTA wiring (battery & EV quotes) that the
 * legacy DecisionCard had, while conforming to the new state-contract
 * rules:
 *   - Confidence normalization (engine "moderate" → UI "medium").
 *   - Priority is computed once, upstream, and passed in as a prop — the
 *     dashboard page owns lane routing so one decision is never rendered
 *     twice by accident.
 */

import type { LucideIcon } from "lucide-react";
import {
  Battery,
  Car,
  Clock,
  Home,
  Lightbulb,
  Wrench,
  Zap,
} from "lucide-react";
import type { EnergyDecisionItem, EnergyDecisionTopic } from "@/lib/contracts";
import type { MarketplaceOpportunity } from "@/lib/contracts/marketplace";
import {
  normalizeConfidence,
  normalizeSeverity,
  type ActionPriority,
  type InsightSeverity,
} from "@/lib/view-models/energy-decisions";
import { AiInsightCard } from "./AiInsightCard";
import { OpportunityActionCard } from "./OpportunityActionCard";

const TOPIC_ICONS: Record<EnergyDecisionTopic, LucideIcon> = {
  "self-consumption-vs-export": Zap,
  "battery-worthiness": Battery,
  "ev-charging": Car,
  "boiler-automation": Home,
  "load-shifting": Clock,
  "maintenance-priority": Wrench,
};

interface EnergyDecisionInsightCardProps {
  decision: EnergyDecisionItem;
  /**
   * Priority resolved upstream by `partitionDecisionsByPriority`. Passing
   * this in (rather than re-deriving) keeps the lane routing and the card
   * rendering in sync — no decision can end up with a high-priority card
   * body but a low-priority lane placement.
   */
  priority: ActionPriority;
  opportunities?: MarketplaceOpportunity[];
  siteId?: string;
  accessToken?: string;
  /** Forces a less prominent layout (used by the Explore-later lane). */
  compact?: boolean;
}

/**
 * Format the engine benefit range into a single human-readable money line.
 * Returns `undefined` when there is no range to display so the card can
 * omit the money row entirely.
 */
function formatBenefit(decision: EnergyDecisionItem): string | undefined {
  const range = decision.estimatedBenefitRangeIlsMonthly;
  if (!range) return undefined;
  if (range.min === range.max) return `₪${range.min} / month`;
  return `₪${range.min}–₪${range.max} / month`;
}

/**
 * Pick the best marketplace opportunity to attach to this decision. Only
 * purchase-driven topics get an attached lead-intent CTA.
 */
function matchOpportunity(
  decision: EnergyDecisionItem,
  opportunities: MarketplaceOpportunity[],
): MarketplaceOpportunity | undefined {
  if (!decision.requiresPurchase) return undefined;
  if (decision.topic === "battery-worthiness") {
    return opportunities.find((o) => o.topic === "battery");
  }
  if (decision.topic === "ev-charging") {
    return opportunities.find((o) => o.topic === "ev");
  }
  return undefined;
}

/**
 * Severity only escalates to the chip when it genuinely matters. The
 * engine emits `"low"` by default for most items and the chip would be
 * noise on a healthy dashboard.
 */
function resolveSeverity(decision: EnergyDecisionItem): InsightSeverity | undefined {
  const normalized = normalizeSeverity(decision.severity);
  return normalized === "info" ? undefined : normalized;
}

export function EnergyDecisionInsightCard({
  decision,
  priority,
  opportunities = [],
  siteId,
  accessToken,
  compact,
}: EnergyDecisionInsightCardProps) {
  const confidence = normalizeConfidence(decision.confidence);
  const severity = resolveSeverity(decision);
  const icon = TOPIC_ICONS[decision.topic] ?? Lightbulb;
  const money = formatBenefit(decision);

  const matched = matchOpportunity(decision, opportunities);

  // Build the CTA. Three shapes:
  //   1. Marketplace-attached (battery / EV that has a live opportunity) →
  //      inject the existing lead-intent button as the CTA element.
  //   2. Other recommended decisions → no CTA for now; Sprint 2 wires the
  //      generic conversion modal. Keeping the slot empty here is
  //      intentional: a fake CTA would read as worse UX than none.
  //   3. Low-confidence items → the AiInsightCard component automatically
  //      collapses to a muted row with no CTA; we don't need to branch.
  const cta =
    matched && decision.recommendation === "recommended"
      ? {
          label:
            decision.topic === "battery-worthiness"
              ? "Get battery quotes"
              : "Explore EV chargers",
          element: (
            <OpportunityActionCard
              title={
                decision.topic === "battery-worthiness"
                  ? "Explore battery systems"
                  : "Smart EV chargers"
              }
              message={
                decision.topic === "battery-worthiness"
                  ? "Connect with top-tier installers for customized battery quotes."
                  : "Find chargers that sync perfectly with your solar production."
              }
              type="product"
              topic={decision.topic === "battery-worthiness" ? "battery" : "ev"}
              estimatedValue={money}
              actionLabel={
                decision.topic === "battery-worthiness"
                  ? "Get battery quotes"
                  : "Explore EV chargers"
              }
              payload={{
                siteId: siteId ?? "",
                sourceType:
                  decision.topic === "battery-worthiness"
                    ? "battery_recommendation"
                    : "ev_recommendation",
                title:
                  decision.topic === "battery-worthiness"
                    ? "Battery request from AI decisions"
                    : "EV charger request from AI decisions",
                estimatedValue: decision.estimatedBenefitRangeIlsMonthly?.min,
              }}
              accessToken={accessToken}
            />
          ),
        }
      : undefined;

  return (
    <AiInsightCard
      issue={decision.title}
      impact={decision.message}
      money={money}
      confidence={confidence}
      priority={compact ? "low" : priority}
      severity={severity}
      icon={icon}
      cta={cta}
    />
  );
}
