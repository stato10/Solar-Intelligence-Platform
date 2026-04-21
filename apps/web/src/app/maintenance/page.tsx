import { cookies } from "next/headers";
import type { AiInsightContractOutput, DashboardAggregateData } from "@/lib/contracts";
import { fetchAiInsights } from "@/lib/api/ai-insights";
import { ApiHttpError } from "@/lib/api/client";
import { fetchDashboardAggregate, fetchDashboardBySiteId } from "@/lib/api/dashboard";
import { toMaintenancePageViewModel } from "@/lib/view-models/maintenance";
import { MaintenanceAiInsightsSection } from "./_components/maintenance-ai-insights-section";
import { MaintenanceEmptyState, MaintenanceErrorState } from "./_components/maintenance-state";
import {
  Droplets,
  Thermometer,
  AlertTriangle,
  CalendarCheck,
  ShieldAlert,
  Wrench,
  Shield,
  TrendingDown,
  Sparkles,
} from "lucide-react";

export default async function MaintenancePage() {
  let aggregate: DashboardAggregateData | null = null;
  let vm: ReturnType<typeof toMaintenancePageViewModel> | null = null;
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

    vm = toMaintenancePageViewModel(aggregate);

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
    errorMessage = error instanceof Error ? error.message : "Unknown maintenance error";
  }

  const hasError = Boolean(errorMessage);
  const isEmpty = !hasError && !vm;

  if (hasError) {
    return (
      <section className="space-y-6">
        <MaintenanceErrorState message={errorMessage ?? "Unknown maintenance error"} />
      </section>
    );
  }

  if (isEmpty || !vm) {
    return (
      <section className="space-y-6">
        <MaintenanceEmptyState />
      </section>
    );
  }

  const ICON_MAP = {
    droplets: Droplets,
    thermometer: Thermometer,
    shield: Shield,
    wrench: Wrench,
  } as const;

  const STATUS_GRADIENT = {
    good: "from-emerald-500/20 via-emerald-400/5 to-transparent",
    warning: "from-amber-500/20 via-amber-400/5 to-transparent",
    critical: "from-rose-500/20 via-rose-400/5 to-transparent",
  };

  const STATUS_BADGE = {
    good: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/25",
    warning: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/25",
    critical: "bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/25",
  };

  const STATUS_LABEL = {
    good: "All Clear",
    warning: "Attention Needed",
    critical: "Action Required",
  };

  return (
    <section className="space-y-6 pb-12">
      {/* ─── Hero Section ─────────────────────────────────────────── */}
      <article className="glass-card relative overflow-hidden rounded-3xl p-8 md:p-10">
        <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${STATUS_GRADIENT[vm.header.statusLevel]}`} />
        <div className="relative">
          <div className="mb-4 flex items-center gap-3">
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${STATUS_BADGE[vm.header.statusLevel]}`}>
              <ShieldAlert className="h-3.5 w-3.5" />
              {STATUS_LABEL[vm.header.statusLevel]}
            </span>
          </div>

          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Maintenance Control
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            {vm.header.title}
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
            {vm.header.subtitle}
          </p>

          {/* Money impact */}
          <div className="mt-6 flex flex-wrap gap-6">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Monthly leakage
              </p>
              <p className="mt-1 text-3xl font-bold tracking-tight text-amber-600 dark:text-amber-400">
                {vm.moneyImpact.leakageMonthly}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Recoverable value
              </p>
              <p className="mt-1 text-3xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                {vm.moneyImpact.recoverable}
              </p>
            </div>
          </div>
        </div>
      </article>

      {/* ─── Soiling & Heat Cards ─────────────────────────────────── */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Soiling Card */}
        <article className="glass-card rounded-2xl p-5 md:p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`rounded-lg p-2 ${vm.soiling.cleaningRecommended ? "bg-amber-500/10 text-amber-600 dark:text-amber-400" : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"}`}>
                <Droplets className="h-4 w-4" />
              </div>
              <p className="text-sm font-semibold">Soiling Analysis</p>
            </div>
            <span className="text-xs text-muted-foreground">{vm.soiling.scoreText}</span>
          </div>

          {/* Visual progress bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Efficiency loss</span>
              <span className="font-medium">{vm.soiling.estimatedLossText}</span>
            </div>
            <div className="mt-1.5 h-2 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${vm.soiling.estimatedLoss > 8 ? "bg-rose-500" : vm.soiling.estimatedLoss > 4 ? "bg-amber-500" : "bg-emerald-500"}`}
                style={{ width: `${Math.min(100, vm.soiling.estimatedLoss * 5)}%` }}
              />
            </div>
          </div>

          {vm.soiling.cleaningRecommended && (
            <div className="mt-4 flex items-center gap-2 rounded-lg state-warning px-3 py-2">
              <CalendarCheck className="h-3.5 w-3.5 shrink-0" />
              <p className="text-xs font-medium">
                Cleaning recommended{vm.soiling.recommendedCleaningDateText !== "--" ? ` by ${vm.soiling.recommendedCleaningDateText}` : ""}
              </p>
            </div>
          )}

          {vm.soiling.explanation && (
            <p className="mt-3 text-xs text-muted-foreground border-l-2 border-primary/20 pl-2">
              {vm.soiling.explanation}
            </p>
          )}
        </article>

        {/* Heat Card */}
        <article className="glass-card rounded-2xl p-5 md:p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-orange-500/10 p-2 text-orange-600 dark:text-orange-400">
                <Thermometer className="h-4 w-4" />
              </div>
              <p className="text-sm font-semibold">Heat Impact</p>
            </div>
            <span className="text-xs text-muted-foreground">{vm.heat.scoreText}</span>
          </div>

          {/* Visual progress bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Efficiency loss</span>
              <span className="font-medium">{vm.heat.estimatedLossText}</span>
            </div>
            <div className="mt-1.5 h-2 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${vm.heat.estimatedLoss > 10 ? "bg-rose-500" : vm.heat.estimatedLoss > 5 ? "bg-orange-500" : "bg-emerald-500"}`}
                style={{ width: `${Math.min(100, vm.heat.estimatedLoss * 5)}%` }}
              />
            </div>
          </div>

          <p className="mt-4 text-xs text-muted-foreground">
            Peak heat window: <span className="font-medium text-foreground">{vm.heat.peakWindowText}</span>
          </p>
        </article>
      </div>

      {/* ─── Intelligence Alerts ──────────────────────────────────── */}
      {vm.alerts.intelligenceAlerts.length > 0 && (
        <article className="glass-card rounded-2xl p-5 md:p-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-4 w-4 text-primary" />
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Intelligence Alerts
            </p>
          </div>
          <div className="space-y-3">
            {vm.alerts.intelligenceAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`rounded-xl border px-4 py-3 ${
                  alert.severity === "high" ? "state-danger" :
                  alert.severity === "moderate" ? "state-warning" : "state-good"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    <div>
                      <p className="text-sm font-medium">{alert.riskType}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{alert.message}</p>
                      {alert.actionHint && (
                        <p className="mt-1.5 text-xs font-medium text-primary">{alert.actionHint}</p>
                      )}
                    </div>
                  </div>
                  {alert.moneyImpact && (
                    <span className="shrink-0 text-sm font-semibold text-amber-600 dark:text-amber-400">
                      {alert.moneyImpact}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </article>
      )}

      {/* ─── Raw Risk Alerts ──────────────────────────────────────── */}
      {vm.alerts.items.length > 0 && (
        <article className="glass-card rounded-2xl p-5 md:p-6">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-3">
            System Alerts
          </p>
          <div className="space-y-2">
            {vm.alerts.items.map((alert) => (
              <div
                key={alert.id}
                className={`flex items-start gap-2.5 rounded-lg border px-3 py-2 text-xs ${
                  alert.severity === "high" ? "state-danger" :
                  alert.severity === "moderate" ? "state-warning" : "state-good"
                }`}
              >
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <div>
                  <p className="font-medium capitalize">{alert.riskType}</p>
                  <p className="text-muted-foreground">{alert.message}</p>
                  {alert.windowText && <p className="text-muted-foreground">Window: {alert.windowText}</p>}
                </div>
              </div>
            ))}
          </div>
        </article>
      )}

      {/* ─── AI Insights ──────────────────────────────────────────── */}
      <MaintenanceAiInsightsSection data={aiInsights} errorMessage={aiInsightsError} />

      {/* ─── Action Cards Grid ────────────────────────────────────── */}
      <div>
        <p className="mb-4 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Recommended Actions
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {vm.actionCards.map((card) => {
            const IconComp = ICON_MAP[card.icon];
            return (
              <article
                key={card.id}
                className="glass-card rounded-2xl p-5 transition-shadow duration-200 hover:shadow-lg"
              >
                <div className="rounded-lg bg-primary/10 p-2 w-fit text-primary">
                  <IconComp className="h-5 w-5" />
                </div>
                <h3 className="mt-3 text-sm font-semibold">{card.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{card.description}</p>
                <button
                  type="button"
                  className="mt-4 inline-flex items-center rounded-xl bg-secondary text-secondary-foreground px-4 py-2 text-xs font-medium hover:bg-secondary/80 transition-colors"
                >
                  {card.ctaLabel}
                </button>
              </article>
            );
          })}
        </div>
      </div>

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
