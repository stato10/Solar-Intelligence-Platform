import { cookies } from "next/headers";
import type { DashboardAggregateData } from "@/lib/contracts";
import { fetchDashboardAggregate, fetchDashboardBySiteId } from "@/lib/api/dashboard";
import { toAlertsPageViewModel } from "@/lib/view-models/alerts";
import { AlertsList } from "./_components/alerts-list";
import { ShieldAlert, Bell, CheckCircle2 } from "lucide-react";

export default async function AlertsPage() {
  let vm: ReturnType<typeof toAlertsPageViewModel> | null = null;
  let errorMessage: string | null = null;

  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("sip.accessToken")?.value;
    const activeSiteId = cookieStore.get("sip.activeSiteId")?.value;

    const aggregate = activeSiteId
      ? await fetchDashboardBySiteId(activeSiteId, accessToken)
      : await fetchDashboardAggregate();

    vm = toAlertsPageViewModel(aggregate);
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : "Unknown error";
  }

  if (errorMessage) {
    return (
      <section className="space-y-6">
        <article className="glass-card rounded-2xl p-8 text-center">
          <ShieldAlert className="mx-auto h-8 w-8 text-rose-500" />
          <p className="mt-3 text-sm text-muted-foreground">{errorMessage}</p>
        </article>
      </section>
    );
  }

  if (!vm) {
    return (
      <section className="space-y-6">
        <article className="glass-card rounded-2xl p-8 text-center">
          <Bell className="mx-auto h-8 w-8 text-muted-foreground/50" />
          <p className="mt-3 text-sm text-muted-foreground">No alert data available.</p>
        </article>
      </section>
    );
  }

  const STATUS_GRADIENT = vm.header.highCount > 0
    ? "from-rose-500/15 via-rose-400/5 to-transparent"
    : vm.header.totalCount > 0
      ? "from-amber-500/15 via-amber-400/5 to-transparent"
      : "from-emerald-500/15 via-emerald-400/5 to-transparent";

  const StatusIcon = vm.header.highCount > 0
    ? ShieldAlert
    : vm.header.totalCount > 0
      ? Bell
      : CheckCircle2;

  const statusColor = vm.header.highCount > 0
    ? "text-rose-600 dark:text-rose-400"
    : vm.header.totalCount > 0
      ? "text-amber-600 dark:text-amber-400"
      : "text-emerald-600 dark:text-emerald-400";

  return (
    <section className="space-y-6 pb-12">
      {/* ─── Hero Section ─────────────────────────────────────────── */}
      <article className="glass-card relative overflow-hidden rounded-3xl p-8 md:p-10">
        <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${STATUS_GRADIENT}`} />
        <div className="relative">
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Alerts & Notifications
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            {vm.header.title}
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
            {vm.header.subtitle}
          </p>

          <div className="mt-6 flex items-center gap-4">
            <div className={`flex items-center gap-2 rounded-xl bg-card/60 border border-border/80 px-4 py-2.5 ${statusColor}`}>
              <StatusIcon className="h-5 w-5" />
              <span className="text-2xl font-bold">{vm.header.totalCount}</span>
              <span className="text-xs text-muted-foreground">active alerts</span>
            </div>
            {vm.header.highCount > 0 && (
              <div className="flex items-center gap-2 rounded-xl bg-rose-500/10 border border-rose-500/20 px-4 py-2.5 text-rose-600 dark:text-rose-400">
                <ShieldAlert className="h-5 w-5" />
                <span className="text-2xl font-bold">{vm.header.highCount}</span>
                <span className="text-xs">high severity</span>
              </div>
            )}
          </div>
        </div>
      </article>

      {/* ─── Alerts List (Client Component w/ filters) ────────────── */}
      <AlertsList alerts={vm.alerts} categoryCounts={vm.categoryCounts} />

      {/* ─── Footer ───────────────────────────────────────────────── */}
      <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-border/50 pt-6 text-xs text-muted-foreground sm:flex-row">
        <p>Site: {vm.context.siteId} | Generated: {vm.context.generatedAt}</p>
      </div>
    </section>
  );
}
