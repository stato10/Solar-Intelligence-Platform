import { cookies } from "next/headers";
import type { AiInsightContractOutputV3, DashboardAggregateData } from "@/lib/contracts";
import { fetchAiInsightsV3 } from "@/lib/api/ai-insights";
import { ApiHttpError } from "@/lib/api/client";
import { fetchDashboardAggregate, fetchDashboardBySiteId } from "@/lib/api/dashboard";
import { fetchMarketplaceOpportunities } from "@/lib/api/marketplace";
import type { MarketplaceOpportunity } from "@/lib/contracts/marketplace";
import { toDashboardPageViewModel } from "@/lib/view-models/dashboard";
import { EnergyDecisionsSection } from "@/components/dashboard/EnergyDecisionsSection";
import { DashboardEmptyState, DashboardErrorState } from "./_components/dashboard-state";

// Primary column
import { HeroInsightCard } from "@/components/dashboard/HeroInsightCard";
import { ActionLane } from "@/components/dashboard/ActionLane";
import { LossIntelligenceCard } from "@/components/dashboard/LossIntelligenceCard";
import { MaintenancePanel } from "@/components/dashboard/MaintenancePanel";
import { SavingsPanel } from "@/components/dashboard/SavingsPanel";
import { AiDeepDiveAccordion } from "@/components/dashboard/AiDeepDiveAccordion";

// Right panel
import { PerformanceStatsGrid } from "@/components/dashboard/PerformanceStatsGrid";
import { WhatIfSimulator } from "@/components/dashboard/WhatIfSimulator";
import { UsageWindowCard } from "@/components/dashboard/UsageWindowCard";
import { HardwareConnectCta } from "@/components/dashboard/HardwareConnectCta";

import { OnboardingDialog } from "@/components/dashboard/OnboardingDialog";

export default async function DashboardPage() {
  let dashboard: DashboardAggregateData | null = null;
  let dashboardVm: ReturnType<typeof toDashboardPageViewModel> | null = null;
  let errorMessage: string | null = null;
  let aiInsights: AiInsightContractOutputV3 | null = null;
  let aiInsightsError: string | null = null;
  let opportunities: MarketplaceOpportunity[] = [];
  let accessToken: string | undefined;

  try {
    const cookieStore = await cookies();
    accessToken = cookieStore.get("sip.accessToken")?.value;
    const activeSiteId = cookieStore.get("sip.activeSiteId")?.value;

    if (activeSiteId) {
      dashboard = await fetchDashboardBySiteId(activeSiteId, accessToken);
    } else {
      dashboard = await fetchDashboardAggregate(); // Default demo 
    }
    dashboardVm = toDashboardPageViewModel(dashboard);
    
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
  // Until EnergyDecisionsSection is split by ActionPriority in the next step,
  // we route the whole section into Recommended and surface LossIntelligenceCard
  // in Now only when the system is actively at risk.
  const systemState = dashboardVm.hero.systemState;
  const showLossInNow = systemState === "critical" || systemState === "warning";
  const hasEnergyDecisions =
    (aiInsights?.energyDecisions?.length ?? 0) > 0;

  return (
    <div className="relative pb-12">
      <OnboardingDialog />
      <div id="connect" className="scroll-mt-24"></div>

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-[1fr_360px]">

        {/* LEFT COLUMN — priority stream: hero → lanes → supporting data → AI */}
        <section className="space-y-8">
          {/* 1. Hero */}
          <HeroInsightCard
            hero={dashboardVm.hero}
            opportunities={opportunities}
            siteId={dashboardVm.siteId}
            siteName={dashboardVm.siteName}
            accessToken={accessToken}
          />

          {/* 2. Now — high priority actions (only when at risk) */}
          {showLossInNow ? (
            <ActionLane
              priority="high"
              subtitle="Needs attention within 48 hours."
            >
              <LossIntelligenceCard lossBreakdown={lossBreakdown} />
            </ActionLane>
          ) : null}

          {/* 3. Recommended — medium priority (AI energy decisions) */}
          {hasEnergyDecisions ? (
            <ActionLane
              priority="medium"
              subtitle="Worth looking at this week."
            >
              <EnergyDecisionsSection
                decisions={aiInsights?.energyDecisions ?? []}
                opportunities={opportunities}
                siteId={dashboardVm.siteId}
                accessToken={accessToken}
              />
            </ActionLane>
          ) : null}

          {/* 4. Supporting data row — compact financial + maintenance snapshot */}
          <section
            aria-label="Supporting data"
            className="grid gap-4 md:grid-cols-2"
          >
            <MaintenancePanel maintenance={dashboardVm.maintenance} />
            <SavingsPanel savings={dashboardVm.savings} />
          </section>

          {/* 5. AI deep-dive — collapsed by default, demoted below the fold */}
          <AiDeepDiveAccordion
            data={aiInsights as AiInsightContractOutputV3 | null}
            errorMessage={aiInsightsError}
          />
        </section>

        {/* RIGHT COLUMN — numeric cockpit + connect-system CTA */}
        <aside className="space-y-4">
          <PerformanceStatsGrid performance={dashboardVm.performance} />

          <WhatIfSimulator
            currentMonthlyIls={currentMonthlyIls}
            maintenanceLeakageMonthlyIls={maintenanceLeakage}
            headroomMonthlyIls={headroomMonthlyIls}
          />

          <UsageWindowCard
            usageWindow={dashboardVm.usageWindow}
            opportunities={opportunities}
            siteId={dashboardVm.siteId}
            accessToken={accessToken}
          />

          {mode !== "real" && <HardwareConnectCta />}
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
