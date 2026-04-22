# 08 — Settings (Control Center)

Score baseline: underpowered (user concern, no formal baseline). Gap: current page is 3 placeholder cards; it must become a real control center.

References: [00-design-tokens.md](./00-design-tokens.md), [01-state-contracts.md](./01-state-contracts.md), [13-voice-and-copy.md](./13-voice-and-copy.md), [17-monetization.md](./17-monetization.md).

---

## 1. Current state

- Page: [apps/web/src/app/settings/page.tsx](../../apps/web/src/app/settings/page.tsx)
- Content: inline `SETTINGS_BLOCKS` array with 3 placeholder cards (Profile, System Setup, Data Sources).
- No downstream effect wiring.

---

## 2. Problems

- Placeholder-only; no real controls.
- No information architecture; 3 cards do not represent the actual surface area of a solar decision platform.
- Nothing here affects the rest of the product.

---

## 3. Redesign intent

Replace the placeholder IA with six real sections. Each section must have a clear purpose, and **every control must affect a visible downstream outcome** somewhere else in the product.

---

## 4. Information architecture (six sections)

1. **System configuration** — the physical and digital system description.
2. **Energy behavior** — user routines and preferences that change recommendations.
3. **Tariffs** — electricity pricing and import/export rates.
4. **Automation preferences** — scheduling rules and device-behavior defaults.
5. **Integrations** — connected hardware and third-party services.
6. **Notifications** — alert delivery and preferences.

Page layout: sidebar-of-anchors on the left (at `xl`) with the six section names, content panel on the right. Below `xl`, render a stacked list with section jump-links at the top.

---

## 5. Section specs

### 5.1 System configuration

Controls:

- System size (kWp) — numeric.
- Panel count, panel type — select + numeric.
- Inverter brand / model — select.
- Tilt and azimuth — numeric (optional, advanced).
- Site location — lat/lon (already exists via the site selector, see [site-selector.tsx](../../apps/web/src/components/layout/site-selector.tsx)).
- Installation date — date picker.

Downstream effect: drives baseline production forecasts, soiling expectations, and heat thresholds.

### 5.2 Energy behavior

Controls:

- Typical at-home hours — day-part toggles.
- Household size — numeric.
- Has EV — boolean, if true shows charger fields.
- Has electric water heater — boolean.
- Has pool pump / heavy loads — boolean.
- Future plans (battery, EV, expansion) — multi-select.

Downstream effect: drives the automation recommendations in [06-automation.md](./06-automation.md) and the opportunity ordering in [07-opportunities.md](./07-opportunities.md).

### 5.3 Tariffs

Controls:

- Import rate (N.IS / kWh) — numeric.
- Export rate or feed-in — numeric.
- Time-of-use plan toggle — boolean. If on, show peak/off-peak windows and rates.

Downstream effect: drives every monetary calculation — loss card, savings hero, opportunity ROI.

### 5.4 Automation preferences

Controls:

- Preferred device windows — per device (Boiler, Dishwasher, EV, etc.).
- Weather override — boolean (skip automation on low-solar forecast days).
- Notification before automation triggers — boolean.

Downstream effect: directly feeds the Automation page Day Timeline in [06-automation.md](./06-automation.md).

### 5.5 Integrations

Controls:

- Connected hardware list — inverter, battery, smart devices. Each row has status (`connected`, `disconnected`, `error`).
- Connect new hardware — opens the connect flow (today: [HardwareConnectCta.tsx](../../apps/web/src/components/dashboard/HardwareConnectCta.tsx)).
- Third-party services — weather provider, tariff provider.

Downstream effect: determines which data is "real" vs "estimated"; directly controls the zero-data experience from [12-empty-states.md](./12-empty-states.md).

### 5.6 Notifications

Controls:

- Channels — email, in-app, (future) SMS.
- Alert categories — Critical / Warning / Informational toggles per channel.
- Weekly digest — boolean + delivery day.
- Quiet hours — time range.

Downstream effect: determines which alerts from [05-alerts.md](./05-alerts.md) also deliver off-app.

---

## 6. Component changes

### Modify

- [apps/web/src/app/settings/page.tsx](../../apps/web/src/app/settings/page.tsx) — replace `SETTINGS_BLOCKS` with the six sections above. Each section is its own card, `p-5`, `rounded-2xl`. The page becomes form-driven, not marketing-copy-driven.

### Add (documented only)

- Per-section form components under `apps/web/src/app/settings/_components/` (one per section).
- `FormRow` primitive — label + control + helper text + validation message. Tokens per [00-design-tokens.md](./00-design-tokens.md).

---

## 7. Persistence and validation

- Every control saves on blur or on explicit "Save changes" per section.
- Optimistic UI; show an inline success chip "Saved" and `router.refresh()` to recompute downstream recommendations.
- Server validation errors render inline under the control.

---

## 8. State handling

- `no-data` site: System configuration section becomes the **first-run configuration form**, with a banner "Complete setup to unlock real recommendations". The other five sections remain visible but are non-blocking.

---

## 9. Instrumentation

- `settings_section_view` — `{ section }`.
- `settings_control_change` — `{ section, controlId, newValueShape }` (no raw PII).
- `settings_save_success` — `{ section }`.
- `settings_save_error` — `{ section, errorCode }`.

---

## 10. Definition of Done

- Six sections render with real controls per section 5; no placeholder "coming soon" copy remains.
- Each control has a documented downstream effect (comment in code or a test asserts it).
- `no-data` banner appears in System configuration until the site is fully set up.
- Settings save flow is optimistic with inline success + error states.
- The page contains no marketing copy; it is operational.
