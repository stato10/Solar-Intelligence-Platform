# 00 — Design Tokens and Layout System

Foundation for every page doc. If anything in this file changes, every downstream doc must be re-read.

The current runtime tokens live in [apps/web/src/app/globals.css](../../apps/web/src/app/globals.css). This doc standardizes and extends them so every page uses the same rules.

---

## 1. Grid

- **Base unit:** `4px`.
- **Primary grid:** `8px` (all paddings, margins, gaps snap to multiples of 8 unless stated).
- **Micro grid:** `4px` only for inline icon/text spacing, badge gutters, and borders.

Tailwind usage: prefer `gap-2`, `gap-3`, `gap-4`, `gap-6`, `gap-8` over arbitrary values.

---

## 2. Container and column widths

- **App container max-width:** `1280px` (`max-w-[1280px]`).
- **Sidebar fixed width (desktop):** `240px`. Defined in [app-shell.tsx](../../apps/web/src/components/layout/app-shell.tsx); any change must be reflected here.
- **Right panel on Dashboard (desktop):** `320px` min, `360px` max. Dashboard grid becomes `xl:grid-cols-[1fr_minmax(320px,360px)]`.
- **Content inner gutter:** `24px` (left/right padding inside main content on desktop), `16px` on tablet, `16px` on mobile.
- **Column gap between primary and right panel:** `24px` desktop.
- **Card-to-card vertical gap in a column:** `16px` for dense stacks (stats), `24px` for major sections.

---

## 3. Card padding

- **Small card (stat tile, chip row):** `p-4` (16px).
- **Standard card (AiInsightCard, OpportunityCard body):** `p-5` (20px).
- **Hero card (HeroInsightCard, page hero):** `p-6` (24px) on desktop, `p-5` on tablet, `p-4` on mobile.
- **Accordion open padding:** same as its parent card minus `-8px` on top to tighten the content underneath.

---

## 4. Radius and elevation

- **Radius scale:** `--radius: 0.75rem` (12px) is the base. Cards: `rounded-2xl` (16px). Inline chips: `rounded-full`. Inputs: `rounded-lg` (8px).
- **Elevation:**
  - `elev-0` — flat card, uses `glass-card` utility from [globals.css](../../apps/web/src/app/globals.css).
  - `elev-1` — hovered card, adds a faint inner glow only.
  - `elev-2` — modal / dialog, owned by [ui/dialog.tsx](../../apps/web/src/components/ui/dialog.tsx).
- **No drop-shadow stacking.** The visual language is "glass on dark", not "material".

---

## 5. Typography scale

Font variables are already wired in [apps/web/src/app/layout.tsx](../../apps/web/src/app/layout.tsx) and [globals.css](../../apps/web/src/app/globals.css) (`--font-plus-jakarta`, `--font-jetbrains-mono`).

- **Display** — `text-3xl` (30px) / `font-semibold` — page hero headline.
- **H1** — `text-2xl` (24px) / `font-semibold` — section title inside a page.
- **H2** — `text-lg` (18px) / `font-medium` — card title.
- **Body** — `text-sm` (14px) — default card body.
- **Caption** — `text-xs` (12px) / `text-muted-foreground` — labels, timestamps, confidence chips.
- **Money-numeric** — `font-mono` using `--font-jetbrains-mono` with `tabular-nums`.

Line-height: `leading-tight` for headings, `leading-relaxed` for paragraph copy.

---

## 6. Color tokens (semantic)

Aligned with existing variables in [globals.css](../../apps/web/src/app/globals.css): `--success`, `--warning`, `--danger`, plus theme tokens `--background`, `--foreground`, `--muted`, `--muted-foreground`, `--border`.

Usage rules:

- **Positive state / gain / savings:** `--success` (green). Examples: "You could save N.IS X/month", healthy status pill.
- **Attention / ROI / opportunity:** `--warning` (amber). Examples: optimization hero, medium-priority action.
- **Critical / active loss:** `--danger` (red). Examples: loss banner, critical alert tile, high-priority action.
- **Neutral / informational:** `--muted-foreground`. Examples: metadata, captions, "last updated".

Never use raw hex in components. Always resolve via the CSS variable or the Tailwind theme alias.

---

## 7. Utility classes

Already present in [globals.css](../../apps/web/src/app/globals.css):

- `.glass-card` — the base card background.
- `.state-good`, `.state-warning`, `.state-danger` — state-tinted borders/backgrounds.

Convention: page-level card wrappers must use `glass-card` plus a `state-*` modifier when state is active. Never re-implement these gradients per component.

---

## 8. Spacing application per surface

- **Hero cards:** `p-6`, title `text-3xl`, subtitle `text-sm text-muted-foreground`, 24px gap to next section.
- **Section titles:** `text-2xl` with a 12px bottom margin to the first card of the section.
- **Insight cards (see [11-ai-insight-card.md](./11-ai-insight-card.md)):** `p-5`, internal gap `gap-3`, CTA row `mt-4`.
- **Filter chip rows (see [05-alerts.md](./05-alerts.md)):** `gap-2`, chip padding `px-3 py-1`.

---

## 9. Definition of Done

- Every new card uses tokens above, no arbitrary `px-[13px]` or `gap-[7px]` values.
- Dashboard main grid renders at `max-w-[1280px]` with a `320–360px` right panel at `xl` breakpoint.
- All money figures render with `font-mono` and `tabular-nums`.
- No component imports a hex color.
- All state color usage resolves through `--success`, `--warning`, `--danger`.
