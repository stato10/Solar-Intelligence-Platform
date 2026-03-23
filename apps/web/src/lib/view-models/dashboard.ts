import type { DashboardAggregateData } from "@/lib/contracts";

export interface DashboardMetricCardVm {
  id: "solar-health" | "risk-alerts" | "opportunity-value";
  title: string;
  valueText: string;
  hint: string;
  icon: "zap" | "triangle-alert" | "bar-chart-3";
}

export interface DashboardRecommendationVm {
  id: string;
  title: string;
  message: string;
  severity: "low" | "moderate" | "high";
}

export interface DashboardPageViewModel {
  header: {
    title: string;
    subtitle: string;
  };
  cards: DashboardMetricCardVm[];
  financial: {
    dailySavingsText: string;
    monthlySavingsText: string;
  };
  recommendations: {
    items: DashboardRecommendationVm[];
  };
  providers: {
    weather: string;
    solar: string;
  };
}

export function toDashboardPageViewModel(data: DashboardAggregateData): DashboardPageViewModel {
  return {
    header: {
      title: "Solar Dashboard",
      subtitle: "Live data is pulled from the aggregated backend endpoint."
    },
    cards: [
      {
        id: "solar-health",
        title: "Solar Health Score",
        valueText: `${data.soiling.score.toFixed(2)} / 100`,
        hint: "Deterministic soiling score from engine.",
        icon: "zap"
      },
      {
        id: "risk-alerts",
        title: "Risk Alerts",
        valueText: String(data.risks.alerts.length),
        hint: "Weather, heat, and soiling alerts from risk module.",
        icon: "triangle-alert"
      },
      {
        id: "opportunity-value",
        title: "Opportunity Value",
        valueText: `${data.optimization.estimatedValue.toFixed(2)} ILS`,
        hint: "Estimated optimization value from opportunity module.",
        icon: "bar-chart-3"
      }
    ],
    financial: {
      dailySavingsText: `${data.financial.dailyEstimatedSavings.toFixed(2)} ILS`,
      monthlySavingsText: `${data.financial.monthlyEstimatedSavings.toFixed(2)} ILS`
    },
    recommendations: {
      items: data.optimization.recommendations.map((item) => ({
        id: item.id,
        title: item.title,
        message: item.message,
        severity: item.severity
      }))
    },
    providers: {
      weather: data.providers.weather,
      solar: data.providers.solar
    }
  };
}
