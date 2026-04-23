/**
 * Typed marketplace catalog — replaces the hardcoded `MARKETPLACE_DATABASE`
 * constant that used to live inside `MarketplaceCarousel.tsx`.
 *
 * Spec: docs/redesign/14-marketplace-catalog.md §3 (schema) and §2
 * (RecommendationType contract).
 *
 * This module is data-only. Nothing here knows about React, fetch, or
 * the network. The JSON files next to it (`catalog.json`,
 * `providers.json`) are hand-edited during Sprint 2; once a backend
 * `GET /marketplace/catalog` endpoint exists, the response type is
 * identical and the only frontend change is swapping the static import
 * for a fetched source.
 */

// ---------------------------------------------------------------------------
// Recommendation taxonomy (doc 14 §2)
// ---------------------------------------------------------------------------
/**
 * Engine-emitted classification of *why* a recommendation is being surfaced.
 * This is the single pivot between the engine output and the catalog:
 * `item.appliesTo ∩ recommendationTypes` is the "why shown" set.
 */
export type RecommendationType =
  | "soiling"
  | "low_self_consumption"
  | "battery_opportunity"
  | "ev_opportunity"
  | "automation_opportunity";

// ---------------------------------------------------------------------------
// Catalog shapes (doc 14 §3)
// ---------------------------------------------------------------------------
export type CatalogCategory =
  | "cleaning"
  | "robotic-cleaner"
  | "battery"
  | "ev-charger"
  | "smart-switch"
  | "boiler-controller"
  | "provider-service";

export type CatalogConfidence = "high" | "medium" | "low";

export type CatalogCtaKind = "quote" | "configure" | "book" | "external";

/**
 * A catalog item is the unit rendered by every marketplace surface —
 * opportunity sections, dashboard carousel, savings lanes, maintenance
 * concern CTAs.
 *
 * Invariants enforced by `isValidCatalogItem` and by the opportunity
 * card's render contract (doc 07 §6):
 *   - At least one of `estimatedMonthlyGain` / `estimatedYearlyGain`.
 *   - `whyRecommendedTags.length` between 1 and 3.
 *   - `appliesTo.length >= 1`.
 *   - `title`, `ctaLabel`, `ctaKind`, `priceRange` are always present.
 */
export interface CatalogItem {
  id: string;
  category: CatalogCategory;
  title: string;
  brand: string;
  /** Absolute or app-relative URL. Missing assets fall back to the
   *  category default in the component. */
  image: string;
  /** Pre-formatted price band string, e.g. "N.IS 4,800 – 6,200". */
  priceRange: string;
  /** At least one of `estimatedMonthlyGain` / `estimatedYearlyGain` must
   *  be set. Kept in N.IS per the voice-and-copy doc. */
  estimatedMonthlyGain?: number;
  estimatedYearlyGain?: number;
  confidence: CatalogConfidence;
  /** Only populated for provider-service items; ignored for products. */
  serviceArea?: string;
  verified: boolean;
  /** 1–3 short "why shown" tags. Rendered verbatim. */
  whyRecommendedTags: string[];
  /** Which engine `RecommendationType` values this item satisfies.
   *  The catalog filter returns items where
   *  `appliesTo ∩ requestedTypes ≠ ∅`. */
  appliesTo: RecommendationType[];
  ctaLabel: string;
  ctaKind: CatalogCtaKind;
}

/** Provider rows always carry `serviceArea` and a stable `providerId` used
 *  by the conversion flow to pre-select the partner. */
export interface ProviderItem extends CatalogItem {
  category: "provider-service";
  serviceArea: string;
  providerId: string;
}

export interface MarketplaceCatalog {
  items: CatalogItem[];
  providers: ProviderItem[];
}

// ---------------------------------------------------------------------------
// Recommendation → category mapping (doc 14 §2)
// ---------------------------------------------------------------------------
/**
 * Canonical map from a `RecommendationType` to the catalog categories it
 * should pull from. The catalog filter uses this when a caller passes a
 * recommendation *type* instead of an explicit category list.
 *
 * The mapping is intentionally redundant with `item.appliesTo` so both
 * query directions work:
 *   - "Which items apply to `soiling`?" → `appliesTo.includes("soiling")`
 *   - "What sections does `soiling` open?" → `RECOMMENDATION_CATEGORY_MAP.soiling`
 */
export const RECOMMENDATION_CATEGORY_MAP: Record<
  RecommendationType,
  readonly CatalogCategory[]
> = {
  soiling: ["cleaning", "robotic-cleaner", "provider-service"],
  low_self_consumption: [
    "smart-switch",
    "boiler-controller",
    "provider-service",
  ],
  battery_opportunity: ["battery", "provider-service"],
  ev_opportunity: ["ev-charger", "provider-service"],
  automation_opportunity: [
    "smart-switch",
    "boiler-controller",
    "provider-service",
  ],
} as const;

// ---------------------------------------------------------------------------
// Section → category routing (doc 07 §5)
// ---------------------------------------------------------------------------
/**
 * The four sections rendered on the Opportunities page. Each section
 * filters the catalog by category (and, for providers, by service area).
 */
export type OpportunitySection =
  | "recommended-now"
  | "products"
  | "providers"
  | "automation";

export interface SectionDefinition {
  id: OpportunitySection;
  title: string;
  subtitle: string;
  categories: readonly CatalogCategory[];
  /** Extra tag filter applied on top of categories for the automation
   *  section. `undefined` means "no tag filter". */
  requireTag?: string;
}

export const OPPORTUNITY_SECTIONS: readonly SectionDefinition[] = [
  {
    id: "recommended-now",
    title: "Recommended now",
    subtitle: "High-priority fixes the engine surfaced today.",
    // Provider-service with `cleaning` tag is routed here via the
    // `priority === "high"` promotion rule in the view-model — this
    // section does not filter by category alone.
    categories: ["cleaning", "provider-service"],
  },
  {
    id: "products",
    title: "Products worth considering",
    subtitle: "Hardware upgrades matched to your system profile.",
    categories: [
      "battery",
      "ev-charger",
      "robotic-cleaner",
    ],
  },
  {
    id: "providers",
    title: "Verified service providers",
    subtitle: "Local professionals that cover your area.",
    categories: ["provider-service"],
  },
  {
    id: "automation",
    title: "Automation solutions",
    subtitle: "Devices that shift consumption to your production window.",
    categories: ["smart-switch", "boiler-controller"],
  },
] as const;

// ---------------------------------------------------------------------------
// Validation helpers — run at import time so a bad JSON edit fails loud.
// ---------------------------------------------------------------------------
export function isValidCatalogItem(item: unknown): item is CatalogItem {
  if (typeof item !== "object" || item === null) return false;
  const it = item as Partial<CatalogItem>;
  const hasGain =
    typeof it.estimatedMonthlyGain === "number" ||
    typeof it.estimatedYearlyGain === "number";
  const tagsOk =
    Array.isArray(it.whyRecommendedTags) &&
    it.whyRecommendedTags.length >= 1 &&
    it.whyRecommendedTags.length <= 3;
  const appliesOk =
    Array.isArray(it.appliesTo) && it.appliesTo.length >= 1;
  return (
    typeof it.id === "string" &&
    typeof it.title === "string" &&
    typeof it.brand === "string" &&
    typeof it.priceRange === "string" &&
    typeof it.ctaLabel === "string" &&
    typeof it.ctaKind === "string" &&
    typeof it.confidence === "string" &&
    typeof it.verified === "boolean" &&
    hasGain &&
    tagsOk &&
    appliesOk
  );
}
