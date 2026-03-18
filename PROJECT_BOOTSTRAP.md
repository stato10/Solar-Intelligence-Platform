You are a senior product architect and implementation engineer.

I want you to generate a production-grade monorepo for a project called:

Solar Intelligence Platform

The platform is a software-only AI-assisted application that helps residential solar owners optimize solar production value, predict maintenance needs, estimate heat-related efficiency losses, detect weather risks, and recommend the best energy usage windows.

The system must NOT depend on hardware integration in V1.

Primary delivery target:
- mobile application (iOS and Android) in MVP

Engineering objective:
- production-grade architecture
- easy local setup
- clear modular boundaries
- fast iteration with mock-friendly integrations

==================================================
PRODUCT GOAL
==================================================

Build an MVP that provides:

1. Solar production forecast
2. Soiling / dust prediction
3. Heat loss estimation
4. Weather risk alerts
5. Energy timing recommendations
6. Financial opportunity estimation
7. AI-generated human-readable insights

The system should tell the user:
- what is happening
- why it is happening
- what action to take
- what financial impact it may have

==================================================
TECH STACK (PROFESSIONAL + EASY TO BUILD)
==================================================

Use the following stack:

Client App (Mobile-first):
- Expo (React Native)
- React Native + TypeScript
- Expo Router
- NativeWind (Tailwind for React Native) optional
- TanStack Query
- Victory Native or React Native Chart Kit for charts
- React Hook Form + Zod for forms and validation

Backend API:
- Node.js
- NestJS
- REST API
- Swagger/OpenAPI docs

Modeling / Calculation Engine:
- Python
- FastAPI
- pandas / numpy where useful

Database:
- PostgreSQL

Caching:
- Redis optional abstraction, but can be stubbed if not fully used yet

AI:
- OpenAI API integration
- Use structured JSON outputs
- AI should only summarize and explain results
- Deterministic calculations must remain outside AI

Infrastructure / DevOps:
- Docker
- docker-compose for local development
- .env support
- clean project structure
- scalable modular architecture
- one-command local startup
- health checks for all services
- seed/mocks enabled by default for quick boot

==================================================
MONOREPO STRUCTURE
==================================================

Create a monorepo with this structure:

/apps
  /mobile     -> Expo React Native app
  /api        -> NestJS backend
  /engine     -> FastAPI Python service

/packages
  /types      -> shared TypeScript types if needed
  /config     -> shared config if useful

Add root-level:
- docker-compose.yml
- README.md
- .env.example
- Makefile optional
- scripts for dev/start/build
- scripts for seed/reset/healthcheck

==================================================
CORE DOMAIN
==================================================

The domain is residential solar system optimization.

Users can:
- sign up / log in
- create a site
- define a solar system
- input:
  - address
  - latitude / longitude
  - system size in kW
  - tilt
  - azimuth
  - panel wattage
  - panel efficiency
  - last cleaning date
  - devices available at home:
    - boiler
    - dishwasher
    - washing machine
    - AC
    - EV

The platform will fetch:
- solar forecast
- weather forecast
- air quality / dust data

The platform will compute:
- expected production
- solar peak window
- soiling score
- heat stress score
- weather risk alerts
- optimization opportunities
- estimated financial impact

==================================================
DATA MODEL
==================================================

Implement PostgreSQL models/entities for:

users
- id
- full_name
- email
- password_hash
- role
- created_at
- updated_at

sites
- id
- user_id
- site_name
- address
- latitude
- longitude
- timezone
- created_at

solar_systems
- id
- site_id
- system_size_kw
- tilt
- azimuth
- panel_wattage
- panel_efficiency
- inverter_type nullable
- last_cleaning_date
- created_at
- updated_at

user_devices
- id
- site_id
- has_boiler
- has_ev
- has_dishwasher
- has_washing_machine
- has_ac
- usage_flexibility_level

tariffs
- id
- site_id
- self_consumption_rate
- export_rate
- currency
- effective_from

weather_snapshots
- id
- site_id
- timestamp
- temperature
- cloud_cover
- wind_speed
- humidity
- precipitation
- weather_source

