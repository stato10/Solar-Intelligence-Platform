import Link from "next/link";
import { getSessionCookies, getSessionDashboard } from "@/lib/api/session-data";
import { toAutomationPageViewModel } from "@/lib/view-models/automation";
import { deriveNavBadgeCounts } from "@/lib/view-models/nav-badges";
import { NavBadgesBridge } from "@/components/layout/NavBadgesBridge";
import type { NavBadgeCounts } from "@/components/layout/NavBadgesBridge";
import { AutomationDayTimeline } from "@/components/dashboard/AutomationDayTimeline";
import { AutomationDeviceCard } from "@/components/dashboard/AutomationDeviceCard";
import {
  Settings2,
  Plug,
  TrendingUp,
  ArrowRight,
  Zap,
  BatteryCharging,
  Info,
} from "lucide-react";

export default async function AutomationPage() {
  let errorMessage: string | null = null;
  let vm: ReturnType<typeof toAutomationPageViewModel> | null = null;
  let accessToken: string | undefined;
  let navBadges: NavBadgeCounts | null = null;

  try {
    const session = await getSessionCookies();
    accessToken = session.accessToken;
    const data = await getSessionDashboard();

    vm = toAutomationPageViewModel(data);
    navBadges = deriveNavBadgeCounts(data);
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : "Failed to load automation data";
  }

  if (errorMessage || !vm) {
    return (
      <section className="space-y-6">
        <article className="glass-card rounded-2xl p-8 text-center text-rose-500">
          <Settings2 className="mx-auto h-8 w-8 mb-3" />
          <p>{errorMessage ?? "No automation data available"}</p>
        </article>
      </section>
    );
  }

  return (
    <section className="space-y-6 pb-12">
      {navBadges ? <NavBadgesBridge {...navBadges} /> : null}
      {/* ─── Hero ─────────────────────────────────────────────────── */}
      <article className="glass-card relative overflow-hidden rounded-3xl p-8 md:p-10">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-indigo-500/15 via-indigo-400/5 to-transparent" />
        <div className="relative">
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase flex items-center gap-2">
            <Settings2 className="h-4 w-4 text-indigo-500" />
            Energy Automation
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            {vm.header.title}
          </h1>
          {/* Directive line — doc 06 §5 */}
          <p className="mt-3 max-w-2xl text-base font-medium">
            {vm.header.directive}
          </p>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            {vm.header.subtitle}
          </p>

          <div className="mt-6 flex items-center gap-4">
            <div className="flex border border-indigo-500/20 bg-indigo-500/10 rounded-xl px-4 py-2.5 items-center gap-3">
              <div className="flex-1">
                <p className="text-xs text-indigo-700 dark:text-indigo-400 font-medium">
                  Self-Consumption
                </p>
                <p className="text-2xl font-bold">{vm.selfConsumption.scoreText}</p>
              </div>
              <div className="h-8 w-[1px] bg-indigo-500/20 mx-2" />
              <div className="flex-1">
                <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                  Potential Gain
                </p>
                <p className="text-2xl font-bold flex items-center text-emerald-600 dark:text-emerald-400">
                  <TrendingUp className="h-4 w-4 mr-1" aria-hidden />
                  {vm.energyShift.totalShiftValueMonth}
                  <span className="text-xs font-normal ml-1">/ mo</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </article>

      {/* ─── Day Timeline ─────────────────────────────────────────── */}
      <AutomationDayTimeline
        devices={vm.deviceRecommendations}
        siteId={vm.context.siteId}
      />

      {/* ─── Device Cards ─────────────────────────────────────────── */}
      <div>
        <header className="mb-4 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold tracking-tight flex items-center gap-2">
              <Plug className="h-5 w-5 text-primary" aria-hidden />
              Automation opportunities
            </h2>
            <p className="text-sm text-muted-foreground">
              Configure each device once; we&apos;ll run it on solar going forward.
            </p>
          </div>
          <span className="text-xs text-muted-foreground">
            {vm.deviceRecommendations.length} device{vm.deviceRecommendations.length === 1 ? "" : "s"}
          </span>
        </header>

        {vm.deviceRecommendations.length === 0 ? (
          <article className="glass-card rounded-2xl border border-border/60 p-6 text-sm text-muted-foreground">
            No automation opportunities detected yet. We&apos;ll surface device
            recommendations here as your consumption patterns stabilize.
          </article>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {vm.deviceRecommendations.map((device) => (
              <AutomationDeviceCard
                key={device.id}
                device={device}
                siteId={vm.context.siteId}
                accessToken={accessToken}
              />
            ))}
          </div>
        )}
      </div>

      {/* ─── How it works (doc 06 §8) ─────────────────────────────── */}
      <aside className="rounded-2xl border border-border/60 bg-muted/30 p-5 md:p-6">
        <header className="mb-3 flex items-center gap-2 text-muted-foreground">
          <Info className="h-4 w-4" aria-hidden />
          <h3 className="text-[11px] font-semibold uppercase tracking-wider">
            How it works
          </h3>
        </header>
        <ul className="grid gap-3 sm:grid-cols-3 text-sm">
          <li className="flex items-start gap-2.5">
            <BatteryCharging className="h-4 w-4 mt-0.5 text-indigo-500 shrink-0" aria-hidden />
            <span>No battery required — automation works with your existing hardware.</span>
          </li>
          <li className="flex items-start gap-2.5">
            <Zap className="h-4 w-4 mt-0.5 text-amber-500 shrink-0" aria-hidden />
            <span>Automation improves your self-consumption ratio so more of your solar stays on-site.</span>
          </li>
          <li className="flex items-start gap-2.5">
            <TrendingUp className="h-4 w-4 mt-0.5 text-emerald-500 shrink-0" aria-hidden />
            <span>Reduces grid purchase costs during peak tariff hours.</span>
          </li>
        </ul>
        <div className="mt-4">
          <Link
            href="/opportunities#automation"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
          >
            See supported devices <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </div>
      </aside>

      {/* ─── Footer ───────────────────────────────────────────────── */}
      <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-border/50 pt-6 text-xs text-muted-foreground">
        <p>Site: {vm.context.siteId} | Generated: {vm.context.generatedAt}</p>
      </div>
    </section>
  );
}
