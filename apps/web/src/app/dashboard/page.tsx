import { cookies } from "next/headers";
import type { AiInsightContractOutputV3, DashboardAggregateData } from "@/lib/contracts";
import { fetchAiInsightsV3 } from "@/lib/api/ai-insights";
import { ApiHttpError } from "@/lib/api/client";
import { fetchDashboardAggregate, fetchDashboardBySiteId } from "@/lib/api/dashboard";
import { fetchMarketplaceOpportunities } from "@/lib/api/marketplace";
import type { MarketplaceOpportunity } from "@/lib/contracts/marketplace";
import { toDashboardPageViewModel } from "@/lib/view-models/dashboard";
import { partitionDecisionsByPriority } from "@/lib/view-models/energy-decisions";
import {
  deriveOnboardingSubstate,
  shouldReplaceHero,
  shouldRenderStaleRibbon,
  shouldTagAsEstimated,
  type OnboardingSubstate,
} from "@/lib/view-models/onboarding";
import { DashboardEmptyState, DashboardErrorState } from "./_components/dashboard-state";

// Primary column
import { HeroInsightCard } from "@/components/dashboard/HeroInsightCard";
import { ZeroDataHero } from "@/components/dashboard/ZeroDataHero";
import { StaleTelemetryBanner } from "@/components/dashboard/StaleTelemetryBanner";
import { SubstateBridge } from "@/components/dashboard/SubstateBridge";
import { EstimatedSurface } from "@/components/dashboard/EstimatedBadge";
import { ActionLane } from "@/components/dashboard/ActionLane";
import { LossIntelligenceCard } from "@/components/dashboard/LossIntelligenceCard";
import { EnergyDecisionInsightCard } from "@/components/dashboard/EnergyDecisionInsightCard";
import { MaintenancePanel } from "@/components/dashboard/MaintenancePanel";
import { SavingsPanel } from "@/components/dashboard/SavingsPanel";
import { AiDeepDiveAccordion } from "@/components/dashboard/AiDeepDiveAccordion";

// Right panel
import { PerformanceStatsGrid } from "@/components/dashboard/PerformanceStatsGrid";
import { WhatIfSimulator } from "@/components/dashboard/WhatIfSimulator";
import { UsageWindowCard } from "@/components/dashboard/UsageWindowCard";
import { HardwareConnectCta } from "@/components/dashboard/HardwareConnectCta";

import { OnboardingDialog } from "@/components/dashboard/OnboardingDialog";

interface DashboardPageProps {
  // Next.js 15+: `searchParams` is a Promise (async dynamic params).
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  let dashboard: DashboardAggregateData | null = null;
  let dashboardVm: ReturnType<typeof toDashboardPageViewModel> | null = null;
  let errorMessage: string | null = null;
  let aiInsights: AiInsightContractOutputV3 | null = null;
  let aiInsightsError: string | null = null;
  let opportunities: MarketplaceOpportunity[] = [];
  let accessToken: string | undefined;
  let activeSiteId: string | undefined;
  // --- Progressive-disclosure onboarding substate ---------------------------
  // Spec: docs/redesign/12-empty-states.md §3 (see also
  // lib/view-models/onboarding.ts for the full rules).
  //
  //   anonymous       — no auth
  //   no-site         — auth but no site selected
  //   never-synced    — site exists but engine mode is "forecast"
  //   stale-telemetry — site was live but last reading > 24h old
  //   live            — fresh real telemetry
  //
  // QA overrides (non-prod only):
  //   ?nodata=1                   → force "never-synced"
  //   ?substate=<any substate>    → force a specific substate
  let substate: OnboardingSubstate = "live";

  try {
    const cookieStore = await cookies();
    accessToken = cookieStore.get("sip.accessToken")?.value;
    activeSiteId = cookieStore.get("sip.activeSiteId")?.value;

    const params = (await searchParams) ?? {};
    const nodataParam = params["nodata"];
    const nodataForced =
      nodataParam === "1" ||
      nodataParam === "true" ||
      (Array.isArray(nodataParam) && nodataParam.includes("1"));
    const substateParam = params["substate"];
    const forcedSubstate =
      typeof substateParam === "string"
        ? substateParam
        : Array.isArray(substateParam)
          ? substateParam[0]
          : undefined;

    if (activeSiteId) {
      dashboard = await fetchDashboardBySiteId(activeSiteId, accessToken);
    } else {
      dashboard = await fetchDashboardAggregate(); // Default demo 
    }

    // Detect the natural substate from signals the data layer gave us.
    const naturalSubstate = deriveOnboardingSubstate({
      accessToken,
      activeSiteId,
      mode: dashboard?.intelligence?.lossBreakdown?.mode as
        | "real"
        | "estimated"
        | "forecast"
        | undefined,
      lastGeneratedAtIso: dashboard?.generatedAt,
    });

    // Apply QA overrides, preferring the explicit `?substate=...` param.
    if (
      forcedSubstate === "anonymous" ||
      forcedSubstate === "no-site" ||
      forcedSubstate === "never-synced" ||
      forcedSubstate === "stale-telemetry" ||
      forcedSubstate === "live"
    ) {
      substate = forcedSubstate;
    } else if (nodataForced) {
      substate = "never-synced";
    } else {
      substate = naturalSubstate;
    }

    // Tell the shared view-model to route the hero as `no-data` whenever
    // we are in a substate that fully replaces the hero.
    dashboardVm = toDashboardPageViewModel(dashboard, {
      forceNoData: shouldReplaceHero(substate),
    });

    try {
      aiInsights = await fetchAiInsightsV3(dashboard, accessToken);
    } catch (aiError) {
      if (aiError instanceof ApiHttpError && aiError.status === 401) {
        aiInsightsError = "Sign in again to load personalized AI insights.";
      } else {
        aiInsightsError = aiError instanceof Error ? aiError.message : "Unknown AI error";
      }
    }

    // Opportunities are completely non-breaking and additive
    try {
      opportunities = await fetchMarketplaceOpportunities(dashboard, aiInsights ?? undefined, accessToken);
    } catch (oppError) {
      console.warn("Failed to load opportunities dynamically, continuing without them");
    }
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : "Unknown dashboard error";
  }

