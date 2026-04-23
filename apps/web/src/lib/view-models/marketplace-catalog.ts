/**
 * Marketplace catalog view-model.
 *
 * Turns the static catalog + the engine's recommendation types into the
 * four grouped sections rendered on the Opportunities page
 * (docs/redesign/07-opportunities.md §5 and §8) and powers the dashboard
 * `MarketplaceCarousel`.
 *
 * This module is the single entry point for every surface that wants
 * "items for this user, already filtered and sorted". Callers pass
 * intent (which recommendation types, which service area); this module
 * owns the filter + sort rules so they stay consistent everywhere.
 */

import catalogData from "@/data/marketplace/catalog.json";
import providersData from "@/data/marketplace/providers.json";
import {
  type CatalogCategory,
  type CatalogConfidence,
  type CatalogItem,
  type MarketplaceCatalog,
  type OpportunitySection,
  type ProviderItem,
  type RecommendationType,
  OPPORTUNITY_SECTIONS,
  RECOMMENDATION_CATEGORY_MAP,
  isValidCatalogItem,
} from "@/data/marketplace/types";
import type { MarketplaceOpportunity } from "@/lib/contracts/marketplace";

// ---------------------------------------------------------------------------
// Static catalog accessor
// ---------------------------------------------------------------------------
/**
 * Loads the static catalog. The import is plain JSON so at runtime this
 * is free. We cast through `unknown` because TypeScript cannot verify
 * the literal shape of JSON imports against the discriminated unions.
 */
export function loadCatalog(): MarketplaceCatalog {
  const items = (catalogData.items as unknown as CatalogItem[]).filter(
    (raw) => {
      const ok = isValidCatalogItem(raw);
      if (!ok && process.env.NODE_ENV !== "production") {
        // Fail loud in dev so bad JSON edits are visible.
        console.warn(
          `[marketplace-catalog] dropping invalid item: ${JSON.stringify(
            (raw as { id?: string }).id ?? raw,
          )}`,
        );
      }
      return ok;
    },
  );
  const providers = (providersData.providers as unknown as ProviderItem[]).filter(
    (raw) =>
      isValidCatalogItem(raw) &&
      typeof (raw as ProviderItem).providerId === "string" &&
      typeof (raw as ProviderItem).serviceArea === "string",
  );
  return { items, providers };
}

// ---------------------------------------------------------------------------
// Recommendation type inference from engine opportunity
// ---------------------------------------------------------------------------
/**
 * The engine currently emits `MarketplaceOpportunity` rows with a
 * free-form `topic` string ("cleaning" / "battery" / "ev" / ...). Map
 * those to the typed `RecommendationType` values the catalog understands.
 *
 * When the engine migrates to emitting `recommendationType` directly,
 * this function becomes a no-op passthrough.
 */
export function toRecommendationType(
  topic: string,
): RecommendationType | null {
  const t = topic.toLowerCase().trim();
  if (t.includes("clean") || t === "soiling") return "soiling";
  if (t.includes("battery")) return "battery_opportunity";
  if (t === "ev" || t.includes("ev") || t.includes("charger"))
    return "ev_opportunity";
  if (t.includes("automat")) return "automation_opportunity";
  if (t.includes("self") || t.includes("consumption"))
    return "low_self_consumption";
  return null;
}

/**
 * Collapse a list of engine opportunities into the unique set of
 * recommendation types that are currently active for this user.
 */
export function deriveRecommendationTypes(
  opportunities: readonly MarketplaceOpportunity[],
): RecommendationType[] {
  const seen = new Set<RecommendationType>();
  for (const opp of opportunities) {
    const mapped = toRecommendationType(opp.topic);
    if (mapped) seen.add(mapped);
  }
  return Array.from(seen);
}

// ---------------------------------------------------------------------------
// Selection + sorting primitives (doc 07 §8)
// ---------------------------------------------------------------------------
export interface SelectCatalogOptions {
  /** Which engine-derived types to match against `item.appliesTo`. If
   *  empty, `matchIfNoTypes` decides the fallback. */
  recommendationTypes: readonly RecommendationType[];
  /** Provider-service items outside this area are filtered out. Pass
   *  `undefined` to allow any area. */
  serviceArea?: string;
  /** Restrict to these categories after the `appliesTo` check. */
  categories?: readonly CatalogCategory[];
  /** When `recommendationTypes` is empty, return:
   *   - `"all"` (default) → every item (used as a demo fallback),
   *   - `"none"` → empty list (strict mode). */
  matchIfNoTypes?: "all" | "none";
  /** Cap the result length after sorting. */
  limit?: number;
}

