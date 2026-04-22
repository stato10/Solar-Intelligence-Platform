# 11 — AI Insight Card (canonical)

One card spec that every AI-driven surface conforms to. Without this, every page re-invents an AI card.

References: [00-design-tokens.md](./00-design-tokens.md), [01-state-contracts.md](./01-state-contracts.md), [13-voice-and-copy.md](./13-voice-and-copy.md), [15-conversion-flow.md](./15-conversion-flow.md).

---

## 1. Where this card is used

All of the following surfaces must converge on this single component:

- Dashboard action lanes — inside [EnergyDecisionsSection.tsx](../../apps/web/src/components/dashboard/EnergyDecisionsSection.tsx).
- Dashboard AI panel rows — inside [AiInsightsPanel.tsx](../../apps/web/src/components/dashboard/AiInsightsPanel.tsx).
- Maintenance concern rows — inside [maintenance-ai-insights-section.tsx](../../apps/web/src/app/maintenance/_components/maintenance-ai-insights-section.tsx).
- Savings lane rows — inside [savings-ai-insights-section.tsx](../../apps/web/src/app/savings/_components/savings-ai-insights-section.tsx).
- Opportunity cards where they are AI-driven — [opportunity-card.tsx](../../apps/web/src/app/opportunities/_components/opportunity-card.tsx) (shares the same core body; marketplace-specific chrome wraps it).

---

## 2. Required structure

Every Insight Card renders exactly these parts in this order:

1. **Issue** — one-line human-readable label. Examples: "Dust buildup detected", "Low self-consumption", "Battery opportunity identified".
2. **Impact** — one-line effect. Examples: "−8% efficiency this month", "Solar surplus wasted during midday", "Payback ~4.8 years".
3. **Money** — monetary figure using `font-mono` and `tabular-nums`. Always include the unit (N.IS / month, N.IS / year, N.IS one-off).
4. **Recommended Action** — one imperative sentence. Examples: "Book cleaning within 7 days", "Shift dishwasher to 11:00–15:00", "Request a battery quote".
5. **Confidence** — chip per [01-state-contracts.md](./01-state-contracts.md) contract 3.
6. **CTA** — per confidence: solid primary / outline / text link. Never absent on `high` or `medium` confidence items.

Optional parts:

- **Why recommended tags** — 1–3 short tags (e.g. "Peak tariff hours", "System profile"). Render as small chips under the Recommended Action line.
- **Deep-dive disclosure** — accordion that reveals the long-form AI explanation. Collapsed by default.

---

## 3. Visual layout

Token values from [00-design-tokens.md](./00-design-tokens.md). Card: `glass-card`, `rounded-2xl`, `p-5`, internal `gap-3`.

```
+-----------------------------------------------------------+
| Issue         (text-lg font-medium)     [severity chip]   |
|                                                           |
| Impact        (text-sm)                                   |
| Money         (font-mono text-lg)                         |
|                                                           |
| Recommended:  Action sentence (text-sm)                   |
| Tags:         [tag] [tag] (text-xs)                       |
|                                                           |
| [CTA button]            [Confidence: high]                |
|                                                           |
| ▸ Deep dive (accordion, collapsed by default)             |
+-----------------------------------------------------------+
```

Severity chip (left-top, only when severity is present): `critical` red, `warning` amber, `info` muted.

CTA row styling per `ActionPriority`:

- `high` → solid primary button, left-aligned; confidence chip right.
- `medium` → outline button.
- `low` → text link "Open" only; no button.

---

## 4. Confidence rules (from contract 3)

- **High confidence + high priority** → Full card, solid CTA. Eligible to drive a page hero if also `critical` or `warning`.
- **High confidence + medium priority** → Full card, solid CTA, never drives the hero.
- **Medium confidence** → Full card, outline CTA.
- **Low confidence** → Collapsed row variant: only Issue + Impact + text link "Learn more". Body hidden behind the disclosure. Never renders a CTA button.

If two insights compete for the same slot, `confidence` wins over `priority`. If equal, `estimatedMonthlyGain` desc breaks the tie.

---

## 5. Props contract

Recommended shape (documented — not created here):

```ts
type AiInsightCardProps = {
  issue: string;
  impact: string;
  money: { value: number; unit: "N.IS/month" | "N.IS/year" | "N.IS"; };
  recommendedAction: string;
  confidence: "high" | "medium" | "low";
  priority: "high" | "medium" | "low";
  severity?: "critical" | "warning" | "info";
  whyRecommendedTags?: string[];
  cta: { label: string; kind: "quote" | "configure" | "book" | "external"; recommendationType: string; };
  deepDive?: string; // markdown or plain text; rendered inside accordion
}
```

---

## 6. Voice and copy rules

Delegated to [13-voice-and-copy.md](./13-voice-and-copy.md). Key constraints:

- No sentences longer than 14 words in Issue / Impact / Recommended Action.
- No marketing adjectives ("amazing", "intelligent", "magical").
- Imperative verb in Recommended Action ("Book", "Shift", "Request").

---

## 7. Conversion wiring

Every CTA emits `opportunity_card_cta_click` (for opportunities) or surface-specific events (see per-page docs), then opens the conversion modal per [15-conversion-flow.md](./15-conversion-flow.md) with a payload containing at least:

```
{ recommendationType, confidence, monthlyGainNis, sourceSurface }
```

Text-link CTAs on `low` confidence skip the modal and link to a learn-more view.

---

## 8. Accessibility

- Insight Card is a `section` with an accessible title (the Issue).
- Severity chip has an accessible label ("severity: warning").
- CTA button has an accessible label equal to `cta.label` plus the Issue context ("Book cleaning for Dust buildup detected").
- Deep-dive accordion is keyboard-operable with arrow keys and Enter.

---

## 9. Definition of Done

- All four surfaces in section 1 render insight rows using the same underlying component (or sharing the same Props contract).
- No surface renders AI insights without Money, Recommended Action, or Confidence.
- `low` confidence items never render a full CTA button.
- Deep-dive copy is accordion-gated; it does not appear in the always-visible card body.
- No hex colors; all severity/confidence styling routes through design tokens.