  const hasError = Boolean(errorMessage);
  const isDashboardEmpty = !hasError && !dashboardVm;

  if (hasError) {
    return (
      <section className="space-y-6">
        <DashboardErrorState message={errorMessage ?? "Unknown dashboard error"} />
      </section>
    );
  }

  if (isDashboardEmpty || !dashboardVm) {
    return (
      <section className="space-y-6">
        <DashboardEmptyState />
      </section>
    );
  }

  const lossBreakdown = dashboard?.intelligence?.lossBreakdown;
  const headroomMonthlyIls = dashboard?.intelligence?.profit?.headroomMonthlyIls ?? 0;
  const currentMonthlyIls = dashboard?.intelligence?.profit?.currentMonthlyIls ?? 0;
  const maintenanceLeakage = lossBreakdown?.totalMoneyLossIls ?? 0;
  const mode = lossBreakdown?.mode ?? "forecast";

  // --- Action lane routing (spec: docs/redesign/02-dashboard.md §8) ----------
  // Decisions are partitioned into Now / Recommended / Explore-later by
  // the view-model layer; see 01-state-contracts.md §2. LossIntelligenceCard
  // only joins the Now lane when the system is actively at risk — on a
  // healthy dashboard it would read as noise (spec 02 §6 "Modify").
  const systemState = dashboardVm.hero.systemState;
  // `replaceHero` covers A/B/C substates — the hero is swapped for
  // `ZeroDataHero`. `isEstimated` also includes the stale case for the
  // right-panel dimming rule below.
  const replaceHero = shouldReplaceHero(substate);
  const renderStaleRibbon = shouldRenderStaleRibbon(substate);
  const isEstimated = shouldTagAsEstimated(substate);
  const isNoData = replaceHero; // legacy alias — kept to minimize churn.
  const showLossInNow = systemState === "critical" || systemState === "warning";
  const decisionsByPriority = partitionDecisionsByPriority(
    aiInsights?.energyDecisions,
  );
  // In any hero-replacing substate, decision lanes are intentionally
  // suppressed: every "action" would be based on forecasted / canned data
  // and would read as noise next to the dominant onboarding CTA. Spec 12 §3.
  const hasNowActions =
    !replaceHero && (showLossInNow || decisionsByPriority.high.length > 0);
  const hasRecommendedActions =
    !replaceHero && decisionsByPriority.medium.length > 0;
  const hasExploreActions =
    !replaceHero && decisionsByPriority.low.length > 0;

  // Compact relative-time string for the sidebar chip detail slot.
  const staleDetail = substate === "stale-telemetry"
    ? formatRelativeShort(dashboard?.generatedAt)
    : undefined;

