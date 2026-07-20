import type {
  DashboardAggregateData,
  DashboardRecommendation,
  IntelligenceOpportunityItem,
} from "@/lib/contracts";
import {
  formatCurrency,
  formatKwh,
  formatPercent,
  formatDate,
  formatScore,
  formatTimeRange,
  resolveAggregateCurrency,
  type CurrencyFormatOptions,
} from "@/lib/utils/formatters";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
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

export interface ProfitVsLossVm {
  currentMonthly: string;
  optimalMonthly: string;
  headroom: string;
  maintenanceLeakage: string;
  exportValueDaily: string;
  selfConsumptionValueDaily: string;
  /** 0-100 ratio: current / optimal */
  efficiencyPercent: number;
}

export interface UpgradeOpportunityVm {
  id: string;
  type: string;
  title: string;
  description: string;
  estimatedValue: string;
  confidence: string;
  priority: number;
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
    providers: { weather: string; solar: string; engine: string };
  };
  financial: {
    dailyEstimatedSavingsText: string;
    monthlyEstimatedSavingsText: string;
    yearlyOptimizationPotentialText: string;
  };
  profitVsLoss: ProfitVsLossVm;
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
    scoreValue: number;
    estimatedSavingsText: string;
    recommendedWindowText: string;
    actions: string[];
  };
  recommendations: {
    valueRelated: SavingsRecommendationVm[];
    other: SavingsRecommendationVm[];
  };
  opportunities: UpgradeOpportunityVm[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
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
    isValueRelated: isValueRelatedRecommendation(item),
  };
}

function toOpportunityVm(
  item: IntelligenceOpportunityItem,
  fmt: CurrencyFormatOptions,
): UpgradeOpportunityVm {
  return {
    id: item.id,
    type: item.type,
    title: item.title,
    description: item.description,
    estimatedValue: formatCurrency(item.estimatedValueIls, fmt),
    confidence: item.confidence,
    priority: item.priority,
  };
}

// ---------------------------------------------------------------------------
// Main mapper
// ---------------------------------------------------------------------------
export function toSavingsPageViewModel(data: DashboardAggregateData): SavingsPageViewModel {
  const fmt = resolveAggregateCurrency(data);
  const recommendationItems = data.optimization.recommendations.map(toRecommendationVm);
  const intel = data.intelligence;

  // Build Profit vs Loss from intelligence or calculated fallback
  const currentMonthly = intel?.profit.currentMonthlyIls ?? data.financial.monthlyEstimatedSavings;
  const optimalMonthly = intel?.profit.optimalMonthlyIls ?? (data.financial.monthlyEstimatedSavings + data.optimization.estimatedValue);
  const headroom = intel?.profit.headroomMonthlyIls ?? data.optimization.estimatedValue;
  const leakage = intel?.profit.maintenanceLeakageMonthlyIls ?? 0;
  const exportDaily = intel?.profit.exportValueDailyIls ?? 0;
  const selfConsDaily = intel?.profit.selfConsumptionValueDailyIls ?? data.selfConsumption.estimatedSavingsIls;

  const efficiencyPercent = optimalMonthly > 0
    ? Math.round((currentMonthly / optimalMonthly) * 100)
    : 100;

  // Dynamic subtitle
  const subtitle = leakage > 0
    ? `You're saving ${formatCurrency(currentMonthly, fmt)}/month. With maintenance optimization, you could reach ${formatCurrency(optimalMonthly, fmt)}/month.`
    : `You're saving ${formatCurrency(currentMonthly, fmt)}/month. Your system is near optimal.`;

  // Map intelligence opportunities
  const opportunities = (intel?.opportunities ?? []).map((item) => toOpportunityVm(item, fmt));

  return {
    header: {
      title: "Savings",
      subtitle,
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
    financial: {
      dailyEstimatedSavingsText: formatCurrency(data.financial.dailyEstimatedSavings, fmt),
      monthlyEstimatedSavingsText: formatCurrency(data.financial.monthlyEstimatedSavings, fmt),
      yearlyOptimizationPotentialText: formatCurrency(data.financial.yearlyOptimizationPotential, fmt),
    },
    profitVsLoss: {
      currentMonthly: formatCurrency(currentMonthly, fmt),
      optimalMonthly: formatCurrency(optimalMonthly, fmt),
      headroom: formatCurrency(headroom, fmt),
      maintenanceLeakage: formatCurrency(leakage, fmt),
      exportValueDaily: formatCurrency(exportDaily, fmt),
      selfConsumptionValueDaily: formatCurrency(selfConsDaily, fmt),
      efficiencyPercent,
    },
    optimization: {
      estimatedValueText: formatCurrency(data.optimization.estimatedValue, fmt),
      opportunityScoreText: formatScore(data.optimization.opportunityScore),
    },
    benchmark: {
      expectedProductionText: formatKwh(data.benchmark.expectedProductionKwh),
      actualProductionText: formatKwh(data.benchmark.actualProductionKwh),
      expectedExportText: formatKwh(data.benchmark.expectedExportKwh),
      actualExportText: formatKwh(data.benchmark.actualExportKwh),
      productionDeviationText: formatPercent(data.benchmark.productionDeviationPercent),
      exportDeviationText: formatPercent(data.benchmark.exportDeviationPercent),
      performanceStatus: data.benchmark.performanceStatus,
      insight: data.benchmark.insight,
    },
    selfConsumption: {
      scoreText: formatScore(data.selfConsumption.selfConsumptionScore),
      scoreValue: data.selfConsumption.selfConsumptionScore,
      estimatedSavingsText: formatCurrency(data.selfConsumption.estimatedSavingsIls, fmt),
      recommendedWindowText: formatTimeRange(
        data.selfConsumption.recommendedUsageWindow.start,
        data.selfConsumption.recommendedUsageWindow.end
      ),
      actions: data.selfConsumption.actions,
    },
    recommendations: {
      valueRelated: recommendationItems.filter((item) => item.isValueRelated),
      other: recommendationItems.filter((item) => !item.isValueRelated),
    },
    opportunities,
  };
}