air_quality_snapshots
- id
- site_id
- timestamp
- pm10
- pm25
- dust
- aod nullable
- aq_source

forecast_runs
- id
- site_id
- run_date
- expected_daily_kwh
- expected_weekly_kwh
- expected_monthly_kwh
- peak_window_start
- peak_window_end
- forecast_source

soiling_scores
- id
- site_id
- score
- estimated_loss_percent
- cleaning_recommended
- recommended_cleaning_date
- explanation
- created_at

heat_loss_scores
- id
- site_id
- score
- estimated_loss_percent
- peak_heat_window_start
- peak_heat_window_end
- created_at

risk_alerts
- id
- site_id
- risk_type
- severity
- message
- expected_start
- expected_end
- created_at
- resolved_at nullable

optimization_recommendations
- id
- site_id
- recommendation_type
- title
- description
- estimated_value
- priority
- valid_from
- valid_until
- created_at

insight_summaries
- id
- site_id
- summary_type
- summary_text
- generated_at

==================================================
RUNTIME DECISION FLOW
==================================================

Use this runtime flow as the default architecture:

Mobile/Web App
      ->
Node.js API
      ->
Decision Layer
  - Solar Orchestrator Agent
  - Recommendation Router
      ->
Python Engine
  - Forecast Calculator
  - Soiling Calculator
  - Heat Calculator
  - Risk Calculator
  - Financial Calculator
      ->
External APIs
  - Solar
  - Weather
  - Air Quality

Decision Layer responsibilities:
- Solar Orchestrator Agent coordinates provider fetches, normalization, and engine execution.
- Recommendation Router converts deterministic outputs into prioritized user actions.
- Decision Layer must stay deterministic-first and explainable.

==================================================
API DESIGN
==================================================

Implement REST endpoints:

Auth:
POST /api/auth/register
POST /api/auth/login
GET /api/auth/me

Sites:
POST /api/sites
GET /api/sites/:id
PUT /api/sites/:id

Solar system:
POST /api/sites/:siteId/system
GET /api/sites/:siteId/system
PUT /api/sites/:siteId/system

Forecast:
GET /api/sites/:siteId/forecast/today
GET /api/sites/:siteId/forecast/week
GET /api/sites/:siteId/forecast/month

Soiling:
GET /api/sites/:siteId/soiling

Heat:
GET /api/sites/:siteId/heat

Risks:
GET /api/sites/:siteId/risks

Optimization:
GET /api/sites/:siteId/opportunities

Financial:
GET /api/sites/:siteId/financial-summary

Insights:
GET /api/sites/:siteId/insights/daily
GET /api/sites/:siteId/insights/weekly

Also create internal service-to-service endpoints between Node API and Python engine.

==================================================
PYTHON ENGINE REQUIREMENTS
==================================================

In the FastAPI service, implement calculation modules for:

1. Solar Forecast Normalization
- Accept solar/weather input
- Return normalized expected production estimates

2. Soiling Score Calculator
Inputs:
- pm10
- pm25
- dust
- wind_speed
- precipitation
- days_since_cleaning

Output:
- score 0-100
- estimated_loss_percent
- cleaning_recommended
- recommended_cleaning_date
- explanation

3. Heat Loss Calculator
Inputs:
- ambient temperature
- irradiance proxy
- wind speed

Output:
- heat score 0-100
- estimated_loss_percent
- peak heat window

4. Weather Risk Classifier
Inputs:
- dust
- wind
- precipitation
- temperature
- cloud_cover

Output:
- risk alerts list with severity and message

5. Energy Opportunity Calculator
Inputs:
- expected production
- peak solar window
- device profile
- tariff spread

Output:
- recommended appliance windows
- opportunity score
- estimated value

6. Financial Estimator
Inputs:
- expected production
- self_consumption_rate
- export_rate
- estimated self-consumption opportunity

Output:
- daily estimated savings
- monthly estimated savings
- yearly optimization potential

Use deterministic formulas and clean pydantic schemas.

==================================================
SCORING LOGIC
==================================================

