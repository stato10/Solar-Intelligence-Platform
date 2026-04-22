# 01 — State Contracts

This doc defines three contracts that every page and component must obey. Without this, pages will invent their own state logic and the product becomes inconsistent.

Downstream files that must implement these contracts:

- [apps/web/src/app/dashboard/page.tsx](../../apps/web/src/app/dashboard/page.tsx)
- [HeroInsightCard.tsx](../../apps/web/src/components/dashboard/HeroInsightCard.tsx)
- [LossIntelligenceCard.tsx](../../apps/web/src/components/dashboard/LossIntelligenceCard.tsx)
- [EnergyDecisionsSection.tsx](../../apps/web/src/components/dashboard/EnergyDecisionsSection.tsx)
- [AiInsightsPanel.tsx](../../apps/web/src/components/dashboard/AiInsightsPanel.tsx)
- [apps/web/src/app/alerts/_components/alerts-list.tsx](../../apps/web/src/app/alerts/_components/alerts-list.tsx)
- [apps/web/src/app/maintenance/_components/maintenance-ai-insights-section.tsx](../../apps/web/src/app/maintenance/_components/maintenance-ai-insights-section.tsx)
- [apps/web/src/app/savings/_components/savings-ai-insights-section.tsx](../../apps/web/src/app/savings/_components/savings-ai-insights-section.tsx)

---

## Contract 1 — `SystemState`

```ts
type SystemState =
  | "healthy"       // all metrics within expected ranges
  | "optimization"  // no faults, but measurable upside remains
  | "warning"       // soft degradation, action recommended
  | "critical"      // active loss, action required
  | "no-data"       // site not yet connected / ingestion gap
```

Derivation (frontend view-model layer, e.g. [apps/web/src/lib/view-models](../../apps/web/src/lib) analogues):

- `critical` — any metric class with `severity = "critical"`, or active fault alert, or loss card reports `> N.IS 200/month` active loss.
- `warning` — any metric with `severity = "warning"`, or soiling risk above its threshold, or heat impact above its threshold.
- `optimization` — no warnings, but the savings delta (current vs potential) is non-trivial.
- `healthy` — no warnings and optimization delta is below the threshold.
- `no-data` — no site selected, or backend reports no telemetry in the last `24h`.

Precedence: `critical > warning > optimization > healthy`. `no-data` overrides all.

### Surface behavior

- **Dashboard hero (`HeroInsightCard`)**:
  - `critical` — red-tinted card, headline = biggest loss, primary CTA = resolve the issue.
  - `warning` — amber-tinted, headline = the at-risk metric, primary CTA = inspect / book fix.
  - `optimization` — neutral-positive, headline = "Your system is stable today", subheadline = "You still have N.IS X/month optimization potential", primary CTA = open opportunities.
  - `healthy` — neutral-positive, headline = "Your system is running well", subheadline = last 7-day summary, CTA demoted.
  - `no-data` — replaces the hero with the zero-data experience defined in [12-empty-states.md](./12-empty-states.md).
- **Alerts page** — tiered counts derive from the same enum. `critical` and `warning` alerts surface as their own tiers; `optimization` and `healthy` render the calm-state block.
- **Maintenance urgency strip** — `warning` and `critical` show the urgency indicator; `healthy` and `optimization` hide it.
- **Marketplace trigger** — `critical` and `warning` prioritize remedial items (cleaning, inspection). `optimization` prioritizes gains (automation, battery). `healthy` de-emphasizes the marketplace row.

### Visual mapping

- `critical` — `state-danger` utility class from [globals.css](../../apps/web/src/app/globals.css).
- `warning` — `state-warning`.
- `optimization` — `state-good` with an amber accent badge.
- `healthy` — `state-good`.
- `no-data` — neutral `glass-card` with the zero-data illustration/CTA.

---

## Contract 2 — `ActionPriority`

```ts
type ActionPriority = "high" | "medium" | "low"
```

Rules:

- `high` — action prevents or recovers **active money loss** (for example, soiling cleaning when loss > N.IS 50/month, critical alert remediation). Shown in the **Now** group.
- `medium` — action improves **forecasted ROI** (battery, EV charger, automation devices). Shown in the **Recommended** group.
- `low` — optional optimization, long-payback, or informational upsell. Shown in the **Explore later** group.

Drives:

- **Card order** — `high` always first, `low` always last.
- **Color intensity** — `high` uses `--danger`/`--warning` trims, `medium` uses neutral, `low` uses muted.
- **CTA strength** — `high` = solid primary button; `medium` = outline button; `low` = text link.
- **Typography** — `high` headlines use `text-2xl`; `medium` `text-lg`; `low` body weight.

Emission source: the aggregate API view-models (see [apps/web/src/lib/api/dashboard.ts](../../apps/web/src/lib/api/dashboard.ts), view-model layer under `apps/web/src/lib/view-models/` referenced elsewhere).

---

## Contract 3 — AI confidence → UI behavior

The AI contract already carries a `confidence` score per insight/decision (`High | Medium | Low`). This contract binds confidence to UI.

- **High**:
  - Render as a full Insight Card (see [11-ai-insight-card.md](./11-ai-insight-card.md)).
  - Primary solid CTA.
  - May drive the hero if also `high` priority.
  - Show confidence chip as `success`-tinted.
- **Medium**:
  - Render as an Insight Card, but CTA is outline.
  - May appear in Recommended group.
  - Confidence chip as `warning`-tinted.
- **Low**:
  - Render as a muted suggestion row (not a full card).
  - No CTA button; a text link "Learn more" opens the accordion.
  - Never surfaced in the hero.
  - Confidence chip as `muted`.

Rule: if the engine returns an insight with `confidence = low` and there is already another insight with `high`, the low-confidence insight collapses into the AI deep-dive accordion.

---

## Usage map (one-glance reference)

- `HeroInsightCard` — consumes `SystemState` (styling + copy).
- `LossIntelligenceCard` — consumes `SystemState` to decide whether to render (hidden on `healthy`), and `ActionPriority` for CTA strength.
- `EnergyDecisionsSection` — sorts its decision cards by `ActionPriority`, styles by `confidence`.
- `AiInsightsPanel` — collapses `low` confidence items; renders `high`/`medium` at the top.
- `alerts-list` — bins by `SystemState`-derived tier (see [05-alerts.md](./05-alerts.md)).
- `MarketplaceCarousel` / `OpportunityCard` — sort order = `ActionPriority`, then `confidence`.

---

## Definition of Done

- A single source helper (e.g. `deriveSystemState(view)`) exists in the view-model layer; no page recomputes state locally.
- Every card that renders state-dependent styling accepts `SystemState` or `ActionPriority` as a typed prop, not ad-hoc booleans.
- `confidence` value is never rendered as raw text; it always resolves to the chip + CTA rules above.
- Storybook or manual QA covers all five `SystemState` values per hero and per AI card.
