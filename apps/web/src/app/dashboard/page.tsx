import { BarChart3, TriangleAlert, Zap } from "lucide-react";
import type { AiInsightContractOutput, DashboardAggregateData } from "@/lib/contracts";
import { fetchAiInsightsV3 } from "@/lib/api/ai-insights";
import { fetchDashboardAggregate } from "@/lib/api/dashboard";
import { toDashboardPageViewModel } from "@/lib/view-models/dashboard";
import { DashboardAiInsightsSection } from "./_components/ai-insights-section";
import { EnergyDecisionsSection } from "@/components/dashboard/EnergyDecisionsSection";
import { DashboardEmptyState, DashboardErrorState } from "./_components/dashboard-state";

export default async function DashboardPage() {
  let dashboard: DashboardAggregateData | null = null;
  let dashboardVm: ReturnType<typeof toDashboardPageViewModel> | null = null;
  let errorMessage: string | null = null;
  let aiInsights: import("@/lib/contracts").AiInsightContractOutputV3 | null = null;
  let aiInsightsError: string | null = null;

  try {
    dashboard = await fetchDashboardAggregate();
    dashboardVm = toDashboardPageViewModel(dashboard);
    try {
      aiInsights = await fetchAiInsightsV3(dashboard);
    } catch (aiError) {
      aiInsightsError = aiError instanceof Error ? aiError.message : "Unknown AI error";
    }
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : "Unknown dashboard error";
  }
  const iconByKey = {
    zap: Zap,
    "triangle-alert": TriangleAlert,
    "bar-chart-3": BarChart3
  } as const;
  const hasError = Boolean(errorMessage);
  const isDashboardEmpty = !hasError && !dashboardVm;
  const headerTitle = dashboardVm?.header.title ?? "Solar Dashboard";
  const headerSubtitle =
    dashboardVm?.header.subtitle ?? "Live data is pulled from the aggregated backend endpoint.";

  return (
    <section className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-8">
        <h1 className="text-2xl font-semibold tracking-tight">{headerTitle}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{headerSubtitle}</p>
        {hasError ? <DashboardErrorState message={errorMessage ?? "Unknown dashboard error"} /> : null}
      </div>

      {hasError ? null : isDashboardEmpty ? (
        <DashboardEmptyState />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            {(dashboardVm?.cards ?? []).map((card) => {
              const CardIcon = iconByKey[card.icon];
              return (
                <article key={card.id} className="rounded-xl border border-border bg-card p-5">
                  <CardIcon className="mb-3 h-5 w-5 text-primary" />
                  <p className="text-xs text-muted-foreground">{card.title}</p>
                  <p className="mt-1 text-2xl font-semibold tracking-tight">{card.valueText}</p>
                  <p className="mt-2 text-xs text-muted-foreground">{card.hint}</p>
                </article>
              );
            })}
          </div>

          <EnergyDecisionsSection decisions={aiInsights?.energyDecisions ?? []} />

          <DashboardAiInsightsSection data={aiInsights as any} errorMessage={aiInsightsError} />

          <div className="grid gap-4 md:grid-cols-2">
            <article className="rounded-xl border border-border bg-card p-5">
              <p className="text-xs text-muted-foreground">Financial Snapshot</p>
              <p className="mt-2 text-sm">
                Daily savings:{" "}
                <span className="font-semibold">{dashboardVm?.financial.dailySavingsText ?? "--"}</span>
              </p>
              <p className="mt-1 text-sm">
                Monthly savings:{" "}
                <span className="font-semibold">{dashboardVm?.financial.monthlySavingsText ?? "--"}</span>
              </p>
            </article>

            <article className="rounded-xl border border-border bg-card p-5">
              <p className="text-xs text-muted-foreground">Recommendations</p>
              <ul className="mt-2 space-y-2 text-sm">
                {dashboardVm?.recommendations.items?.length ? (
                  dashboardVm.recommendations.items.map((item) => (
                    <li key={item.id} className="rounded-md border border-border px-3 py-2">
                      <p className="font-medium">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.message}</p>
                    </li>
                  ))
                ) : (
                  <li className="text-muted-foreground">No recommendations available.</li>
                )}
              </ul>
            </article>
          </div>

          <div className="rounded-xl border border-border bg-card p-5 text-xs text-muted-foreground">
            Data providers: weather={dashboardVm?.providers.weather ?? "--"}, solar=
            {dashboardVm?.providers.solar ?? "--"}
          </div>
        </>
      )}
    </section>
  );
}
