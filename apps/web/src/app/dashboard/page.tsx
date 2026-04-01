import { BarChart3, TriangleAlert, Zap } from "lucide-react";
import { cookies } from "next/headers";
import type { AiInsightContractOutputV3, DashboardAggregateData } from "@/lib/contracts";
import { fetchAiInsightsV3 } from "@/lib/api/ai-insights";
import { ApiHttpError } from "@/lib/api/client";
import { fetchDashboardAggregate } from "@/lib/api/dashboard";
import { toDashboardPageViewModel } from "@/lib/view-models/dashboard";
import { DashboardAiInsightsSection } from "./_components/ai-insights-section";
import { EnergyDecisionsSection } from "@/components/dashboard/EnergyDecisionsSection";
import { DashboardEmptyState, DashboardErrorState } from "./_components/dashboard-state";

export default async function DashboardPage() {
  let dashboard: DashboardAggregateData | null = null;
  let dashboardVm: ReturnType<typeof toDashboardPageViewModel> | null = null;
  let errorMessage: string | null = null;
  let aiInsights: AiInsightContractOutputV3 | null = null;
  let aiInsightsError: string | null = null;

  try {
    const accessToken = (await cookies()).get("sip.accessToken")?.value;
    dashboard = await fetchDashboardAggregate();
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
  const primaryRecommendation = dashboardVm?.recommendations.items?.[0] ?? null;

  return (
    <section className="space-y-8">
      <div className="glass-card rounded-2xl p-8">
        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Control overview
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">{headerTitle}</h1>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground">{headerSubtitle}</p>
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
                <article key={card.id} className="glass-card rounded-2xl p-5">
                  <div className="mb-4 inline-flex rounded-lg bg-primary/12 p-2 text-primary">
                    <CardIcon className="h-5 w-5" />
                  </div>
                  <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    {card.title}
                  </p>
                  <p className="mt-2 text-3xl font-semibold tracking-tight">{card.valueText}</p>
                  <p className="mt-2 text-xs text-muted-foreground">{card.hint}</p>
                </article>
              );
            })}
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-4">
              <DashboardAiInsightsSection data={aiInsights} errorMessage={aiInsightsError} />
            </div>
            <aside className="space-y-4">
              <article className="glass-card rounded-2xl p-5">
                <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  Financial impact
                </p>
                <p className="mt-3 text-sm">
                  Daily savings:{" "}
                  <span className="font-semibold">{dashboardVm?.financial.dailySavingsText ?? "--"}</span>
                </p>
                <p className="mt-1 text-sm">
                  Monthly savings:{" "}
                  <span className="font-semibold">{dashboardVm?.financial.monthlySavingsText ?? "--"}</span>
                </p>
              </article>

              <article className="glass-card rounded-2xl p-5">
                <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  Next best action
                </p>
                {primaryRecommendation ? (
                  <div className="mt-3 rounded-xl border border-border/80 bg-card/60 p-3">
                    <p className="text-sm font-semibold">{primaryRecommendation.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{primaryRecommendation.message}</p>
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-muted-foreground">No recommendations available.</p>
                )}
              </article>
            </aside>
          </div>

          <EnergyDecisionsSection decisions={aiInsights?.energyDecisions ?? []} />

          <div className="grid gap-4 md:grid-cols-2">
            <article className="glass-card rounded-2xl p-5">
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Recommendations
              </p>
              <ul className="mt-2 space-y-2 text-sm">
                {dashboardVm?.recommendations.items?.length ? (
                  dashboardVm.recommendations.items.map((item) => (
                    <li key={item.id} className="rounded-xl border border-border/80 bg-card/60 px-3 py-2.5">
                      <p className="font-medium">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.message}</p>
                    </li>
                  ))
                ) : (
                  <li className="text-muted-foreground">No recommendations available.</li>
                )}
              </ul>
            </article>

            <article className="glass-card rounded-2xl p-5">
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Data providers
              </p>
              <p className="mt-3 text-sm text-muted-foreground">
                weather=<span className="font-medium text-foreground">{dashboardVm?.providers.weather ?? "--"}</span>
                , solar=<span className="font-medium text-foreground">{dashboardVm?.providers.solar ?? "--"}</span>
              </p>
            </article>
          </div>
        </>
      )}
    </section>
  );
}
