import type {
  DashboardAggregateData,
  DashboardRecommendation,
  DashboardRiskAlert,
  IntelligenceAlertItem,
} from "@/lib/contracts";
import {
  formatPercent,
  formatCurrency,
  formatDate,
  formatScore,
  formatTimeRange,
  formatDateTime,
} from "@/lib/utils/formatters";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface MaintenanceRiskAlertVm {
  id: string;
  riskType: string;
  severity: "low" | "moderate" | "high";
  message: string;
  windowText: string;
  actionHint?: string;
  moneyImpact?: string;
}

export interface MaintenanceRecommendationVm {
  id: string;
  title: string;
  message: string;
  severity: "low" | "moderate" | "high";
  typeLabel: string;
  sourceModuleLabel: string;
  validityText: string;
  isMaintenanceLikely: boolean;
}

export interface MaintenancePageViewModel {
  header: {
    title: string;
    subtitle: string;
    statusLevel: "good" | "warning" | "critical";
  };
  context: {
    siteId: string;
    generatedAt: string;
    source: string;
    providers: { weather: string; solar: string; engine: string };
  };
  moneyImpact: {
    leakageMonthly: string;
    leakageExplanation: string;
    recoverable: string;
  };
  soiling: {
    score: number;
    scoreText: string;
    estimatedLoss: number;
    estimatedLossText: string;
    cleaningRecommended: boolean;
    cleaningRecommendedText: string;
    recommendedCleaningDateText: string;
    explanation: string;
  };
  heat: {
    score: number;
    scoreText: string;
    estimatedLoss: number;
    estimatedLossText: string;
    peakWindowText: string;
  };
  alerts: {
    items: MaintenanceRiskAlertVm[];
    intelligenceAlerts: MaintenanceRiskAlertVm[];
  };
  recommendations: {
    maintenanceLikely: MaintenanceRecommendationVm[];
    other: MaintenanceRecommendationVm[];
  };
  actionCards: Array<{
    id: string;
    title: string;
    description: string;
    ctaLabel: string;
    icon: "droplets" | "thermometer" | "shield" | "wrench";
    enabled: boolean;
  }>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function toAlertVm(alert: DashboardRiskAlert): MaintenanceRiskAlertVm {
  return {
    id: `${alert.riskType}-${alert.expectedStart}-${alert.expectedEnd}`,
    riskType: alert.riskType,
    severity: alert.severity,
    message: alert.message,
    windowText: formatTimeRange(formatDateTime(alert.expectedStart), formatDateTime(alert.expectedEnd)),
  };
}

function intelligenceAlertToVm(alert: IntelligenceAlertItem): MaintenanceRiskAlertVm {
  return {
    id: alert.id,
    riskType: alert.category,
    severity: alert.severity,
    message: alert.message,
    windowText: "",
    actionHint: alert.actionHint,
    moneyImpact: alert.moneyImpactIls ? formatCurrency(alert.moneyImpactIls) : undefined,
  };
}

function isMaintenanceLikelyRecommendation(item: DashboardRecommendation): boolean {
  const signal = `${item.type} ${item.sourceModule}`.toLowerCase();
  return (
    signal.includes("soil") ||
    signal.includes("clean") ||
    signal.includes("heat") ||
    signal.includes("risk") ||
    signal.includes("maint")
  );
}

function toRecommendationVm(item: DashboardRecommendation): MaintenanceRecommendationVm {
  return {
    id: item.id,
    title: item.title,
    message: item.message,
    severity: item.severity,
    typeLabel: item.type,
    sourceModuleLabel: item.sourceModule,
    validityText: formatTimeRange(formatDate(item.validFrom), formatDate(item.validUntil)),
    isMaintenanceLikely: isMaintenanceLikelyRecommendation(item),
  };
}

// ---------------------------------------------------------------------------
// Main mapper
// ---------------------------------------------------------------------------
export function toMaintenancePageViewModel(data: DashboardAggregateData): MaintenancePageViewModel {
  const recommendationItems = data.optimization.recommendations.map(toRecommendationVm);
  const maintenanceLikely = recommendationItems.filter((item) => item.isMaintenanceLikely);
  const other = recommendationItems.filter((item) => !item.isMaintenanceLikely);

  const intel = data.intelligence;
  const intelAlerts = (intel?.alerts ?? [])
    .filter((a) => a.category === "maintenance" || a.category === "weather" || a.category === "production")
    .map(intelligenceAlertToVm);

  // Determine status from intelligence or fallback logic
  const statusLevel = intel?.status.level ?? (
    data.soiling.cleaningRecommended ? "warning" : "good"
  );

  // Dynamic header based on intelligence
  const hasIssues = data.soiling.cleaningRecommended ||
    data.heat.estimatedLossPercent > 5 ||
    data.risks.alerts.length > 0;

  const subtitle = intel
    ? intel.status.primaryCause
    : hasIssues
      ? "Active maintenance signals detected. Review recommended actions below."
      : "All maintenance signals are within normal range.";

  // Money impact from intelligence
  const leakageMonthly = intel?.profit.maintenanceLeakageMonthlyIls ?? 0;
  const recoverable = data.optimization.estimatedValue;

  // Build action cards based on actual signals
  const actionCards: MaintenancePageViewModel["actionCards"] = [];

  if (data.soiling.cleaningRecommended) {
    actionCards.push({
      id: "action-cleaning",
      title: "Schedule Panel Cleaning",
      description: `Dust is causing ~${data.soiling.estimatedLossPercent.toFixed(1)}% loss. Cleaning can recover ${formatCurrency(recoverable)}.`,
      ctaLabel: "Request Cleaning",
      icon: "droplets",
      enabled: true,
    });
  }

  if (data.heat.estimatedLossPercent > 5) {
    actionCards.push({
      id: "action-cooling",
      title: "Explore Cooling Solutions",
      description: `Heat is reducing output by ~${data.heat.estimatedLossPercent.toFixed(1)}% during peak hours.`,
      ctaLabel: "Learn More",
      icon: "thermometer",
      enabled: true,
    });
  }

  if (data.risks.alerts.some((a) => a.severity === "high")) {
    actionCards.push({
      id: "action-weather",
      title: "Review Weather Protection",
      description: "Active high-severity weather alerts may affect your system.",
      ctaLabel: "View Alerts",
      icon: "shield",
      enabled: true,
    });
  }

  // Always show a general maintenance action
  actionCards.push({
    id: "action-inspection",
    title: "Schedule Inspection",
    description: "Regular inspections help detect issues early and extend system life.",
    ctaLabel: "Schedule",
    icon: "wrench",
    enabled: true,
  });

  return {
    header: {
      title: "Maintenance",
      subtitle,
      statusLevel: statusLevel as "good" | "warning" | "critical",
    },
    context: {
      siteId: data.siteId,
      generatedAt: formatDate(data.generatedAt),
      source: data.source,
      providers: {
        weather: data.providers.weather,
        solar: data.providers.solar,
        engine: data.providers.engine,
      },
    },
    moneyImpact: {
      leakageMonthly: formatCurrency(leakageMonthly),
      leakageExplanation: leakageMonthly > 0
        ? `You're losing approximately ${formatCurrency(leakageMonthly)}/month due to maintenance issues.`
        : "No measurable leakage from maintenance issues.",
      recoverable: formatCurrency(recoverable),
    },
    soiling: {
      score: data.soiling.score,
      scoreText: formatScore(data.soiling.score),
      estimatedLoss: data.soiling.estimatedLossPercent,
      estimatedLossText: formatPercent(data.soiling.estimatedLossPercent),
      cleaningRecommended: data.soiling.cleaningRecommended,
      cleaningRecommendedText: data.soiling.cleaningRecommended ? "Yes" : "No",
      recommendedCleaningDateText: formatDate(data.soiling.recommendedCleaningDate),
      explanation: data.soiling.explanation,
    },
    heat: {
      score: data.heat.score,
      scoreText: formatScore(data.heat.score),
      estimatedLoss: data.heat.estimatedLossPercent,
      estimatedLossText: formatPercent(data.heat.estimatedLossPercent),
      peakWindowText: formatTimeRange(data.heat.peakHeatWindowStart, data.heat.peakHeatWindowEnd),
    },
    alerts: {
      items: data.risks.alerts.map(toAlertVm),
      intelligenceAlerts: intelAlerts,
    },
    recommendations: {
      maintenanceLikely,
      other,
    },
    actionCards,
  };
}
