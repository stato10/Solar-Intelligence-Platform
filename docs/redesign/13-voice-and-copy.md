# 13 — Voice, Copy, and Formatting

One voice across the product. Without this, the platform reads part analytical, part commercial, part maintenance — which is exactly the problem flagged in the critique.

---

## 1. Voice

Three adjectives, in this order:

- **Professional** — the user trusts the numbers.
- **Financial** — every statement relates to money, gain, or loss.
- **Practical** — every statement ends with something the user can do.

Not:

- Too technical (kilowatt-hour vocabulary beyond money framing).
- Too "AI magic" (never say "intelligent", "smart AI", "magic").
- Too marketing (never say "amazing", "powerful", "revolutionary").

---

## 2. Sentence patterns

### Issue / Impact / Action triplet (for Insight Cards)

Used in [11-ai-insight-card.md](./11-ai-insight-card.md).

- Issue: **noun phrase**, max 6 words. "Dust buildup detected", "Low self-consumption", "Battery opportunity identified".
- Impact: **concrete effect**, max 14 words. "Estimated loss of N.IS 18/month from dust accumulation over the last 14 days."
- Recommended Action: **imperative verb first**, max 14 words. "Book cleaning in the next 7 days."

### Hero copy (for page headers)

Two lines max:

- Line 1: status (what is true now).
- Line 2: money (what it costs or what you could gain).

Example (`optimization` state):

```
Your system is stable today.
You still have N.IS 92.7 / month optimization potential.
```

### CTA labels

Verb + object, two to four words. Good: "Book cleaning", "Request quote", "Configure automation", "Connect system". Bad: "Click here", "Learn more" (unless used as a muted tertiary link only).

---

## 3. Banned phrases

Do not ship any of these strings:

- "AI magic", "magic", "smart AI", "powerful AI".
- "Revolutionary", "amazing", "incredible".
- "We think", "We believe" (replace with data phrasing).
- "No data." / "No items." / "Nothing here." as standalone.
- Emoji anywhere in UI strings.

Replace with:

- "Based on your system profile, we recommend ..."
- "Measured over the last 14 days ..."
- "Your best current opportunity is ..."

---

## 4. Currency and number formatting

- Currency unit: **N.IS** written as `N.IS` (not a symbol) preceding or following the number per context, consistent with the existing copy in the product. Format: `N.IS 706.50`.
- Decimals: always two for money (`N.IS 18.12`). Never `N.IS 18.1`.
- Thousands separator: comma (`N.IS 4,800`).
- Percentages: one decimal for small deltas (`−8.0%`), zero decimals for round numbers (`+12%`).
- Energy: kWh with no space before unit (`4.2kWh`) in compact chips; with space (`4.2 kWh`) in prose.
- Use `font-mono` with `tabular-nums` for every monetary value.

---

## 5. Date and time

- Dates: ISO-style compact (`22 Apr 2026`) or relative (`2 min ago`, `yesterday`). Never fully numeric (`04/22/2026` ambiguous).
- Windows of time: 24-hour clock, hyphen separator (`12:00–14:00`).

---

## 6. RTL and language

The product serves Hebrew-speaking users (Israel). While these specs assume English source copy:

- Every page must set `dir` correctly when Hebrew is enabled; this is a future-facing note for the localization layer.
- Numeric formatting (currency, time, percentages) stays LTR even within an RTL body.
- Mirror icon directions where meaning depends on direction (e.g. chevrons).

---

## 7. Confidence and severity vocabulary

- Confidence chips: **High / Medium / Low** (capitalized).
- Severity chips: **Critical / Warning / Info** (capitalized).
- Never translate confidence to percentages in UI; keep it categorical.

---

## 8. Examples by surface

- **Dashboard hero — `critical`:**
  "Active loss detected: dust accumulation.
  Estimated impact: N.IS 96 / month. Recommended action: book cleaning within 48h."

- **Maintenance concern card:**
  "Dust buildup detected.
  −8% efficiency this month. Estimated loss: N.IS 18.12 / month.
  Recommended: book cleaning in the next 7 days."

- **Savings empty lane (with-upgrades):**
  "No high-confidence upgrade recommendation is currently available.
  Your best immediate gains are behavioral and automation-based."

- **Alerts calm-state:**
  "No active alerts.
  Your system is currently operating within expected ranges.
  Monitoring continues for: soiling, weather risk, performance deviation, financial leakage."

---

## 9. Definition of Done

- No banned phrase (section 3) appears in any page, component, or string literal.
- All money values render with `font-mono` + `tabular-nums` and two decimals.
- Every hero follows the two-line status + money pattern (or the zero-data pattern from [12-empty-states.md](./12-empty-states.md)).
- Every CTA label follows verb-object, two to four words.
- Confidence and severity appear only as the approved categorical words.
