import { Target, Users, Activity, ArrowDownRight, ArrowUpRight, TrendingDown, TrendingUp, Minus } from "lucide-react";
import type { PerformanceVm } from "@/lib/view-models/dashboard";
import type { SemanticStatus } from "@/lib/utils/formatters";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface PerformanceStatsGridProps {
  performance: PerformanceVm;
}

const STATUS_STYLES: Record<SemanticStatus, { text: string; bg: string }> = {
  good: {
    text: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-500/10",
  },
  warning: {
    text: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-500/10",
  },
  critical: {
    text: "text-rose-600 dark:text-rose-400",
    bg: "bg-rose-500/10",
  },
};

function DeviationIcon({ value }: { value: string }) {
  const num = parseFloat(value);
  if (num > 2) return <TrendingUp className="h-4 w-4" />;
  if (num < -2) return <TrendingDown className="h-4 w-4" />;
  return <Minus className="h-4 w-4" />;
}

export function PerformanceStatsGrid({ performance }: PerformanceStatsGridProps) {
  const cards = [
    { ...performance.optimal, icon: Target },
    { ...performance.areaAverage, icon: Users },
    { ...performance.actual, icon: Activity },
  ];

  const perfBadge = performance.performanceStatus === "good"
    ? { label: "On Track", class: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/25" }
    : performance.performanceStatus === "underperforming"
      ? { label: "Underperforming", class: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/25" }
      : { label: "Over-exporting", class: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/25" };

  return (
    <div id="performance-stats" className="space-y-3">
      <div className="grid gap-4 sm:grid-cols-3">
        {cards.map((card) => {
          const style = STATUS_STYLES[card.status];
          const CardIcon = card.icon;

          return (
            <article
              key={card.label}
              className="glass-card rounded-2xl p-5 transition-shadow duration-200 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  {card.label}
                </p>
                <div className={cn("rounded-lg p-1.5", style.bg)}>
                  <CardIcon className={cn("h-4 w-4", style.text)} />
                </div>
              </div>
              <p className={cn("mt-3 text-2xl font-bold tracking-tight sm:text-3xl", style.text)}>
                {card.value}
              </p>
            </article>
          );
        })}
      </div>

      {/* Performance status bar */}
      <div className="flex items-center gap-3 rounded-xl border border-border/80 bg-card/60 px-4 py-2.5">
        <Badge variant="outline" className={cn("border px-2.5 py-0.5 text-xs", perfBadge.class)}>
          {perfBadge.label}
        </Badge>
        <p className="text-xs text-muted-foreground line-clamp-1">{performance.insight}</p>
      </div>
    </div>
  );
}
