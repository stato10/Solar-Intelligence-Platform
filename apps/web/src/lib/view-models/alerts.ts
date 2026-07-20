import type { DashboardAggregateData } from "@/lib/contracts";
import {
  formatCurrency,
  formatDate,
  resolveAggregateCurrency,
} from "@/lib/utils/formatters";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export type AlertCategory = "all" | "maintenance" | "weather" | "production" | "financial";

export interface AlertItemVm {
  id: string;
  severity: "low" | "moderate" | "high";
  category: string;
  title: string;
  message: string;
  actionHint?: string;
  moneyImpact?: string;
  source: "intelligence" | "risk";
}

export interface AlertsPageViewModel {
  header: {
    title: string;
    subtitle: string;
    totalCount: number;
    highCount: number;
  };
  context: {
    siteId: string;
    generatedAt: string;
  };
  alerts: AlertItemVm[];
  categoryCounts: Record<AlertCategory, number>;
}

// ---------------------------------------------------------------------------
// Main mapper
// ---------------------------------------------------------------------------
export function toAlertsPageViewModel(data: DashboardAggregateData): AlertsPageViewModel {
  const fmt = resolveAggregateCurrency(data);
  const alerts: AlertItemVm[] = [];

  // Prefer intelligence alerts (enriched with actionHint and moneyImpact)
  const intel = data.intelligence;
  if (intel?.alerts && intel.alerts.length > 0) {
    intel.alerts.forEach((a) => {
      alerts.push({
        id: a.id,
        severity: a.severity,
        category: a.category,
        title: a.title,
        message: a.message,
        actionHint: a.actionHint,
        moneyImpact: a.moneyImpactIls ? formatCurrency(a.moneyImpactIls, fmt) : undefined,
        source: "intelligence",
      });
    });
  }

  // Add raw risk alerts that aren't already covered by intelligence
  const intelIds = new Set(alerts.map((a) => a.id));
  data.risks.alerts.forEach((a, i) => {
    const id = `risk-${a.riskType}-${i}`;
    if (!intelIds.has(id)) {
      alerts.push({
        id,
        severity: a.severity,
        category: "weather",
        title: prettifyRiskType(a.riskType),
        message: a.message,
        source: "risk",
      });
    }
  });

  // Sort: high first, then moderate, then low
  const ORDER: Record<string, number> = { high: 0, moderate: 1, low: 2 };
  alerts.sort((a, b) => (ORDER[a.severity] ?? 3) - (ORDER[b.severity] ?? 3));

  // Count by category
  const categoryCounts: Record<AlertCategory, number> = {
    all: alerts.length,
    maintenance: alerts.filter((a) => a.category === "maintenance").length,
    weather: alerts.filter((a) => a.category === "weather").length,
    production: alerts.filter((a) => a.category === "production").length,
    financial: alerts.filter((a) => a.category === "financial").length,
  };

  const highCount = alerts.filter((a) => a.severity === "high").length;

  const subtitle = highCount > 0
    ? `${highCount} high-severity alert${highCount > 1 ? "s" : ""} require your attention.`
    : alerts.length > 0
      ? "All current alerts are within manageable range."
      : "No active alerts — your system is running smoothly.";

  return {
    header: {
      title: "Alerts Center",
      subtitle,
      totalCount: alerts.length,
      highCount,
    },
    context: {
      siteId: data.siteId,
      generatedAt: formatDate(data.generatedAt),
    },
    alerts,
    categoryCounts,
  };
}

function prettifyRiskType(raw: string): string {
  return raw.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
