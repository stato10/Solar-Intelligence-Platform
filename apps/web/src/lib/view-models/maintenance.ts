import type { DashboardAggregateData, DashboardRecommendation, DashboardRiskAlert } from "@/lib/contracts";

export interface MaintenanceRiskAlertVm {
  id: string;
  riskType: string;
  severity: "low" | "moderate" | "high";
  message: string;
  windowText: string;
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
  };
  context: {
    siteId: string;
    generatedAt: string;
    source: string;
    providers: {
      weather: string;
      solar: string;
      engine: string;
    };
  };
  soiling: {
    scoreText: string;
    estimatedLossText: string;
    cleaningRecommendedText: string;
    recommendedCleaningDateText: string;
    explanation: string;
  };
  heat: {
    scoreText: string;
    estimatedLossText: string;
    peakWindowText: string;
  };
  alerts: {
    items: MaintenanceRiskAlertVm[];
  };
  recommendations: {
    maintenanceLikely: MaintenanceRecommendationVm[];
    other: MaintenanceRecommendationVm[];
  };
}

function formatDateText(value: string | null): string {
  if (!value) {
    return "--";
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function toAlertVm(alert: DashboardRiskAlert): MaintenanceRiskAlertVm {
  return {
    id: `${alert.riskType}-${alert.expectedStart}-${alert.expectedEnd}`,
    riskType: alert.riskType,
    severity: alert.severity,
    message: alert.message,
    windowText: `${formatDateText(alert.expectedStart)} -> ${formatDateText(alert.expectedEnd)}`
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
    validityText: `${formatDateText(item.validFrom)} -> ${formatDateText(item.validUntil)}`,
    isMaintenanceLikely: isMaintenanceLikelyRecommendation(item)
  };
}

export function toMaintenancePageViewModel(data: DashboardAggregateData): MaintenancePageViewModel {
  const recommendationItems = data.optimization.recommendations.map(toRecommendationVm);
  const maintenanceLikely = recommendationItems.filter((item) => item.isMaintenanceLikely);
  const other = recommendationItems.filter((item) => !item.isMaintenanceLikely);

  return {
    header: {
      title: "Maintenance",
      subtitle: "Deterministic maintenance signals from the canonical aggregate payload."
    },
    context: {
      siteId: data.siteId,
      generatedAt: formatDateText(data.generatedAt),
      source: data.source,
      providers: {
        weather: data.providers.weather,
        solar: data.providers.solar,
        engine: data.providers.engine
      }
    },
    soiling: {
      scoreText: `${data.soiling.score.toFixed(2)} / 100`,
      estimatedLossText: `${data.soiling.estimatedLossPercent.toFixed(2)}%`,
      cleaningRecommendedText: data.soiling.cleaningRecommended ? "Yes" : "No",
      recommendedCleaningDateText: formatDateText(data.soiling.recommendedCleaningDate),
      explanation: data.soiling.explanation
    },
    heat: {
      scoreText: `${data.heat.score.toFixed(2)} / 100`,
      estimatedLossText: `${data.heat.estimatedLossPercent.toFixed(2)}%`,
      peakWindowText: `${formatDateText(data.heat.peakHeatWindowStart)} -> ${formatDateText(data.heat.peakHeatWindowEnd)}`
    },
    alerts: {
      items: data.risks.alerts.map(toAlertVm)
    },
    recommendations: {
      maintenanceLikely,
      other
    }
  };
}
