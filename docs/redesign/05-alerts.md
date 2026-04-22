# 05 — Alerts

Score baseline: **6.5/10**. Gap: feels empty when there are no alerts; lacks tiering and educational depth.

References: [00-design-tokens.md](./00-design-tokens.md), [01-state-contracts.md](./01-state-contracts.md), [12-empty-states.md](./12-empty-states.md), [13-voice-and-copy.md](./13-voice-and-copy.md).

---

## 1. Current state

- Page: [apps/web/src/app/alerts/page.tsx](../../apps/web/src/app/alerts/page.tsx)
- List: [apps/web/src/app/alerts/_components/alerts-list.tsx](../../apps/web/src/app/alerts/_components/alerts-list.tsx)
- Layout: hero → filter buttons → flat alerts list → footer.

---

## 2. Problems

- Empty states look unfinished, not intentionally calm.
- All alerts render at equal weight (no tiers).
- Filters don't show counts.

---

## 3. Redesign intent

Turn Alerts into a real alert center: three visual tiers, filter chips with counts, a purposeful calm-state block when nothing is active.

---

## 4. Tier model

Maps from `SystemState` and alert severity:

- **Critical** — `severity = "critical"` or unresolved fault. Red accent. Requires action.
- **Warning** — `severity = "warning"` or drifting metric. Amber accent.
- **Informational** — low-severity, educational, or resolved-in-last-24h. Muted accent.

Each tier is rendered as a dedicated section with a title and a tier count chip. A tier with zero items is hidden (not shown as "Critical (0)").

---

## 5. Filter design

Replace button-style filters with **chips**, each carrying its count:

- All (N)
- Maintenance (N)
- Weather (N)
- Financial (N)
- Performance (N)

Behavior:

- Only chips with non-zero counts become interactive; zero-count chips render muted and disabled.
- Selecting a chip narrows which tiers/items render; tier structure is preserved inside the filtered view.

Styling: `rounded-full`, `px-3 py-1`, `text-xs`, inter-chip `gap-2`. Token rules per [00-design-tokens.md](./00-design-tokens.md).

---

## 6. Calm-state block (when zero active alerts)

Replace "No alerts in this category" with a persistent, valuable block:

```
No active alerts
Your system is currently operating within expected ranges.

Monitoring continues for:
- Soiling and dust buildup
- Weather risk (heat, storms)
- Performance deviation
- Financial leakage
```

Visual treatment: `glass-card`, `p-5`, monitoring list as bullet rows with muted icons. CTA row at the bottom: text link "Manage alert preferences" routing to [08-settings.md](./08-settings.md) notifications section.

This block also appears at the **bottom** of the alerts list when a filter yields zero results, as a "why you might not see alerts" explainer.

---

## 7. Component changes

### Modify

- [apps/web/src/app/alerts/_components/alerts-list.tsx](../../apps/web/src/app/alerts/_components/alerts-list.tsx):
  - Group items into three tiers before rendering.
  - Convert filters to chips with counts.
  - Render the calm-state block when the filtered list is empty.
- [apps/web/src/app/alerts/page.tsx](../../apps/web/src/app/alerts/page.tsx):
  - Hero shows counts per tier next to the page title.
  - Hero state tinting maps from the highest-severity tier present (`critical` > `warning` > none).

---

## 8. Alert row schema

Each row must carry:

- `severity` (drives tier).
- `category` (drives filter chip).
- `title` — one-line human summary.
- `detected_at` — timestamp.
- `impact` — optional one-line money/efficiency impact ("Estimated loss: N.IS 18/month").
- `action` — optional CTA label; if present, routes via [15-conversion-flow.md](./15-conversion-flow.md).

Rows without `impact` still render; they simply hide the impact line. Rows without `action` render without a CTA.

---

## 9. Instrumentation

- `alerts_filter_change` — `{ chip, resultCount }`.
- `alert_row_cta_click` — `{ alertId, category, severity }`.
- `alerts_calm_state_view` — fired when the calm block renders in the primary (non-filtered) slot.

---

## 10. Definition of Done

- Alerts list renders three visual tiers when items exist across severities; empty tiers do not render headings.
- Filter chips show counts; zero-count chips render disabled.
- Calm-state block appears when the primary list is empty and lists the four monitored risks.
- Hero state-tinting reflects the highest-severity alert present.
- Every alert row with an `action` routes through the conversion flow.