const CONFIDENCE_RANK: Record<CatalogConfidence, number> = {
  high: 3,
  medium: 2,
  low: 1,
};

function matchesRecommendation(
  item: CatalogItem,
  types: readonly RecommendationType[],
  matchIfNoTypes: "all" | "none",
): boolean {
  if (types.length === 0) return matchIfNoTypes === "all";
  return types.some((t) => item.appliesTo.includes(t));
}

function matchesServiceArea(
  item: CatalogItem,
  serviceArea: string | undefined,
): boolean {
  if (!item.serviceArea) return true; // non-provider items always pass
  if (!serviceArea) return true; // caller didn't restrict
  if (item.serviceArea.toLowerCase().includes("nationwide")) return true;
  return item.serviceArea.toLowerCase().includes(serviceArea.toLowerCase());
}

/**
 * Sort order (doc 07 §8):
 *   1. Confidence: high > medium > low.
 *   2. Monthly gain desc (falls back to yearly/12).
 *   3. Verified items before unverified at equal rank.
 * Items with `confidence === "low"` are pushed to the end — they still
 * render, but muted by the UI.
 */
function estimateMonthlyGain(item: CatalogItem): number {
  if (typeof item.estimatedMonthlyGain === "number")
    return item.estimatedMonthlyGain;
  if (typeof item.estimatedYearlyGain === "number")
    return item.estimatedYearlyGain / 12;
  return 0;
}

export function sortCatalogItems<T extends CatalogItem>(items: T[]): T[] {
  return items.slice().sort((a, b) => {
    const lowA = a.confidence === "low" ? 1 : 0;
    const lowB = b.confidence === "low" ? 1 : 0;
    if (lowA !== lowB) return lowA - lowB;

    const confDiff = CONFIDENCE_RANK[b.confidence] - CONFIDENCE_RANK[a.confidence];
    if (confDiff !== 0) return confDiff;

    const gainDiff = estimateMonthlyGain(b) - estimateMonthlyGain(a);
    if (gainDiff !== 0) return gainDiff;

    const verifiedDiff = Number(b.verified) - Number(a.verified);
    return verifiedDiff;
  });
}

/**
 * Primary entry point. Returns the catalog items — products and
 * providers merged — that match the given intent, in display order.
 */
export function selectCatalogItems(
  options: SelectCatalogOptions,
): CatalogItem[] {
  const {
    recommendationTypes,
    serviceArea,
    categories,
    matchIfNoTypes = "all",
    limit,
  } = options;

  const catalog = loadCatalog();
  const merged: CatalogItem[] = [...catalog.items, ...catalog.providers];

  const filtered = merged.filter((item) => {
    if (categories && !categories.includes(item.category)) return false;
    if (!matchesRecommendation(item, recommendationTypes, matchIfNoTypes))
      return false;
    if (!matchesServiceArea(item, serviceArea)) return false;
    return true;
  });

  const sorted = sortCatalogItems(filtered);
  return typeof limit === "number" ? sorted.slice(0, limit) : sorted;
}

// ---------------------------------------------------------------------------
// Section view-model for the Opportunities page (doc 07 §5)
// ---------------------------------------------------------------------------
export interface OpportunitySectionVm {
  id: OpportunitySection;
  title: string;
  subtitle: string;
  items: CatalogItem[];
}

export interface OpportunitiesCatalogViewModel {
  sections: OpportunitySectionVm[];
  totals: {
    productCount: number;
    providerCount: number;
    recommendedNowCount: number;
  };
  /** True when *all* sections are empty — the page should render the
   *  zero-data marketplace block from doc 12. */
  isEmpty: boolean;
  /** Engine-derived types used to build this view. Exposed for
   *  instrumentation and for child cards. */
  recommendationTypes: RecommendationType[];
}

/**
 * Build the 4-section Opportunities view-model.
 *
 * `opportunities` is the raw engine output. `serviceArea` is optional —
 * when provided, provider-service items outside the area are filtered
 * out. When empty, this function falls back to showing the full catalog
 * so the marketplace never looks barren during onboarding / no-data
 * states.
 */
