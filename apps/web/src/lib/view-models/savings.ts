import type { DashboardAggregateData, DashboardRecommendation } from "@/lib/contracts";

export interface SavingsRecommendationVm {
  id: string;
  title: string;
  message: string;
  severity: "low" | "moderate" | "high";
  typeLabel: string;
  sourceModuleLabel: string;
  validityText: string;
  isValueRelated: boolean;
}

export interface SavingsPageViewModel {
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
  financial: {
    dailyEstimatedSavingsText: string;
    monthlyEstimatedSavingsText: string;
    yearlyOptimizationPotentialText: string;
  };
  optimization: {
    estimatedValueText: string;
    opportunityScoreText: string;
  };
  benchmark: {
    expectedProductionText: string;
    actualProductionText: string;
    expectedExportText: string;
    actualExportText: string;
    productionDeviationText: string;
    exportDeviationText: string;
    performanceStatus: string;
    insight: string;
  };
  selfConsumption: {
    scoreText: string;
    estimatedSavingsText: string;
    recommendedWindowText: string;
    actions: string[];
  };
  recommendations: {
    valueRelated: SavingsRecommendationVm[];
    other: SavingsRecommendationVm[];
  };
}

import {
  formatCurrency,
  formatKwh,
  formatPercent,
  formatDate,
  formatScore,
  formatTimeRange
} from "@/lib/utils/formatters";

function isValueRelatedRecommendation(item: DashboardRecommendation): boolean {
  const signal = `${item.type} ${item.sourceModule}`.toLowerCase();
  return (
    signal.includes("value") ||
    signal.includes("saving") ||
    signal.includes("financial") ||
    signal.includes("benchmark") ||
    signal.includes("export") ||
    signal.includes("tariff") ||
    signal.includes("consumption")
  );
}

function toRecommendationVm(item: DashboardRecommendation): SavingsRecommendationVm {
  return {
    id: item.id,
    title: item.title,
    message: item.message,
    severity: item.severity,
    typeLabel: item.type,
    sourceModuleLabel: item.sourceModule,
    validityText: formatTimeRange(formatDate(item.validFrom), formatDate(item.validUntil)),
    isValueRelated: isValueRelatedRecommendation(item)
  };
}

export function toSavingsPageViewModel(data: DashboardAggregateData): SavingsPageViewModel {
  const recommendationItems = data.optimization.recommendations.map(toRecommendationVm);

  return {
    header: {
      title: "Savings",
      subtitle: "Deterministic financial and optimization signals from canonical aggregate data."
    },
    context: {
      siteId: data.siteId,
      generatedAt: formatDate(data.generatedAt),
      source: data.source,
      providers: {
        weather: data.providers.weather,
        solar: data.providers.solar,
        engine: data.providers.engine
      }
    },
    financial: {
      dailyEstimatedSavingsText: formatCurrency(data.financial.dailyEstimatedSavings),
      monthlyEstimatedSavingsText: formatCurrency(data.financial.monthlyEstimatedSavings),
      yearlyOptimizationPotentialText: formatCurrency(data.financial.yearlyOptimizationPotential)
    },
    optimization: {
      estimatedValueText: formatCurrency(data.optimization.estimatedValue),
      opportunityScoreText: formatScore(data.optimization.opportunityScore)
    },
    benchmark: {
      expectedProductionText: formatKwh(data.benchmark.expectedProductionKwh),
      actualProductionText: formatKwh(data.benchmark.actualProductionKwh),
      expectedExportText: formatKwh(data.benchmark.expectedExportKwh),
      actualExportText: formatKwh(data.benchmark.actualExportKwh),
      productionDeviationText: formatPercent(data.benchmark.productionDeviationPercent),
      exportDeviationText: formatPercent(data.benchmark.exportDeviationPercent),
      performanceStatus: data.benchmark.performanceStatus,
      insight: data.benchmark.insight
    },
    selfConsumption: {
      scoreText: formatScore(data.selfConsumption.selfConsumptionScore),
      estimatedSavingsText: formatCurrency(data.selfConsumption.estimatedSavingsIls),
      recommendedWindowText: formatTimeRange(
        formatDate(data.selfConsumption.recommendedUsageWindow.start),
        formatDate(data.selfConsumption.recommendedUsageWindow.end)
      ),
      actions: data.selfConsumption.actions
    },
    recommendations: {
      valueRelated: recommendationItems.filter((item) => item.isValueRelated),
      other: recommendationItems.filter((item) => !item.isValueRelated)
    }
  };
}
