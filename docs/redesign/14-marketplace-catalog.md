# 14 — Marketplace Catalog (Typed Mock)

The marketplace today reads from a hardcoded `MARKETPLACE_DATABASE` constant inside [MarketplaceCarousel.tsx](../../apps/web/src/components/dashboard/MarketplaceCarousel.tsx). This doc defines the typed catalog that replaces it, plus the engine → catalog mapping that stops recommendations from feeling random.

References: [01-state-contracts.md](./01-state-contracts.md), [07-opportunities.md](./07-opportunities.md), [11-ai-insight-card.md](./11-ai-insight-card.md), [15-conversion-flow.md](./15-conversion-flow.md).

---

## 1. Proposed file layout

Documented only — these files are **not** created in this phase.

- `apps/web/src/data/marketplace/types.ts` — TypeScript types.
- `apps/web/src/data/marketplace/catalog.json` — product and automation items.
- `apps/web/src/data/marketplace/providers.json` — service providers.

Both JSON files are hand-edited during Sprint 2 using the seed items in section 4. When the backend `GET /marketplace/catalog` endpoint exists, the frontend swaps the static import for the fetch with zero component changes (the shape is identical).

---

## 2. `RecommendationType` contract

The engine emits recommendations classified into:

```ts
type RecommendationType =
  | "soiling"
  | "low_self_consumption"
  | "battery_opportunity"
  | "ev_opportunity"
  | "automation_opportunity";
```

Mapping to catalog categories:

- `soiling` → `cleaning` + `robotic-cleaner` + `provider-service` (with tag `cleaning`).
- `low_self_consumption` → `smart-switch` + `boiler-controller` + `automation_opportunity` behavioral suggestions.
- `battery_opportunity` → `battery` + `provider-service` (with tag `battery-install`).
- `ev_opportunity` → `ev-charger` + `provider-service` (with tag `ev-install`).
- `automation_opportunity` → `smart-switch` + `boiler-controller` (device-targeted) + `provider-service` (with tag `automation-install`).

This mapping is the single source of truth. Every "why shown" reason in a card derives from the mapping — **items never appear without at least one matched `recommendationType`**.

---

## 3. Catalog item schema

```ts
type CatalogCategory =
  | "cleaning"
  | "robotic-cleaner"
  | "battery"
  | "ev-charger"
  | "smart-switch"
  | "boiler-controller"
  | "provider-service";

type CatalogConfidence = "high" | "medium" | "low";

type CatalogCtaKind = "quote" | "configure" | "book" | "external";

type CatalogItem = {
  id: string;
  category: CatalogCategory;
  title: string;
  brand: string;
  image: string;                    // absolute or app-relative URL
  priceRange: string;               // formatted, e.g. "N.IS 4,800 – 6,200"
  estimatedMonthlyGain?: number;    // in N.IS; at least one of monthly/yearly must be set
  estimatedYearlyGain?: number;
  confidence: CatalogConfidence;
  serviceArea?: string;             // for providers
  verified: boolean;
  whyRecommendedTags: string[];     // 1..3 short tags
  appliesTo: RecommendationType[];  // the mapping from section 2
  ctaLabel: string;                 // verb-object, 2-4 words
  ctaKind: CatalogCtaKind;
};

type ProviderItem = CatalogItem & {
  category: "provider-service";
  serviceArea: string;
  providerId: string;               // used by the conversion flow to pre-select
};

type MarketplaceCatalog = {
  items: CatalogItem[];
  providers: ProviderItem[];
};
```

All monetary gains use N.IS units per [13-voice-and-copy.md](./13-voice-and-copy.md).

---

## 4. Seed items (JSON-ready examples)

These are representative placeholders for Sprint 2. Brand choices flagged as "Israel-relevant" are placeholders meant to be replaced with real verified partners when the catalog goes live.

### 4.1 Cleaning

