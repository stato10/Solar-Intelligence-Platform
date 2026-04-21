# Cursor Master Brief

## Solar Intelligence Platform — Full Product Map

## Objective

Turn the existing MVP into a full solar intelligence product that helps users understand:

* current system health
* profit vs loss
* maintenance-related leakage
* electricity buy/sell tariff impact
* weather-related future risks
* self-consumption opportunities
* battery / EV / smart automation relevance
* actionable next steps
* alerts even when the user is outside the app

IMPORTANT:

* Do not break any existing API contracts
* Do not change `DashboardAggregateData`
* Do not change AI insight contract response shapes
* Do not refactor core engine logic
* All work must be additive and modular
* UI must consume typed view-models, not raw provider/API payloads

---

## 1. Product Philosophy

This product is not just a solar dashboard.

It must behave like a:

**Smart Solar Decision Platform**

The user should never need to interpret raw numbers alone.

Every important signal must be translated into:

**Status → Money Impact → Reason → Recommended Action**

---

## 2. Existing Data Capabilities Already Available

The current project already contains enough data to build a complete product experience.

### Available aggregate data

* forecast
* soiling
* heat
* risks.alerts
* optimization
* financial
* benchmark
* selfConsumption
* providers

### Available AI data

* currentStateInsights
* maintenanceInsights
* optimizationInsights
* savingsExplanation
* energyDecisions

### Available profile/business data

* site
* solar system
* device profile
* tariffs
* site historical entities / summaries foundation

This means the platform can already support:

* maintenance recommendations
* savings explanation
* profit/loss framing
* buy vs sell tariff logic
* self-consumption optimization
* future product/service recommendations

All of these are visible in the current data snapshot. 

---

## 3. Main Product Modules

Build the product around these modules:

### A. Current Status Engine
Purpose: tell the user what is happening right now
Inputs: benchmark, forecast, financial, soiling, risks
Outputs: performance status, deviation, primary issue/opportunity, top money signal, primary recommended action

### B. Profit vs Loss Engine
Purpose: show the user how much they gain and how much they are losing
Inputs: financial variables, soiling estimated loss, optimization value, selfConsumption savings, tariffs
Outputs: current savings, optimization potential, maintenance-related loss, behavior-related savings opportunity, tariff-based buy vs sell value gap

### C. Maintenance Intelligence Engine
Purpose: explain whether the system needs maintenance and what happens if ignored
Inputs: soiling, heat, risks.alerts, maintenanceInsights, benchmark deviation
Outputs: cleaning recommendation, severity, expected efficiency leakage, maintenance risk explanation, future maintenance actions

### D. Weather Risk Engine
Purpose: use weather and forecast to warn about future conditions that affect performance or safety
Inputs: OpenWeather, Open-Meteo, heat windows, risk alerts, future conditions
Outputs: extreme heat warning, storm / hail / wind / rain related warning, possible production impact, maintenance scheduling suggestion, preventive guidance

### E. Self-Consumption & Smart Usage Engine
Purpose: tell the user when and how to use their own production better
Inputs: selfConsumption windows, actions, score, tariffs, device profile
Outputs: recommended usage window, appliance suggestions, behavioral savings opportunity, automation opportunity

### F. Upgrade / Opportunity Engine
Purpose: detect whether the user should consider upgrades or connected products
Inputs: energyDecisions, self-consumption score, export deviation, tariffs, device profile, flexibility flags
Outputs: battery-worthiness signal, EV relevance, smart-switch / automation opportunity, cooling system relevance, automatic cleaning system relevance

### G. Alerts & Notification Engine
Purpose: notify the user even when not inside the app
Inputs: maintenance signals, risk signals, benchmark deviations, smart usage windows, weather risk events, monetizable opportunity thresholds
Outputs: in-app alerts, push notifications, email notifications

### H. Marketplace / Action Engine
Purpose: turn recommendations into real actions later
Inputs: cleaning recommended, battery-worthiness, EV opportunity, automation opportunity, weather protection need, cooling / automatic cleaning opportunity
Outputs: lead intent creation, service recommendation, product recommendation, future provider routing, commission-ready action trail

---

## 4. User-Facing Screens

## Screen 1 — Dashboard
Purpose: the single screen that summarizes everything
Must show: current status, KPIs, maintenance summary, savings summary, smart usage window, AI explanation, Contextual opportunity cards (feature flagged).

## Screen 2 — Maintenance
Purpose: operational decision center
Must answer: Is the system losing performance? Likely cause? Financial impact? Next steps?

## Screen 3 — Savings
Purpose: financial decision center
Must answer: How much am I saving? Where am I losing value?

## Screen 4 — Alerts Center
Purpose: centralized operational notifications
Categories: maintenance, weather, financial, behavior, upgrade opportunity.

## Screen 5 — Smart Automation / Energy Control
Purpose: show how the user can automate savings and self-consumption.
Focus: recommendations rather than immediate connected control.

## Screen 6 — Upgrades / Opportunities
Purpose: future-facing action center for products/services.
Contextual cards: panel cleaning, automatic cleaning system, cooling/heat mitigation, battery options, EV setup.

---

## 5. Core UX Rules

**Rule 1** — Show value fast (Status, money, action in < 5 seconds)
**Rule 2** — Do not show raw data (Never expose raw JSON)
**Rule 3** — Translate numbers into meaning (e.g. "Moderate dust buildup is reducing output")
**Rule 4** — Money is central (savings, losses, recoverable value)
**Rule 5** — Why builds trust (cause, source reasoning, expected effect)
**Rule 6** — Contextual actions only (no generic marketplace homepage)

---

## 6. Notification Strategy
Build a notification system that works even when the user is not inside the app (in-app alerts, email, push foundation).

---

## 7. Service and Product Recommendation Logic
Use existing signals to generate future-safe action opportunities. (Cleaning service, battery, EV, coolings, etc.)

---

## 8. Recommended Backend Modules
Start introducing these gradually without breaking core aggregate response.
apps/api/src/status/
apps/api/src/profit-loss/
apps/api/src/maintenance-intelligence/
apps/api/src/weather-risk/
apps/api/src/self-consumption/
apps/api/src/opportunities/
apps/api/src/alerts/
apps/api/src/notifications/
apps/api/src/marketplace/
apps/api/src/leads/

---

## 9. Recommended Frontend Pages / Components
apps/web/src/app/dashboard/
apps/web/src/app/maintenance/
apps/web/src/app/savings/
apps/web/src/app/alerts/
apps/web/src/app/automation/
apps/web/src/app/opportunities/

Use shadcn/ui.

---

## 10. View-Model Rule
Every page must consume a typed view model only. (DashboardPageViewModel, MaintenancePageViewModel, etc.)

---

## 11. Business Logic Priorities
Priority 1: Turn existing data into user understanding (status, money, reason, action).
Priority 2: Build alerts and maintenance/savings depth.
Priority 3: Build contextual opportunities and lead capture.
Priority 4: Build provider/product routing capability.

---

## 12. Critical Data/Quality Notes
Must normalize current data snapshots (clean coordinates, clean auth strings, standardize tariffs and panel efficiency).

---

## 13. Final Product Direction
"A smart solar decision assistant — not just a dashboard."
