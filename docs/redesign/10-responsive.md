# 10 — Responsive Strategy

Score baseline: **6.5/10**. Gap: desktop-first; tablet and mobile need intentional product design, not shrinking.

References: [00-design-tokens.md](./00-design-tokens.md), [02-dashboard.md](./02-dashboard.md), [07-opportunities.md](./07-opportunities.md), [09-sidebar-shell.md](./09-sidebar-shell.md).

---

## 1. Breakpoints

Aligned with the Tailwind defaults used in the app:

- **Desktop** — `xl` and above (`>= 1280px`).
- **Tablet** — `md` through `lg` (`>= 768px`, `< 1280px`).
- **Mobile** — below `md` (`< 768px`).

No custom breakpoints are introduced.

---

## 2. Global shell behavior

### Desktop

- Sidebar fixed `240px` (see [09-sidebar-shell.md](./09-sidebar-shell.md)).
- Content container `max-w-[1280px]` centered.
- Outer gutter `24px`.

### Tablet

- Sidebar collapses to a **rail** (icons only, `64px`) or a drawer triggered from a top bar. Default to drawer for simplicity.
- Content container full-width minus `16px` side gutter.

### Mobile

- Sidebar is a **drawer** only; a top bar with hamburger + site chip + avatar persists.
- Content single column; no fixed side gutters beyond `16px`.

---

## 3. Page-level stacking rules

### Dashboard

Desktop grid today: `xl:grid-cols-[1fr_360px]`. Update per [02-dashboard.md](./02-dashboard.md) to `xl:grid-cols-[1fr_minmax(320px,360px)]`.

- **Tablet:** right panel stacks **below** the primary column. Order: Hero → Action Lanes (Now / Recommended / Explore) → Supporting Data → Right Panel items as their own section → AI accordion.
- **Mobile:** same stack as tablet, all cards full-width (1 column grids). Action Lane cards become 1-col. What-if Simulator collapses into an accordion by default.

### Maintenance

- Concern Cards: 2-col on tablet, 1-col on mobile.
- AI accordion remains collapsed by default on mobile regardless of state.

### Savings

- Opportunity lanes: 2-col on tablet, 1-col on mobile.
- Hero headline line-breaks into two lines on narrow widths.

### Alerts

- Filter chips: 1-row wrap on tablet, horizontal-scroll on mobile with edge-fade.
- Alert rows: compact layout with title → impact → action stacked vertically on mobile.

### Automation

- Day Timeline: on tablet, preserves the horizontal strip. On mobile, becomes a horizontally-scrollable strip with the three band labels sticky across the top; legend stacks below.
- Device cards: 2-col on tablet, 1-col on mobile.

### Opportunities

- Sections remain stacked vertically.
- Card grid: 3-col desktop → 2-col tablet → 1-col mobile.
- Alternative mobile treatment for the dashboard carousel: horizontal scroll with snap.

### Settings

- Left anchor rail hides below `xl`. Sections render as a stacked list with jump-links at the top of the page.

### Sidebar shell

- See [09-sidebar-shell.md](./09-sidebar-shell.md) for drawer behavior.

---

## 4. Right-panel collapse sequence (Dashboard)

At the `xl → lg` transition (primary breakpoint for the dashboard):

1. Right panel moves below primary column.
2. Cards inside the right panel render in a 2-col grid at `lg` (Performance + Usage window on top, What-if + Connect System underneath).
3. At `md` → `sm`, drops to 1-col.

---

## 5. Card density

- Desktop — default token padding (`p-5`, `p-6` for hero).
- Tablet — same padding; reduce internal `gap` by one step (e.g. `gap-4` → `gap-3`).
- Mobile — reduce card padding one step (`p-5` → `p-4`); never reduce hero below `p-5`.

---

## 6. Typography responsiveness

- Hero headline — `text-3xl` desktop, `text-2xl` tablet, `text-xl` mobile.
- Section titles — `text-2xl` desktop, `text-xl` tablet, `text-lg` mobile.
- Body stays `text-sm` across breakpoints.

Money-numeric values never scale below `text-base` to preserve scannability.

---

## 7. Long text collapse

- Any paragraph of AI explanation longer than 3 lines on mobile must collapse into a "Read more" toggle.
- Insight Card bodies cap at `max-h-32` on mobile with a fade mask and a "Read more" expander; desktop is unbounded.

---

## 8. Marketplace-specific rules

- `MarketplaceCarousel` on the dashboard: horizontal scroll with snap on all breakpoints; no vertical stacking.
- Opportunities page: stacked sections as described in section 3.

---

## 9. Definition of Done

- Dashboard at 768px renders the primary column, then the right panel items as a 2-col grid, then the AI accordion; no horizontal scroll.
- Dashboard at 375px renders a single full-width column with the What-if Simulator collapsed.
- Maintenance Concern Cards render 2-col at `md`, 1-col at `sm`.
- Alerts filter chips horizontally scroll on mobile with edge fade.
- Opportunities grid goes 3 → 2 → 1 columns at `xl`, `md`, and below `md` respectively.
- Sidebar becomes a drawer on mobile with the utility zone present at the bottom of the drawer.
- No card on any page overflows horizontally at 320px.
