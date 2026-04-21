import { cookies } from "next/headers";
import { fetchDashboardAggregate, fetchDashboardBySiteId } from "@/lib/api/dashboard";
import { toAutomationPageViewModel } from "@/lib/view-models/automation";
import {
  Settings2,
  Plug,
  Clock,
  Car,
  Thermometer,
  Waves,
  Cpu,
  ArrowRight,
  TrendingUp,
} from "lucide-react";

export default async function AutomationPage() {
  let errorMessage: string | null = null;
  let vm: ReturnType<typeof toAutomationPageViewModel> | null = null;

  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("sip.accessToken")?.value;
    const activeSiteId = cookieStore.get("sip.activeSiteId")?.value;

    const data = activeSiteId
      ? await fetchDashboardBySiteId(activeSiteId, accessToken)
      : await fetchDashboardAggregate();

    vm = toAutomationPageViewModel(data);
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

  // Generate a dynamic timeline gradient based on the usage window
  // e.g. 10:00 to 14:00
  const startHour = parseInt(vm.energyShift.windowStart.split(":")[0] || "10");
  const endHour = parseInt(vm.energyShift.windowEnd.split(":")[0] || "14");
  const startPercent = Math.max(0, (startHour / 24) * 100);
  const endPercent = Math.min(100, (endHour / 24) * 100);

  const ICONS = {
    pool: Waves,
    ev: Car,
    heater: Thermometer,
    general: Cpu,
  };

  return (
    <section className="space-y-6 pb-12">
      {/* ─── Hero Section ─────────────────────────────────────────── */}
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
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
            {vm.header.subtitle}
          </p>

          <div className="mt-6 flex items-center gap-4">
            <div className="flex border border-indigo-500/20 bg-indigo-500/10 rounded-xl px-4 py-2.5 items-center gap-3">
              <div className="flex-1">
                <p className="text-xs text-indigo-700 dark:text-indigo-400 font-medium">Self-Consumption</p>
                <p className="text-2xl font-bold">{vm.selfConsumption.scoreText}</p>
              </div>
              <div className="h-8 w-[1px] bg-indigo-500/20 mx-2" />
              <div className="flex-1">
                <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">Potential Gain</p>
                <p className="text-2xl font-bold flex items-center text-emerald-600 dark:text-emerald-400">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  {vm.energyShift.totalShiftValueMonth}
                  <span className="text-xs font-normal ml-1">/mo</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </article>

      {/* ─── Energy Shift Timeline ─────────────────────────────────── */}
      <article className="glass-card rounded-2xl p-5 md:p-8">
        <div className="flex items-center gap-2 mb-6">
          <Clock className="h-5 w-5 text-amber-500" />
          <h2 className="text-lg font-semibold tracking-tight">Optimal Usage Window</h2>
        </div>

        <div className="relative h-12 w-full rounded-xl bg-muted overflow-hidden border">
          {/* Day/Night background texture */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-800 via-sky-200 to-slate-800 opacity-20 dark:from-slate-950 dark:via-sky-900 dark:to-slate-950" />
          
          {/* Solar Peak Highlight */}
          <div 
            className="absolute top-0 bottom-0 bg-gradient-to-r from-amber-500/20 via-amber-400/40 to-amber-500/20 shadow-[inset_0_2px_4px_rgba(251,191,36,0.3)] border-x border-amber-500/50"
            style={{ left: `${startPercent}%`, width: `${endPercent - startPercent}%` }}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[10px] font-bold text-amber-700 dark:text-amber-500 bg-background/50 px-2 py-0.5 rounded-full backdrop-blur-sm">
                PEAK SOLAR
              </span>
            </div>
          </div>
        </div>

        <div className="flex justify-between mt-2 text-xs text-muted-foreground px-1">
          <span>00:00</span>
          <span>06:00</span>
          <span>12:00</span>
          <span>18:00</span>
          <span>24:00</span>
        </div>

        <p className="mt-4 text-sm text-center">
          Shift heavy energy loads to <span className="font-semibold text-foreground">{vm.energyShift.windowLabel}</span> to run directly off solar power instead of buying from the grid.
        </p>
      </article>

      {/* ─── Device Automation Cards ───────────────────────────────── */}
      <div>
        <h2 className="text-lg font-semibold tracking-tight mb-4 flex items-center gap-2">
          <Plug className="h-5 w-5 text-primary" />
          Recommended Actions
        </h2>
        
        <div className="grid gap-4 sm:grid-cols-2">
          {vm.deviceRecommendations.map((device) => {
            const Icon = ICONS[device.iconType];
            
            return (
              <article key={device.id} className="relative glass-card rounded-2xl p-6 transition-all hover:shadow-md group overflow-hidden">
                <div className="absolute right-0 top-0 w-24 h-24 bg-primary/5 rounded-bl-[100px] -z-10 group-hover:bg-primary/10 transition-colors" />
                
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{device.deviceName}</h3>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Save</p>
                    <p className="text-xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                      {device.financialImpactMonth}
                    </p>
                    <p className="text-xs text-muted-foreground">/ month</p>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-border/50">
                  <p className="text-sm text-muted-foreground mb-4">
                    {device.recommendedAction}
                  </p>
                  
                  <button type="button" className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors">
                    Configure Automation <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      {/* ─── Footer ───────────────────────────────────────────────── */}
      <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-border/50 pt-6 text-xs text-muted-foreground">
        <p>Site: {vm.context.siteId} | Generated: {vm.context.generatedAt}</p>
      </div>
    </section>
  );
}
