# 09 — Sidebar / App Shell

Score baseline: **8/10**. Gap: premium polish, bottom area underused, switcher cramped.

References: [00-design-tokens.md](./00-design-tokens.md), [10-responsive.md](./10-responsive.md), [13-voice-and-copy.md](./13-voice-and-copy.md).

---

## 1. Current state

- Shell: [apps/web/src/components/layout/app-shell.tsx](../../apps/web/src/components/layout/app-shell.tsx).
- Site selector: [apps/web/src/components/layout/site-selector.tsx](../../apps/web/src/components/layout/site-selector.tsx).
- Root layout: [apps/web/src/app/layout.tsx](../../apps/web/src/app/layout.tsx).
- Fixed 240px sidebar; brand at top, nav in middle, plan badge at bottom.

---

## 2. Problems

- Brand / logo area is small and not premium.
- Site selector feels cramped.
- Bottom zone is underused — only a static plan badge.

---

## 3. Redesign intent

Tighten the visual identity at the top, breathe around the site selector, and use the bottom zone as an always-available utility strip (Connect System, integration status, support).

---

## 4. Sidebar anatomy (top to bottom)

1. **Brand lockup** — logo mark + product wordmark, `h-16` total height, left-padded `px-5`. Wordmark uses `font-plus-jakarta`, `text-lg`, `font-semibold`. The current icon-only mark is retained; add the wordmark beside it.
2. **Site selector** — reworked site-selector component with more breathing room (`mx-3 my-4`, `p-3`); shows the active site name on one line, a muted sub-label (location or system size), and a chevron.
3. **Primary nav** — `NAV_ITEMS` list with icons. Active state: left indicator rail (3px), brighter text, card-tinted background. Hover: subtle `bg-white/5`. Inactive: muted icon and text. Per-item optional badge on the right for urgency (see "Urgency badges" below).
4. **Secondary nav** — "Support & Learning" links stay in their current place, visually lighter than primary nav.
5. **Bottom utility zone** — new (replaces the single plan badge). See section 6.

---

## 5. Urgency badges on nav items

A tiny dot or count chip on the right side of nav items reflects current state:

- **Alerts** — dot when `SystemState ∈ {critical, warning}`; chip with count when more than one alert.
- **Maintenance** — dot when an unresolved concern exists.
- **Opportunities** — subtle chip "New" when a freshly surfaced high-priority opportunity exists.

Styling: small circle (`size-2`) for binary, `rounded-full px-1.5 text-[10px]` for counts. Colors per [00-design-tokens.md](./00-design-tokens.md).

---

## 6. Bottom utility zone

Stacked vertically, bottom-pinned. `p-3`, `gap-3`.

- **Connect System** — compact CTA using the same intent as [HardwareConnectCta.tsx](../../apps/web/src/components/dashboard/HardwareConnectCta.tsx). Hidden when the site is already connected.
- **Integration status** — one-line pill summarizing connected hardware status (`All systems connected` / `1 integration needs attention`). Links to Settings → Integrations ([08-settings.md](./08-settings.md) section 5.5).
- **Plan badge** — kept from current design, relocated to the bottom of this zone.
- **Support link** — text link to support / docs.

Never scroll this zone; if the nav overflows, the nav list scrolls, not the utility zone.

---

## 7. Site selector rework

- Two-line layout (title + muted sub-line) instead of single-line.
- Selected state: faint border, `bg-white/5`.
- Dropdown menu uses [ui/dialog.tsx](../../apps/web/src/components/ui/dialog.tsx) conventions or an accessible menu primitive; items show site name + small "connected / not connected" chip.
- Keep the existing server-action wiring (`setActiveSite`, cookie sync).

---

## 8. Mobile behavior

Below `md` (per [10-responsive.md](./10-responsive.md)):

- Sidebar becomes a **drawer**.
- Top bar: brand (compact), hamburger, site name chip, avatar.
- Drawer content mirrors the full sidebar; utility zone sits at the bottom of the drawer sheet.
- Tap outside or swipe-left closes the drawer.

---

## 9. Component changes

### Modify

- [apps/web/src/components/layout/app-shell.tsx](../../apps/web/src/components/layout/app-shell.tsx):
  - Increase brand lockup area and add wordmark.
  - Add urgency badge rendering next to nav items (driven by a small hook that reads the same view-model data the dashboard consumes).
  - Replace the single plan badge at the bottom with the four-item utility zone in section 6.
  - Ensure the nav list scrolls independently of the utility zone.
- [apps/web/src/components/layout/site-selector.tsx](../../apps/web/src/components/layout/site-selector.tsx):
  - Two-line selected state.
  - Dropdown items with connection chips.

### Add (documented only)

- `SidebarUtilityZone.tsx` component to encapsulate the bottom stack.
- `NavUrgencyBadge.tsx` component.

---

## 10. Instrumentation

- `sidebar_nav_click` — `{ destination, hasUrgencyBadge }`.
- `sidebar_connect_click` — `{ surface: "sidebar_utility" }`.
- `sidebar_support_click` — no props.

---

## 11. Definition of Done

- Brand lockup shows logo + wordmark at `h-16`.
- Site selector renders two lines and an in-menu connection chip per site.
- Urgency badges render on Alerts, Maintenance, Opportunities based on real view-model state.
- Bottom utility zone contains Connect System (conditional), Integration status, Plan badge, Support link.
- Below `md`, sidebar is a drawer with identical content and bottom utility zone.
- No emoji or marketing copy in the sidebar.