```json
{
  "id": "cleaning-local-standard",
  "category": "cleaning",
  "title": "Professional panel cleaning",
  "brand": "Local cleaning provider",
  "image": "/marketplace/cleaning-standard.jpg",
  "priceRange": "From N.IS 250 / visit",
  "estimatedMonthlyGain": 18,
  "estimatedYearlyGain": 216,
  "confidence": "high",
  "verified": true,
  "whyRecommendedTags": ["Dust risk detected", "7-day window"],
  "appliesTo": ["soiling"],
  "ctaLabel": "Book cleaning",
  "ctaKind": "book"
}
```

### 4.2 Robotic cleaner

```json
{
  "id": "robotic-cleaner-entry",
  "category": "robotic-cleaner",
  "title": "Automated rooftop cleaning unit",
  "brand": "Israel-relevant brand (placeholder)",
  "image": "/marketplace/robotic-cleaner.jpg",
  "priceRange": "N.IS 9,800 – 14,500",
  "estimatedMonthlyGain": 30,
  "estimatedYearlyGain": 360,
  "confidence": "medium",
  "verified": false,
  "whyRecommendedTags": ["Recurring dust", "Large roof area"],
  "appliesTo": ["soiling"],
  "ctaLabel": "Get quote",
  "ctaKind": "quote"
}
```

### 4.3 Battery

```json
{
  "id": "battery-solaredge-home",
  "category": "battery",
  "title": "Residential battery 10kWh",
  "brand": "SolarEdge (placeholder)",
  "image": "/marketplace/battery-solaredge.jpg",
  "priceRange": "N.IS 24,000 – 32,000",
  "estimatedMonthlyGain": 210,
  "estimatedYearlyGain": 2520,
  "confidence": "medium",
  "verified": true,
  "whyRecommendedTags": ["Surplus export > 20%", "Evening consumption"],
  "appliesTo": ["battery_opportunity"],
  "ctaLabel": "Request quote",
  "ctaKind": "quote"
}
```

```json
{
  "id": "battery-byd-home",
  "category": "battery",
  "title": "Residential battery 7.6kWh",
  "brand": "BYD (placeholder)",
  "image": "/marketplace/battery-byd.jpg",
  "priceRange": "N.IS 18,500 – 24,000",
  "estimatedMonthlyGain": 170,
  "estimatedYearlyGain": 2040,
  "confidence": "medium",
  "verified": false,
  "whyRecommendedTags": ["Smaller household", "Shorter payback"],
  "appliesTo": ["battery_opportunity"],
  "ctaLabel": "Request quote",
  "ctaKind": "quote"
}
```

### 4.4 EV charger

```json
{
  "id": "ev-charger-standard",
  "category": "ev-charger",
  "title": "Smart EV charger 7.4kW",
  "brand": "Israel-relevant brand (placeholder)",
  "image": "/marketplace/ev-charger.jpg",
  "priceRange": "N.IS 3,200 – 4,500",
  "estimatedMonthlyGain": 95,
  "estimatedYearlyGain": 1140,
  "confidence": "medium",
  "verified": true,
  "whyRecommendedTags": ["EV detected", "Solar-scheduled charging"],
  "appliesTo": ["ev_opportunity"],
  "ctaLabel": "Configure",
  "ctaKind": "configure"
}
```

### 4.5 Smart switch

```json
{
  "id": "smart-switch-shelly",
  "category": "smart-switch",
  "title": "Smart switch with energy metering",
  "brand": "Shelly (placeholder)",
  "image": "/marketplace/smart-switch.jpg",
  "priceRange": "From N.IS 180",
  "estimatedMonthlyGain": 28,
  "estimatedYearlyGain": 336,
  "confidence": "high",
  "verified": true,
  "whyRecommendedTags": ["Low self-consumption", "Shift heavy loads"],
  "appliesTo": ["low_self_consumption", "automation_opportunity"],
  "ctaLabel": "Configure",
  "ctaKind": "configure"
}
```

### 4.6 Boiler controller

