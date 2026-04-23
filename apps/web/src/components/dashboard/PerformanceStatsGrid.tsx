import { Target, Users, Activity, TrendingDown, TrendingUp, Minus } from "lucide-react";
import type { PerformanceVm, PerformanceCardVm } from "@/lib/view-models/dashboard";
import type { SemanticStatus } from "@/lib/utils/formatters";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface PerformanceStatsGridProps {
  performance: PerformanceVm;
}

/**
 * Splits a label like "Optimal (100%)" → { title: "Optimal", sublabel: "100%" }.
 * Keeps the view-model contract stable while giving the UI two targets to style.
 */
function splitLabel(raw: string): { title: string; sublabel?: string } {
  const match = raw.match(/^(.+?)\s*\((.+)\)\s*$/);
  if (!match) return { title: raw };
  return { title: match[1].trim(), sublabel: match[2].trim() };
}

const STATUS_TEXT: Record<SemanticStatus, string> = {
  good: "text-emerald-600 dark:text-emerald-400",
  warning: "text-amber-600 dark:text-amber-400",
  critical: "text-rose-600 dark:text-rose-400",
};

function DeviationGlyph({ sublabel, status }: { sublabel?: string; status: SemanticStatus }) {
  if (!sublabel) return null;
  const num = parseFloat(sublabel);
  if (Number.isNaN(num)) return null;
  const cls = cn("h-3.5 w-3.5 shrink-0", STATUS_TEXT[status]);
  if (num > 2) return <TrendingUp className={cls} aria-hidden />;
  if (num < -2) return <TrendingDown className={cls} aria-hidden />;
  return <Minus className={cls} aria-hidden />;
}

interface PerformanceRowProps {
  icon: React.ElementType;
  card: PerformanceCardVm;
  /**
   * When true the row uses a stronger visual treatment — this is the "You"
   * row so it must read as the hero measurement at a glance.
   */
  emphasized?: boolean;
  /** Hide the bottom divider on the last row. */
  last?: boolean;
}

function PerformanceRow({ icon: Icon, card, emphasized, last }: PerformanceRowProps) {
  const { title, sublabel } = splitLabel(card.label);
  const valueColor = emphasized ? STATUS_TEXT[card.status] : "text-foreground";

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 px-4 py-3",
        !last && "border-b border-border/60",
        emphasized && "bg-emerald-500/[0.06]",
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <div
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
            emphasized
              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
              : "bg-muted/40 text-muted-foreground",
          )}
        >
          <Icon className="h-4 w-4" aria-hidden />
        </div>
        <div className="flex min-w-0 flex-col">
          <span
            className={cn(
              "truncate text-sm leading-tight",
              emphasized ? "font-semibold text-foreground" : "font-medium text-muted-foreground",
            )}
          >
            {title}
          </span>
          {sublabel ? (
            <span className="flex items-center gap-1 text-[11px] leading-tight text-muted-foreground">
              {emphasized ? <DeviationGlyph sublabel={sublabel} status={card.status} /> : null}
              <span className="truncate">{sublabel}</span>
            </span>
          ) : null}
        </div>
      </div>
      <p className={cn("shrink-0 text-right text-lg font-semibold tabular-nums tracking-tight", valueColor)}>
        {card.value}
      </p>
    </div>
  );
}

export function PerformanceStatsGrid({ performance }: PerformanceStatsGridProps) {
  const perfBadge =
    performance.performanceStatus === "good"
      ? { label: "On Track", class: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/25" }
      : performance.performanceStatus === "underperforming"
        ? { label: "Underperforming", class: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/25" }
        : { label: "Over-exporting", class: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/25" };

  return (
    <section
      id="performance-stats"
      aria-label="Today's production benchmark"
      className="glass-card overflow-hidden rounded-2xl"
    >
      <header className="flex items-center justify-between gap-3 border-b border-border/60 px-4 py-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Production today
        </p>
        <Badge variant="outline" className={cn("border px-2 py-0.5 text-[10px]", perfBadge.class)}>
          {perfBadge.label}
        </Badge>
      </header>

      <PerformanceRow icon={Target} card={performance.optimal} />
      <PerformanceRow icon={Users} card={performance.areaAverage} />
      <PerformanceRow icon={Activity} card={performance.actual} emphasized last />

      {performance.insight ? (
        <p className="border-t border-border/60 bg-muted/20 px-4 py-2.5 text-xs leading-snug text-muted-foreground">
          {performance.insight}
        </p>
      ) : null}
    </section>
  );
}
