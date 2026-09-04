"use client";

/**
 * Adapter: AI contract items (v2/v3 `InsightItem`, `SavingsLineItem`,
 * `ProductRecommendationItem`) → canonical `AiInsightCard`.
 *
 * Spec: docs/redesign/11-ai-insight-card.md §1 — every AI surface
 * (dashboard AI panel, maintenance AI section, savings AI section) must
 * render insight rows through the same component. This adapter owns:
 *   - vocabulary normalization (engine "moderate" → UI "medium" etc.),
 *   - money formatting in the user's active currency,
 *   - the "Why this was flagged" deep-dive (reason + source refs),
 * so the page-level sections stay thin.
 */

import type { LucideIcon } from "lucide-react";
import type { AggregateSourceRef } from "@/lib/contracts/ai-insight-v2";
import {
  normalizeConfidence,
  normalizeSeverity,
  type ActionPriority,
  type InsightSeverity,
} from "@/lib/view-models/energy-decisions";
import { formatSourceRefsForDisplay } from "@/lib/view-models/ai-insights";
import { formatCurrency } from "@/lib/utils/formatters";
import { useCurrency } from "@/hooks/use-currency";
import { AiInsightCard } from "@/components/dashboard/AiInsightCard";

/** Structural shape shared by v2 and v3 insight-like contract items.
 *  `sourceRefs` is widened to `string[]` so both contract versions fit;
 *  the formatter falls back to the raw ref for unknown labels. */
export interface ContractInsightLike {
  id: string;
  title: string;
  message: string;
  severity: "low" | "moderate" | "high";
  confidence: "low" | "moderate" | "high";
  actionability?: "immediate" | "scheduled" | "informational";
  reason: { text: string; sourceRefs: readonly string[] };
  expectedBenefitRangeIlsMonthly?: { min: number; max: number };
}

export interface AiContractInsightCardProps {
  item: ContractInsightLike;
  /**
   * When true, `message` is treated as the Recommended Action and
   * `reason.text` becomes the Impact line (savings items are phrased as
   * actions). When false (default), `message` is the Impact line and the
   * reason lives in the deep-dive.
   */
  actionFromMessage?: boolean;
  /** Extra explanation appended to the deep-dive (e.g. product whyRelevant). */
  extraWhy?: string;
  icon?: LucideIcon;
  className?: string;
}

/** `actionability` → CTA-strength priority. These list surfaces carry no
 *  CTA buttons, so priority only drives typography weight. */
function derivePriority(item: ContractInsightLike): ActionPriority {
  return item.actionability === "informational" ? "low" : "medium";
}

/** Severity chip only when it genuinely matters (mirrors dashboard rule). */
function resolveSeverity(item: ContractInsightLike): InsightSeverity | undefined {
  const normalized = normalizeSeverity(item.severity);
  return normalized === "info" ? undefined : normalized;
}

export function AiContractInsightCard({
  item,
  actionFromMessage = false,
  extraWhy,
  icon,
  className,
}: AiContractInsightCardProps) {
  const { currency, locale } = useCurrency();

  const range = item.expectedBenefitRangeIlsMonthly;
  let money: string | undefined;
  if (range) {
    const min = formatCurrency(Math.round(range.min), { currency, locale, decimals: 0 });
    const max = formatCurrency(Math.round(range.max), { currency, locale, decimals: 0 });
    money = range.min === range.max ? `${min} / month` : `${min}–${max} / month`;
  }

  const sources = formatSourceRefsForDisplay(
    item.reason.sourceRefs as AggregateSourceRef[],
  );
  const deepDive = (
    <div className="space-y-1.5">
      {!actionFromMessage ? (
        <p>
          <span className="font-medium text-foreground/80">Why this was flagged: </span>
          {item.reason.text}
        </p>
      ) : null}
      {extraWhy ? <p>{extraWhy}</p> : null}
      {sources ? (
        <p className="text-[10px] opacity-80">Sources: {sources}</p>
      ) : null}
    </div>
  );
  const hasDeepDive = !actionFromMessage || Boolean(extraWhy) || Boolean(sources);

  return (
    <AiInsightCard
      issue={item.title}
      impact={actionFromMessage ? item.reason.text : item.message}
      recommendedAction={actionFromMessage ? item.message : undefined}
      money={money}
      confidence={normalizeConfidence(item.confidence)}
      priority={derivePriority(item)}
      severity={resolveSeverity(item)}
      icon={icon}
      deepDive={hasDeepDive ? deepDive : undefined}
      className={className}
    />
  );
}
