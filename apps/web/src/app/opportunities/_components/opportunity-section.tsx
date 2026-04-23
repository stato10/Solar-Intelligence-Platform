"use client";

/**
 * Client-side wrapper around a single Opportunities section. Owns:
 *   - the success-chip state (shown for 4s after a CTA completes,
 *     per docs/redesign/15-conversion-flow.md §6), and
 *   - the temporary CTA → lead-intent bridge.
 *
 * When the shared `useConversionFlow` hook lands in the next commit,
 * this wrapper swaps its handler for it with zero card-side changes.
 */

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import type { CatalogItem } from "@/data/marketplace/types";
import {
  OpportunityMarketplaceCard,
  type OpportunityMarketplaceCardProps,
} from "./opportunity-marketplace-card";
import type { LeadSourceType } from "@/lib/contracts/marketplace";
import { createLeadIntent } from "@/lib/api/marketplace";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
/** Maps a catalog category to the engine's existing `LeadSourceType`
 *  enum. The conversion flow will replace this with richer routing in
 *  the next commit; for now it preserves backward-compat with the
 *  current `/leads/intents` endpoint. */
function toLeadSourceType(item: CatalogItem): LeadSourceType {
  switch (item.category) {
    case "cleaning":
    case "robotic-cleaner":
      return "cleaning_recommendation";
    case "battery":
      return "battery_recommendation";
    case "ev-charger":
      return "ev_recommendation";
    case "smart-switch":
    case "boiler-controller":
      return "automation_recommendation";
    case "provider-service":
      // Providers route to the closest matching lead type via
      // `appliesTo`. Fall back to automation as the safest bucket.
      if (item.appliesTo.includes("soiling")) return "cleaning_recommendation";
      if (item.appliesTo.includes("battery_opportunity"))
        return "battery_recommendation";
      if (item.appliesTo.includes("ev_opportunity"))
        return "ev_recommendation";
      return "automation_recommendation";
    default:
      return "automation_recommendation";
  }
}

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
  const [successItemId, setSuccessItemId] = useState<string | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);

  // Auto-dismiss the success chip after 4s (spec §6).
  useEffect(() => {
    if (!successItemId) return;
    const t = window.setTimeout(() => setSuccessItemId(null), 4000);
    return () => window.clearTimeout(t);
  }, [successItemId]);

  const handleCta = useCallback<
    NonNullable<OpportunityMarketplaceCardProps["onCtaClick"]>
  >(
    async (item) => {
      setErrorText(null);
      try {
        await createLeadIntent(
          {
            siteId,
            sourceType: toLeadSourceType(item),
            sourceReference: item.id,
            title: `${item.ctaLabel} — ${item.title}`,
            estimatedValue: item.estimatedMonthlyGain ?? item.estimatedYearlyGain,
            metadataJson: {
              catalogItemId: item.id,
              category: item.category,
              brand: item.brand,
              section: id,
              ctaKind: item.ctaKind,
              confidence: item.confidence,
              whyRecommendedTags: item.whyRecommendedTags,
            },
          },
          accessToken,
        );
        setSuccessItemId(item.id);
      } catch (err) {
        setErrorText(
          err instanceof Error
            ? err.message
            : "We couldn't send that. Try again.",
        );
      }
    },
    [accessToken, id, siteId],
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

      {errorText ? (
        <p
          role="alert"
          className="rounded-lg border border-rose-500/30 bg-rose-500/5 px-3 py-2 text-xs text-rose-500"
        >
          {errorText}
        </p>
      ) : null}

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
 * Fallback muted-items selector. Doc 07 §8: low-confidence **and**
 * low-priority (we only have confidence here) items get pushed down
 * and dimmed. We approximate with confidence alone until engine
 * priority reaches the catalog layer.
 */
function defaultMutedIds(items: readonly CatalogItem[]): ReadonlySet<string> {
  return new Set(items.filter((it) => it.confidence === "low").map((it) => it.id));
}
