# 12 — Empty, Loading, Error, and Zero-Data States

Every page needs the same four non-happy-path patterns. This doc defines them once and lists where each applies.

References: [00-design-tokens.md](./00-design-tokens.md), [01-state-contracts.md](./01-state-contracts.md), [13-voice-and-copy.md](./13-voice-and-copy.md).

Affected components today:

- [apps/web/src/components/ai/ai-inline-error.tsx](../../apps/web/src/components/ai/ai-inline-error.tsx) exports `AiInlineError`, `AiInlineEmpty`, `AiStateCard`.
- Dashboard states: [apps/web/src/app/dashboard/_components/dashboard-state.tsx](../../apps/web/src/app/dashboard/_components/dashboard-state.tsx).
- Maintenance states: `apps/web/src/app/maintenance/_components/maintenance-state.tsx`.
- Savings states: `apps/web/src/app/savings/_components/savings-state.tsx`.

---

## 1. The four patterns

### 1.1 Loading

When initial data is loading:

- Render the page shell (hero skeleton, section skeletons) using skeletons from [apps/web/src/components/ui/skeleton.tsx](../../apps/web/src/components/ui/skeleton.tsx).
- Never show a spinner without shell context.
- Minimum render time: 200ms (suppress skeleton below that to avoid flashes).

### 1.2 Error

When a server call fails:

- Use `AiInlineError` for in-card errors ("Couldn't load this insight. Retry.").
- Use a page-level error boundary for full-page failures with a single retry CTA and a support link.
- Error copy is neutral, non-alarming: "Something went wrong. Try again." No stack traces. No emoji.

### 1.3 Empty

When the server returned successfully but there is no data to show in a section:

- Never render the section heading over nothing (see [05-alerts.md](./05-alerts.md) tier rules).
- If the section must render for structural reasons, use `AiInlineEmpty` with a per-page copy block (defined in the page doc).
- Empty copy must explain **why** it is empty and what happens next. Never "No items." as a final message.

### 1.4 Healthy-calm (no bad news)

When nothing is wrong, the page must still feel useful:

- Dashboard `healthy` hero (see [02-dashboard.md](./02-dashboard.md) section 7).
- Alerts calm-state block (see [05-alerts.md](./05-alerts.md) section 6).
- Savings empty-lane copy (see [04-savings.md](./04-savings.md) section 6).

The rule: healthy state keeps the monitoring commitment visible ("We are watching for X, Y, Z").

---

## 2. Per-page state matrix

- **Dashboard** — all five `SystemState` values handled; see [02-dashboard.md](./02-dashboard.md).
- **Maintenance** — `critical` / `warning` show concerns + urgency; `healthy` / `optimization` show "Next check scheduled" line; `no-data` goes to zero-data.
- **Savings** — `no-data` goes to zero-data; all other states render the current-vs-potential headline.
- **Alerts** — empty list → calm-state block.
- **Automation** — `no-data` goes to zero-data; otherwise shows day timeline even with zero current devices (the timeline still teaches the user the opportunity windows).
- **Opportunities** — if all four sections empty, render the zero-data marketplace block (see section 3 below).
- **Settings** — `no-data` promotes System Configuration to a first-run form; other sections remain usable.
- **Sidebar** — urgency badges hidden on `healthy` / `no-data`.

---

## 3. Zero-data experience (new user or site not connected)

Surfaces on every page when the site is unconnected or ingestion has no data for the last 24h. Three elements, always in this order:

1. **Hero banner** — neutral, explanatory:

   ```
   Your system isn't connected yet.
   We can still show you an estimated view based on your setup.
   ```

2. **Estimated simulation** — a lightweight simulated dashboard that runs against the defaults from [getDefaultDashboardAggregateRequest](../../apps/web/src/lib/api/dashboard.ts) (or equivalent). Every card carries an "Estimated" tag. Money figures render with a subtle diagonal-hatch treatment to visually distinguish from real data.

3. **Connect System CTA** — primary call to action, same intent as [HardwareConnectCta.tsx](../../apps/web/src/components/dashboard/HardwareConnectCta.tsx). Copy:

   ```
   Connect your inverter to switch to real-time monitoring.
   ```

Per-page overrides:

- **Dashboard** — replaces the Hero and dims the right panel; "Connect System" is the single dominant action.
- **Opportunities** — hero banner visible; estimated opportunities list surfaces the top 3 likely gains based on defaults, flagged as "Estimated".
- **Alerts** — hero banner visible; calm-state block remains but footer adds "Monitoring activates once your system is connected".
- **Automation** — hero banner visible; day timeline renders with a default schedule set, every device card flagged "Estimated".
- **Maintenance / Savings** — hero banner visible; pages render the estimated simulation.
- **Settings** — promotes System Configuration as the first-run form.

---

## 4. Copy library

Use these copy blocks verbatim unless a per-page doc overrides them.

- **Loading:** (no user-facing string; skeleton only).
- **Error in a card:** "Couldn't load this insight." — with retry button.
- **Error at page level:** "Something went wrong. Try again, or contact support." — retry + support link.
- **Empty section (generic):** "No items to show right now. We'll surface new items here as soon as they are available."
- **Empty section (savings with-upgrades):** see [04-savings.md](./04-savings.md) section 6 exact copy.
- **Alerts empty:** see [05-alerts.md](./05-alerts.md) section 6 exact copy.

---

## 5. Visual rules

- Empty/healthy/no-data surfaces use `glass-card` without `state-danger` / `state-warning` tints.
- Estimated data surfaces add a 1px dashed border segment at the top of the card and a chip "Estimated".
- Skeletons use the radius of the element they replace.
- Error messages never introduce red full-bleed backgrounds; they use an inline muted state with a `state-warning` accent only.

---

## 6. Definition of Done

- Every page renders the correct pattern for every state in section 2.
- Zero-data experience includes the banner, the estimated simulation, and the Connect System CTA on every page listed in section 3.
- No card anywhere shows "No data." or "No items." as a terminal message.
- `AiInlineEmpty` is only used with page-doc-sanctioned copy.
- Estimated figures are visually distinguishable from real data.
