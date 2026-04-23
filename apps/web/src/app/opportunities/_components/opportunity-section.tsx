"use client";

/**
 * Client-side wrapper around a single Opportunities section.
 *
 * As of Sprint 2 Commit 4 every CTA routes through the shared
 * `useConversionFlow()` hook (docs/redesign/15-conversion-flow.md).
 * This component's only responsibility now is layout + "request
 * sent" success chips that fade out after 4 seconds (spec §6).
 */

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import type { CatalogItem } from "@/data/marketplace/types";
import {
  OpportunityMarketplaceCard,
  type OpportunityMarketplaceCardProps,
} from "./opportunity-marketplace-card";
import {
  useConversionFlow,
  useConversionFlowState,
  type ConversionContext,
} from "@/hooks/use-conversion-flow";
import { toRecommendationType } from "@/lib/view-models/marketplace-catalog";
import { track } from "@/lib/analytics/client";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
export interface OpportunitySectionProps {
  id: string;
  title: string;
  subtitle: string;
  items: CatalogItem[];
  siteId: string;
  accessToken?: string;
  /** Pre-computed muted flag per item (doc 07 §8). Falls back to
   *  internal logic when absent. */
  mutedItemIds?: ReadonlySet<string>;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function OpportunitySection({
  id,
  title,
  subtitle,
  items,
  siteId,
  accessToken,
  mutedItemIds,
}: OpportunitySectionProps) {
  const { start } = useConversionFlow();
  const flowState = useConversionFlowState();

  // Track the last item whose flow completed so we can render the
  // contextual success chip on the originating card (spec §6).
  const [successItemId, setSuccessItemId] = useState<string | null>(null);

  useEffect(() => {
    if (
      flowState.step === "confirmation" &&
      flowState.context?.catalogItemId &&
      items.some((it) => it.id === flowState.context?.catalogItemId)
    ) {
      setSuccessItemId(flowState.context.catalogItemId);
    }
  }, [flowState.step, flowState.context, items]);

  useEffect(() => {
    if (!successItemId) return;
    const t = window.setTimeout(() => setSuccessItemId(null), 4000);
    return () => window.clearTimeout(t);
  }, [successItemId]);

  // Impression event fires once per mount per section (spec 17 §3.2).
  useEffect(() => {
    track(
      "opportunities_section_impression",
      { section: id, itemCount: items.length },
      { surface: "opportunities_section", siteId },
    );
  }, [id, items.length, siteId]);

  const handleCta = useCallback<
    NonNullable<OpportunityMarketplaceCardProps["onCtaClick"]>
  >(
    (item) => {
      // Resolve the recommendation type from the item's `appliesTo`
      // set. Falls back to the section-implied type when the set is
      // empty, but the catalog validator guarantees ≥ 1 entry.
      const rec =
        item.appliesTo[0] ??
        toRecommendationType(item.category) ??
        "automation_opportunity";

      const context: ConversionContext = {
        sourceSurface: "opportunities_section",
        recommendationType: rec,
        catalogItemId: item.id,
        catalogItemTitle: item.title,
        catalogItemBrand: item.brand,
        monthlyGainNis: item.estimatedMonthlyGain,
        yearlyGainNis: item.estimatedYearlyGain,
        priceRange: item.priceRange,
        confidence: item.confidence,
        priority: item.confidence === "high" ? "high" : "medium",
        ctaKind: item.ctaKind,
        siteId,
        accessToken,
      };
      track(
        "catalog_item_clicked",
        {
          itemId: item.id,
          category: item.category,
          recommendationType: rec,
          confidence: item.confidence,
          sourceSurface: "opportunities_section",
        },
        { surface: "opportunities_section", siteId },
      );
      start(context);
    },
    [accessToken, siteId, start],
  );

  const muted = mutedItemIds ?? defaultMutedIds(items);

  return (
    <section
      aria-labelledby={`opps-section-${id}-title`}
      data-section-id={id}
      className="space-y-4"
    >
      <header className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2
            id={`opps-section-${id}-title`}
            className="text-xl font-semibold tracking-tight"
          >
            {title}
          </h2>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <span className="text-xs text-muted-foreground">
          {items.length} {items.length === 1 ? "result" : "results"}
        </span>
      </header>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <div key={item.id} className="relative">
            <OpportunityMarketplaceCard
              item={item}
              onCtaClick={handleCta}
              muted={muted.has(item.id)}
            />
            {successItemId === item.id ? (
              <div
                role="status"
                className="pointer-events-none absolute inset-x-4 top-4 flex items-center justify-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-500 backdrop-blur"
              >
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                Request sent — a provider will contact you within 48h
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}

/**
 * Fallback muted-items selector. Doc 07 §8: low-confidence items get
 * pushed down and dimmed. We key off confidence alone until engine
 * priority reaches the catalog layer.
 */
function defaultMutedIds(items: readonly CatalogItem[]): ReadonlySet<string> {
  return new Set(
    items.filter((it) => it.confidence === "low").map((it) => it.id),
  );
}