Implement simple but extensible scoring logic.

Solar Health Score:
100 - soiling_penalty - heat_penalty - risk_penalty + forecast_stability_bonus

Soiling score should increase with:
- PM10 / dust
- wind carrying dust
- days since cleaning

Soiling score should decrease with:
- meaningful rain

Heat stress score should increase with:
- ambient temperature
- irradiance
and decrease with:
- wind cooling

Opportunity score should increase with:
- strong solar peak
- higher tariff difference
- more flexible household devices

Keep the formulas modular and easy to improve later.

==================================================
EXTERNAL API ABSTRACTION
==================================================

Do NOT hardcode third-party APIs directly into business logic.

Create provider abstractions/services for:
- solar forecast provider
- weather provider
- air quality provider

For now implement mock-ready adapters with placeholder providers:
- PVGIS provider
- Solcast provider
- OpenMeteo provider

Use environment variables for API keys.

If real implementation is incomplete, create clean interfaces and mock responses so the app still runs end-to-end locally.

==================================================
APPLICATION CLIENT REQUIREMENTS
==================================================

Build a polished MVP mobile app with:

Screens:
- Login
- Register
- Onboarding wizard
- Main dashboard
- Forecast details
- Maintenance / Soiling page
- Heat & Weather Risk page
- Savings / Financial Impact page
- Settings page

Main dashboard should display:
- Solar Health Score
- Today’s expected production
- Peak solar usage window
- Cleaning status
- Heat loss indicator
- Weather risk alerts
- Savings opportunity
- AI action feed

Use reusable UI components.
Keep the design clean and modern.
Use a mobile-first responsive approach.
Support safe area, offline state handling, and loading/error states.

==================================================
AI INSIGHT LAYER
==================================================

Implement an AI service in the Node backend.

Input:
- deterministic outputs from forecast / soiling / heat / risk / financial services

Output:
- short daily insight
- short weekly summary
- prioritized recommendations

Important:
- AI must not invent raw metrics
- AI must only explain and summarize
- Use structured output contracts
- Add fallback non-AI template summary if OpenAI key is missing

Example insight style:
"High production is expected tomorrow between 11:30 and 14:00. Running heavy appliances during this period can increase self-consumption. No cleaning is needed this week because rainfall is expected in the next 48 hours."

==================================================
AUTH & SECURITY
==================================================

Implement:
- JWT auth
- password hashing
- route guards
- input validation
- DTOs / schema validation
- secure environment variable handling
- CORS config for local dev

==================================================
CODE QUALITY
==================================================

Requirements:
- modular clean architecture
- typed DTOs
- error handling
- comments only where useful
- avoid overengineering
- production-like folder structure
- clean README for setup and local run
- strict TypeScript in app and API
- shared lint/format config
- CI-ready scripts (`lint`, `test`, `typecheck`, `build`)

==================================================
DELIVERABLES
==================================================

Generate:
1. Full monorepo folder structure
2. Core backend modules
3. Core client app screens/components
4. Python engine with calculation endpoints
5. Docker setup
6. .env.example
7. README with setup instructions
8. Seed / mock data where helpful

==================================================
IMPLEMENTATION APPROACH (PHASED FOR FAST DELIVERY)
==================================================

Work in phases.

Phase 1:
- scaffold monorepo
- setup mobile/api/engine
- auth + basic DB
- site and solar system CRUD
- basic mobile onboarding + dashboard shell

Phase 2:
- forecast provider abstraction
- weather provider abstraction
- air quality provider abstraction
- mock data flow working end-to-end
- cache + retry policies for provider calls

Phase 3:
- scoring engines
- dashboard endpoints
- financial summary
- optimization opportunities
- charts and actionable recommendation UX in mobile app

Phase 4:
- AI insight summaries
- polish client app UX
- finalize README and docker
- harden observability/logging/error reporting

For every phase:
- generate the code
- explain what files were created
- explain how to run it
- identify TODOs clearly
- keep code runnable at end of each phase (no broken intermediate states)

Start by generating the monorepo structure and the Phase 1 implementation.