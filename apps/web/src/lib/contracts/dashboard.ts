import type { ApiSuccessEnvelope } from "./common";

export interface DashboardAggregateRequest {
  siteId: string;
  latitude: number;
  longitude: number;
  systemSizeKw: number;
  lossPercent?: number;
  timezone?: string;
  generatedAt?: string;
  tariff?: {
    currency?: string;
    importRate?: number;
    exportRate?: number;
  };
}

export interface DashboardRiskAlert {
  riskType: string;
  severity: "low" | "moderate" | "high";
  message: string;
  expectedStart: string;
  expectedEnd: string;
}

export interface DashboardRecommendation {
  id: string;
  type: string;
  title: string;
  message: string;
  severity: "low" | "moderate" | "high";
  priority: number;
  estimatedValue: number;
  validFrom: string;
  validUntil: string;
  sourceModule: string;
}

export interface DashboardAggregateData {
  siteId: string;
  generatedAt: string;
  source: "DASHBOARD_AGGREGATED_V1";
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
    alerts: DashboardRiskAlert[];
  };
  optimization: {
    opportunityScore: number;
    recommendations: DashboardRecommendation[];
    estimatedValue: number;
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
    recommendedUsageWindow: {
      start: string;
      end: string;
    };
    selfConsumptionScore: number;
    estimatedSavingsIls: number;
    actions: string[];
  };
  providers: {
    weather: string;
    solar: string;
    engine: string;
  };
}

export type DashboardAggregateSuccessEnvelope = ApiSuccessEnvelope<DashboardAggregateData>;

export interface DashboardDemoSeedResponseData {
  dashboard: DashboardAggregateData;
  user?: unknown;
  site?: unknown;
  system?: unknown;
  tariff?: unknown;
  aggregatePayload?: unknown;
}

export type DashboardDemoSeedSuccessEnvelope = ApiSuccessEnvelope<DashboardDemoSeedResponseData>;
