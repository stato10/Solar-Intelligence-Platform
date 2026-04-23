import { Clock, Sun, ListChecks } from "lucide-react";
import type { UsageWindowVm } from "@/lib/view-models/dashboard";
import type { MarketplaceOpportunity } from "@/lib/contracts/marketplace";
import { cn } from "@/lib/utils";
import { MarketplaceActionCard } from "./MarketplaceActionCard";

interface UsageWindowCardProps {
  usageWindow: UsageWindowVm;
  opportunities?: MarketplaceOpportunity[];
  siteId?: string;
  accessToken?: string;
}

export function UsageWindowCard({ usageWindow, opportunities = [], siteId, accessToken }: UsageWindowCardProps) {
  // Mock times for the visual strip
  const hours = [8, 10, 12, 14, 16, 18];
  const activeStart = parseInt(usageWindow.windowStart.split(":")[0], 10);
  const activeEnd = parseInt(usageWindow.windowEnd.split(":")[0], 10);

  return (
    <article id="usage-window" className="glass-card rounded-2xl p-5 md:p-6">
      {/* Header — always stacks vertically so it reads cleanly in the 360px
          right-rail and in the wide single-column below xl. */}
      <div className="space-y-4">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Smart Usage Optimization
          </p>
          <h3 className="mt-1 flex items-center gap-2 text-lg font-semibold tracking-tight sm:text-xl">
            <Sun className="h-5 w-5 shrink-0 text-amber-500" />
            <span className="min-w-0">Peak Window: {usageWindow.windowText}</span>
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Shift heavy appliance usage to this window to maximize self-consumption.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
          <div className="rounded-lg bg-emerald-500/10 px-3 py-1.5 text-emerald-600 dark:text-emerald-400">
            <span className="font-semibold">{usageWindow.estimatedSavings}</span> max savings
          </div>
          <div className="text-muted-foreground">
            Current score: <span className="font-medium text-foreground">{usageWindow.selfConsumptionScore}</span>
          </div>
        </div>

        {/* Recommended actions — horizontal chip row so it never forces a
            second column on narrow containers. */}
        {usageWindow.actions.length > 0 && (
          <div className="rounded-xl border border-border/80 bg-card/60 p-3">
            <h4 className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <ListChecks className="h-3.5 w-3.5" />
              Recommended actions
            </h4>
            <ul className="flex flex-wrap gap-x-4 gap-y-1.5">
              {usageWindow.actions.map((action, i) => (
                <li key={i} className="flex items-center gap-2 text-xs">
                  <div className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
                  <span>{action}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Visual Time Strip */}
      <div className="mt-6">
        <div className="relative h-8 rounded-lg bg-muted overflow-hidden flex">
          {hours.map((hour, i) => {
            const isLast = i === hours.length - 1;
            const nextHour = isLast ? 20 : hours[i + 1];
            const duration = nextHour - hour;
            const flexBasis = `${(duration / 12) * 100}%`;
            
            const isActive = hour >= activeStart && hour < activeEnd;

            return (
              <div 
                key={hour} 
                className={cn(
                  "relative h-full flex flex-col justify-center border-r border-border/50 last:border-r-0 transition-colors",
                  isActive ? "bg-amber-400/20" : ""
                )}
                style={{ flexBasis }}
              >
                {isActive && (
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-amber-500" />
                )}
                <span className="px-2 text-[10px] text-muted-foreground font-medium">
                  {hour}:00
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Automation Opportunity Card or Placeholder CTA */}
      <div className="mt-6 border-t border-border/50 pt-4">
        {opportunities.find(o => o.topic === "switcher") ? (
          <MarketplaceActionCard
            title="Automate Heavy Appliances"
            cause="inefficient usage during peak hours"
            monthlyLossIls={parseFloat(usageWindow.estimatedSavings.replace(/[^\d.]/g, '')) || 15}
            type="automation"
            actionLabel="Explore Automation Solutions"
            payload={{
              siteId: siteId ?? "",
              sourceType: "automation_recommendation",
              title: "Automation Request from Usage Window",
              estimatedValue: parseFloat(usageWindow.estimatedSavings.replace(/[^\d.]/g, '')) || undefined,
            }}
            accessToken={accessToken}
          />
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-xl border border-border/50 bg-card/40 p-4">
            <div>
              <h4 className="font-semibold text-sm text-foreground/90">Automate your usage</h4>
              <p className="text-xs text-muted-foreground mt-1">
                You can save more by setting timers or using smart plugs for your heavy appliances.
              </p>
            </div>
            <button className="whitespace-nowrap rounded-xl bg-secondary text-secondary-foreground px-4 py-2 text-sm font-medium hover:bg-secondary/80 transition-colors">
              Optimize Usage
            </button>
          </div>
        )}
      </div>
    </article>
  );
}
