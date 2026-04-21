import { Coins, TrendingUp, TrendingDown, Target } from "lucide-react";
import type { SavingsSummaryVm } from "@/lib/view-models/dashboard";

interface SavingsPanelProps {
  savings: SavingsSummaryVm;
}

export function SavingsPanel({ savings }: SavingsPanelProps) {
  return (
    <article id="savings-panel" className="glass-card rounded-2xl p-5 md:p-6">
      <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        Financial Impact
      </p>

      <div className="mt-4 space-y-4">
        {/* Primary savings figures */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-border/80 bg-card/60 p-3">
            <div className="flex items-center gap-1.5">
              <Coins className="h-3.5 w-3.5 text-emerald-500" />
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Daily
              </p>
            </div>
            <p className="mt-1.5 text-xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
              {savings.dailySavings}
            </p>
          </div>

          <div className="rounded-xl border border-border/80 bg-card/60 p-3">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Monthly
              </p>
            </div>
            <p className="mt-1.5 text-xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
              {savings.monthlySavings}
            </p>
          </div>
        </div>

        {/* Yearly */}
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Yearly optimization potential
          </p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
            {savings.yearlySavings}
          </p>
        </div>

        {/* Maintenance leakage (from intelligence) */}
        {savings.maintenanceLeakage && (
          <div className="flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2">
            <TrendingDown className="h-3.5 w-3.5 text-amber-500 shrink-0" />
            <p className="text-xs">
              <span className="font-medium text-amber-600 dark:text-amber-400">{savings.maintenanceLeakage}</span>
              <span className="text-muted-foreground"> lost monthly to maintenance</span>
            </p>
          </div>
        )}

        {/* Headroom (from intelligence) */}
        {savings.headroom && (
          <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2">
            <TrendingUp className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
            <p className="text-xs">
              <span className="font-medium text-emerald-600 dark:text-emerald-400">{savings.headroom}</span>
              <span className="text-muted-foreground"> additional savings possible</span>
            </p>
          </div>
        )}

        {/* Opportunity */}
        <div className="flex items-center gap-3 rounded-xl border border-border/80 bg-card/60 px-3 py-2.5">
          <Target className="h-4 w-4 text-primary" />
          <div className="text-xs">
            <span className="text-muted-foreground">Opportunity score: </span>
            <span className="font-semibold">{savings.opportunityScore}</span>
            <span className="mx-1.5 text-muted-foreground">·</span>
            <span className="text-muted-foreground">Value: </span>
            <span className="font-semibold">{savings.opportunityValue}</span>
          </div>
        </div>
      </div>
    </article>
  );
}
