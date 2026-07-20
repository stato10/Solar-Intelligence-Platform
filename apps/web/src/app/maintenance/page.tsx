import type { AiInsightContractOutput, DashboardAggregateData } from "@/lib/contracts";
import { fetchAiInsights } from "@/lib/api/ai-insights";
import { ApiHttpError } from "@/lib/api/client";
import { getSessionCookies, getSessionDashboard } from "@/lib/api/session-data";
import { toMaintenancePageViewModel } from "@/lib/view-models/maintenance";
import { deriveNavBadgeCounts } from "@/lib/view-models/nav-badges";
import { NavBadgesBridge } from "@/components/layout/NavBadgesBridge";
import { MaintenanceAiInsightsSection } from "./_components/maintenance-ai-insights-section";
import { MaintenanceAiAccordion } from "./_components/maintenance-ai-accordion";
import { MaintenanceEmptyState, MaintenanceErrorState } from "./_components/maintenance-state";
import { ConcernCard } from "./_components/concern-card";
import {
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
} from "lucide-react";

export default async function MaintenancePage() {
  let aggregate: DashboardAggregateData | null = null;
  let vm: ReturnType<typeof toMaintenancePageViewModel> | null = null;
  let errorMessage: string | null = null;
  let aiInsights: AiInsightContractOutput | null = null;
  let aiInsightsError: string | null = null;
  let accessToken: string | undefined;

  try {
    const session = await getSessionCookies();
    accessToken = session.accessToken;
    aggregate = await getSessionDashboard();

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

  const STATUS_GRADIENT = {
    good: "from-emerald-500/20 via-emerald-400/5 to-transparent",
    warning: "from-amber-500/20 via-amber-400/5 to-transparent",
    critical: "from-rose-500/20 via-rose-400/5 to-transparent",
  } as const;

  const STATUS_BADGE = {
    good: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/25",
    warning: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/25",
    critical: "bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/25",
  } as const;

  const STATUS_LABEL = {
    good: "All Clear",
    warning: "Attention Needed",
    critical: "Action Required",
  } as const;

  // Combine intelligence + system alerts into a single compact list (doc
  // 03 §5) for rendering below the AI accordion.
  const compactAlerts = [
    ...vm.alerts.intelligenceAlerts.map((a) => ({ ...a, kind: "intel" as const })),
    ...vm.alerts.items.map((a) => ({ ...a, kind: "system" as const })),
  ];

  const hasConcerns = vm.concerns.length > 0;

  return (
    <section className="space-y-6 pb-12">
      <NavBadgesBridge {...deriveNavBadgeCounts(aggregate)} />
      {/* ─── Hero ─────────────────────────────────────────────────── */}
      <article className="glass-card relative overflow-hidden rounded-3xl p-8 md:p-10">
        <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${STATUS_GRADIENT[vm.header.statusLevel]}`} />
        <div className="relative">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${STATUS_BADGE[vm.header.statusLevel]}`}>
              <ShieldAlert className="h-3.5 w-3.5" />
              {STATUS_LABEL[vm.header.statusLevel]}
            </span>
            {vm.header.urgencyLabel ? (
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${
                  vm.header.statusLevel === "critical"
                    ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30"
                    : "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30"
                }`}
              >
                <AlertTriangle className="h-3.5 w-3.5" />
                {vm.header.urgencyLabel}
              </span>
            ) : null}
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

      {/* ─── ConcernCards (doc 03 §6) ──────────────────────────────── */}
      {hasConcerns ? (
        <section aria-labelledby="maint-concerns-title" className="space-y-4">
          <header className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 id="maint-concerns-title" className="text-xl font-semibold tracking-tight">
                What needs attention
              </h2>
              <p className="text-sm text-muted-foreground">
                Each concern shows the impact, the money at stake, and the recommended fix.
              </p>
            </div>
            <span className="text-xs text-muted-foreground">
              {vm.concerns.length} {vm.concerns.length === 1 ? "concern" : "concerns"}
            </span>
          </header>
          <div className="grid gap-5 md:grid-cols-2">
            {vm.concerns.map((concern) => (
              <ConcernCard
                key={concern.id}
                concern={concern}
                siteId={vm.context.siteId}
                accessToken={accessToken}
              />
            ))}
          </div>
        </section>
      ) : (
        <article className="glass-card rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-6 md:p-8 flex items-start gap-4">
          <div className="rounded-xl bg-emerald-500/15 p-2.5 text-emerald-600 dark:text-emerald-400 shrink-0">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold">No maintenance concerns right now</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              All maintenance signals are within normal range. We&apos;ll surface new concerns here the moment the engine detects them.
            </p>
          </div>
        </article>
      )}

      {/* ─── AI deep-dive accordion (doc 03 §5) ───────────────────── */}
      <MaintenanceAiAccordion statusLevel={vm.header.statusLevel} siteId={vm.context.siteId}>
        <MaintenanceAiInsightsSection data={aiInsights} errorMessage={aiInsightsError} />
      </MaintenanceAiAccordion>

      {/* ─── Compact alert list (below accordion, doc 03 §5) ──────── */}
      {compactAlerts.length > 0 ? (
        <section aria-labelledby="maint-alerts-title" className="glass-card rounded-2xl p-5 md:p-6">
          <header className="mb-3 flex items-center justify-between">
            <h3
              id="maint-alerts-title"
              className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Alerts
            </h3>
            <span className="text-[11px] text-muted-foreground">
              {compactAlerts.length} active
            </span>
          </header>
          <ul className="space-y-2">
            {compactAlerts.map((alert) => (
              <li
                key={`${alert.kind}-${alert.id}`}
                className={`flex items-start gap-2.5 rounded-lg border px-3 py-2 text-xs ${
                  alert.severity === "high"
                    ? "border-rose-500/30 bg-rose-500/5"
                    : alert.severity === "moderate"
                      ? "border-amber-500/30 bg-amber-500/5"
                      : "border-border/60 bg-muted/40"
                }`}
              >
                <AlertTriangle
                  className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${
                    alert.severity === "high"
                      ? "text-rose-500"
                      : alert.severity === "moderate"
                        ? "text-amber-500"
                        : "text-muted-foreground"
                  }`}
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <span className="font-medium capitalize">{alert.riskType}</span>
                    {alert.moneyImpact ? (
                      <span className="text-amber-600 dark:text-amber-400 font-semibold">
                        {alert.moneyImpact}
                      </span>
                    ) : null}
                  </div>
                  <p className="text-muted-foreground">{alert.message}</p>
                  {alert.windowText ? (
                    <p className="text-muted-foreground">Window: {alert.windowText}</p>
                  ) : null}
                  {alert.actionHint ? (
                    <p className="text-primary/90">{alert.actionHint}</p>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

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
