import type { AiInsightContractOutput, DashboardAggregateData } from "@/lib/contracts";
import { fetchAiInsights } from "@/lib/api/ai-insights";
import { fetchDashboardAggregate } from "@/lib/api/dashboard";
import { toMaintenancePageViewModel } from "@/lib/view-models/maintenance";
import { MaintenanceAiInsightsSection } from "./_components/maintenance-ai-insights-section";
import { MaintenanceEmptyState, MaintenanceErrorState } from "./_components/maintenance-state";

export default async function MaintenancePage() {
  let aggregate: DashboardAggregateData | null = null;
  let maintenanceVm: ReturnType<typeof toMaintenancePageViewModel> | null = null;
  let errorMessage: string | null = null;
  let aiInsights: AiInsightContractOutput | null = null;
  let aiInsightsError: string | null = null;

  try {
    aggregate = await fetchDashboardAggregate();
    maintenanceVm = toMaintenancePageViewModel(aggregate);
    try {
      aiInsights = await fetchAiInsights(aggregate);
    } catch (aiError) {
      aiInsightsError = aiError instanceof Error ? aiError.message : "Unknown AI error";
    }
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : "Unknown maintenance error";
  }

  const hasError = Boolean(errorMessage);
  const isEmpty = !hasError && !maintenanceVm;

  return (
    <section className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-8">
        <h1 className="text-2xl font-semibold tracking-tight">
          {maintenanceVm?.header.title ?? "Maintenance"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {maintenanceVm?.header.subtitle ?? "Maintenance signals from aggregate payload."}
        </p>
        {hasError ? <MaintenanceErrorState message={errorMessage ?? "Unknown maintenance error"} /> : null}
      </div>

      {hasError ? null : isEmpty ? (
        <MaintenanceEmptyState />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <article className="rounded-xl border border-border bg-card p-5">
              <p className="text-xs text-muted-foreground">Soiling</p>
              <p className="mt-2 text-sm">
                Score: <span className="font-semibold">{maintenanceVm?.soiling.scoreText ?? "--"}</span>
              </p>
              <p className="mt-1 text-sm">
                Estimated loss:{" "}
                <span className="font-semibold">{maintenanceVm?.soiling.estimatedLossText ?? "--"}</span>
              </p>
              <p className="mt-1 text-sm">
                Cleaning recommended:{" "}
                <span className="font-semibold">
                  {maintenanceVm?.soiling.cleaningRecommendedText ?? "--"}
                </span>
              </p>
              <p className="mt-1 text-sm">
                Recommended cleaning date:{" "}
                <span className="font-semibold">
                  {maintenanceVm?.soiling.recommendedCleaningDateText ?? "--"}
                </span>
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                {maintenanceVm?.soiling.explanation ?? "--"}
              </p>
            </article>

            <article className="rounded-xl border border-border bg-card p-5">
              <p className="text-xs text-muted-foreground">Heat Maintenance Signals</p>
              <p className="mt-2 text-sm">
                Score: <span className="font-semibold">{maintenanceVm?.heat.scoreText ?? "--"}</span>
              </p>
              <p className="mt-1 text-sm">
                Estimated loss:{" "}
                <span className="font-semibold">{maintenanceVm?.heat.estimatedLossText ?? "--"}</span>
              </p>
              <p className="mt-1 text-sm">
                Peak heat window:{" "}
                <span className="font-semibold">{maintenanceVm?.heat.peakWindowText ?? "--"}</span>
              </p>
            </article>
          </div>

          <article className="rounded-xl border border-border bg-card p-5">
            <p className="text-xs text-muted-foreground">Maintenance Alerts</p>
            <ul className="mt-2 space-y-2 text-sm">
              {maintenanceVm?.alerts.items.length ? (
                maintenanceVm.alerts.items.map((alert) => (
                  <li key={alert.id} className="rounded-md border border-border px-3 py-2">
                    <p className="font-medium">
                      {alert.riskType} ({alert.severity})
                    </p>
                    <p className="text-xs text-muted-foreground">{alert.message}</p>
                    <p className="text-xs text-muted-foreground">Window: {alert.windowText}</p>
                  </li>
                ))
              ) : (
                <li className="text-muted-foreground">No maintenance alerts available.</li>
              )}
            </ul>
          </article>

          <MaintenanceAiInsightsSection data={aiInsights} errorMessage={aiInsightsError} />

          <div className="grid gap-4 md:grid-cols-2">
            <article className="rounded-xl border border-border bg-card p-5">
              <p className="text-xs text-muted-foreground">Likely Maintenance Recommendations</p>
              <ul className="mt-2 space-y-2 text-sm">
                {maintenanceVm?.recommendations.maintenanceLikely.length ? (
                  maintenanceVm.recommendations.maintenanceLikely.map((item) => (
                    <li key={item.id} className="rounded-md border border-border px-3 py-2">
                      <p className="font-medium">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.message}</p>
                      <p className="text-xs text-muted-foreground">
                        Type: {item.typeLabel} | Module: {item.sourceModuleLabel} | Severity: {item.severity}
                      </p>
                      <p className="text-xs text-muted-foreground">Valid: {item.validityText}</p>
                    </li>
                  ))
                ) : (
                  <li className="text-muted-foreground">No clearly maintenance-specific items.</li>
                )}
              </ul>
            </article>

            <article className="rounded-xl border border-border bg-card p-5">
              <p className="text-xs text-muted-foreground">Other Recommendations (Transparent View)</p>
              <ul className="mt-2 space-y-2 text-sm">
                {maintenanceVm?.recommendations.other.length ? (
                  maintenanceVm.recommendations.other.map((item) => (
                    <li key={item.id} className="rounded-md border border-border px-3 py-2">
                      <p className="font-medium">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.message}</p>
                      <p className="text-xs text-muted-foreground">
                        Type: {item.typeLabel} | Module: {item.sourceModuleLabel} | Severity: {item.severity}
                      </p>
                      <p className="text-xs text-muted-foreground">Valid: {item.validityText}</p>
                    </li>
                  ))
                ) : (
                  <li className="text-muted-foreground">No additional recommendations available.</li>
                )}
              </ul>
            </article>
          </div>

          <div className="rounded-xl border border-border bg-card p-5 text-xs text-muted-foreground">
            Site: {maintenanceVm?.context.siteId ?? "--"} | Generated at:{" "}
            {maintenanceVm?.context.generatedAt ?? "--"} | Source: {maintenanceVm?.context.source ?? "--"} |
            Providers: weather={maintenanceVm?.context.providers.weather ?? "--"}, solar=
            {maintenanceVm?.context.providers.solar ?? "--"}, engine=
            {maintenanceVm?.context.providers.engine ?? "--"}
          </div>
        </>
      )}
    </section>
  );
}
