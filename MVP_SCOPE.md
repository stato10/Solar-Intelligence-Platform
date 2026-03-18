# MVP Scope

## Scope Freeze (Phase 0)
- Baseline status: **Frozen for Phase 1 start**
- Change policy: scope changes require explicit approval and update to `EXECUTION_PLAN.md` + `TODO.md`
- Rule: no "nice-to-have" additions before core outputs are complete

## Goal
Deliver a working product that provides clear daily value to solar users.

## Core Outputs (MVP MUST include)

1. Daily Solar Production Forecast
2. Peak Solar Usage Window
3. Soiling / Cleaning Recommendation
4. Heat / Weather Risk Indicator
5. Monthly Financial Opportunity Estimate
6. AI Daily Insight Summary

---

## Included Features

### User & System Setup
- User authentication (register/login)
- Site creation
- Solar system configuration:
  - location
  - system size
  - tilt / azimuth
  - panel data
  - last cleaning date
- Device profile (boiler, AC, EV, etc.)
- Tariff configuration

---

### Data & Forecasting
- Solar forecast (via provider abstraction)
- Weather forecast
- Air quality / dust data

---

### Calculation Engines
- Forecast normalization
- Soiling score
- Heat loss estimation
- Weather risk classification
- Energy opportunity calculation
- Financial estimation

---

### Dashboard
- Solar Health Score
- Today’s expected production
- Peak usage window
- Cleaning status
- Risk alerts
- Savings estimate
- Recommendation feed

---

### AI Layer
- Daily insight
- Weekly summary
- Action prioritization

---

## NOT INCLUDED (STRICT)

- Hardware integration
- Real-time inverter sync
- Smart device automation
- Battery optimization
- Complex multi-agent loops
- Marketplace / installer CRM

---

## Success Criteria

MVP is successful if:
- User can onboard system
- Dashboard shows meaningful data
- Recommendations are actionable
- Financial value is clearly visible
