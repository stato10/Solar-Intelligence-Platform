# 07 — Opportunities / Marketplace

Score baseline: **6/10**. Gap: underpopulated and not yet commercial-feeling. Strategically the highest-upside page.

References: [00-design-tokens.md](./00-design-tokens.md), [01-state-contracts.md](./01-state-contracts.md), [11-ai-insight-card.md](./11-ai-insight-card.md), [12-empty-states.md](./12-empty-states.md), [13-voice-and-copy.md](./13-voice-and-copy.md), [14-marketplace-catalog.md](./14-marketplace-catalog.md), [15-conversion-flow.md](./15-conversion-flow.md), [17-monetization.md](./17-monetization.md).

---

## 1. Current state

- Page: [apps/web/src/app/opportunities/page.tsx](../../apps/web/src/app/opportunities/page.tsx)
- Cards: [apps/web/src/app/opportunities/_components/opportunity-card.tsx](../../apps/web/src/app/opportunities/_components/opportunity-card.tsx)
- Carousel: [apps/web/src/components/dashboard/MarketplaceCarousel.tsx](../../apps/web/src/components/dashboard/MarketplaceCarousel.tsx) — currently reads from a hardcoded `MARKETPLACE_DATABASE` constant.
- Layout: hero → single opportunity grid → optional carousel → footer.

---

## 2. Problems

- Often renders one card on a huge page — perception of incompleteness.
- No section grouping by intent.
- Catalog data is hardcoded inside a component file.

---

## 3. Redesign intent

Turn the page into a structured **marketplace**, organized by intent, with cards that communicate why they were selected for this user, estimated gain, and cost. Data sourced from the typed catalog in [14-marketplace-catalog.md](./14-marketplace-catalog.md), with the engine mapping in the same doc determining what appears in each section.

---

## 4. Hero

Replace the current hero copy with:

```
Verified opportunities to improve your solar return.
Selected based on your system profile, usage pattern, and estimated ROI.
```

Sub-line renders summary counts: "`N` recommended now · `M` products · `K` providers".

---

## 5. Sections

Render four sections, in this order, each hidden when empty:

- **Recommended now** — high-priority actions already surfaced on the dashboard. Typically soiling cleaning, critical fixes. Sourced from `ActionPriority = "high"` items and `provider-service` catalog entries.
- **Products worth considering** — hardware upgrades matching the user's system. Sourced from `battery`, `ev-charger`, `smart-switch`, `boiler-controller` categories.
- **Verified service providers** — local providers in the user's `serviceArea`. Sourced from `provider-service` category.
- **Automation solutions** — devices that automate consumption windows. Subset of `smart-switch` and `boiler-controller` with an `automation` tag.

Section rendering rules:

- Minimum 1 card → section shows.
- 0 cards → section hides entirely (no "Coming soon" placeholders).
- If all four sections are empty, render the zero-data marketplace block from [12-empty-states.md](./12-empty-states.md).

---

## 6. Card contract

Every marketplace card must render all the following (fields from [14-marketplace-catalog.md](./14-marketplace-catalog.md)):

- `image` — product thumbnail or provider logo.
- `title` — product or service name.
- `brand` — manufacturer or provider name. `verified = true` renders a "Verified" chip.
- `whyRecommendedTags` — 1–3 short tags explaining the match (e.g. "Dust risk detected", "Low self-consumption").
- `estimatedMonthlyGain` / `estimatedYearlyGain` — at least one must be present, `font-mono`.
- `priceRange` — cost band (e.g. "N.IS 4,800 – 6,200" or "From N.IS 250 / visit").
- `serviceArea` — for providers, the region they cover; hidden for generic products.
- `confidence` — chip per [01-state-contracts.md](./01-state-contracts.md).
- `ctaLabel` — one of "Get quote" / "Configure" / "Book" / "Learn more".
- `ctaKind` — `quote | configure | book | external`.

Layout (`p-5`, `rounded-2xl`):

```
+---------------------------------------------+
| [thumbnail]                                 |
|                                             |
| Title (text-lg)     [Verified chip]         |
| Brand (text-xs muted)                       |
|                                             |
| Why: [tag] [tag]                            |
| Est. gain: N.IS 55 / month                  |
| Price: N.IS 4,800 – 6,200                   |
|                                             |
| [Primary CTA]     confidence px             |
+---------------------------------------------+
```

Grid: 3-col at `xl`, 2-col at `md`, 1-col below `md`.

---

## 7. Component changes

### Modify

- [apps/web/src/app/opportunities/page.tsx](../../apps/web/src/app/opportunities/page.tsx):
  - Add the hero copy and summary sub-line.
  - Render the four sections in order; hide empty sections.
  - Source data from the typed catalog (see doc 14) via a view-model that applies the engine → catalog mapping.
- [opportunity-card.tsx](../../apps/web/src/app/opportunities/_components/opportunity-card.tsx):
  - Extend the card to carry every field in section 6. Treat missing fields as a data-quality failure (log a warning; do not render the card without `title`, `estimatedMonthlyGain` or `estimatedYearlyGain`, `priceRange`, `ctaLabel`, `ctaKind`).
- [MarketplaceCarousel.tsx](../../apps/web/src/components/dashboard/MarketplaceCarousel.tsx):
  - Replace `MARKETPLACE_DATABASE` with data from the typed catalog (doc 14). Carousel continues to live on the dashboard; this page uses the full grid.

### Remove

- The current hardcoded `MARKETPLACE_DATABASE` constant (after doc 14 data files exist).

---

## 8. Sort order within a section

Primary: `ActionPriority` (`high > medium > low`).

Secondary: `confidence` (`high > medium > low`).

Tertiary: `estimatedMonthlyGain` desc.

Items with `ActionPriority = low` and `confidence = low` are moved to the bottom of their section and rendered in a muted style.

---

## 9. Instrumentation

- `opportunities_section_impression` — `{ section, itemCount }`.
- `opportunity_card_impression` — `{ itemId, section, recommendationType, confidence }`.
- `opportunity_card_cta_click` — `{ itemId, ctaKind, recommendationType, monthlyGainNis }`.

---

## 10. Definition of Done

- [x] Four sections render with the correct catalog filtering; empty sections hide.
- [ ] Every card renders all mandatory fields from section 6. *(Partial: relies on catalog-load validation rather than a hard fail at render for missing required fields.)*
- [x] No hardcoded catalog data remains in `MarketplaceCarousel.tsx`.
- [x] `MARKETPLACE_DATABASE` import is gone.
- [x] Zero-data experience renders when all four sections are empty.
- [x] All CTAs route through [15-conversion-flow.md](./15-conversion-flow.md).
