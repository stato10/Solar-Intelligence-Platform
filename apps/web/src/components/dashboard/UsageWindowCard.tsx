import { Clock, Sun, ListChecks } from "lucide-react";
import type { UsageWindowVm } from "@/lib/view-models/dashboard";
import type { MarketplaceOpportunity } from "@/lib/contracts/marketplace";
import { cn } from "@/lib/utils";
import { OpportunityActionCard } from "./OpportunityActionCard";

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
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div className="flex-1 space-y-4">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Smart Usage Optimization
            </p>
            <h3 className="mt-1 flex items-center gap-2 text-xl font-semibold tracking-tight">
              <Sun className="h-5 w-5 text-amber-500" />
              Peak Window: {usageWindow.windowText}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Shift heavy appliance usage to this window to maximize self-consumption.
            </p>
          </div>

          <div className="flex items-center gap-4 text-sm">
            <div className="rounded-lg bg-emerald-500/10 px-3 py-1.5 text-emerald-600 dark:text-emerald-400">
              <span className="font-semibold">{usageWindow.estimatedSavings}</span> max savings
            </div>
            <div className="text-muted-foreground">
              Current score: <span className="font-medium text-foreground">{usageWindow.selfConsumptionScore}</span>
            </div>
          </div>
        </div>

        {/* Action list */}
        {usageWindow.actions.length > 0 && (
          <div className="w-full md:w-64 rounded-xl border border-border/80 bg-card/60 p-4">
            <h4 className="mb-2 flex items-center gap-2 text-xs font-semibold text-muted-foreground">
              <ListChecks className="h-3.5 w-3.5" />
              Recommended actions
            </h4>
            <ul className="space-y-2">
              {usageWindow.actions.map((action, i) => (
                <li key={i} className="flex items-start gap-2 text-xs">
                  <div className="mt-0.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
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

      {/* Automation Opportunity Card */}
      {opportunities.find(o => o.topic === "switcher") ? (
        <div className="mt-6 border-t border-border/50 pt-2">
          <OpportunityActionCard
            title="Automate Heavy Appliances"
            message="Smart plugs and switchers can automatically run your boiler or dishwasher during peak production."
            type="automation"
            topic="switcher"
            estimatedValue={usageWindow.estimatedSavings}
            actionLabel="Explore Automation Solutions"
            payload={{
              siteId: siteId ?? "",
              sourceType: "automation_recommendation",
              title: "Automation Request from Usage Window",
              estimatedValue: parseFloat(usageWindow.estimatedSavings.replace(/[^\d.]/g, '')),
            }}
            accessToken={accessToken}
          />
        </div>
      ) : null}
    </article>
  );
}
