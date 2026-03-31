import { cookies } from "next/headers";
import type { AiInsightContractOutput, DashboardAggregateData } from "@/lib/contracts";
import { fetchAiInsights } from "@/lib/api/ai-insights";
import { ApiHttpError } from "@/lib/api/client";
import { fetchDashboardAggregate } from "@/lib/api/dashboard";
import { toSavingsPageViewModel } from "@/lib/view-models/savings";
import { SavingsAiInsightsSection } from "./_components/savings-ai-insights-section";
import { SavingsEmptyState, SavingsErrorState } from "./_components/savings-state";

export default async function SavingsPage() {
  let aggregate: DashboardAggregateData | null = null;
  let savingsVm: ReturnType<typeof toSavingsPageViewModel> | null = null;
  let errorMessage: string | null = null;
  let aiInsights: AiInsightContractOutput | null = null;
  let aiInsightsError: string | null = null;

  try {
    const accessToken = (await cookies()).get("sip.accessToken")?.value;
    aggregate = await fetchDashboardAggregate();
    savingsVm = toSavingsPageViewModel(aggregate);
    try {
      aiInsights = await fetchAiInsights(aggregate, accessToken);
    } catch (aiError) {
      if (aiError instanceof ApiHttpError && aiError.status === 401) {
        aiInsightsError = "Sign in again to load personalized AI insights.";
      } else {
        aiInsightsError = aiError instanceof Error ? aiError.message : "Unknown AI error";
      }
    }
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : "Unknown savings error";
  }

  const hasError = Boolean(errorMessage);
  const isEmpty = !hasError && !savingsVm;

  return (
    <section className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-8">
        <h1 className="text-2xl font-semibold tracking-tight">{savingsVm?.header.title ?? "Savings"}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {savingsVm?.header.subtitle ?? "Savings signals from aggregate payload."}
        </p>
        {hasError ? <SavingsErrorState message={errorMessage ?? "Unknown savings error"} /> : null}
      </div>

      {hasError ? null : isEmpty ? (
        <SavingsEmptyState />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <article className="rounded-xl border border-border bg-card p-5">
              <p className="text-xs text-muted-foreground">Financial Summary</p>
              <p className="mt-2 text-sm">
                Daily estimated savings:{" "}
                <span className="font-semibold">
                  {savingsVm?.financial.dailyEstimatedSavingsText ?? "--"}
                </span>
              </p>
              <p className="mt-1 text-sm">
                Monthly estimated savings:{" "}
                <span className="font-semibold">
                  {savingsVm?.financial.monthlyEstimatedSavingsText ?? "--"}
                </span>
              </p>
              <p className="mt-1 text-sm">
                Yearly optimization potential:{" "}
                <span className="font-semibold">
                  {savingsVm?.financial.yearlyOptimizationPotentialText ?? "--"}
                </span>
              </p>
            </article>

            <article className="rounded-xl border border-border bg-card p-5">
              <p className="text-xs text-muted-foreground">Optimization Value</p>
              <p className="mt-2 text-sm">
                Estimated value:{" "}
                <span className="font-semibold">{savingsVm?.optimization.estimatedValueText ?? "--"}</span>
              </p>
              <p className="mt-1 text-sm">
                Opportunity score:{" "}
                <span className="font-semibold">{savingsVm?.optimization.opportunityScoreText ?? "--"}</span>
              </p>
            </article>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <article className="rounded-xl border border-border bg-card p-5">
              <p className="text-xs text-muted-foreground">Benchmark and Export Context</p>
              <p className="mt-2 text-sm">
                Expected production:{" "}
                <span className="font-semibold">{savingsVm?.benchmark.expectedProductionText ?? "--"}</span>
              </p>
              <p className="mt-1 text-sm">
                Actual production:{" "}
                <span className="font-semibold">{savingsVm?.benchmark.actualProductionText ?? "--"}</span>
              </p>
              <p className="mt-1 text-sm">
                Expected export:{" "}
                <span className="font-semibold">{savingsVm?.benchmark.expectedExportText ?? "--"}</span>
              </p>
              <p className="mt-1 text-sm">
                Actual export:{" "}
                <span className="font-semibold">{savingsVm?.benchmark.actualExportText ?? "--"}</span>
              </p>
              <p className="mt-1 text-sm">
                Production deviation:{" "}
                <span className="font-semibold">{savingsVm?.benchmark.productionDeviationText ?? "--"}</span>
              </p>
              <p className="mt-1 text-sm">
                Export deviation:{" "}
                <span className="font-semibold">{savingsVm?.benchmark.exportDeviationText ?? "--"}</span>
              </p>
              <p className="mt-1 text-sm">
                Performance status:{" "}
                <span className="font-semibold">{savingsVm?.benchmark.performanceStatus ?? "--"}</span>
              </p>
              <p className="mt-2 text-xs text-muted-foreground">{savingsVm?.benchmark.insight ?? "--"}</p>
            </article>

            <article className="rounded-xl border border-border bg-card p-5">
              <p className="text-xs text-muted-foreground">Self-Consumption Context</p>
              <p className="mt-2 text-sm">
                Self-consumption score:{" "}
                <span className="font-semibold">{savingsVm?.selfConsumption.scoreText ?? "--"}</span>
              </p>
              <p className="mt-1 text-sm">
                Estimated savings:{" "}
                <span className="font-semibold">{savingsVm?.selfConsumption.estimatedSavingsText ?? "--"}</span>
              </p>
              <p className="mt-1 text-sm">
                Recommended usage window:{" "}
                <span className="font-semibold">
                  {savingsVm?.selfConsumption.recommendedWindowText ?? "--"}
                </span>
              </p>
              <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                {savingsVm?.selfConsumption.actions.length ? (
                  savingsVm.selfConsumption.actions.map((item, index) => <li key={index}>- {item}</li>)
                ) : (
                  <li>No self-consumption actions available.</li>
                )}
              </ul>
            </article>
          </div>

          <SavingsAiInsightsSection data={aiInsights} errorMessage={aiInsightsError} />

          <div className="grid gap-4 md:grid-cols-2">
            <article className="rounded-xl border border-border bg-card p-5">
              <p className="text-xs text-muted-foreground">Likely Value-Related Recommendations</p>
              <ul className="mt-2 space-y-2 text-sm">
                {savingsVm?.recommendations.valueRelated.length ? (
                  savingsVm.recommendations.valueRelated.map((item) => (
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
                  <li className="text-muted-foreground">No clearly value-related items.</li>
                )}
              </ul>
            </article>

            <article className="rounded-xl border border-border bg-card p-5">
              <p className="text-xs text-muted-foreground">Other Recommendations (Transparent View)</p>
              <ul className="mt-2 space-y-2 text-sm">
                {savingsVm?.recommendations.other.length ? (
                  savingsVm.recommendations.other.map((item) => (
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
            Site: {savingsVm?.context.siteId ?? "--"} | Generated at: {savingsVm?.context.generatedAt ?? "--"} |
            Source: {savingsVm?.context.source ?? "--"} | Providers: weather=
            {savingsVm?.context.providers.weather ?? "--"}, solar=
            {savingsVm?.context.providers.solar ?? "--"}, engine=
            {savingsVm?.context.providers.engine ?? "--"}
          </div>
        </>
      )}
    </section>
  );
}
