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

function formatNumberText(value: number, suffix = ""): string {
  return `${value.toFixed(2)}${suffix}`;
}

function formatDateText(value: string | null): string {
  if (!value) {
    return "--";
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

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
    validityText: `${formatDateText(item.validFrom)} -> ${formatDateText(item.validUntil)}`,
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
      generatedAt: formatDateText(data.generatedAt),
      source: data.source,
      providers: {
        weather: data.providers.weather,
        solar: data.providers.solar,
        engine: data.providers.engine
      }
    },
    financial: {
      dailyEstimatedSavingsText: `${formatNumberText(data.financial.dailyEstimatedSavings)} ILS`,
      monthlyEstimatedSavingsText: `${formatNumberText(data.financial.monthlyEstimatedSavings)} ILS`,
      yearlyOptimizationPotentialText: `${formatNumberText(data.financial.yearlyOptimizationPotential)} ILS`
    },
    optimization: {
      estimatedValueText: `${formatNumberText(data.optimization.estimatedValue)} ILS`,
      opportunityScoreText: `${formatNumberText(data.optimization.opportunityScore)} / 100`
    },
    benchmark: {
      expectedProductionText: `${formatNumberText(data.benchmark.expectedProductionKwh)} kWh`,
      actualProductionText: `${formatNumberText(data.benchmark.actualProductionKwh)} kWh`,
      expectedExportText: `${formatNumberText(data.benchmark.expectedExportKwh)} kWh`,
      actualExportText: `${formatNumberText(data.benchmark.actualExportKwh)} kWh`,
      productionDeviationText: `${formatNumberText(data.benchmark.productionDeviationPercent)}%`,
      exportDeviationText: `${formatNumberText(data.benchmark.exportDeviationPercent)}%`,
      performanceStatus: data.benchmark.performanceStatus,
      insight: data.benchmark.insight
    },
    selfConsumption: {
      scoreText: `${formatNumberText(data.selfConsumption.selfConsumptionScore)} / 100`,
      estimatedSavingsText: `${formatNumberText(data.selfConsumption.estimatedSavingsIls)} ILS`,
      recommendedWindowText: `${formatDateText(data.selfConsumption.recommendedUsageWindow.start)} -> ${formatDateText(data.selfConsumption.recommendedUsageWindow.end)}`,
      actions: data.selfConsumption.actions
    },
    recommendations: {
      valueRelated: recommendationItems.filter((item) => item.isValueRelated),
      other: recommendationItems.filter((item) => !item.isValueRelated)
    }
  };
}
