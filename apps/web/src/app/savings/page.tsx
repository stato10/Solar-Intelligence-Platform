import { cookies } from "next/headers";
import type { AiInsightContractOutput, DashboardAggregateData } from "@/lib/contracts";
import { fetchAiInsights } from "@/lib/api/ai-insights";
import { ApiHttpError } from "@/lib/api/client";
import { fetchDashboardAggregate, fetchDashboardBySiteId } from "@/lib/api/dashboard";
import { toSavingsPageViewModel } from "@/lib/view-models/savings";
import { SavingsAiInsightsSection } from "./_components/savings-ai-insights-section";
import { SavingsEmptyState, SavingsErrorState } from "./_components/savings-state";
import {
  Coins,
  TrendingUp,
  TrendingDown,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Sun,
  Zap,
  Battery,
  Car,
  Sparkles,
} from "lucide-react";

export default async function SavingsPage() {
  let aggregate: DashboardAggregateData | null = null;
  let vm: ReturnType<typeof toSavingsPageViewModel> | null = null;
  let errorMessage: string | null = null;
  let aiInsights: AiInsightContractOutput | null = null;
  let aiInsightsError: string | null = null;

  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("sip.accessToken")?.value;
    const activeSiteId = cookieStore.get("sip.activeSiteId")?.value;

    aggregate = activeSiteId
      ? await fetchDashboardBySiteId(activeSiteId, accessToken)
      : await fetchDashboardAggregate();

    vm = toSavingsPageViewModel(aggregate);

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
  const isEmpty = !hasError && !vm;

  if (hasError) {
    return (
      <section className="space-y-6">
        <SavingsErrorState message={errorMessage ?? "Unknown savings error"} />
      </section>
    );
  }

  if (isEmpty || !vm) {
    return (
      <section className="space-y-6">
        <SavingsEmptyState />
      </section>
    );
  }

  const OPPORTUNITY_ICONS: Record<string, React.ElementType> = {
    cleaning: Sparkles,
    battery: Battery,
    ev: Car,
    automation: Zap,
  };

  return (
    <section className="space-y-6 pb-12">
      {/* ─── Hero Section ─────────────────────────────────────────── */}
      <article className="glass-card relative overflow-hidden rounded-3xl p-8 md:p-10">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-emerald-500/15 via-emerald-400/5 to-transparent" />
        <div className="relative">
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Financial Optimization
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            {vm.header.title}
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
            {vm.header.subtitle}
          </p>

          {/* Primary savings KPIs */}
          <div className="mt-6 flex flex-wrap gap-8">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Daily</p>
              <p className="mt-1 text-3xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                {vm.financial.dailyEstimatedSavingsText}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Monthly</p>
              <p className="mt-1 text-3xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                {vm.financial.monthlyEstimatedSavingsText}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Yearly Potential</p>
              <p className="mt-1 text-3xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                {vm.financial.yearlyOptimizationPotentialText}
              </p>
            </div>
          </div>
        </div>
      </article>

      {/* ─── Profit vs Loss ────────────────────────────────────────── */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Current vs Optimal */}
        <article className="glass-card rounded-2xl p-5 md:p-6">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-4">
            Profit vs Loss
          </p>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-emerald-500/10 p-1.5">
                  <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500" />
                </div>
                <span className="text-sm">Current monthly</span>
              </div>
              <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                {vm.profitVsLoss.currentMonthly}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-primary/10 p-1.5">
                  <Target className="h-3.5 w-3.5 text-primary" />
                </div>
                <span className="text-sm">Optimal monthly</span>
              </div>
              <span className="text-lg font-bold text-primary">
                {vm.profitVsLoss.optimalMonthly}
              </span>
            </div>

            {/* Efficiency bar */}
            <div>
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                <span>Savings efficiency</span>
                <span className="font-medium">{vm.profitVsLoss.efficiencyPercent}%</span>
              </div>
              <div className="h-3 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-primary transition-all duration-700"
                  style={{ width: `${vm.profitVsLoss.efficiencyPercent}%` }}
                />
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2">
              <TrendingDown className="h-3.5 w-3.5 text-amber-500" />
              <p className="text-xs">
                <span className="font-medium text-amber-600 dark:text-amber-400">{vm.profitVsLoss.maintenanceLeakage}</span>
                <span className="text-muted-foreground"> lost monthly to maintenance issues</span>
              </p>
            </div>

            <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
              <p className="text-xs">
                <span className="font-medium text-emerald-600 dark:text-emerald-400">{vm.profitVsLoss.headroom}</span>
                <span className="text-muted-foreground"> additional savings possible</span>
              </p>
            </div>
          </div>
        </article>

        {/* Export vs Self-Consumption */}
        <article className="glass-card rounded-2xl p-5 md:p-6">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-4">
            Export vs Self-Consumption
          </p>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-blue-500/10 p-1.5">
                  <ArrowDownRight className="h-3.5 w-3.5 text-blue-500" />
                </div>
                <span className="text-sm">Export value (daily)</span>
              </div>
              <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {vm.profitVsLoss.exportValueDaily}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-emerald-500/10 p-1.5">
                  <Sun className="h-3.5 w-3.5 text-emerald-500" />
                </div>
                <span className="text-sm">Self-consumption value (daily)</span>
              </div>
              <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                {vm.profitVsLoss.selfConsumptionValueDaily}
              </span>
            </div>

            <div className="rounded-xl border border-border/80 bg-card/60 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Coins className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold">Self-consumption score</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="h-3 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${vm.selfConsumption.scoreValue > 70 ? "bg-emerald-500" : vm.selfConsumption.scoreValue > 40 ? "bg-amber-500" : "bg-rose-500"}`}
                      style={{ width: `${Math.min(100, vm.selfConsumption.scoreValue)}%` }}
                    />
                  </div>
                </div>
                <span className="text-sm font-bold">{vm.selfConsumption.scoreText}</span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Estimated savings: <span className="font-medium">{vm.selfConsumption.estimatedSavingsText}</span>
              </p>
            </div>

            {vm.selfConsumption.actions.length > 0 && (
              <div className="space-y-2 border-t border-border/50 pt-3">
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  Smart usage actions
                </p>
                {vm.selfConsumption.actions.map((action, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs">
                    <div className="mt-0.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
                    <span>{action}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </article>
      </div>

      {/* ─── Performance Context ───────────────────────────────────── */}
      <article className="glass-card rounded-2xl p-5 md:p-6">
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-4">
          Production & Benchmark
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-border/80 bg-card/60 p-3">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Expected</p>
            <p className="mt-1 text-xl font-bold tracking-tight">{vm.benchmark.expectedProductionText}</p>
          </div>
          <div className="rounded-xl border border-border/80 bg-card/60 p-3">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Actual</p>
            <p className="mt-1 text-xl font-bold tracking-tight">{vm.benchmark.actualProductionText}</p>
          </div>
          <div className={`rounded-xl border p-3 ${
            vm.benchmark.performanceStatus === "good" ? "state-good" :
            vm.benchmark.performanceStatus === "underperforming" ? "state-warning" : "state-danger"
          }`}>
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Deviation</p>
            <p className="mt-1 text-xl font-bold tracking-tight">{vm.benchmark.productionDeviationText}</p>
          </div>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">{vm.benchmark.insight}</p>
      </article>

      {/* ─── Upgrade Opportunities ─────────────────────────────────── */}
      {vm.opportunities.length > 0 && (
        <div>
          <p className="mb-4 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Savings Opportunities
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {vm.opportunities.map((opp) => {
              const OppIcon = OPPORTUNITY_ICONS[opp.type] ?? Sparkles;
              return (
                <article key={opp.id} className="glass-card rounded-2xl p-5 transition-shadow duration-200 hover:shadow-lg">
                  <div className="flex items-start justify-between">
                    <div className="rounded-lg bg-primary/10 p-2 text-primary">
                      <OppIcon className="h-5 w-5" />
                    </div>
                    <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                      {opp.estimatedValue}
                    </span>
                  </div>
                  <h3 className="mt-3 text-sm font-semibold">{opp.title}</h3>
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{opp.description}</p>
                  <div className="mt-3 flex items-center gap-2 text-[10px] text-muted-foreground">
                    <span className="capitalize">Confidence: {opp.confidence}</span>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── AI Insights ──────────────────────────────────────────── */}
      <SavingsAiInsightsSection data={aiInsights} errorMessage={aiInsightsError} />

      {/* ─── Footer ───────────────────────────────────────────────── */}
      <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-border/50 pt-6 text-xs text-muted-foreground sm:flex-row">
        <p>Site: {vm.context.siteId} | Generated: {vm.context.generatedAt}</p>
        <p>
          Providers: {vm.context.providers.weather} (Weather) · {vm.context.providers.solar} (Solar) · {vm.context.providers.engine} (Engine)
        </p>
      </div>
    </section>
  );
}