export function toOpportunitiesCatalogViewModel(
  opportunities: readonly MarketplaceOpportunity[],
  serviceArea?: string,
): OpportunitiesCatalogViewModel {
  const recommendationTypes = deriveRecommendationTypes(opportunities);
  // When the engine has not surfaced any recommendation types, the
  // page stays useful by showing the full catalog as a "browse mode".
  // The individual sections still apply their category filters.
  const baseOptions = {
    recommendationTypes,
    serviceArea,
    matchIfNoTypes: "all" as const,
  };

  // Section 1 — Recommended now.
  //  Strict match: must apply to at least one *current* recommendation
  //  type. Empty when the engine has not flagged anything today.
  const recommendedNow = selectCatalogItems({
    ...baseOptions,
    recommendationTypes, // keep strict even if empty
    matchIfNoTypes: "none",
    categories: ["cleaning", "provider-service"],
  }).filter((item) => {
    // Only keep `provider-service` rows that match a cleaning or
    // soiling topic — avoids dragging battery/automation providers
    // into the "Recommended now" lane.
    if (item.category === "provider-service") {
      return item.appliesTo.includes("soiling");
    }
    return true;
  });

  // Section 2 — Products worth considering.
  const products = selectCatalogItems({
    ...baseOptions,
    categories: ["battery", "ev-charger", "robotic-cleaner"],
  });

  // Section 3 — Verified providers.
  const providers = selectCatalogItems({
    ...baseOptions,
    categories: ["provider-service"],
  });

  // Section 4 — Automation solutions.
  const automation = selectCatalogItems({
    ...baseOptions,
    categories: ["smart-switch", "boiler-controller"],
  });

  const sections: OpportunitySectionVm[] = [];
  const byId = (id: OpportunitySection) =>
    OPPORTUNITY_SECTIONS.find((s) => s.id === id)!;

  if (recommendedNow.length > 0) {
    const def = byId("recommended-now");
    sections.push({
      id: def.id,
      title: def.title,
      subtitle: def.subtitle,
      items: recommendedNow,
    });
  }
  if (products.length > 0) {
    const def = byId("products");
    sections.push({
      id: def.id,
      title: def.title,
      subtitle: def.subtitle,
      items: products,
    });
  }
  if (providers.length > 0) {
    const def = byId("providers");
    sections.push({
      id: def.id,
      title: def.title,
      subtitle: def.subtitle,
      items: providers,
    });
  }
  if (automation.length > 0) {
    const def = byId("automation");
    sections.push({
      id: def.id,
      title: def.title,
      subtitle: def.subtitle,
      items: automation,
    });
  }

  const isEmpty = sections.length === 0;

  return {
    sections,
    totals: {
      productCount: products.length,
      providerCount: providers.length,
      recommendedNowCount: recommendedNow.length,
    },
    isEmpty,
    recommendationTypes,
  };
}

// ---------------------------------------------------------------------------
// Catalog used by `MarketplaceCarousel` on the dashboard.
// ---------------------------------------------------------------------------
/**
 * Dashboard carousel picks a curated cross-category mix so the strip
 * never looks all-one-thing. Strict recommendation match when types
 * are known; fall back to a popular-first cross-section otherwise.
 */
export function selectCarouselItems(
  opportunities: readonly MarketplaceOpportunity[],
  limit = 6,
): CatalogItem[] {
  const recommendationTypes = deriveRecommendationTypes(opportunities);

  if (recommendationTypes.length === 0) {
    // Demo mode — show a hand-picked cross-section.
    const catalog = loadCatalog();
    const mix = [...catalog.items, ...catalog.providers];
    return sortCatalogItems(mix).slice(0, limit);
  }

  // Expand the recommendation types into candidate categories, then
  // pull the top `limit` items by confidence + gain.
  const allowed = new Set<CatalogCategory>();
  for (const t of recommendationTypes) {
    for (const cat of RECOMMENDATION_CATEGORY_MAP[t]) allowed.add(cat);
  }
  return selectCatalogItems({
    recommendationTypes,
    matchIfNoTypes: "none",
    categories: Array.from(allowed),
    limit,
  });
}