```json
{
  "id": "boiler-controller-standard",
  "category": "boiler-controller",
  "title": "Solar-aware boiler controller",
  "brand": "Israel-relevant brand (placeholder)",
  "image": "/marketplace/boiler-controller.jpg",
  "priceRange": "N.IS 950 – 1,400",
  "estimatedMonthlyGain": 55,
  "estimatedYearlyGain": 660,
  "confidence": "high",
  "verified": true,
  "whyRecommendedTags": ["Electric water heater", "Midday surplus"],
  "appliesTo": ["low_self_consumption", "automation_opportunity"],
  "ctaLabel": "Configure",
  "ctaKind": "configure"
}
```

### 4.7 Providers

```json
{
  "id": "provider-cleaning-central",
  "providerId": "prov-cleaning-central",
  "category": "provider-service",
  "title": "Rooftop cleaning — central Israel",
  "brand": "Verified cleaning technician",
  "image": "/marketplace/provider-cleaning.jpg",
  "priceRange": "From N.IS 250 / visit",
  "estimatedMonthlyGain": 18,
  "confidence": "high",
  "serviceArea": "Tel Aviv + Gush Dan",
  "verified": true,
  "whyRecommendedTags": ["Soiling recovery"],
  "appliesTo": ["soiling"],
  "ctaLabel": "Book visit",
  "ctaKind": "book"
}
```

```json
{
  "id": "provider-battery-installer",
  "providerId": "prov-battery-north",
  "category": "provider-service",
  "title": "Battery installation — certified installer",
  "brand": "Verified battery installer",
  "image": "/marketplace/provider-battery.jpg",
  "priceRange": "Quote on request",
  "estimatedYearlyGain": 2200,
  "confidence": "medium",
  "serviceArea": "Haifa + North",
  "verified": true,
  "whyRecommendedTags": ["Battery ROI", "Local installer"],
  "appliesTo": ["battery_opportunity"],
  "ctaLabel": "Request quote",
  "ctaKind": "quote"
}
```

```json
{
  "id": "provider-automation-specialist",
  "providerId": "prov-automation-central",
  "category": "provider-service",
  "title": "Home automation specialist",
  "brand": "Verified automation specialist",
  "image": "/marketplace/provider-automation.jpg",
  "priceRange": "From N.IS 450 / hour",
  "estimatedMonthlyGain": 45,
  "confidence": "medium",
  "serviceArea": "Nationwide",
  "verified": true,
  "whyRecommendedTags": ["Setup complexity", "Professional install"],
  "appliesTo": ["automation_opportunity", "low_self_consumption"],
  "ctaLabel": "Book consult",
  "ctaKind": "book"
}
```

---

## 5. Selection and sorting

When a view (Opportunities page, dashboard carousel, savings lane, maintenance concern CTA) asks the catalog for items, the view passes:

- `recommendationTypes: RecommendationType[]` — from the current engine output.
- `priority: ActionPriority` (optional).
- `serviceArea: string` (for provider sections).

The catalog returns items such that:

1. `item.appliesTo` intersects `recommendationTypes`.
2. Provider items without matching `serviceArea` are filtered out.
3. Items are sorted by the rules in [07-opportunities.md](./07-opportunities.md) section 8.

---

## 6. Migration to real backend

When `GET /marketplace/catalog` is available in [apps/api](../../apps/api), the response must match `MarketplaceCatalog`. The only frontend change is swapping the static import for a fetched-on-server source; no component changes required. Engine-driven filtering can move server-side; the frontend continues to pass `recommendationTypes`.

---

## 7. Definition of Done

- `apps/web/src/data/marketplace/types.ts`, `catalog.json`, `providers.json` exist (future Sprint 2 execution) with the schema in section 3.
- [MarketplaceCarousel.tsx](../../apps/web/src/components/dashboard/MarketplaceCarousel.tsx) no longer contains `MARKETPLACE_DATABASE`.
- Every catalog item has `appliesTo` populated with at least one `RecommendationType`.
- Provider items always include `serviceArea` and `providerId`.
- Copy in `title`, `whyRecommendedTags`, and `ctaLabel` obeys [13-voice-and-copy.md](./13-voice-and-copy.md).
- JSON validates against the schema (run a schema check in CI; documented as a follow-up).
