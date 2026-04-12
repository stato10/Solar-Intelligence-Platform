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
      console.error("Failed to load opportunities dynamically, continuing without them", oppError);
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

  return (
    <section className="space-y-6 pb-12">
      {/* 1. Hero Insight (Above the fold) */}
      <HeroInsightCard 
        hero={dashboardVm.hero} 
        opportunities={opportunities} 
        siteId={dashboardVm.siteId}
        siteName={dashboardVm.siteName}
        accessToken={accessToken}
      />

      {/* 2. Performance Stats Grid */}
      <PerformanceStatsGrid performance={dashboardVm.performance} />

      {/* 3 & 4. Maintenance and Savings (Below the fold, 2-column) */}
      <div className="grid gap-6 md:grid-cols-2">
        <MaintenancePanel maintenance={dashboardVm.maintenance} />
        <SavingsPanel savings={dashboardVm.savings} />
      </div>

      {/* 5. Usage Optimization Window */}
      <UsageWindowCard 
        usageWindow={dashboardVm.usageWindow} 
        opportunities={opportunities} 
        siteId={dashboardVm.siteId}
        accessToken={accessToken}
      />

      {/* 6. AI Insights Panel (Collapsible) */}
      <div className="pt-2">
        <h2 className="mb-4 text-lg font-semibold tracking-tight">AI Analysis & Decisions</h2>
        <div className="space-y-6">
          <EnergyDecisionsSection 
            decisions={aiInsights?.energyDecisions ?? []} 
            opportunities={opportunities}
            siteId={dashboardVm.siteId}
            accessToken={accessToken}
          />
          <AiInsightsPanel data={aiInsights} errorMessage={aiInsightsError} />
        </div>
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
    </section>
  );
}
