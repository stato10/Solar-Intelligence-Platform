/**
 * Types returned by the Intelligence Layer and appended additively to the
 * dashboard aggregate response under the `intelligence` field.
 *
 * Keep these shapes stable: the frontend contract mirrors them and
 * consumes them via view-models.
 */

export type IntelligenceSeverity = "low" | "moderate" | "high";
export type IntelligenceStatus = "good" | "warning" | "critical";

export type IntelligenceMoneyPeriod =
  | "daily"
  | "weekly"
  | "monthly"
  | "yearly"
  | "recoverable";

export type IntelligenceCtaType =
  | "cleaning"
  | "optimization"
  | "monitoring"
  | "battery"
  | "ev"
  | "automation"
  | "general";

export type IntelligenceAlertCategory =
  | "maintenance"
  | "weather"
  | "production"
  | "financial";

export type IntelligenceOpportunityType =
  | "cleaning"
  | "battery"
  | "ev"
  | "automation";

export type IntelligenceConfidence = "low" | "medium" | "high";

export interface IntelligenceStatusBlock {
  level: IntelligenceStatus;
  statusLabel: string;
  headline: string;
  primaryCause: string;
  moneyImpactIls: number;
  moneyPeriod: IntelligenceMoneyPeriod;
  cta: {
    label: string;
    type: IntelligenceCtaType;
  };
}

export interface IntelligenceProfitBlock {
  dailySavingsIls: number;
  monthlySavingsIls: number;
  yearlySavingsIls: number;
  maintenanceLeakageMonthlyIls: number;
  exportValueDailyIls: number;
  selfConsumptionValueDailyIls: number;
  currentMonthlyIls: number;
  optimalMonthlyIls: number;
  headroomMonthlyIls: number;
}

export interface IntelligenceAlert {
  id: string;
  severity: IntelligenceSeverity;
  category: IntelligenceAlertCategory;
  title: string;
  message: string;
  actionHint?: string;
  moneyImpactIls?: number;
}

export interface IntelligenceOpportunity {
  id: string;
  type: IntelligenceOpportunityType;
  title: string;
  description: string;
  estimatedValueIls: number;
  confidence: IntelligenceConfidence;
  priority: number;
}

export interface DashboardIntelligence {
  status: IntelligenceStatusBlock;
  profit: IntelligenceProfitBlock;
  alerts: IntelligenceAlert[];
  opportunities: IntelligenceOpportunity[];
  generatedAt: string;
  // Extended fields for detail views and engines
  lossBreakdown?: any;
  estimation?: any;
  engineRecommendations?: any;
  simulations?: any;
  debug?: {
    expected: number;
    estimated: number;
    factors: any;
  };
}

/**
 * Minimum contract required by the Intelligence Layer. Matches the shape
 * produced by `DashboardService.aggregate()` before the `intelligence`
 * field is attached. Kept deliberately narrow so services are independent
 * of external DTOs.
 */
export interface IntelligenceInput {
  siteId: string;
  generatedAt: string;
  forecast: {
    expectedDailyKwh: number;
    expectedWeeklyKwh: number;
    expectedMonthlyKwh: number;
  };
  soiling: {
    score: number;
    estimatedLossPercent: number;
    cleaningRecommended: boolean;
    recommendedCleaningDate: string | null;
    explanation: string;
  };
  heat: {
    score: number;
    estimatedLossPercent: number;
    peakHeatWindowStart: string;
    peakHeatWindowEnd: string;
  };
  risks: {
    alerts: Array<{
      riskType: string;
      severity: IntelligenceSeverity;
      message: string;
      expectedStart: string;
      expectedEnd: string;
    }>;
  };
  optimization: {
    opportunityScore: number;
    estimatedValue: number;
    recommendations: Array<{
      id: string;
      type: string;
      title: string;
      message: string;
      severity: IntelligenceSeverity;
      priority: number;
      estimatedValue: number;
      validFrom: string;
      validUntil: string;
      sourceModule: string;
    }>;
  };
  financial: {
    dailyEstimatedSavings: number;
    monthlyEstimatedSavings: number;
    yearlyOptimizationPotential: number;
  };
  benchmark: {
    expectedProductionKwh: number;
    actualProductionKwh: number;
    expectedExportKwh: number;
    actualExportKwh: number;
    productionDeviationPercent: number;
    exportDeviationPercent: number;
    performanceStatus: "good" | "underperforming" | "overexporting";
    insight: string;
  };
  selfConsumption: {
    recommendedUsageWindow: { start: string; end: string };
    selfConsumptionScore: number;
    estimatedSavingsIls: number;
    actions: string[];
  };
  // Internal context for engines
  engineContext?: {
    ghi?: number;
    cloudCover?: number;
    temperature?: number;
    pm10?: number;
    daysWithoutRain?: number;
    actualKwh?: number; // to signal real vs estimated
  };
  engineTariff?: {
    importRate: number;
    exportRate: number;
  };
}

export function roundCurrency(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round(value * 100) / 100;
}
