# 17 — Monetization and Instrumentation

Makes revenue surfaces explicit and attaches measurable events to each. Without this, no surface can be optimized.

References: [07-opportunities.md](./07-opportunities.md), [14-marketplace-catalog.md](./14-marketplace-catalog.md), [15-conversion-flow.md](./15-conversion-flow.md).

---

## 1. Revenue sources

Three streams, in priority order for this platform:

- **Leads** — referring qualified users to verified providers. Revenue per qualified lead or per completed job.
- **Affiliate** — hardware purchases routed to partner brands (battery, EV charger, smart switch, boiler controller, robotic cleaner).
- **Premium subscription** — unlocks real-time monitoring (via connected hardware), advanced automation, and priority provider matching.

---

## 2. UI → revenue mapping

Every monetizable UI surface is attached to exactly one stream. The table is the source of truth; if a new CTA is added, it must appear here.

- [MarketplaceActionCard.tsx](../../apps/web/src/components/dashboard/MarketplaceActionCard.tsx) → **Lead** (provider services) or **Affiliate** (hardware products) depending on `ctaKind`.
- [OpportunityActionCard.tsx](../../apps/web/src/components/dashboard/OpportunityActionCard.tsx) → **Lead** for most cases; **Affiliate** when `recommendationType ∈ {battery_opportunity, ev_opportunity}` and the user picks a hardware item.
- [opportunity-card.tsx](../../apps/web/src/app/opportunities/_components/opportunity-card.tsx) → routed via the catalog item's `ctaKind` (`quote` / `book` → Lead; `configure` for a device the user does not yet own → Affiliate; `external` → Affiliate).
- [MarketplaceCarousel.tsx](../../apps/web/src/components/dashboard/MarketplaceCarousel.tsx) → same rules per item.
- Maintenance Concern Card CTA (see [03-maintenance.md](./03-maintenance.md)) → **Lead** (provider).
- Automation Device Card CTA (see [06-automation.md](./06-automation.md)) → **Affiliate** when device is missing; **Lead** when a provider install is needed.
- [HardwareConnectCta.tsx](../../apps/web/src/components/dashboard/HardwareConnectCta.tsx) → **Premium subscription** entry point.

---

## 3. Instrumentation events

All events share a common envelope and are fired from a single analytics helper (documented; not created in this phase):

```ts
type AnalyticsEvent = {
  event: string;                // from the list below
  ts: string;                   // ISO timestamp
  userId?: string;
  siteId?: string;
  sessionId: string;
  surface: string;              // the component/page emitting
  props: Record<string, unknown>;
};
```

### 3.1 CTA lifecycle (aligned with [15-conversion-flow.md](./15-conversion-flow.md))

- `cta_click` — props: `{ recommendationType, confidence, priority, monthlyGainNis?, catalogItemId?, ctaKind, sourceSurface }`.
- `modal_open` — props: `{ recommendationType, catalogItemId?, sourceSurface }`.
- `modal_dismiss` — props: `{ stepReached: "context" | "provider" | "form", reason: "close" | "cancel" | "timeout" }`.
- `provider_selected` — props: `{ providerId, recommendationType, catalogItemId? }`.
- `lead_submit_attempt` — props: `{ providerId, recommendationType, hasEmail, hasPhone }`.
- `lead_submitted` — props: `{ providerId, recommendationType, catalogItemId?, monthlyGainNis? }`.
- `lead_submit_failed` — props: `{ errorCode, step: "validation" | "network" | "server" }`.
- `conversion_complete` — props: `{ providerId, recommendationType, revenueStream: "lead" | "affiliate" | "subscription" }`.

### 3.2 Page and surface impressions

- `page_view` — props: `{ path, systemState }`.
- `hero_impression` — props: `{ surface: "dashboard" | "maintenance" | "savings" | "automation" | "opportunities", systemState }`.
- `action_lane_impression` — props: `{ lane: "now" | "recommended" | "explore", itemCount, totalMonthlyGainNis }`.
- `opportunities_section_impression` — props: `{ section, itemCount }`.
- `catalog_item_clicked` — props: `{ itemId, category, recommendationType, confidence, sourceSurface }`.

### 3.3 Subscription upsell

- `subscription_upsell_shown` — props: `{ surface: "dashboard_right" | "sidebar_utility" | "opportunities" }`.
- `subscription_upsell_click` — props: `{ surface }`.
- `subscription_start` — props: `{ plan, source }`.

### 3.4 Product engagement (not directly revenue, but required for ratios)

- `ai_accordion_toggle` — per page — props: `{ page, opened }`.
- `whatif_toggle_change` — props: `{ toggleId, value, deltaNis }`.
- `settings_control_change` — props: `{ section, controlId }`.

---

## 4. Required ratios

These metrics must be derivable from the events above. Every Sprint 1-4 spec that ships must preserve the events needed for these:

- **CTA click-through rate** per surface: `cta_click / hero_impression` or `/ action_lane_impression`.
- **Modal completion rate**: `conversion_complete / modal_open`.
- **Lead-to-conversion rate**: `conversion_complete / lead_submitted`.
- **Provider-match success**: `provider_selected / modal_open` (step-3 drop-off signal).
- **Zero-data activation**: `settings_control_change(section="system-configuration") / page_view(systemState="no-data")` — measures first-run setup completion.
- **Opportunities engagement**: `catalog_item_clicked / opportunities_section_impression`.

---

## 5. Experimentation hooks

Every Insight Card and Opportunity Card supports a `variantId` (documented, not implemented in this phase) that passes through all CTA events. This allows A/B testing:

- Hero copy variants per `SystemState`.
- CTA label variants ("Request quote" vs "Get quote").
- Sort order experiments in Opportunity sections.

Variants must never affect the lead payload schema. Only UI text and ordering.

---

## 6. Do-not-track and privacy

- Events never include raw contact fields (`name`, `phone`, `email`).
- `userId` is a stable pseudonymous ID.
- Lead submissions are stored server-side; analytics events reference them by `leadId` (added to the payload once created) rather than inline contact data.

---

## 7. Component changes (documented only)

- `apps/web/src/lib/analytics/client.ts` — a thin wrapper that all events go through; owns the envelope, session ID, and error suppression.
- Event emission sites are the per-page docs (dashboard, maintenance, savings, alerts, automation, opportunities, settings, sidebar) and the conversion flow.

---

## 8. Definition of Done

- Every revenue surface in section 2 emits `cta_click` with `revenueStream` derivable from `ctaKind` + `recommendationType`.
- Every conversion-flow step emits its lifecycle event (section 3.1).
- Every page emits `page_view` with `systemState` on mount.
- `subscription_upsell_shown` fires on every surface listed in section 3.3.
- No event payload contains raw PII.
- All 6 ratios in section 4 can be computed from the emitted events alone.
