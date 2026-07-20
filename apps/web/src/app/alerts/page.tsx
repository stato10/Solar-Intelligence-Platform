import { getSessionDashboard } from "@/lib/api/session-data";
import { toAlertsPageViewModel } from "@/lib/view-models/alerts";
import { deriveNavBadgeCounts } from "@/lib/view-models/nav-badges";
import { NavBadgesBridge } from "@/components/layout/NavBadgesBridge";
import type { NavBadgeCounts } from "@/components/layout/NavBadgesBridge";
import { PageHeader } from "@/components/layout/PageHeader";
import { AlertsList } from "./_components/alerts-list";
import { ShieldAlert, Bell, CheckCircle2 } from "lucide-react";

export default async function AlertsPage() {
  let vm: ReturnType<typeof toAlertsPageViewModel> | null = null;
  let errorMessage: string | null = null;
  let navBadges: NavBadgeCounts | null = null;

  try {
    const aggregate = await getSessionDashboard();

    vm = toAlertsPageViewModel(aggregate);
    navBadges = deriveNavBadgeCounts(aggregate);
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

  const StatusIcon = vm.header.highCount > 0
    ? ShieldAlert
    : vm.header.totalCount > 0
      ? Bell
      : CheckCircle2;

  const tone =
    vm.header.highCount > 0
      ? "danger"
      : vm.header.totalCount > 0
        ? "warning"
        : "success";

  return (
    <section className="space-y-6 pb-12">
      {navBadges ? <NavBadgesBridge {...navBadges} /> : null}
      <PageHeader
        eyebrow="Alerts & notifications"
        title={vm.header.title}
        subtitle={vm.header.subtitle}
        icon={StatusIcon}
        tone={tone}
        aside={
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-xl border border-border/80 bg-card/60 px-4 py-2.5">
              <span className="text-2xl font-bold tabular-nums">{vm.header.totalCount}</span>
              <span className="text-xs text-muted-foreground">active</span>
            </div>
            {vm.header.highCount > 0 ? (
              <div className="flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-2.5 text-rose-400">
                <span className="text-2xl font-bold tabular-nums">{vm.header.highCount}</span>
                <span className="text-xs">high</span>
              </div>
            ) : null}
          </div>
        }
      />

      <AlertsList alerts={vm.alerts} categoryCounts={vm.categoryCounts} />

      <p className="text-center text-[11px] text-muted-foreground/70">
        Updated {vm.context.generatedAt}
      </p>
    </section>
  );
}
