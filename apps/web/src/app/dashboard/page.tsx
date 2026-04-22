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

// 6 New Core Sections
import { HeroInsightCard } from "@/components/dashboard/HeroInsightCard";
import { PerformanceStatsGrid } from "@/components/dashboard/PerformanceStatsGrid";
import { MaintenancePanel } from "@/components/dashboard/MaintenancePanel";
import { SavingsPanel } from "@/components/dashboard/SavingsPanel";
import { UsageWindowCard } from "@/components/dashboard/UsageWindowCard";
import { AiInsightsPanel } from "@/components/dashboard/AiInsightsPanel";
import { LossIntelligenceCard } from "@/components/dashboard/LossIntelligenceCard";
import { WhatIfSimulator } from "@/components/dashboard/WhatIfSimulator";
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

  return (
    <div className="relative pb-12">
      <OnboardingDialog />
      <div id="connect" className="scroll-mt-24"></div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-8">
        
        {/* LEFT COLUMN: The Main Action Engine */}
        <section className="space-y-6">
          {/* 1. Hero Insight (Above the fold) */}
          <HeroInsightCard 
            hero={dashboardVm.hero} 
            opportunities={opportunities} 
            siteId={dashboardVm.siteId}
            siteName={dashboardVm.siteName}
            accessToken={accessToken}
          />

          {/* 2. Loss Tracking Engine Hook */}
          <LossIntelligenceCard lossBreakdown={lossBreakdown} />
          
          {mode !== "real" && (
            <HardwareConnectCta />
          )}

          {/* AI Decisions Context */}
          <div className="pt-4">
            <h2 className="mb-4 text-lg font-semibold tracking-tight text-white">AI Analysis & Decisions</h2>
            <EnergyDecisionsSection 
              decisions={aiInsights?.energyDecisions ?? []} 
              opportunities={opportunities}
              siteId={dashboardVm.siteId}
              accessToken={accessToken}
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2 pt-4">
            <MaintenancePanel maintenance={dashboardVm.maintenance} />
            <SavingsPanel savings={dashboardVm.savings} />
          </div>
        </section>

        {/* RIGHT COLUMN: The Decision Cockpit */}
        <aside className="space-y-6">
          {/* 1. Performance Overview */}
          <PerformanceStatsGrid performance={dashboardVm.performance} />

          {/* 2. What-If Simulator (Crucial placement next to the Hero loss) */}
          <WhatIfSimulator 
            currentMonthlyIls={currentMonthlyIls}
            maintenanceLeakageMonthlyIls={maintenanceLeakage}
            headroomMonthlyIls={headroomMonthlyIls}
          />

          {/* 3. Deep Context */}
          <UsageWindowCard 
            usageWindow={dashboardVm.usageWindow} 
            opportunities={opportunities} 
            siteId={dashboardVm.siteId}
            accessToken={accessToken}
          />

          <AiInsightsPanel 
            data={aiInsights as AiInsightContractOutputV3 | null} 
            errorMessage={aiInsightsError} 
          />
        </aside>

      </div>

      {/* Footer metadata */}
      <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-border/50 pt-6 text-xs text-muted-foreground sm:flex-row">
        <p>
          Generated: {dashboardVm.generatedAt}
        </p>
        <div className="flex gap-4">
          <span>Providers: {dashboardVm.providers.weather} (Weather) · {dashboardVm.providers.solar} (Solar)</span>
          <span>Engine: {dashboardVm.providers.engine}</span>
        </div>
      </div>
    </div>
  );
}