  return (
    <div className="relative pb-12">
      <OnboardingDialog />
      {/* Mirror the server-computed substate into a client cookie so the
          sidebar status chip shows the accurate state. */}
      <SubstateBridge substate={substate} detail={staleDetail} />
      <div id="connect" className="scroll-mt-24"></div>

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-[1fr_360px]">

        {/* LEFT COLUMN — priority stream: hero → lanes → supporting data → AI */}
        <section className="space-y-8">
          {/* 0. Stale-telemetry ribbon — Layer 2 of progressive disclosure.
               Non-destructive; the last-known dashboard stays visible below. */}
          {renderStaleRibbon ? (
            <StaleTelemetryBanner lastSeenIso={dashboard?.generatedAt} />
          ) : null}

          {/* 1. Hero — swaps to ZeroDataHero for the hero-replacing substates
               (anonymous / no-site / never-synced). The stale-telemetry
               substate keeps the normal hero visible because the data below
               it is still meaningful (it's the last-known state). */}
          {replaceHero ? (
            <ZeroDataHero substate={substate} />
          ) : (
            <HeroInsightCard
              hero={dashboardVm.hero}
              opportunities={opportunities}
              siteId={dashboardVm.siteId}
              siteName={dashboardVm.siteName}
              accessToken={accessToken}
            />
          )}

          {/* 2. Now — high priority actions (only when at risk or when we
               have a high-priority behavioral decision to act on today). */}
          {hasNowActions ? (
            <ActionLane
              priority="high"
              subtitle="Needs attention within 48 hours."
            >
              {showLossInNow ? (
                <LossIntelligenceCard lossBreakdown={lossBreakdown} />
              ) : null}
              {decisionsByPriority.high.map((decision) => (
                <EnergyDecisionInsightCard
                  key={decision.id}
                  decision={decision}
                  priority="high"
                  opportunities={opportunities}
                  siteId={dashboardVm.siteId}
                  accessToken={accessToken}
                />
              ))}
            </ActionLane>
          ) : null}

          {/* 3. Recommended — medium priority (forecasted ROI upgrades). */}
          {hasRecommendedActions ? (
            <ActionLane
              priority="medium"
              subtitle="Worth looking at this week."
            >
              {decisionsByPriority.medium.map((decision) => (
                <EnergyDecisionInsightCard
                  key={decision.id}
                  decision={decision}
                  priority="medium"
                  opportunities={opportunities}
                  siteId={dashboardVm.siteId}
                  accessToken={accessToken}
                />
              ))}
            </ActionLane>
          ) : null}

          {/* 4. Explore later — low-priority / low-confidence suggestions.
               Rendered as a tight `rows` lane so they read as secondary. */}
          {hasExploreActions ? (
            <ActionLane
              priority="low"
              subtitle="Long-payback ideas and low-confidence suggestions."
            >
              {decisionsByPriority.low.map((decision) => (
                <EnergyDecisionInsightCard
                  key={decision.id}
                  decision={decision}
                  priority="low"
                  opportunities={opportunities}
                  siteId={dashboardVm.siteId}
                  accessToken={accessToken}
                  compact
                />
              ))}
            </ActionLane>
          ) : null}

          {/* 5. Supporting data row — compact financial + maintenance snapshot.
               Wrapped in EstimatedSurface while in zero-data so numbers read
               as forecasts, not as committed facts. */}
          <section
            aria-label="Supporting data"
            className="grid gap-4 md:grid-cols-2"
          >
            <EstimatedSurface active={isEstimated}>
              <MaintenancePanel maintenance={dashboardVm.maintenance} />
            </EstimatedSurface>
            <EstimatedSurface active={isEstimated}>
              <SavingsPanel savings={dashboardVm.savings} />
            </EstimatedSurface>
          </section>

          {/* 6. AI deep-dive — collapsed by default, demoted below the fold.
               Suppressed in zero-data: there is no real telemetry for the
               engine to dive into, so the accordion would only advertise an
               empty panel. */}
          {!isNoData ? (
            <AiDeepDiveAccordion
              data={aiInsights as AiInsightContractOutputV3 | null}
              errorMessage={aiInsightsError}
            />
          ) : null}
        </section>

        {/* RIGHT COLUMN — numeric cockpit + connect-system CTA.
             In zero-data mode the whole aside is dimmed (spec 12 §3) so the
             dominant action remains the Connect CTA in the hero. */}
        <aside
          className={`space-y-4 ${replaceHero ? "opacity-75" : ""}`.trim()}
          data-estimated={isEstimated ? "true" : undefined}
          data-substate={substate}
        >
          <EstimatedSurface active={isEstimated}>
            <PerformanceStatsGrid performance={dashboardVm.performance} />
          </EstimatedSurface>

          <EstimatedSurface active={isEstimated}>
            <WhatIfSimulator
              currentMonthlyIls={currentMonthlyIls}
              maintenanceLeakageMonthlyIls={maintenanceLeakage}
              headroomMonthlyIls={headroomMonthlyIls}
            />
          </EstimatedSurface>

          <EstimatedSurface active={isEstimated}>
            <UsageWindowCard
              usageWindow={dashboardVm.usageWindow}
              opportunities={opportunities}
              siteId={dashboardVm.siteId}
              accessToken={accessToken}
            />
          </EstimatedSurface>

          {/* HardwareConnectCta is always present while unconnected; it is
               the primary destination of the zero-data hero and the stale
               ribbon's "Troubleshoot" CTA. */}
          {(replaceHero || renderStaleRibbon || mode !== "real") && <HardwareConnectCta />}
        </aside>

      </div>

      {/* Footer metadata */}
      <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-border/50 pt-6 text-xs text-muted-foreground sm:flex-row">
        <p>Generated: {dashboardVm.generatedAt}</p>
        <div className="flex gap-4">
          <span>
            Providers: {dashboardVm.providers.weather} (Weather) ·{" "}
            {dashboardVm.providers.solar} (Solar)
          </span>
          <span>Engine: {dashboardVm.providers.engine}</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Compact relative time ("3h ago", "2d ago") for the sidebar chip.
 * Kept here because it's tiny and nothing else needs it.
 */
function formatRelativeShort(iso?: string): string | undefined {
  if (!iso) return undefined;
  const then = Date.parse(iso);
  if (Number.isNaN(then)) return undefined;
  const hours = Math.floor((Date.now() - then) / (60 * 60 * 1000));
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}
