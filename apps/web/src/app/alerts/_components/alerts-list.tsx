"use client";

import { useState } from "react";
import type { AlertItemVm, AlertCategory } from "@/lib/view-models/alerts";
import {
  AlertTriangle,
  ShieldAlert,
  Cloud,
  TrendingDown,
  Coins,
  Bell,
} from "lucide-react";

interface AlertsListProps {
  alerts: AlertItemVm[];
  categoryCounts: Record<AlertCategory, number>;
}

const CATEGORY_CONFIG: Record<string, { label: string; icon: React.ElementType }> = {
  all: { label: "All", icon: Bell },
  maintenance: { label: "Maintenance", icon: ShieldAlert },
  weather: { label: "Weather", icon: Cloud },
  production: { label: "Production", icon: TrendingDown },
  financial: { label: "Financial", icon: Coins },
};

const SEVERITY_STYLES: Record<string, string> = {
  high: "state-danger",
  moderate: "state-warning",
  low: "state-good",
};

const SEVERITY_DOT: Record<string, string> = {
  high: "bg-rose-500",
  moderate: "bg-amber-500",
  low: "bg-emerald-500",
};

export function AlertsList({ alerts, categoryCounts }: AlertsListProps) {
  const [activeCategory, setActiveCategory] = useState<AlertCategory>("all");

  const filtered = activeCategory === "all"
    ? alerts
    : alerts.filter((a) => a.category === activeCategory);

  return (
    <div className="space-y-4">
      {/* Category filter tabs */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(CATEGORY_CONFIG).map(([key, config]) => {
          const count = categoryCounts[key as AlertCategory] ?? 0;
          const isActive = activeCategory === key;
          const FilterIcon = config.icon;

          return (
            <button
              key={key}
              type="button"
              onClick={() => setActiveCategory(key as AlertCategory)}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-medium transition-colors ${
                isActive
                  ? "bg-secondary text-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <FilterIcon className="h-3.5 w-3.5" />
              {config.label}
              {count > 0 && (
                <span className={`ml-1 rounded-full px-1.5 py-0.5 text-[10px] ${
                  isActive ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Alert items */}
      {filtered.length === 0 ? (
        <div className="glass-card rounded-2xl p-8 text-center">
          <Bell className="mx-auto h-8 w-8 text-muted-foreground/50" />
          <p className="mt-3 text-sm text-muted-foreground">
            No alerts in this category.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((alert) => (
            <article
              key={alert.id}
              className={`rounded-xl border px-4 py-3.5 transition-shadow duration-200 hover:shadow-md ${SEVERITY_STYLES[alert.severity]}`}
            >
              <div className="flex items-start gap-3">
                <div className="flex items-start gap-2.5 flex-1">
                  <div className="mt-1 flex flex-col items-center gap-1">
                    <div className={`h-2.5 w-2.5 rounded-full ${SEVERITY_DOT[alert.severity]}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold">{alert.title}</h3>
                      <span className="rounded-full bg-muted/50 px-2 py-0.5 text-[10px] text-muted-foreground capitalize">
                        {alert.category}
                      </span>
                      <span className="rounded-full bg-muted/50 px-2 py-0.5 text-[10px] text-muted-foreground capitalize">
                        {alert.severity}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{alert.message}</p>
                    {alert.actionHint && (
                      <p className="mt-2 text-xs font-medium text-primary flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        {alert.actionHint}
                      </p>
                    )}
                  </div>
                </div>
                {alert.moneyImpact && (
                  <span className="shrink-0 rounded-lg bg-amber-500/10 px-2.5 py-1 text-sm font-bold text-amber-600 dark:text-amber-400">
                    {alert.moneyImpact}
                  </span>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
